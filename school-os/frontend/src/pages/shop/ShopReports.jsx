import { useEffect, useState } from 'react';
import api, { formatINR } from '../../lib/shopApi';
import { useShopAuth } from '../../context/ShopAuthContext';

const PERIODS = ['today', 'yesterday', 'weekly', 'monthly', 'yearly'];

export default function ShopReports() {
  const { isAdmin } = useShopAuth();
  const [period, setPeriod] = useState('today');
  const [sales, setSales] = useState(null);
  const [profit, setProfit] = useState(null);
  const [best, setBest] = useState([]);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    api.get('/reports/sales', { params: { period } }).then((r) => setSales(r.data));
  }, [period]);

  useEffect(() => {
    api.get('/reports/best-selling').then((r) => setBest(r.data));
    api.get('/suppliers/purchase-history').then((r) => setPurchases(r.data));
    if (isAdmin) api.get('/reports/profit').then((r) => setProfit(r.data));
  }, [isAdmin]);

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="font-display text-2xl">Reports</h1>

      <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Sales</h2>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-full text-xs capitalize ${period === p ? 'text-white' : 'bg-black/5'}`}
                style={period === p ? { background: 'var(--color-navy)' } : {}}>{p}</button>
            ))}
          </div>
        </div>
        {sales && (
          <div className="flex gap-8">
            <div>
              <div className="text-xs text-black/50 uppercase">Total Sales</div>
              <div className="font-display text-2xl font-mono-num">{formatINR(sales.total)}</div>
            </div>
            <div>
              <div className="text-xs text-black/50 uppercase">Bills</div>
              <div className="font-display text-2xl font-mono-num">{sales.count}</div>
            </div>
          </div>
        )}
      </div>

      {isAdmin && profit && (
        <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
          <h2 className="font-medium mb-4">Profit Report (all time)</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-black/50 uppercase">Purchased</div>
              <div className="font-mono-num text-lg">{formatINR(profit.purchased)}</div>
            </div>
            <div>
              <div className="text-xs text-black/50 uppercase">Sold</div>
              <div className="font-mono-num text-lg">{formatINR(profit.sold)}</div>
            </div>
            <div>
              <div className="text-xs text-black/50 uppercase">Profit</div>
              <div className="font-mono-num text-lg" style={{ color: 'var(--color-maroon)' }}>{formatINR(profit.profit)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
        <h2 className="font-medium mb-3">Best Selling Items</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-black/40 text-xs uppercase"><th>#</th><th>Item</th><th>Sold</th><th>Revenue</th></tr></thead>
          <tbody>
            {best.map((b, i) => (
              <tr key={i} className="border-t border-black/5">
                <td className="py-1.5">{i + 1}</td><td>{b.item_name}</td>
                <td className="font-mono-num">{b.sold}</td><td className="font-mono-num">{formatINR(b.revenue)}</td>
              </tr>
            ))}
            {best.length === 0 && <tr><td colSpan={4} className="text-black/40 py-2">No sales yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
        <h2 className="font-medium mb-3">Purchase History</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-black/40 text-xs uppercase"><th>Date</th><th>Item</th><th>Size</th><th>Supplier</th><th>Qty</th><th>Price</th></tr></thead>
          <tbody>
            {purchases.slice(0, 20).map((p) => (
              <tr key={p.id} className="border-t border-black/5">
                <td className="py-1.5">{new Date(p.purchase_date).toLocaleDateString('en-IN')}</td>
                <td>{p.item_name}</td><td>{p.size}</td><td>{p.supplier_name || '—'}</td>
                <td className="font-mono-num">{p.quantity}</td><td className="font-mono-num">{formatINR(p.purchase_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
