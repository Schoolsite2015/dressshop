import { pool } from "./src/config/db.js";

async function addVisitorsTable() {
  const client = await pool.connect();
  try {
    console.log("Creating visitors table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        purpose TEXT NOT NULL,
        whom_to_meet TEXT,
        check_in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
        check_out_time TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'checked_in' -- checked_in | checked_out
      );
    `);
    console.log("Visitors table created successfully!");
  } catch (err) {
    console.error("Failed to create visitors table:", err);
  } finally {
    client.release();
    pool.end();
  }
}

addVisitorsTable();
