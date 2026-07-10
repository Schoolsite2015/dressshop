import { query } from "../config/db.js";

export async function listEvents(req, res) {
  const { rows } = await query(`SELECT * FROM events ORDER BY event_date DESC`);
  res.json({ events: rows });
}

export async function addEvent(req, res) {
  const { title, description, eventDate, venue } = req.body;
  if (!title || !eventDate) return res.status(400).json({ error: "title and eventDate required." });
  const { rows } = await query(
    `INSERT INTO events (title, description, event_date, venue) VALUES ($1,$2,$3,$4) RETURNING *`,
    [title, description || null, eventDate, venue || null]
  );
  res.status(201).json({ event: rows[0] });
}

export async function updateEvent(req, res) {
  const { title, description, eventDate, venue } = req.body;
  const { rows } = await query(
    `UPDATE events SET title=COALESCE($1,title), description=COALESCE($2,description),
     event_date=COALESCE($3,event_date), venue=COALESCE($4,venue) WHERE id=$5 RETURNING *`,
    [title||null, description||null, eventDate||null, venue||null, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Event not found." });
  res.json({ event: rows[0] });
}

export async function deleteEvent(req, res) {
  await query(`DELETE FROM events WHERE id = $1`, [req.params.id]);
  res.json({ success: true });
}
