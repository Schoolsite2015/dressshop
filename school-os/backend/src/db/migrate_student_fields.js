import { query } from "../config/db.js";

async function run() {
  console.log("Starting safe migration for mother_name and aadhar_no...");

  try {
    console.log("Adding fields to students table...");
    await query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_name TEXT;`);
    await query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS aadhar_no TEXT;`);
    console.log("students table updated.");

    console.log("Adding fields to admissions table...");
    await query(`ALTER TABLE admissions ADD COLUMN IF NOT EXISTS mother_name TEXT;`);
    await query(`ALTER TABLE admissions ADD COLUMN IF NOT EXISTS aadhar_no TEXT;`);
    console.log("admissions table updated.");

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();
