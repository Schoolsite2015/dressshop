import { query } from "../config/db.js";

// Public — the school website shows a subset (audience = 'all').
export async function listPublicNotices(req, res) {
  const { rows } = await query(
    `SELECT id, title, body, created_at FROM notices WHERE audience = 'all' ORDER BY created_at DESC LIMIT 20`
  );
  res.json({ notices: rows });
}

// Staff — full list including targeted audiences (parents/teachers/students).
export async function listAllNotices(req, res) {
  const { rows } = await query(`SELECT * FROM notices ORDER BY created_at DESC LIMIT 100`);
  res.json({ notices: rows });
}

export async function createNotice(req, res) {
  const { title, body, audience } = req.body;
  if (!title || !body) return res.status(400).json({ error: "title and body are required." });
  const { rows } = await query(
    `INSERT INTO notices (title, body, audience, created_by) VALUES ($1,$2,$3,$4) RETURNING *`,
    [title, body, audience || "all", req.user.id]
  );
  res.status(201).json({ notice: rows[0] });
}

export async function deleteNotice(req, res) {
  await query(`DELETE FROM notices WHERE id = $1`, [req.params.id]);
  res.json({ deleted: true });
}
