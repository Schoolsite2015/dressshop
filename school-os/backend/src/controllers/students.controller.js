import { query } from "../config/db.js";
import { randomUUID } from "crypto";

export async function listStudents(req, res) {
  const { classId, sectionId, search } = req.query;
  const conditions = [];
  const params = [];

  if (classId) { params.push(classId); conditions.push(`s.class_id = $${params.length}`); }
  if (sectionId) { params.push(sectionId); conditions.push(`s.section_id = $${params.length}`); }
  if (search) { params.push(`%${search}%`); conditions.push(`s.name ILIKE $${params.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await query(
    `SELECT s.id, s.admission_no, s.name, s.dob, s.gender, s.status,
            c.name AS class_name, sec.name AS section_name
     FROM students s
     LEFT JOIN classes c ON c.id = s.class_id
     LEFT JOIN sections sec ON sec.id = s.section_id
     ${where}
     ORDER BY c.sort_order, sec.name, s.name`,
    params
  );
  res.json({ students: rows });
}

export async function getStudent(req, res) {
  const { rows } = await query(
    `SELECT s.*, c.name AS class_name, sec.name AS section_name
     FROM students s
     LEFT JOIN classes c ON c.id = s.class_id
     LEFT JOIN sections sec ON sec.id = s.section_id
     WHERE s.id = $1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Student not found." });
  res.json({ student: rows[0] });
}

export async function createStudent(req, res) {
  const { admission_no, name, dob, gender, class_id, section_id, address, blood_group, mother_name, aadhar_no } = req.body;
  if (!admission_no || !name) {
    return res.status(400).json({ error: "Admission number and name are required." });
  }
  const qr_code = "QR-" + admission_no + "-" + randomUUID().split("-")[0];
  const { rows } = await query(
    `INSERT INTO students (admission_no, name, dob, gender, class_id, section_id, address, blood_group, mother_name, aadhar_no, qr_code)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [admission_no, name, dob || null, gender || null, class_id || null, section_id || null, address || null, blood_group || null, mother_name || null, aadhar_no || null, qr_code]
  );
  res.status(201).json({ student: rows[0] });
}

export async function updateStudent(req, res) {
  const { id } = req.params;
  const { name, dob, gender, class_id, section_id, address, blood_group, mother_name, aadhar_no, status } = req.body;
  
  const { rows } = await query(
    `UPDATE students SET
      name = COALESCE($2, name),
      dob = COALESCE($3, dob),
      gender = COALESCE($4, gender),
      class_id = COALESCE($5, class_id),
      section_id = COALESCE($6, section_id),
      address = COALESCE($7, address),
      blood_group = COALESCE($8, blood_group),
      mother_name = COALESCE($9, mother_name),
      aadhar_no = COALESCE($10, aadhar_no),
      status = COALESCE($11, status)
     WHERE id = $1 RETURNING *`,
    [id, name, dob, gender, class_id, section_id, address, blood_group, mother_name, aadhar_no, status]
  );
  
  if (!rows[0]) return res.status(404).json({ error: "Student not found." });
  res.json({ student: rows[0] });
}

export async function lookupStudent(req, res) {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' (admission number or QR code) is required." });
  }
  const { rows } = await query(
    `SELECT s.*, c.name AS class_name, sec.name AS section_name
     FROM students s
     LEFT JOIN classes c ON c.id = s.class_id
     LEFT JOIN sections sec ON sec.id = s.section_id
     WHERE s.qr_code = $1 OR s.admission_no = $1`,
    [q]
  );
  if (!rows[0]) return res.status(404).json({ error: "Student not found." });
  res.json({ student: rows[0] });
}

export async function listClasses(req, res) {
  if (req.user.role === "teacher") {
    // Only return classes this teacher is assigned to
    const { rows: staffRows } = await query(`SELECT id FROM staff WHERE user_id = $1`, [req.user.id]);
    if (staffRows.length === 0) return res.json({ classes: [] });
    const staffId = staffRows[0].id;
    
    const { rows } = await query(`
      SELECT DISTINCT c.* FROM classes c
      LEFT JOIN teacher_class_assignments tca ON tca.class_id = c.id AND tca.teacher_id = $1
      LEFT JOIN teacher_subject_assignments tsa ON tsa.class_id = c.id AND tsa.teacher_id = $1
      WHERE tca.id IS NOT NULL OR tsa.id IS NOT NULL
      ORDER BY c.sort_order
    `, [staffId]);
    return res.json({ classes: rows });
  }

  if (req.user.role === "student") {
    // Only return the student's own class
    const { rows } = await query(`
      SELECT DISTINCT c.* FROM classes c
      JOIN students s ON s.class_id = c.id
      WHERE s.user_id = $1
      ORDER BY c.sort_order
    `, [req.user.id]);
    return res.json({ classes: rows });
  }

  if (req.user.role === "parent") {
    // Only return the parent's children's classes
    const { rows } = await query(`
      SELECT DISTINCT c.* FROM classes c
      JOIN students s ON s.class_id = c.id
      WHERE s.parent_user_id = $1
      ORDER BY c.sort_order
    `, [req.user.id]);
    return res.json({ classes: rows });
  }

  // Otherwise return all classes (office, principal, admin)
  const { rows } = await query(`SELECT * FROM classes ORDER BY sort_order`);
  res.json({ classes: rows });
}

export async function listSections(req, res) {
  const { classId } = req.query;
  
  if (req.user.role === "teacher") {
    const { rows: staffRows } = await query(`SELECT id FROM staff WHERE user_id = $1`, [req.user.id]);
    if (staffRows.length === 0) return res.json({ sections: [] });
    const staffId = staffRows[0].id;
    
    let dbQuery = `
      SELECT DISTINCT sec.* FROM sections sec
      LEFT JOIN teacher_class_assignments tca ON tca.section_id = sec.id AND tca.teacher_id = $1
      LEFT JOIN teacher_subject_assignments tsa ON tsa.section_id = sec.id AND tsa.teacher_id = $1
      WHERE (tca.id IS NOT NULL OR tsa.id IS NOT NULL)
    `;
    const params = [staffId];
    if (classId) {
      dbQuery += ` AND sec.class_id = $2`;
      params.push(classId);
    }
    dbQuery += ` ORDER BY sec.name`;
    const { rows } = await query(dbQuery, params);
    return res.json({ sections: rows });
  }

  const { rows } = await query(
    classId
      ? `SELECT * FROM sections WHERE class_id = $1 ORDER BY name`
      : `SELECT * FROM sections ORDER BY name`,
    classId ? [classId] : []
  );
  res.json({ sections: rows });
}

export async function listSubjects(req, res) {
  const { rows } = await query(`SELECT * FROM subjects ORDER BY name`);
  res.json({ subjects: rows });
}

// GET /students/profile — resolves the logged-in user's student record
export async function getMyProfile(req, res) {
  const { rows } = await query(
    `SELECT s.*, c.name AS class_name, sec.name AS section_name,
            u.email, u.phone
     FROM students s
     LEFT JOIN classes c ON c.id = s.class_id
     LEFT JOIN sections sec ON sec.id = s.section_id
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.user_id = $1`,
    [req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Student profile not found." });
  res.json({ student: rows[0] });
}

// GET /students/children — resolves the logged-in parent's children
export async function getMyChildren(req, res) {
  const { rows } = await query(
    `SELECT s.*, c.name AS class_name, sec.name AS section_name
     FROM students s
     LEFT JOIN classes c ON c.id = s.class_id
     LEFT JOIN sections sec ON sec.id = s.section_id
     WHERE s.parent_user_id = $1
     ORDER BY s.name`,
    [req.user.id]
  );
  res.json({ children: rows });
}
