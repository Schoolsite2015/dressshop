import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function nextBillNumber(schoolId) {
  const row = db.prepare(`SELECT bill_number FROM bills WHERE school_id = ? ORDER BY id DESC LIMIT 1`).get(schoolId);
  let next = 1;
  if (row?.bill_number) {
    const n = parseInt(row.bill_number, 10);
    if (!isNaN(n)) next = n + 1;
  }
  return String(next).padStart(6, '0');
}

router.post('/', (req, res) => {
  const { customer, items, gstPercent = 0, discount = 0, paymentMethod = 'Cash' } = req.body;
  if (!customer?.phone || !customer?.name) {
    return res.status(400).json({ error: 'Customer name and phone are required' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'At least one item is required' });
  }

  db.exec('BEGIN');
  try {
    let cust = db.prepare('SELECT * FROM customers WHERE school_id = ? AND phone = ?').get(req.schoolId, customer.phone);
    if (!cust) {
      const r = db.prepare('INSERT INTO customers (school_id, name, phone, class, section) VALUES (?, ?, ?, ?, ?)')
        .run(req.schoolId, customer.name, customer.phone, customer.class || null, customer.section || null);
      cust = db.prepare('SELECT * FROM customers WHERE id = ?').get(Number(r.lastInsertRowid));
    } else if (customer.class || customer.section) {
      db.prepare('UPDATE customers SET class = COALESCE(?, class), section = COALESCE(?, section) WHERE id = ?')
        .run(customer.class || null, customer.section || null, cust.id);
    }

    let subtotal = 0;
    const lineItems = [];
    for (const it of items) {
      // Join through items to enforce that this item_size actually belongs to this school
      const sizeRow = db.prepare(`SELECT isz.*, i.name as item_name FROM item_sizes isz
        JOIN items i ON i.id = isz.item_id WHERE isz.id = ? AND i.school_id = ?`).get(it.itemSizeId, req.schoolId);
      if (!sizeRow) throw new Error(`Item not found: ${it.itemSizeId}`);
      if (sizeRow.stock < it.quantity) {
        throw new Error(`Insufficient stock for ${sizeRow.item_name} (size ${sizeRow.size}). Only ${sizeRow.stock} left.`);
      }
      const lineTotal = sizeRow.selling_price * it.quantity;
      subtotal += lineTotal;
      lineItems.push({
        itemSizeId: sizeRow.id, itemName: sizeRow.item_name, size: sizeRow.size,
        quantity: it.quantity, unitPrice: sizeRow.selling_price, lineTotal,
      });
    }

    const gstAmount = Math.round((subtotal * gstPercent / 100) * 100) / 100;
    const grandTotal = Math.round((subtotal + gstAmount - discount) * 100) / 100;
    const billNumber = nextBillNumber(req.schoolId);

    const billRes = db.prepare(`INSERT INTO bills
      (school_id, bill_number, customer_id, subtotal, gst_percent, gst_amount, discount, grand_total, payment_method, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(req.schoolId, billNumber, cust.id, subtotal, gstPercent, gstAmount, discount, grandTotal, paymentMethod, req.user.id);
    const billId = Number(billRes.lastInsertRowid);

    const insertBillItem = db.prepare(`INSERT INTO bill_items
      (bill_id, item_size_id, item_name, size, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const decrementStock = db.prepare('UPDATE item_sizes SET stock = stock - ? WHERE id = ?');

    for (const li of lineItems) {
      insertBillItem.run(billId, li.itemSizeId, li.itemName, li.size, li.quantity, li.unitPrice, li.lineTotal);
      decrementStock.run(li.quantity, li.itemSizeId);
    }

    db.exec('COMMIT');
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(billId);
    res.status(201).json({ bill, items: lineItems, customer: cust });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(400).json({ error: err.message || 'Failed to generate bill' });
  }
});

router.get('/', (req, res) => {
  const { from, to, limit = 100 } = req.query;
  let query = `SELECT b.*, c.name as customer_name, c.phone as customer_phone
    FROM bills b LEFT JOIN customers c ON c.id = b.customer_id WHERE b.school_id = ? AND b.status = 'active'`;
  const params = [req.schoolId];
  if (from) { query += ' AND date(b.created_at) >= date(?)'; params.push(from); }
  if (to) { query += ' AND date(b.created_at) <= date(?)'; params.push(to); }
  query += ' ORDER BY b.created_at DESC LIMIT ?';
  params.push(Number(limit));
  res.json(db.prepare(query).all(...params));
});

router.get('/:billNumber', (req, res) => {
  const bill = db.prepare(`SELECT b.*, c.name as customer_name, c.phone as customer_phone
    FROM bills b LEFT JOIN customers c ON c.id = b.customer_id WHERE b.school_id = ? AND b.bill_number = ?`)
    .get(req.schoolId, req.params.billNumber);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });
  const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(bill.id);
  res.json({ bill, items });
});

router.delete('/:id', requireAdmin, (req, res) => {
  const bill = db.prepare('SELECT * FROM bills WHERE id = ? AND school_id = ?').get(req.params.id, req.schoolId);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });

  db.exec('BEGIN');
  try {
    const items = db.prepare('SELECT * FROM bill_items WHERE bill_id = ?').all(bill.id);
    const restore = db.prepare('UPDATE item_sizes SET stock = stock + ? WHERE id = ?');
    for (const it of items) restore.run(it.quantity, it.item_size_id);
    db.prepare(`UPDATE bills SET status = 'deleted' WHERE id = ?`).run(bill.id);
    db.exec('COMMIT');
    res.json({ success: true });
  } catch (err) {
    db.exec('ROLLBACK');
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

export default router;
