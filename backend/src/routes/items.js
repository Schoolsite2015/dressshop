import { Router } from 'express';
import QRCode from 'qrcode';
import db from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const CATEGORIES = ['Shirt', 'Pant', 'Skirt', 'Lower', 'T-Shirt', 'Jacket', 'Sweater',
  'Tie', 'Belt', 'Socks', 'House T-Shirt', 'House Lower', 'Blazer', 'Cap'];

function statusFor(stock, minimum) {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= minimum) return 'low_stock';
  return 'ok';
}

// GET /api/items - full catalog with sizes & stock, optional filters
router.get('/', (req, res) => {
  const { category, status } = req.query;
  let items = db.prepare('SELECT * FROM items WHERE school_id = ? ORDER BY category, name').all(req.schoolId);
  if (category) items = items.filter(i => i.category === category);

  const sizeStmt = db.prepare('SELECT * FROM item_sizes WHERE item_id = ? ORDER BY CAST(size AS INTEGER)');
  let result = items.map(item => {
    const sizes = sizeStmt.all(item.id).map(s => ({
      ...s,
      status: statusFor(s.stock, s.minimum_stock),
    }));
    return { ...item, sizes };
  });

  if (status) {
    result = result
      .map(item => ({ ...item, sizes: item.sizes.filter(s => s.status === status) }))
      .filter(item => item.sizes.length > 0);
  }

  res.json({ items: result, categories: CATEGORIES });
});

// GET /api/items/alerts - low stock & out of stock summary
router.get('/alerts', (req, res) => {
  const rows = db.prepare(`
    SELECT i.name, i.category, i.gender, s.size, s.stock, s.minimum_stock
    FROM item_sizes s JOIN items i ON i.id = s.item_id
    WHERE i.school_id = ? AND s.stock <= s.minimum_stock
    ORDER BY s.stock ASC
  `).all(req.schoolId);
  const outOfStock = rows.filter(r => r.stock <= 0);
  const lowStock = rows.filter(r => r.stock > 0);
  res.json({ outOfStock, lowStock, outOfStockCount: outOfStock.length, lowStockCount: lowStock.length });
});

// POST /api/items - add new stock (creates item if needed, creates/updates size entry)
router.post('/', (req, res) => {
  const { name, category, gender, size, quantity, purchasePrice, sellingPrice, minimumStock, supplierId } = req.body;
  if (!name || !category || !size || quantity == null || purchasePrice == null || sellingPrice == null) {
    return res.status(400).json({ error: 'name, category, size, quantity, purchasePrice, sellingPrice are required' });
  }

  db.exec('BEGIN');
  try {
    let item = db.prepare(`SELECT * FROM items WHERE school_id = ? AND name = ? AND category = ?
      AND IFNULL(gender,'') = IFNULL(?,'')`).get(req.schoolId, name, category, gender || null);
    let itemId;
    if (!item) {
      const r = db.prepare('INSERT INTO items (school_id, name, category, gender) VALUES (?, ?, ?, ?)')
        .run(req.schoolId, name, category, gender || null);
      itemId = Number(r.lastInsertRowid);
    } else {
      itemId = item.id;
    }

    let sizeRow = db.prepare('SELECT * FROM item_sizes WHERE item_id = ? AND size = ?').get(itemId, String(size));
    if (sizeRow) {
      db.prepare(`UPDATE item_sizes SET stock = stock + ?, purchase_price = ?, selling_price = ?,
        minimum_stock = COALESCE(?, minimum_stock) WHERE id = ?`)
        .run(Number(quantity), Number(purchasePrice), Number(sellingPrice), minimumStock ?? null, sizeRow.id);
    } else {
      const r = db.prepare(`INSERT INTO item_sizes (item_id, size, stock, minimum_stock, purchase_price, selling_price)
        VALUES (?, ?, ?, ?, ?, ?)`)
        .run(itemId, String(size), Number(quantity), minimumStock ?? 10, Number(purchasePrice), Number(sellingPrice));
      const newSizeId = Number(r.lastInsertRowid);
      const barcode = `SKU${String(newSizeId).padStart(8, '0')}`;
      db.prepare('UPDATE item_sizes SET barcode = ? WHERE id = ?').run(barcode, newSizeId);
      sizeRow = { id: newSizeId };
    }

    db.prepare(`INSERT INTO purchases (item_size_id, supplier_id, quantity, purchase_price) VALUES (?, ?, ?, ?)`)
      .run(sizeRow.id, supplierId || null, Number(quantity), Number(purchasePrice));

    db.exec('COMMIT');
    const updated = db.prepare('SELECT * FROM item_sizes WHERE item_id = ? AND size = ?').get(itemId, String(size));
    res.status(201).json({ itemId, size: updated });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to add stock' });
  }
});

