import { query } from "../config/db.js";

export async function listItems(req, res) {
  const { category } = req.query;
  const { rows } = await query(
    `SELECT * FROM inventory_items
     WHERE ($1::text IS NULL OR category = $1)
     ORDER BY category, name`,
    [category || null]
  );
  res.json({ items: rows });
}

export async function addItem(req, res) {
  const { category, name, quantity, unit } = req.body;
  if (!category || !name) return res.status(400).json({ error: "category and name required." });
  const { rows } = await query(
    `INSERT INTO inventory_items (category, name, quantity, unit) VALUES ($1,$2,$3,$4) RETURNING *`,
    [category, name, quantity || 0, unit || "pcs"]
  );
  res.status(201).json({ item: rows[0] });
}

export async function updateItem(req, res) {
  const { quantity, name, unit, category } = req.body;
  const { rows } = await query(
    `UPDATE inventory_items SET
       name     = COALESCE($1, name),
       category = COALESCE($2, category),
       quantity = COALESCE($3, quantity),
       unit     = COALESCE($4, unit)
     WHERE id = $5 RETURNING *`,
    [name || null, category || null, quantity != null ? quantity : null, unit || null, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Item not found." });
  res.json({ item: rows[0] });
}

export async function deleteItem(req, res) {
  await query(`DELETE FROM inventory_items WHERE id = $1`, [req.params.id]);
  res.json({ success: true });
}
