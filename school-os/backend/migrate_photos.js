import { query } from "./src/config/db.js";

async function run() {
  try {
    await query(`ALTER TABLE students ADD COLUMN IF NOT EXISTS photo_url TEXT;`);
    console.log("Added photo_url to students");
    await query(`ALTER TABLE staff ADD COLUMN IF NOT EXISTS photo_url TEXT;`);
    console.log("Added photo_url to staff");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
