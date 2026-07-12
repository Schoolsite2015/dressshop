import { pool } from './src/config/db.js';

async function run() {
  const { rows } = await pool.query("SELECT id, name, photo_url, role FROM users WHERE role = 'principal'");
  console.log(rows);
  process.exit(0);
}

run();
