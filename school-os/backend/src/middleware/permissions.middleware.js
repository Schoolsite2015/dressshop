import { query } from "../config/db.js";

// Helper to check if a teacher has access to a specific class and section
export async function hasClassAccess(userId, classId, sectionId) {
  // First get the staff_id for this user
  const { rows: staffRows } = await query(`SELECT id FROM staff WHERE user_id = $1`, [userId]);
  if (!staffRows.length) return false;
  const staffId = staffRows[0].id;

  // Check teacher_class_assignments
  const { rows: classRows } = await query(
    `SELECT id FROM teacher_class_assignments WHERE teacher_id = $1 AND class_id = $2 AND section_id = $3`,
    [staffId, classId, sectionId]
  );
  if (classRows.length > 0) return true;

  // Check teacher_subject_assignments
  const { rows: subjectRows } = await query(
    `SELECT id FROM teacher_subject_assignments WHERE teacher_id = $1 AND class_id = $2 AND section_id = $3`,
    [staffId, classId, sectionId]
  );
  if (subjectRows.length > 0) return true;

  return false;
}

// Helper to check if a teacher has access to a specific student
export async function hasStudentAccess(userId, studentId) {
  const { rows } = await query(`SELECT class_id, section_id FROM students WHERE id = $1`, [studentId]);
  if (!rows.length) return false;
  const { class_id, section_id } = rows[0];
  return hasClassAccess(userId, class_id, section_id);
}

// Express middleware for enforcing access based on classId/sectionId in request body/query
export async function requireClassAccess(req, res, next) {
  const { role, id: userId } = req.user;
  
  // Principal and Admin have full access
  if (["principal", "admin"].includes(role)) {
    return next();
  }
  
  // Office has view/administrative access but usually we restrict teacher actions at the route level using `requireRole`
  if (role === "office") {
    return next(); 
  }

  const classId = req.body.classId || req.body.class_id || req.query.classId || req.query.class_id;
  const sectionId = req.body.sectionId || req.body.section_id || req.query.sectionId || req.query.section_id;

  if (classId && sectionId) {
    const hasAccess = await hasClassAccess(userId, classId, sectionId);
    if (!hasAccess) {
      return res.status(403).json({ error: "You are not assigned to this class and section." });
    }
  }

  next();
}

// Express middleware for enforcing access based on studentId
export async function requireStudentAccess(req, res, next) {
  const { role, id: userId } = req.user;
  
  if (["principal", "admin"].includes(role)) {
    return next();
  }
  
  if (role === "office") {
    return next();
  }

  const studentId = req.body.studentId || req.body.student_id || req.query.studentId || req.query.student_id || req.params.studentId || req.params.id;

  if (studentId) {
    const hasAccess = await hasStudentAccess(userId, studentId);
    if (!hasAccess) {
      return res.status(403).json({ error: "You are not assigned to this student." });
    }
  }

  next();
}
