import { query } from "../config/db.js";

export async function createExam(req, res) {
  const { name, classId, academicYear, subjects } = req.body;
  // subjects: [{ subjectId, maxMarks }]
  if (!name || !classId || !academicYear) {
    return res.status(400).json({ error: "name, classId and academicYear are required." });
  }

  const { rows } = await query(
    `INSERT INTO exams (name, class_id, academic_year) VALUES ($1,$2,$3) RETURNING *`,
    [name, classId, academicYear]
  );
  const exam = rows[0];

  if (Array.isArray(subjects) && subjects.length) {
    for (const s of subjects) {
      await query(
        `INSERT INTO exam_subjects (exam_id, subject_id, max_marks) VALUES ($1,$2,$3)`,
        [exam.id, s.subjectId, s.maxMarks || 100]
      );
    }
  }
  res.status(201).json({ exam });
}

export async function listExams(req, res) {
  const { classId } = req.query;
  const { rows } = await query(
    `SELECT e.*, c.name AS class_name FROM exams e
     LEFT JOIN classes c ON c.id = e.class_id
     WHERE ($1::uuid IS NULL OR e.class_id = $1)
     ORDER BY e.academic_year DESC`,
    [classId || null]
  );
  res.json({ exams: rows });
}

export async function getExamSubjects(req, res) {
  const { rows } = await query(
    `SELECT es.id, es.max_marks, s.id AS subject_id, s.name AS subject_name
     FROM exam_subjects es JOIN subjects s ON s.id = es.subject_id
     WHERE es.exam_id = $1 ORDER BY s.name`,
    [req.params.examId]
  );
  res.json({ examSubjects: rows });
}

// GET /exams/:examId/marks?classId=&sectionId=  -> gradebook grid: students x subjects
export async function getGradebook(req, res) {
  const { examId } = req.params;
  const { classId, sectionId } = req.query;

  const { rows: subjects } = await query(
    `SELECT es.id AS exam_subject_id, s.name AS subject_name, es.max_marks
     FROM exam_subjects es JOIN subjects s ON s.id = es.subject_id
     WHERE es.exam_id = $1 ORDER BY s.name`,
    [examId]
  );

  const { rows: students } = await query(
    `SELECT id, name, admission_no FROM students
     WHERE class_id = $1 AND ($2::uuid IS NULL OR section_id = $2)
     ORDER BY name`,
    [classId, sectionId || null]
  );

  const { rows: marks } = await query(
    `SELECT m.student_id, m.exam_subject_id, m.marks_obtained
     FROM marks m JOIN exam_subjects es ON es.id = m.exam_subject_id
     WHERE es.exam_id = $1`,
    [examId]
  );

  const marksMap = {};
  marks.forEach((m) => { marksMap[`${m.student_id}:${m.exam_subject_id}`] = m.marks_obtained; });

  const grid = students.map((s) => ({
    student: s,
    marks: subjects.map((sub) => ({
      examSubjectId: sub.exam_subject_id,
      subjectName: sub.subject_name,
      maxMarks: sub.max_marks,
      obtained: marksMap[`${s.id}:${sub.exam_subject_id}`] ?? null,
    })),
  }));

  res.json({ subjects, grid });
}

// POST /exams/marks  body: { entries: [{ studentId, examSubjectId, marksObtained }] }
export async function saveMarks(req, res) {
  const { entries } = req.body;
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: "entries is required." });
  }
  const saved = [];
  for (const e of entries) {
    const { rows } = await query(
      `INSERT INTO marks (exam_subject_id, student_id, marks_obtained)
       VALUES ($1,$2,$3)
       ON CONFLICT (exam_subject_id, student_id)
       DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained
       RETURNING *`,
      [e.examSubjectId, e.studentId, e.marksObtained]
    );
    saved.push(rows[0]);
  }
  res.json({ saved: saved.length });
}

// Convenience for the AI Report Card page: a student's marks for one exam,
// already shaped as { subject, obtained, max }.
export async function getStudentExamMarks(req, res) {
  const { examId, studentId } = req.params;
  const { rows } = await query(
    `SELECT s.name AS subject, m.marks_obtained AS obtained, es.max_marks AS max
     FROM marks m
     JOIN exam_subjects es ON es.id = m.exam_subject_id
     JOIN subjects s ON s.id = es.subject_id
     WHERE es.exam_id = $1 AND m.student_id = $2`,
    [examId, studentId]
  );
  res.json({ marks: rows });
}
