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
  const { role, id: userId } = req.user;

  let assignedClassIds = [];
  
  if (role === "teacher") {
    const { rows: staffRows } = await query(`SELECT id FROM staff WHERE user_id = $1`, [userId]);
    if (staffRows.length === 0) return res.json({ homework: [] });
    const staffId = staffRows[0].id;

    const { rows: classes } = await query(`
      SELECT class_id FROM teacher_class_assignments WHERE teacher_id = $1
      UNION
      SELECT class_id FROM teacher_subject_assignments WHERE teacher_id = $1
    `, [staffId]);
    assignedClassIds = classes.map(c => c.class_id);
    
    if (classId && !assignedClassIds.includes(classId)) {
      return res.status(403).json({ error: "Not authorized for this class." });
    }
  } else if (role === "student") {
    const { rows: studentRows } = await query(`SELECT class_id, section_id FROM students WHERE user_id = $1`, [userId]);
    if (studentRows.length > 0) {
      const studentClassId = studentRows[0].class_id;
      const studentSectionId = studentRows[0].section_id;
      if ((classId && classId !== studentClassId) || (sectionId && sectionId !== studentSectionId)) {
        return res.status(403).json({ error: "Not authorized to view other class homework." });
      }
      assignedClassIds = [studentClassId];
    }
  } else if (role === "parent") {
    // For parent, they can see homework for their children's classes
    const { rows: children } = await query(`SELECT class_id FROM students WHERE parent_user_id = $1`, [userId]);
    assignedClassIds = children.map(c => c.class_id);
    if (classId && !assignedClassIds.includes(classId)) {
      return res.status(403).json({ error: "Not authorized for this class." });
    }
  }

  let dbQuery = `
     SELECT h.*, s.name AS subject_name, c.name AS class_name, sec.name AS section_name
     FROM homework h
     LEFT JOIN subjects s ON s.id = h.subject_id
     LEFT JOIN classes c ON c.id = h.class_id
     LEFT JOIN sections sec ON sec.id = h.section_id
     WHERE 1=1
  `;
  const params = [];
  
  if (classId) {
    params.push(classId);
    dbQuery += ` AND h.class_id = $${params.length}`;
  } else if (["teacher", "student", "parent"].includes(role)) {
    if (assignedClassIds.length === 0) return res.json({ homework: [] });
    dbQuery += ` AND h.class_id = ANY($${params.length + 1}::uuid[])`;
    params.push(assignedClassIds);
  }

  if (sectionId) {
    params.push(sectionId);
    dbQuery += ` AND h.section_id = $${params.length}`;
  } else if (role === "student") {
    // strict section check for student
    const { rows: studentRows } = await query(`SELECT section_id FROM students WHERE user_id = $1`, [userId]);
    if (studentRows.length > 0 && studentRows[0].section_id) {
      params.push(studentRows[0].section_id);
      dbQuery += ` AND h.section_id = $${params.length}`;
    }
  }

  dbQuery += ` ORDER BY h.due_date DESC NULLS LAST, h.created_at DESC`;

  const { rows } = await query(dbQuery, params);
  res.json({ homework: rows });
}

export async function deleteHomework(req, res) {
  await query(`DELETE FROM homework WHERE id = $1`, [req.params.id]);
  res.json({ deleted: true });
}
