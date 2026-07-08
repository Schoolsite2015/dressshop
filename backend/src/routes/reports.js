import { Router } from 'express';
import db from '../db/index.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function sumBillsWhere(schoolId, whereClause, params = []) {
  const row = db.prepare(`SELECT COALESCE(SUM(grand_total),0) as total, COUNT(*) as count
    FROM bills WHERE school_id = ? AND status = 'active' AND ${whereClause}`).get(schoolId, ...params);
  return { total: row.total, count: row.count };
}

// Returns processed within a date window (matched on when the return itself
// happened, not the original bill date) — subtracted from revenue so refunded
// sales don't inflate the numbers.
function sumReturnsWhere(schoolId, whereClause, params = []) {
  const row = db.prepare(`SELECT COALESCE(SUM(refund_total),0) as total, COUNT(*) as count
    FROM returns WHERE school_id = ? AND ${whereClause}`).get(schoolId, ...params);
  return { total: row.total, count: row.count };
}

router.get('/dashboard', (req, res) => {
  const today = sumBillsWhere(req.schoolId, `date(created_at) = date('now')`);
  const todayReturns = sumReturnsWhere(req.schoolId, `date(created_at) = date('now')`);
  const monthTotal = db.prepare(`SELECT COALESCE(SUM(grand_total),0) as total FROM bills
    WHERE school_id = ? AND status='active' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`)
    .get(req.schoolId).total;
  const monthReturns = db.prepare(`SELECT COALESCE(SUM(refund_total),0) as total FROM returns
    WHERE school_id = ? AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`)
    .get(req.schoolId).total;

  const lowStock = db.prepare(`SELECT COUNT(*) as c FROM item_sizes isz JOIN items i ON i.id = isz.item_id
    WHERE i.school_id = ? AND isz.stock > 0 AND isz.stock <= isz.minimum_stock`).get(req.schoolId).c;
  const outOfStock = db.prepare(`SELECT COUNT(*) as c FROM item_sizes isz JOIN items i ON i.id = isz.item_id
    WHERE i.school_id = ? AND isz.stock <= 0`).get(req.schoolId).c;
  const totalStock = db.prepare(`SELECT COALESCE(SUM(isz.stock),0) as s FROM item_sizes isz
    JOIN items i ON i.id = isz.item_id WHERE i.school_id = ?`).get(req.schoolId).s;

  res.json({
    todaysSales: Math.round((today.total - todayReturns.total) * 100) / 100,
    todaysBills: today.count,
    lowStockAlerts: lowStock, outOfStock, totalStock,
    revenueThisMonth: Math.round((monthTotal - monthReturns) * 100) / 100,
  });
});

router.get('/sales', (req, res) => {
  const { period = 'today' } = req.query;
  const clauses = {
    today: `date(created_at) = date('now')`,
    yesterday: `date(created_at) = date('now','-1 day')`,
    weekly: `date(created_at) >= date('now','-7 days')`,
    monthly: `strftime('%Y-%m', created_at) = strftime('%Y-%m','now')`,
    yearly: `strftime('%Y', created_at) = strftime('%Y','now')`,
  };
  const clause = clauses[period] || clauses.today;
  const summary = sumBillsWhere(req.schoolId, clause);
  const returns = sumReturnsWhere(req.schoolId, clause);

  const breakdown = db.prepare(`SELECT date(created_at) as day, COALESCE(SUM(grand_total),0) as total, COUNT(*) as bills
    FROM bills WHERE school_id = ? AND status='active' AND ${clause} GROUP BY date(created_at) ORDER BY day`)
    .all(req.schoolId);

  res.json({
    period,
    total: Math.round((summary.total - returns.total) * 100) / 100,
    count: summary.count,
    returnsTotal: returns.total,
    returnsCount: returns.count,
    breakdown,
  });
});

router.get('/profit', requireAdmin, (req, res) => {
  const { from, to } = req.query;
  let dateClause = `1=1`;
  const params = [];
  if (from) { dateClause += ` AND date(b.created_at) >= date(?)`; params.push(from); }
  if (to) { dateClause += ` AND date(b.created_at) <= date(?)`; params.push(to); }

  const sold = db.prepare(`
    SELECT COALESCE(SUM(bi.line_total),0) as revenue, COALESCE(SUM(bi.quantity * isz.purchase_price),0) as cost
    FROM bill_items bi
    JOIN bills b ON b.id = bi.bill_id AND b.status = 'active' AND b.school_id = ?
    JOIN item_sizes isz ON isz.id = bi.item_size_id
    WHERE ${dateClause}
  `).get(req.schoolId, ...params);

  let returnDateClause = `1=1`;
  const returnParams = [];
  if (from) { returnDateClause += ` AND date(r.created_at) >= date(?)`; returnParams.push(from); }
  if (to) { returnDateClause += ` AND date(r.created_at) <= date(?)`; returnParams.push(to); }
  const returned = db.prepare(`
    SELECT COALESCE(SUM(ri.line_total),0) as revenue, COALESCE(SUM(ri.quantity * isz.purchase_price),0) as cost
    FROM return_items ri
    JOIN returns r ON r.id = ri.return_id AND r.school_id = ?
    JOIN item_sizes isz ON isz.id = ri.item_size_id
    WHERE ${returnDateClause}
  `).get(req.schoolId, ...returnParams);

  let purchasedClause = `i.school_id = ?`;
  const purchasedParams = [req.schoolId];
  if (from) { purchasedClause += ` AND date(p.purchase_date) >= date(?)`; purchasedParams.push(from); }
  if (to) { purchasedClause += ` AND date(p.purchase_date) <= date(?)`; purchasedParams.push(to); }
  const purchased = db.prepare(`
    SELECT COALESCE(SUM(p.quantity * p.purchase_price),0) as total
    FROM purchases p JOIN item_sizes isz ON isz.id = p.item_size_id JOIN items i ON i.id = isz.item_id
    WHERE ${purchasedClause}
  `).get(...purchasedParams);

  const netRevenue = sold.revenue - returned.revenue;
  const netCost = sold.cost - returned.cost;

  res.json({
    purchased: purchased.total,
    sold: Math.round(netRevenue * 100) / 100,
    costOfGoodsSold: Math.round(netCost * 100) / 100,
    profit: Math.round((netRevenue - netCost) * 100) / 100,
  });
});

router.get('/best-selling', (req, res) => {
  const { limit = 10 } = req.query;
  const rows = db.prepare(`
    SELECT
      bi.item_name,
      SUM(bi.quantity) - COALESCE(ret.qty, 0) as sold,
      SUM(bi.line_total) as revenue
    FROM bill_items bi
    JOIN bills b ON b.id = bi.bill_id AND b.status = 'active' AND b.school_id = ?
    LEFT JOIN (
      SELECT ri.item_name, SUM(ri.quantity) as qty
      FROM return_items ri JOIN returns r ON r.id = ri.return_id
      WHERE r.school_id = ?
      GROUP BY ri.item_name
    ) ret ON ret.item_name = bi.item_name
    GROUP BY bi.item_name
    ORDER BY sold DESC LIMIT ?
  `).all(req.schoolId, req.schoolId, Number(limit));
  res.json(rows);
});

export default router;
