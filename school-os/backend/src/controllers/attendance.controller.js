import { query } from "../config/db.js";

// Teacher marks attendance for a whole class/section on a given date.
// body: { date, classId, sectionId, records: [{ studentId, status }] }
export async function markAttendance(req, res) {
  const { date, records } = req.body;
  if (!date || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: "Date and at least one attendance record are required." });
  }

  const results = [];
  for (const r of records) {
    const { rows } = await query(
      `INSERT INTO attendance (student_id, date, status, marked_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (student_id, date)
       DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by
       RETURNING *`,
      [r.studentId, date, r.status, req.user.id]
    );
    results.push(rows[0]);
  }

  res.json({ marked: results.length, records: results });
}

// POST /attendance/quick
// body: { studentId, date, status }
export async function markQuickAttendance(req, res) {
  const { studentId, date, status } = req.body;
  if (!studentId || !date || !status) {
    return res.status(400).json({ error: "studentId, date, and status are required." });
  }

  const { rows } = await query(
    `INSERT INTO attendance (student_id, date, status, marked_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (student_id, date)
     DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by
     RETURNING *`,
    [studentId, date, status, req.user.id]
  );

  res.json({ marked: 1, record: rows[0] });
}

// GET /attendance?classId=&sectionId=&date=
export async function getAttendanceForClass(req, res) {
  const { classId, sectionId, date } = req.query;
  if (!date) return res.status(400).json({ error: "date is required." });

  const { rows } = await query(
    `SELECT s.id AS student_id, s.name, s.admission_no, a.status
     FROM students s
     LEFT JOIN attendance a ON a.student_id = s.id AND a.date = $3
     WHERE s.class_id = $1 AND ($2::uuid IS NULL OR s.section_id = $2)
     ORDER BY s.name`,
    [classId, sectionId || null, date]
  );
  res.json({ date, students: rows });
}

// GET /attendance/student/:studentId?from=&to=
export async function getStudentAttendance(req, res) {
  const { studentId } = req.params;
  const { from, to } = req.query;

  const { rows } = await query(
    `SELECT date, status FROM attendance
     WHERE student_id = $1
       AND ($2::date IS NULL OR date >= $2)
       AND ($3::date IS NULL OR date <= $3)
     ORDER BY date DESC`,
    [studentId, from || null, to || null]
  );

  const total = rows.length;
  const present = rows.filter((r) => r.status === "present").length;
  const percentage = total ? Math.round((present / total) * 1000) / 10 : null;

  res.json({ records: rows, summary: { total, present, percentage } });
}
