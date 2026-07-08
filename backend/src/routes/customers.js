import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/lookup', (req, res) => {
  const { phone, name } = req.query;
  let customer = null;
  if (phone) {
    customer = db.prepare('SELECT * FROM customers WHERE school_id = ? AND phone = ?').get(req.schoolId, phone);
  } else if (name) {
    customer = db.prepare('SELECT * FROM customers WHERE school_id = ? AND name LIKE ? ORDER BY created_at DESC LIMIT 1')
      .get(req.schoolId, `%${name}%`);
  }
  res.json({ customer: customer || null });
});

router.get('/:phone/history', (req, res) => {
  const customer = db.prepare('SELECT * FROM customers WHERE school_id = ? AND phone = ?').get(req.schoolId, req.params.phone);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const bills = db.prepare(`SELECT * FROM bills WHERE customer_id = ? AND school_id = ? AND status = 'active' ORDER BY created_at DESC`)
    .all(customer.id, req.schoolId);
  const billIds = bills.map(b => b.id);
  let items = [];
  if (billIds.length) {
    const placeholders = billIds.map(() => '?').join(',');
    items = db.prepare(`SELECT * FROM bill_items WHERE bill_id IN (${placeholders})`).all(...billIds);
  }
  const totalSpending = bills.reduce((sum, b) => sum + b.grand_total, 0);
  const lastVisit = bills[0]?.created_at || null;

  res.json({ customer, bills, purchasedItems: items, totalSpending, lastVisit, billCount: bills.length });
});

router.post('/', (req, res) => {
  const { name, phone, class: cls, section } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'name and phone required' });

  const existing = db.prepare('SELECT * FROM customers WHERE school_id = ? AND phone = ?').get(req.schoolId, phone);
  if (existing) {
    db.prepare('UPDATE customers SET name = ?, class = ?, section = ? WHERE id = ?')
      .run(name, cls || existing.class, section || existing.section, existing.id);
    return res.json(db.prepare('SELECT * FROM customers WHERE id = ?').get(existing.id));
  }
  const r = db.prepare('INSERT INTO customers (school_id, name, phone, class, section) VALUES (?, ?, ?, ?, ?)')
    .run(req.schoolId, name, phone, cls || null, section || null);
  res.status(201).json(db.prepare('SELECT * FROM customers WHERE id = ?').get(Number(r.lastInsertRowid)));
});

export default router;
