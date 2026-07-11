import { pool } from "./src/config/db.js";

async function wipe() {
  const client = await pool.connect();
  try {
    console.log("Starting database wipe...");
    await client.query("BEGIN");

    console.log("Truncating dependent tables...");
    const tables = [
      "students",
      "staff",
      "staff_attendance",
      "payroll",
      "attendance",
      "fee_payments",
      "admissions",
      "marks",
      "report_cards",
      "teacher_assignments",
      "messages"
    ];

    for (const table of tables) {
      console.log(`Truncating ${table}...`);
      await client.query(`TRUNCATE TABLE ${table} CASCADE`).catch(() => {});
    }
    
    console.log("Deleting all users except the Super Admin...");
    await client.query("DELETE FROM users WHERE email != 'principal@snpublicschool.edu.in'");

    await client.query("COMMIT");
    console.log("Database wiped successfully. Ready for fresh data entry!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Wipe failed:", err);
  } finally {
    client.release();
    pool.end();
  }
}

wipe();
