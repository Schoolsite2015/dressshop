// Seeds reference data + demo login accounts for every role.
// Usage: npm run seed  (run AFTER npm run migrate)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEMO_PASSWORD = "Password@123";

const DEMO_USERS = [
  { name: "R. K. Sharma",   email: "principal@snpublicschool.edu.in", role: "principal" },
  { name: "Anita Verma",    email: "teacher@snpublicschool.edu.in",   role: "teacher" },
  { name: "Riya Singh",     email: "student@snpublicschool.edu.in",   role: "student" },
  { name: "Suresh Singh",   email: "parent@snpublicschool.edu.in",    role: "parent" },
  { name: "Meena Gupta",    email: "office@snpublicschool.edu.in",    role: "office" },
];

async function seed() {
  const sql = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf-8");
  console.log("Seeding reference data ...");
  await pool.query(sql);

  console.log("Creating demo login accounts (password for all: Password@123) ...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const createdUsers = {};

  for (const u of DEMO_USERS) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [u.name, u.email, passwordHash, u.role]
    );
    createdUsers[u.role] = rows[0]?.id;
  }

  // Fetch class/section for Class 8
  const cls = await pool.query(`SELECT id FROM classes WHERE name = 'Class 8' LIMIT 1`);
  const sec = await pool.query(`SELECT id FROM sections WHERE class_id = $1 LIMIT 1`, [cls.rows[0].id]);

  // Create/update student record linked to student user + parent user
  if (createdUsers.student) {
    await pool.query(
      `INSERT INTO students (user_id, admission_no, name, dob, gender, class_id, section_id, admission_date, parent_user_id)
       VALUES ($1, 'SNPS-2026-001', 'Riya Singh', '2013-05-14', 'Female', $2, $3, '2026-04-01', $4)
       ON CONFLICT (admission_no) DO UPDATE
       SET user_id = EXCLUDED.user_id, parent_user_id = EXCLUDED.parent_user_id`,
      [createdUsers.student, cls.rows[0].id, sec.rows[0]?.id ?? null, createdUsers.parent ?? null]
    );
    console.log("  student record linked to parent user");
  }

  // Create staff entry for teacher
  if (createdUsers.teacher) {
    await pool.query(
      `INSERT INTO staff (user_id, employee_id, name, designation, department, joining_date, salary_basic)
       VALUES ($1, 'SNPS-STAFF-001', 'Anita Verma', 'Senior Teacher', 'Science', '2018-04-01', 35000)
       ON CONFLICT (employee_id) DO UPDATE SET user_id = EXCLUDED.user_id`,
      [createdUsers.teacher]
    );
    console.log("  staff record created for teacher Anita Verma");
  }

  // Create staff entry for principal
  if (createdUsers.principal) {
    await pool.query(
      `INSERT INTO staff (user_id, employee_id, name, designation, department, joining_date, salary_basic)
       VALUES ($1, 'SNPS-STAFF-000', 'R. K. Sharma', 'Principal', 'Administration', '2010-04-01', 75000)
       ON CONFLICT (employee_id) DO UPDATE SET user_id = EXCLUDED.user_id`,
      [createdUsers.principal]
    );
    console.log("  staff record created for principal");
  }

  // Seed demo fee payments
  const { rows: studentRows } = await pool.query(`SELECT id FROM students LIMIT 1`);
  const { rows: feeStructureRows } = await pool.query(`SELECT id FROM fee_structure LIMIT 1`);
  if (studentRows[0] && feeStructureRows[0]) {
    for (let m = 1; m <= 3; m++) {
      await pool.query(
        `INSERT INTO fee_payments (student_id, fee_structure_id, amount, payment_date, mode, receipt_no, status)
         VALUES ($1, $2, $3, $4, 'cash', $5, 'paid')
         ON CONFLICT (receipt_no) DO NOTHING`,
        [studentRows[0].id, feeStructureRows[0].id, 6500, `2026-0${m}-15`, `RCPT-2026-00${m}`]
      );
    }
    console.log("  demo fee payments seeded");
  }

  // Seed demo attendance records (June 2026)
  if (studentRows[0]) {
    for (let d = 1; d <= 20; d++) {
      const date = new Date(2026, 5, d);
      if (date.getDay() !== 0) {
        const status = d % 10 === 0 ? "absent" : "present";
        await pool.query(
          `INSERT INTO attendance (student_id, date, status)
           VALUES ($1, $2, $3) ON CONFLICT (student_id, date) DO NOTHING`,
          [studentRows[0].id, date.toISOString().slice(0, 10), status]
        );
      }
    }
    console.log("  demo attendance records seeded");
  }

  // Seed transport routes and buses
  const { rows: routeRows } = await pool.query(
    `INSERT INTO transport_routes (name) VALUES ('Pindra - Varanasi Main')
     ON CONFLICT DO NOTHING RETURNING id`
  );
  if (routeRows[0]) {
    await pool.query(
      `INSERT INTO buses (route_id, number_plate, driver_name, driver_phone, last_lat, last_lng)
       VALUES ($1, 'UP65 BT 1234', 'Ramesh Kumar', '9876543210', 25.3176, 82.9739)
       ON CONFLICT DO NOTHING`,
      [routeRows[0].id]
    );
    console.log("  demo transport routes and buses seeded");
  }

  // Seed library books
  const demoBooks = [
    { title: "NCERT Mathematics Class 8", author: "NCERT", isbn: "978-8174504531", barcode: "LIB-001", total: 5 },
    { title: "NCERT Science Class 8", author: "NCERT", isbn: "978-8174506245", barcode: "LIB-002", total: 4 },
    { title: "Wings of Fire", author: "A.P.J. Abdul Kalam", isbn: "978-8173711466", barcode: "LIB-003", total: 3 },
    { title: "The Alchemist", author: "Paulo Coelho", isbn: "978-0062315007", barcode: "LIB-004", total: 2 },
    { title: "NCERT English Class 8", author: "NCERT", isbn: "978-8174505262", barcode: "LIB-005", total: 6 },
  ];
  for (const book of demoBooks) {
    await pool.query(
      `INSERT INTO library_books (title, author, isbn, barcode, total_copies, available_copies)
       VALUES ($1, $2, $3, $4, $5, $5) ON CONFLICT (barcode) DO NOTHING`,
      [book.title, book.author, book.isbn, book.barcode, book.total]
    );
  }
  console.log("  demo library books seeded");

  // Seed hostel rooms
  for (let r = 1; r <= 5; r++) {
    await pool.query(
      `INSERT INTO hostel_rooms (room_no, capacity) VALUES ($1, 4) ON CONFLICT (room_no) DO NOTHING`,
      [`R-10${r}`]
    );
  }
  console.log("  demo hostel rooms seeded");

  // Seed inventory
  const demoInventory = [
    { category: "lab", name: "Microscope", quantity: 15, unit: "pcs" },
    { category: "computers", name: "Desktop Computer", quantity: 30, unit: "pcs" },
    { category: "sports", name: "Cricket Bat", quantity: 8, unit: "pcs" },
    { category: "uniform", name: "School Shirt (M)", quantity: 150, unit: "pcs" },
    { category: "stationery", name: "Chalk Box", quantity: 5, unit: "boxes" },
    { category: "furniture", name: "Student Desk", quantity: 200, unit: "pcs" },
  ];
  for (const item of demoInventory) {
    await pool.query(
      `INSERT INTO inventory_items (category, name, quantity, unit) VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [item.category, item.name, item.quantity, item.unit]
    );
  }
  console.log("  demo inventory items seeded");

  console.log("\nSeed complete. Demo accounts:");
  DEMO_USERS.forEach((u) => console.log(`  ${u.role.padEnd(10)} -> ${u.email} / ${DEMO_PASSWORD}`));
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
