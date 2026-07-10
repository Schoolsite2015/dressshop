import { pool, query } from "../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const generatePassword = () => {
  // Generates something like "Sn@5a8b2c" — readable and secure enough
  const hex = crypto.randomBytes(3).toString("hex");
  return `Sn@${hex}`;
};

const hashPassword = async (pwd) => {
  return await bcrypt.hash(pwd, 10);
};

export async function addStudent(req, res) {
  const { name, dob, gender, blood_group, class_id, section_id, address, parent_name, parent_email, parent_phone } = req.body;
  if (!name || !class_id || !parent_name) {
    return res.status(400).json({ error: "Name, class, and parent name are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const studentPassword = generatePassword();
    const parentPassword = generatePassword();
    
    // Generate unique emails
    const ts = Date.now();
    const safeName = name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10);
    const studentEmail = `${safeName}.${ts}@snpublicschool.edu.in`;
    const pEmail = parent_email || `parent.${safeName}.${ts}@snpublicschool.edu.in`;

    // 1. Create Student User account
    const sHash = await hashPassword(studentPassword);
    const { rows: studentUsers } = await client.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'student') RETURNING id`,
      [name, studentEmail, sHash]
    );
    const studentUserId = studentUsers[0].id;

    // 2. Create Parent User account
    const pHash = await hashPassword(parentPassword);
    const { rows: parentUsers } = await client.query(
      `INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, 'parent') RETURNING id`,
      [parent_name, pEmail, parent_phone || null, pHash]
    );
    const parentUserId = parentUsers[0].id;

    // 3. Generate unique admission number
    const year = new Date().getFullYear();
    const { rows: countRows } = await client.query(`SELECT COUNT(*) FROM students`);
    const seq = String(Number(countRows[0].count) + 1).padStart(4, "0");
    const admissionNo = `SNPS-${year}-${seq}`;

    // 4. Create Student Record
    const photoUrl = req.file ? `/uploads/photos/${req.file.filename}` : null;
    const { rows: students } = await client.query(
      `INSERT INTO students (user_id, admission_no, name, dob, gender, blood_group, class_id, section_id, parent_user_id, address, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [studentUserId, admissionNo, name, dob || null, gender || null, blood_group || null, class_id, section_id || null, parentUserId, address || null, photoUrl]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Student and Parent accounts created successfully",
      student: students[0],
      credentials: {
        student: { email: studentEmail, password: studentPassword },
        parent: { email: pEmail, password: parentPassword }
      }
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("addStudent error:", err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Duplicate entry — email or admission number already exists." });
    }
    res.status(500).json({ error: "Failed to create student: " + err.message });
  } finally {
    client.release();
  }
}

export async function addStaff(req, res) {
  const { name, email, phone, role, designation, department, salary_basic } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: "Name, email, and role are required" });
  }

  const validRoles = ["teacher", "office", "hr", "librarian", "transport"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `Role must be one of: ${validRoles.join(", ")}` });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const password = generatePassword();
    const hash = await hashPassword(password);

    // 1. Create User account
    const { rows: users } = await client.query(
      `INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [name, email, phone || null, hash, role]
    );
    const userId = users[0].id;

    // 2. Generate employee ID
    const { rows: countRows } = await client.query(`SELECT COUNT(*) FROM staff`);
    const seq = String(Number(countRows[0].count) + 1).padStart(4, "0");
    const employeeId = `SNPS-STAFF-${seq}`;

    // 3. Create Staff Record
    const photoUrl = req.file ? `/uploads/photos/${req.file.filename}` : null;
    const { rows: staff } = await client.query(
      `INSERT INTO staff (user_id, employee_id, name, designation, department, joining_date, salary_basic, photo_url)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7) RETURNING *`,
      [userId, employeeId, name, designation || null, department || null, salary_basic ? Number(salary_basic) : null, photoUrl]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Staff account created successfully",
      staff: staff[0],
      credentials: { email, password }
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("addStaff error:", err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    res.status(500).json({ error: "Failed to create staff: " + err.message });
  } finally {
    client.release();
  }
}

export async function listClasses(req, res) {
  const { rows } = await query(`SELECT * FROM classes ORDER BY sort_order, name`);
  res.json({ classes: rows });
}

export async function addClass(req, res) {
  const { name, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: "Class name is required" });
  try {
    const { rows } = await query(`INSERT INTO classes (name, sort_order) VALUES ($1, $2) RETURNING *`, [name, sort_order || 0]);
    res.status(201).json({ class: rows[0] });
  } catch (err) {
    res.status(409).json({ error: "This class may already exist." });
  }
}

export async function listSections(req, res) {
  const { rows } = await query(
    `SELECT s.*, c.name AS class_name FROM sections s JOIN classes c ON c.id = s.class_id ORDER BY c.sort_order, s.name`
  );
  res.json({ sections: rows });
}

export async function addSection(req, res) {
  const { class_id, name } = req.body;
  if (!class_id || !name) return res.status(400).json({ error: "class_id and name are required" });
  try {
    const { rows } = await query(`INSERT INTO sections (class_id, name) VALUES ($1, $2) RETURNING *`, [class_id, name]);
    res.status(201).json({ section: rows[0] });
  } catch (err) {
    res.status(409).json({ error: "This section may already exist for this class." });
  }
}

export async function listAcademicYears(req, res) {
  const { rows } = await query(`SELECT * FROM academic_years ORDER BY start_date DESC`);
  res.json({ academicYears: rows });
}

export async function addAcademicYear(req, res) {
  const { label, start_date, end_date, is_current } = req.body;
  if (!label || !start_date || !end_date) return res.status(400).json({ error: "label, start_date, and end_date are required" });
  try {
    if (is_current) {
      await query(`UPDATE academic_years SET is_current = FALSE`);
    }
    const { rows } = await query(
      `INSERT INTO academic_years (label, start_date, end_date, is_current) VALUES ($1, $2, $3, $4) RETURNING *`,
      [label, start_date, end_date, is_current || false]
    );
    res.status(201).json({ academicYear: rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to add academic year." });
  }
}
