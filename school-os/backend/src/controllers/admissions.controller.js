import { query } from "../config/db.js";

// Public endpoint — no auth. A parent applying from the school website.
export async function applyOnline(req, res) {
  const { applicantName, dob, classAppliedFor, parentName, motherName, aadharNo, phone, email, address } = req.body;
  if (!applicantName || !classAppliedFor || !parentName || !phone) {
    return res.status(400).json({ error: "Applicant name, class applied for, parent name and phone are required." });
  }
  const { rows } = await query(
    `INSERT INTO admissions (applicant_name, dob, class_applied_for, parent_name, mother_name, aadhar_no, phone, email, address)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, applicant_name, status, applied_at`,
    [applicantName, dob || null, classAppliedFor, parentName, motherName || null, aadharNo || null, phone, email || null, address || null]
  );
  res.status(201).json({ application: rows[0] });
}

// Public — a parent tracking their application by id.
export async function trackApplication(req, res) {
  const { rows } = await query(`SELECT * FROM admissions WHERE id = $1`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "No application found with that ID." });
  res.json({ application: rows[0] });
}

// Staff-only — office/principal view of the admissions pipeline.
export async function listApplications(req, res) {
  const { status } = req.query;
  const { rows } = await query(
    `SELECT * FROM admissions WHERE ($1::text IS NULL OR status = $1) ORDER BY applied_at DESC`,
    [status || null]
  );
  res.json({ applications: rows });
}

export async function updateApplicationStatus(req, res) {
  const { status, interviewSlot } = req.body;
  const allowed = ["submitted", "shortlisted", "interview", "offered", "admitted", "rejected"];
  if (status && !allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(", ")}` });
  }
  const { rows } = await query(
    `UPDATE admissions SET
       status = COALESCE($2, status),
       interview_slot = COALESCE($3, interview_slot)
     WHERE id = $1 RETURNING *`,
    [req.params.id, status || null, interviewSlot || null]
  );
  if (!rows[0]) return res.status(404).json({ error: "Application not found." });
  res.json({ application: rows[0] });
}
