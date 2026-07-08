import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET /api/returns/lookup/:billNumber - fetch a bill plus how much of each line
// has already been returned, so the UI can cap what's returnable.
router.get('/lookup/:billNumber', (req, res) => {
  const bill = db.prepare(`SELECT b.*, c.name as customer_name, c.phone as customer_phone
    FROM bills b LEFT JOIN customers c ON c.id = b.customer_id
    WHERE b.school_id = ? AND b.bill_number = ? AND b.status = 'active'`)
    .get(req.schoolId, req.params.billNumber);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });

  const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(bill.id);
  const alreadyReturned = db.prepare(`
    SELECT bill_item_id, COALESCE(SUM(quantity), 0) as returned_qty
    FROM return_items WHERE bill_item_id IN (${items.map(() => '?').join(',') || 'NULL'})
    GROUP BY bill_item_id
  `).all(...items.map(i => i.id));
  const returnedMap = Object.fromEntries(alreadyReturned.map(r => [r.bill_item_id, r.returned_qty]));

  const itemsWithReturnable = items.map(it => ({
    ...it,
    alreadyReturned: returnedMap[it.id] || 0,
    returnable: it.quantity - (returnedMap[it.id] || 0),
  }));

  res.json({ bill, items: itemsWithReturnable });
});

// POST /api/returns - process a return (and, for an exchange, the new bill is
// created separately via the normal POST /api/bills flow right after this).
// body: { billNumber, items: [{ billItemId, quantity }], reason }
router.post('/', (req, res) => {
  const { billNumber, items, reason } = req.body;
  if (!billNumber || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'billNumber and at least one item are required' });
  }

  db.exec('BEGIN');
  try {
    const bill = db.prepare(`SELECT * FROM bills WHERE school_id = ? AND bill_number = ? AND status = 'active'`)
      .get(req.schoolId, billNumber);
    if (!bill) throw new Error('Bill not found');

    let refundTotal = 0;
    const lineItems = [];

    for (const reqItem of items) {
      if (!reqItem.quantity || reqItem.quantity <= 0) continue;
      const billItem = db.prepare('SELECT * FROM bill_items WHERE id = ? AND bill_id = ?')
        .get(reqItem.billItemId, bill.id);
      if (!billItem) throw new Error(`Bill line item not found: ${reqItem.billItemId}`);

      const alreadyReturned = db.prepare('SELECT COALESCE(SUM(quantity),0) as q FROM return_items WHERE bill_item_id = ?')
        .get(billItem.id).q;
      const returnable = billItem.quantity - alreadyReturned;
      if (reqItem.quantity > returnable) {
        throw new Error(`Cannot return ${reqItem.quantity} of ${billItem.item_name} (size ${billItem.size}) — only ${returnable} returnable.`);
      }

      const lineTotal = billItem.unit_price * reqItem.quantity;
      refundTotal += lineTotal;
      lineItems.push({
        billItemId: billItem.id, itemSizeId: billItem.item_size_id,
        itemName: billItem.item_name, size: billItem.size,
        quantity: reqItem.quantity, unitPrice: billItem.unit_price, lineTotal,
      });
    }

    if (lineItems.length === 0) throw new Error('No valid items to return');

    const returnRes = db.prepare(`INSERT INTO returns (school_id, bill_id, reason, refund_total, created_by)
      VALUES (?, ?, ?, ?, ?)`).run(req.schoolId, bill.id, reason || null, refundTotal, req.user.id);
    const returnId = Number(returnRes.lastInsertRowid);

    const insertReturnItem = db.prepare(`INSERT INTO return_items
      (return_id, bill_item_id, item_size_id, item_name, size, quantity, unit_price, line_total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    const restoreStock = db.prepare('UPDATE item_sizes SET stock = stock + ? WHERE id = ?');

    for (const li of lineItems) {
      insertReturnItem.run(returnId, li.billItemId, li.itemSizeId, li.itemName, li.size, li.quantity, li.unitPrice, li.lineTotal);
      restoreStock.run(li.quantity, li.itemSizeId);
    }

    db.exec('COMMIT');
    const ret = db.prepare('SELECT * FROM returns WHERE id = ?').get(returnId);
    res.status(201).json({ return: ret, items: lineItems });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(400).json({ error: err.message || 'Failed to process return' });
  }
});

// GET /api/returns?billNumber=... - list returns, optionally filtered to one bill
router.get('/', (req, res) => {
  const { billNumber } = req.query;
  let rows;
  if (billNumber) {
    rows = db.prepare(`
      SELECT r.*, b.bill_number FROM returns r JOIN bills b ON b.id = r.bill_id
      WHERE r.school_id = ? AND b.bill_number = ? ORDER BY r.created_at DESC
    `).all(req.schoolId, billNumber);
  } else {
    rows = db.prepare(`
      SELECT r.*, b.bill_number, c.name as customer_name FROM returns r
      JOIN bills b ON b.id = r.bill_id LEFT JOIN customers c ON c.id = b.customer_id
      WHERE r.school_id = ? ORDER BY r.created_at DESC LIMIT 100
    `).all(req.schoolId);
  }
  res.json(rows);
});

export default router;
