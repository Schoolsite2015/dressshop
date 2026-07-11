// Runs a single migration file from src/db/migrations/.
// Usage: node src/db/run-migration.js 002_teacher_assignments.sql
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const file = process.argv[2];
if (!file) {
  console.error("Usage: node src/db/run-migration.js <filename.sql>");
  process.exit(1);
}

async function run() {
  const full = path.join(__dirname, "migrations", file);
  const sql = fs.readFileSync(full, "utf-8");
  console.log(`Applying migration: ${file} ...`);
  await pool.query(sql);
  console.log("Migration applied successfully.");
  await pool.end();
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
