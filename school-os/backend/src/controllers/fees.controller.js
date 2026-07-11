import { query } from "../config/db.js";
import { sendFeeReceipt } from "../services/whatsapp.service.js";

export async function listFeeStructure(req, res) {
  const { classId } = req.query;
  const { rows } = await query(
    `SELECT fs.*, c.name AS class_name FROM fee_structure fs
     LEFT JOIN classes c ON c.id = fs.class_id
     WHERE ($1::uuid IS NULL OR fs.class_id = $1)
     ORDER BY fs.due_date`,
    [classId || null]
  );
  res.json({ feeStructure: rows });
}

export async function recordPayment(req, res) {
  const { studentId, feeStructureId, amount, mode, receiptNo } = req.body;
  if (!studentId || !amount) {
    return res.status(400).json({ error: "studentId and amount are required." });
  }
  
  const finalReceiptNo = receiptNo || `RC-${Date.now()}`;
  const { rows } = await query(
    `INSERT INTO fee_payments (student_id, fee_structure_id, amount, mode, receipt_no, status)
     VALUES ($1,$2,$3,$4,$5,'paid') RETURNING *`,
    [studentId, feeStructureId || null, amount, mode || "cash", finalReceiptNo]
  );
  
  // Try to get parent phone number to send WhatsApp
  try {
    const { rows: studentRows } = await query(
      `SELECT s.name AS student_name, u.phone 
       FROM students s 
       LEFT JOIN users u ON u.id = s.parent_user_id 
       WHERE s.id = $1`,
      [studentId]
    );
    
    if (studentRows.length > 0 && studentRows[0].phone) {
      const link = `https://snpublicschool.edu.in/verify/receipt/${finalReceiptNo}`;
      sendFeeReceipt(
        studentRows[0].phone, 
        studentRows[0].student_name, 
        amount, 
        finalReceiptNo, 
        link
      ).catch(console.error); // Fire and forget so we don't block the API response
    }
  } catch (err) {
    console.error("Failed to fetch parent phone for WhatsApp:", err);
  }

  res.status(201).json({ payment: rows[0] });
}

export async function getStudentFees(req, res) {
  const { studentId } = req.params;

  const { rows: payments } = await query(
    `SELECT * FROM fee_payments WHERE student_id = $1 ORDER BY payment_date DESC`,
    [studentId]
  );

  const { rows: student } = await query(`SELECT class_id FROM students WHERE id = $1`, [studentId]);
  const { rows: structure } = await query(
    `SELECT * FROM fee_structure WHERE class_id = $1`,
    [student[0]?.class_id]
  );

  const totalDue = structure.reduce((sum, s) => sum + Number(s.amount), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  res.json({
    feeStructure: structure,
    payments,
    summary: { totalDue, totalPaid, balance: totalDue - totalPaid },
  });
}

// Simple dashboard aggregate for the Principal's fee-collection widget.
export async function feeCollectionSummary(req, res) {
  const { rows } = await query(
    `SELECT date_trunc('month', payment_date)::date AS month, SUM(amount) AS collected
     FROM fee_payments
     GROUP BY 1 ORDER BY 1 DESC LIMIT 12`
  );
  res.json({ monthly: rows });
}
