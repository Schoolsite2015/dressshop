import { query } from "../config/db.js";

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
  const { admission_no, name, dob, gender, class_id, section_id, address, blood_group } = req.body;
  if (!admission_no || !name) {
    return res.status(400).json({ error: "Admission number and name are required." });
  }
  const { rows } = await query(
    `INSERT INTO students (admission_no, name, dob, gender, class_id, section_id, address, blood_group)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [admission_no, name, dob || null, gender || null, class_id || null, section_id || null, address || null, blood_group || null]
  );
  res.status(201).json({ student: rows[0] });
}

export async function listClasses(req, res) {
  const { rows } = await query(`SELECT * FROM classes ORDER BY sort_order`);
  res.json({ classes: rows });
}

export async function listSections(req, res) {
  const { classId } = req.query;
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
