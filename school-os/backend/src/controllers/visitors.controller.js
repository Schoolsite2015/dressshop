import { query } from "../config/db.js";

export async function getVisitors(req, res) {
  try {
    const { rows } = await query(
      `SELECT * FROM visitors ORDER BY check_in_time DESC LIMIT 50`
    );
    res.json({ visitors: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch visitors" });
  }
}

export async function checkInVisitor(req, res) {
  const { name, phone, purpose, whomToMeet } = req.body;
  if (!name || !phone || !purpose) {
    return res.status(400).json({ error: "Name, phone, and purpose are required." });
  }

  try {
    const { rows } = await query(
      `INSERT INTO visitors (name, phone, purpose, whom_to_meet)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, phone, purpose, whomToMeet]
    );
    res.status(201).json({ visitor: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Check-in failed" });
  }
}

export async function checkOutVisitor(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await query(
      `UPDATE visitors 
       SET check_out_time = now(), status = 'checked_out'
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Visitor not found" });
    res.json({ visitor: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Check-out failed" });
  }
}
