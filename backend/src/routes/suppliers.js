import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT s.*,
      (SELECT COALESCE(SUM(p.quantity * p.purchase_price), 0)
       FROM purchases p JOIN item_sizes isz ON isz.id = p.item_size_id
       WHERE p.supplier_id = s.id) as total_purchased,
      (SELECT COUNT(*) FROM purchases p WHERE p.supplier_id = s.id) as purchase_count
    FROM suppliers s WHERE s.school_id = ? ORDER BY s.name
  `).all(req.schoolId);
  res.json(rows);
});

router.get('/purchase-history', (req, res) => {
  const rows = db.prepare(`
    SELECT p.id, p.quantity, p.purchase_price, p.purchase_date, p.notes,
           s.name as supplier_name, i.name as item_name, isz.size
    FROM purchases p
    JOIN item_sizes isz ON isz.id = p.item_size_id
    JOIN items i ON i.id = isz.item_id
    LEFT JOIN suppliers s ON s.id = p.supplier_id
    WHERE i.school_id = ?
    ORDER BY p.purchase_date DESC
    LIMIT 200
  `).all(req.schoolId);
  res.json(rows);
});

// GET /reorder-suggestions - smart reordering recommendations based on sales velocity and min stock
router.get('/reorder-suggestions', (req, res) => {
  try {
    const suppliers = db.prepare('SELECT id, name FROM suppliers WHERE school_id = ?').all(req.schoolId);
    
    // Fetch all item sizes and items for this school
    const itemSizes = db.prepare(`
      SELECT isz.*, i.name, i.gender, i.category
      FROM item_sizes isz
      JOIN items i ON isz.item_id = i.id
      WHERE i.school_id = ?
    `).all(req.schoolId);

    // Sales in the last 30 days
    const sales = db.prepare(`
      SELECT bi.item_size_id, SUM(bi.quantity) as qty
      FROM bill_items bi
      JOIN bills b ON bi.bill_id = b.id
      WHERE b.school_id = ? AND b.status = 'active' AND b.created_at >= datetime('now', '-30 days')
      GROUP BY bi.item_size_id
    `).all(req.schoolId);

    // Returns in the last 30 days
    const returns = db.prepare(`
      SELECT ri.item_size_id, SUM(ri.quantity) as qty
      FROM return_items ri
      JOIN returns r ON ri.return_id = r.id
      WHERE r.school_id = ? AND r.created_at >= datetime('now', '-30 days')
      GROUP BY ri.item_size_id
    `).all(req.schoolId);

    const salesMap = new Map();
    for (const s of sales) salesMap.set(s.item_size_id, Number(s.qty));

    const returnsMap = new Map();
    for (const r of returns) returnsMap.set(r.item_size_id, Number(r.qty));

    // Prepare queries for last recorded supplier lookups
    const q1 = db.prepare(`
      SELECT supplier_id FROM purchases
      WHERE item_size_id = ? AND supplier_id IS NOT NULL
      ORDER BY purchase_date DESC LIMIT 1
    `);
    const q2 = db.prepare(`
      SELECT p.supplier_id FROM purchases p
      JOIN item_sizes isz ON p.item_size_id = isz.id
      WHERE isz.item_id = ? AND p.supplier_id IS NOT NULL
      ORDER BY p.purchase_date DESC LIMIT 1
    `);
    const q3 = db.prepare(`
      SELECT id FROM suppliers
      WHERE school_id = ?
      ORDER BY id ASC LIMIT 1
    `);

    const suggestionsMap = new Map();

    for (const size of itemSizes) {
      const sold = salesMap.get(size.id) || 0;
      const returned = returnsMap.get(size.id) || 0;
      const netSales30d = Math.max(0, sold - returned);
      const salesVelocity = netSales30d / 30;

      let daysLeft = Infinity;
      if (salesVelocity > 0) {
        daysLeft = size.stock / salesVelocity;
      }

      // Filter: stock is below minimum OR days_left is <= 10
      if (size.stock <= size.minimum_stock || daysLeft <= 10) {
        // Quantities
        const targetStock = Math.max(size.minimum_stock * 2, netSales30d);
        const suggestedQuantity = Math.max(0, targetStock - size.stock);

        if (suggestedQuantity > 0) {
          // Resolve last recorded supplier
          let supplierId = null;
          let r1 = q1.get(size.id);
          if (r1) {
            supplierId = r1.supplier_id;
          } else {
            let r2 = q2.get(size.item_id);
            if (r2) {
              supplierId = r2.supplier_id;
            } else {
              let r3 = q3.get(req.schoolId);
              if (r3) {
                supplierId = r3.id;
              }
            }
          }

          let supplierName = 'Unassigned Supplier';
          if (supplierId) {
            const found = suppliers.find(s => s.id === supplierId);
            if (found) supplierName = found.name;
          } else {
            // Group together under null
            supplierId = 'unassigned';
          }

          if (!suggestionsMap.has(supplierId)) {
            suggestionsMap.set(supplierId, {
              supplierId,
              supplierName,
              items: [],
              warning: ''
            });
          }

          suggestionsMap.get(supplierId).items.push({
            itemSizeId: size.id,
            itemId: size.item_id,
            name: size.name,
            category: size.category,
            gender: size.gender,
            size: size.size,
            stock: size.stock,
            minimumStock: size.minimum_stock,
            purchasePrice: size.purchase_price,
            sellingPrice: size.selling_price,
            sales30d: netSales30d,
            salesVelocity: Number(salesVelocity.toFixed(2)),
            suggestedQuantity,
            estimatedCost: suggestedQuantity * size.purchase_price
          });
        }
      }
    }

    // Generate personalized warnings
    const result = [];
    for (const [supId, data] of suggestionsMap.entries()) {
      const firstItem = data.items[0];
      if (firstItem) {
        data.warning = `You're low on Size ${firstItem.size} ${firstItem.name} ${firstItem.category}s, here's a suggested purchase order for ${data.supplierName} based on sales velocity.`;
      }
      result.push(data);
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /bulk-purchase - batch purchases under transaction
router.post('/bulk-purchase', (req, res) => {
  const { supplierId, items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items list required' });
  }

  const normalizedSupplierId = (supplierId === 'unassigned' || !supplierId) ? null : Number(supplierId);

  db.exec('BEGIN TRANSACTION');
  try {
    const updateSize = db.prepare(`
      UPDATE item_sizes
      SET stock = stock + ?, purchase_price = ?, selling_price = ?
      WHERE id = ?
    `);

    const insertPurchase = db.prepare(`
      INSERT INTO purchases (item_size_id, supplier_id, quantity, purchase_price, notes)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      updateSize.run(
        Number(item.quantity),
        Number(item.purchasePrice),
        Number(item.sellingPrice),
        Number(item.itemSizeId)
      );

      insertPurchase.run(
        Number(item.itemSizeId),
        normalizedSupplierId,
        Number(item.quantity),
        Number(item.purchasePrice),
        'Bulk Suggestion Restock'
      );
    }

    db.exec('COMMIT');
    res.json({ success: true });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to record bulk purchase: ' + err.message });
  }
});

