import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ items: [], bills: [], customers: [] });
  const like = `%${q}%`;

  const items = db.prepare(`
    SELECT i.name, i.category, i.gender, isz.id as item_size_id, isz.size, isz.stock, isz.selling_price
    FROM items i JOIN item_sizes isz ON isz.item_id = i.id
    WHERE i.school_id = ? AND (i.name LIKE ? OR i.category LIKE ? OR isz.size LIKE ?)
    LIMIT 25
  `).all(req.schoolId, like, like, like);

  const bills = db.prepare(`
    SELECT b.*, c.name as customer_name, c.phone as customer_phone
    FROM bills b LEFT JOIN customers c ON c.id = b.customer_id
    WHERE b.school_id = ? AND (b.bill_number LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)
    ORDER BY b.created_at DESC LIMIT 25
  `).all(req.schoolId, like, like, like);

  const customers = db.prepare(`SELECT * FROM customers WHERE school_id = ? AND (name LIKE ? OR phone LIKE ?) LIMIT 25`)
    .all(req.schoolId, like, like);

  res.json({ items, bills, customers });
});

export default router;