// PUT /api/items/sizes/:sizeId - admin: update price / minimum stock / stock directly
router.put('/sizes/:sizeId', requireAdmin, (req, res) => {
  const { sizeId } = req.params;
  const { stock, minimumStock, purchasePrice, sellingPrice } = req.body;

  const existing = db.prepare(`SELECT isz.* FROM item_sizes isz
    JOIN items i ON i.id = isz.item_id WHERE isz.id = ? AND i.school_id = ?`).get(sizeId, req.schoolId);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  db.prepare(`UPDATE item_sizes SET
    stock = COALESCE(?, stock),
    minimum_stock = COALESCE(?, minimum_stock),
    purchase_price = COALESCE(?, purchase_price),
    selling_price = COALESCE(?, selling_price)
    WHERE id = ?`)
    .run(stock ?? null, minimumStock ?? null, purchasePrice ?? null, sellingPrice ?? null, sizeId);

  res.json(db.prepare('SELECT * FROM item_sizes WHERE id = ?').get(sizeId));
});

// GET /api/items/barcode/:code - look up an item by scanned barcode (for billing)
router.get('/barcode/:code', (req, res) => {
  const row = db.prepare(`
    SELECT isz.*, i.name as item_name, i.category, i.gender
    FROM item_sizes isz JOIN items i ON i.id = isz.item_id
    WHERE i.school_id = ? AND isz.barcode = ?
  `).get(req.schoolId, req.params.code);
  if (!row) return res.status(404).json({ error: 'No item found for this barcode' });
  res.json(row);
});

// GET /api/items/sizes/:sizeId/qrcode - QR code image (data URL) for printing on a stock tag
router.get('/sizes/:sizeId/qrcode', async (req, res) => {
  const row = db.prepare(`SELECT isz.* FROM item_sizes isz JOIN items i ON i.id = isz.item_id
    WHERE isz.id = ? AND i.school_id = ?`).get(req.params.sizeId, req.schoolId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  try {
    const dataUrl = await QRCode.toDataURL(row.barcode, { margin: 1, width: 200 });
    res.json({ barcode: row.barcode, qrDataUrl: dataUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// DELETE /api/items/sizes/:sizeId - admin only
router.delete('/sizes/:sizeId', requireAdmin, (req, res) => {
  const sizeId = Number(req.params.sizeId);
  const { force } = req.query;

  const sizeRow = db.prepare(`
    SELECT isz.id, isz.item_id
    FROM item_sizes isz
    JOIN items i ON isz.item_id = i.id
    WHERE isz.id = ? AND i.school_id = ?
  `).get(sizeId, req.schoolId);

  if (!sizeRow) return res.status(404).json({ error: 'Not found' });

  if (force === 'true') {
    db.exec('BEGIN TRANSACTION');
    try {
      db.prepare('DELETE FROM return_items WHERE item_size_id = ?').run(sizeId);
      db.prepare('DELETE FROM bill_items WHERE item_size_id = ?').run(sizeId);
      db.prepare('DELETE FROM purchases WHERE item_size_id = ?').run(sizeId);
      db.prepare('DELETE FROM item_sizes WHERE id = ?').run(sizeId);
      db.exec('COMMIT');
      res.json({ success: true });
    } catch (err) {
      db.exec('ROLLBACK');
      console.error(err);
      res.status(500).json({ error: 'Failed to force delete size: ' + err.message });
    }
  } else {
    try {
      db.prepare('DELETE FROM item_sizes WHERE id = ?').run(sizeId);
      res.json({ success: true });
    } catch (err) {
      if (err.message.includes('FOREIGN KEY') || err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({
          error: 'history_exists',
          message: 'This size has associated billing or purchase history.'
        });
      }
      res.status(500).json({ error: err.message });
    }
  }
});

// DELETE /api/items/:itemId - admin only
router.delete('/:itemId', requireAdmin, (req, res) => {
  const itemId = Number(req.params.itemId);
  const { force } = req.query;

  const existing = db.prepare('SELECT id FROM items WHERE id = ? AND school_id = ?').get(itemId, req.schoolId);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  if (force === 'true') {
    db.exec('BEGIN TRANSACTION');
    try {
      const sizes = db.prepare('SELECT id FROM item_sizes WHERE item_id = ?').all(itemId);
      const sizeIds = sizes.map(s => s.id);

      if (sizeIds.length > 0) {
        const placeholders = sizeIds.map(() => '?').join(',');
        db.prepare(`DELETE FROM return_items WHERE item_size_id IN (${placeholders})`).run(...sizeIds);
        db.prepare(`DELETE FROM bill_items WHERE item_size_id IN (${placeholders})`).run(...sizeIds);
        db.prepare(`DELETE FROM purchases WHERE item_size_id IN (${placeholders})`).run(...sizeIds);
        db.prepare(`DELETE FROM item_sizes WHERE item_id = ?`).run(itemId);
      }

      db.prepare('DELETE FROM items WHERE id = ?').run(itemId);
      db.exec('COMMIT');
      res.json({ success: true });
    } catch (err) {
      db.exec('ROLLBACK');
      console.error(err);
      res.status(500).json({ error: 'Failed to force delete item: ' + err.message });
    }
  } else {
    try {
      db.prepare('DELETE FROM items WHERE id = ?').run(itemId);
      res.json({ success: true });
    } catch (err) {
      if (err.message.includes('FOREIGN KEY') || err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({
          error: 'history_exists',
          message: 'This item has associated billing or purchase history.'
        });
      }
      res.status(500).json({ error: err.message });
    }
  }
});

export default router;
