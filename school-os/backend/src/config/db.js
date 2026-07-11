import pg from "pg";
import dotenv from "dotenv";
import { AsyncLocalStorage } from "async_hooks";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error", err);
});

export const tenantContext = new AsyncLocalStorage();

// Override pool.connect to support both promise and callback styles,
// while transparently setting PostgreSQL tenant context.
const originalConnect = pool.connect.bind(pool);
pool.connect = function(callback) {
  if (callback) {
    return originalConnect(async (err, client, release) => {
      if (err) return callback(err);

      const tenantId = tenantContext.getStore();
      try {
        if (tenantId) {
          await client.query(`SELECT set_config('app.current_tenant', $1, false)`, [tenantId]);
        } else {
          await client.query(`SELECT set_config('app.current_tenant', '', false)`);
        }
        callback(null, client, release);
      } catch (queryErr) {
        release(queryErr);
        callback(queryErr);
      }
    });
  }

  return (async () => {
    const client = await originalConnect();
    const tenantId = tenantContext.getStore();
    try {
      if (tenantId) {
        await client.query(`SELECT set_config('app.current_tenant', $1, false)`, [tenantId]);
      } else {
        await client.query(`SELECT set_config('app.current_tenant', '', false)`);
      }
      return client;
    } catch (err) {
      client.release();
      throw err;
    }
  })();
};

export const getConnection = () => pool.connect();

// Controllers import this query function
export const query = async (text, params) => {
  const client = await getConnection();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
};
