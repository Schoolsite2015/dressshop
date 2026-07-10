import { query } from "../config/db.js";

export async function listStaff(req, res) {
  const { rows } = await query(
    `SELECT s.*, u.email, u.phone, u.role
     FROM staff s LEFT JOIN users u ON u.id = s.user_id
     ORDER BY s.name`
  );
  res.json({ staff: rows });
}

export async function getStaffMember(req, res) {
  const { rows } = await query(
    `SELECT s.*, u.email, u.phone FROM staff s LEFT JOIN users u ON u.id = s.user_id WHERE s.id = $1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Staff not found." });
  res.json({ staff: rows[0] });
}

export async function addStaff(req, res) {
  const { userId, employeeId, name, designation, department, joiningDate, salaryBasic } = req.body;
  if (!employeeId || !name) return res.status(400).json({ error: "employeeId and name required." });
  const { rows } = await query(
    `INSERT INTO staff (user_id, employee_id, name, designation, department, joining_date, salary_basic)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [userId || null, employeeId, name, designation || null, department || null,
     joiningDate || null, salaryBasic || null]
  );
  res.status(201).json({ staff: rows[0] });
}

export async function listPayroll(req, res) {
  const { staffId, month, year } = req.query;
  const { rows } = await query(
    `SELECT p.*, s.name AS staff_name, s.designation
     FROM payroll p JOIN staff s ON s.id = p.staff_id
     WHERE ($1::uuid IS NULL OR p.staff_id = $1)
       AND ($2::int IS NULL OR p.month = $2)
       AND ($3::int IS NULL OR p.year = $3)
     ORDER BY p.year DESC, p.month DESC`,
    [staffId || null, month ? Number(month) : null, year ? Number(year) : null]
  );
  res.json({ payroll: rows });
}

export async function createPayrollEntry(req, res) {
  const { staffId, month, year, basic, allowances, deductions } = req.body;
  if (!staffId || !month || !year) return res.status(400).json({ error: "staffId, month, year required." });
  const net = (basic || 0) + (allowances || 0) - (deductions || 0);
  const { rows } = await query(
    `INSERT INTO payroll (staff_id, month, year, basic, allowances, deductions, net_pay)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (staff_id, month, year)
     DO UPDATE SET basic=EXCLUDED.basic, allowances=EXCLUDED.allowances,
                   deductions=EXCLUDED.deductions, net_pay=EXCLUDED.net_pay
     RETURNING *`,
    [staffId, month, year, basic || 0, allowances || 0, deductions || 0, net]
  );
  res.json({ payroll: rows[0] });
}

export async function markPaid(req, res) {
  const { rows } = await query(
    `UPDATE payroll SET paid_on = CURRENT_DATE WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Payroll entry not found." });
  res.json({ payroll: rows[0] });
}

export async function markStaffAttendance(req, res) {
  const { entries, date } = req.body; // entries: [{staffId, status}]
  if (!Array.isArray(entries)) return res.status(400).json({ error: "entries[] required." });
  const d = date || new Date().toISOString().slice(0, 10);
  for (const e of entries) {
    await query(
      `INSERT INTO staff_attendance (staff_id, date, status) VALUES ($1,$2,$3)
       ON CONFLICT (staff_id, date) DO UPDATE SET status = EXCLUDED.status`,
      [e.staffId, d, e.status]
    );
  }
  res.json({ saved: entries.length });
}

export async function getStaffAttendance(req, res) {
  const { date } = req.query;
  const { rows } = await query(
    `SELECT sa.*, s.name AS staff_name FROM staff_attendance sa
     JOIN staff s ON s.id = sa.staff_id
     WHERE ($1::date IS NULL OR sa.date = $1)
     ORDER BY s.name`,
    [date || null]
  );
  res.json({ attendance: rows });
}
