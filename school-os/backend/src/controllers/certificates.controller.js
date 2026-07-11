import { query } from "../config/db.js";

function serial() {
  return `SNPS-CERT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
}

export async function issueCertificate(req, res) {
  const { studentId, type } = req.body;
  if (!studentId || !type) return res.status(400).json({ error: "studentId and type required." });
  const certSerial = serial();
  const verifyUrl  = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-certificate/${certSerial}`;

  const { rows } = await query(
    `INSERT INTO certificates (student_id, type, qr_code, issued_by)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [studentId, type, verifyUrl, req.user.id]
  );
  // Store serial in qr_code field for lookup
  await query(`UPDATE certificates SET qr_code = $1 WHERE id = $2`,
    [`${verifyUrl}|${rows[0].id}`, rows[0].id]);

  const { rows: full } = await query(
    `SELECT c.*, s.name AS student_name, s.admission_no, s.class_id,
            cl.name AS class_name, u.name AS issued_by_name
     FROM certificates c
     JOIN students s ON s.id = c.student_id
     LEFT JOIN classes cl ON cl.id = s.class_id
     LEFT JOIN users u ON u.id = c.issued_by
     WHERE c.id = $1`,
    [rows[0].id]
  );
  res.status(201).json({ certificate: full[0] });
}

export async function listCertificates(req, res) {
  const { studentId, type } = req.query;
  const { rows } = await query(
    `SELECT c.*, s.name AS student_name, s.admission_no, cl.name AS class_name, u.name AS issued_by_name
     FROM certificates c
     JOIN students s ON s.id = c.student_id
     LEFT JOIN classes cl ON cl.id = s.class_id
     LEFT JOIN users u ON u.id = c.issued_by
     WHERE ($1::uuid IS NULL OR c.student_id = $1)
       AND ($2::text IS NULL OR c.type = $2)
     ORDER BY c.issued_date DESC`,
    [studentId || null, type || null]
  );
  res.json({ certificates: rows });
}

export async function verifyCertificate(req, res) {
  // id can be the UUID or the serial embedded in qr_code
  const { id } = req.params;
  const { rows } = await query(
    `SELECT c.*, s.name AS student_name, s.admission_no, cl.name AS class_name, u.name AS issued_by_name
     FROM certificates c
     JOIN students s ON s.id = c.student_id
     LEFT JOIN classes cl ON cl.id = s.class_id
     LEFT JOIN users u ON u.id = c.issued_by
     WHERE c.id = $1 OR c.qr_code LIKE $2`,
    [id, `%${id}%`]
  );
  if (!rows[0]) return res.status(404).json({ error: "Certificate not found.", valid: false });
  res.json({ certificate: rows[0], valid: true });
}
