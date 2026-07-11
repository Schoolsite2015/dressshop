import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEMO_PASSWORD = "Password@123";

const SUPER_ADMIN_USER = { name: "Super Admin", email: "admin@snpublicschool.edu.in", role: "admin" };

async function seed() {
  console.log("Emptying database and resetting everything...");

  // TRUNCATE all relevant tables to get a clean slate. 
  // We use CASCADE to delete all dependent rows.
  const tablesToTruncate = [
    'users',
    'students',
    'staff',
    'fee_payments',
    'attendance',
    'admissions',
    'visitors',
    'notices',
    'events',
    'academic_years',
    'classes',
    'sections',
    'subjects',
    'fee_structure'
  ];

  for (const table of tablesToTruncate) {
    try {
      await pool.query(`TRUNCATE TABLE ${table} CASCADE`);
      console.log(`Truncated ${table}`);
    } catch (err) {
      console.log(`Failed to truncate ${table}: ${err.message}`);
    }
  }

  // Now seed structural data
  const sql = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf-8");
  console.log("\nSeeding reference data (classes, subjects, structures) ...");
  await pool.query(sql);

  console.log("\nCreating super admin login account (password: Password@123) ...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name`,
    [SUPER_ADMIN_USER.name, SUPER_ADMIN_USER.email, passwordHash, SUPER_ADMIN_USER.role]
  );

  console.log("\nDatabase reset complete. Only super admin exists now.");
  console.log(`  admin -> ${SUPER_ADMIN_USER.email} / ${DEMO_PASSWORD}`);
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
