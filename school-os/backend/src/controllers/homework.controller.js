import { query } from "../config/db.js";

export async function createHomework(req, res) {
  const { classId, sectionId, subjectId, description, dueDate } = req.body;
  if (!classId || !description) {
    return res.status(400).json({ error: "classId and description are required." });
  }
  const { rows } = await query(
    `INSERT INTO homework (class_id, section_id, subject_id, description, due_date)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [classId, sectionId || null, subjectId || null, description, dueDate || null]
  );
  res.status(201).json({ homework: rows[0] });
}

// GET /homework?classId=&sectionId=
export async function listHomework(req, res) {
  const { classId, sectionId } = req.query;
  const { rows } = await query(
    `SELECT h.*, s.name AS subject_name, c.name AS class_name, sec.name AS section_name
     FROM homework h
     LEFT JOIN subjects s ON s.id = h.subject_id
     LEFT JOIN classes c ON c.id = h.class_id
     LEFT JOIN sections sec ON sec.id = h.section_id
     WHERE ($1::uuid IS NULL OR h.class_id = $1)
       AND ($2::uuid IS NULL OR h.section_id = $2)
     ORDER BY h.due_date DESC NULLS LAST, h.created_at DESC`,
    [classId || null, sectionId || null]
  );
  res.json({ homework: rows });
}

export async function deleteHomework(req, res) {
  await query(`DELETE FROM homework WHERE id = $1`, [req.params.id]);
  res.json({ deleted: true });
}