router.get('/:id', (req, res) => {
  const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ? AND school_id = ?').get(req.params.id, req.schoolId);
  if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

  const purchases = db.prepare(`
    SELECT p.*, i.name as item_name, isz.size
    FROM purchases p
    JOIN item_sizes isz ON isz.id = p.item_size_id
    JOIN items i ON i.id = isz.item_id
    WHERE p.supplier_id = ?
    ORDER BY p.purchase_date DESC
  `).all(supplier.id);

  const totalPurchased = purchases.reduce((sum, p) => sum + p.quantity * p.purchase_price, 0);
  res.json({ supplier, purchases, totalPurchased });
});

router.post('/', (req, res) => {
  const { name, phone, address } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const r = db.prepare('INSERT INTO suppliers (school_id, name, phone, address) VALUES (?, ?, ?, ?)')
    .run(req.schoolId, name, phone || null, address || null);
  res.status(201).json(db.prepare('SELECT * FROM suppliers WHERE id = ?').get(Number(r.lastInsertRowid)));
});

router.put('/:id', requireAdmin, (req, res) => {
  const { name, phone, address } = req.body;
  const existing = db.prepare('SELECT id FROM suppliers WHERE id = ? AND school_id = ?').get(req.params.id, req.schoolId);
  if (!existing) return res.status(404).json({ error: 'Supplier not found' });
  db.prepare('UPDATE suppliers SET name = COALESCE(?, name), phone = ?, address = ? WHERE id = ?')
    .run(name || null, phone ?? null, address ?? null, req.params.id);
  res.json(db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT id FROM suppliers WHERE id = ? AND school_id = ?').get(req.params.id, req.schoolId);
  if (!existing) return res.status(404).json({ error: 'Supplier not found' });
  const inUse = db.prepare('SELECT COUNT(*) as c FROM purchases WHERE supplier_id = ?').get(req.params.id).c;
  if (inUse > 0) {
    // Keep purchase history intact; just detach the supplier reference instead of blocking deletion.
    db.prepare('UPDATE purchases SET supplier_id = NULL WHERE supplier_id = ?').run(req.params.id);
  }
  db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
