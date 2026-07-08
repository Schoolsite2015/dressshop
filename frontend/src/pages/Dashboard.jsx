import { useEffect, useState } from 'react';
import api, { formatINR } from '../lib/api';
import StatCard from '../components/StatCard';
import { AlertTriangle, XCircle, Truck, X } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [modalItems, setModalItems] = useState([]);

  function reloadData() {
    api.get('/reports/dashboard').then((r) => setStats(r.data));
    api.get('/items/alerts').then((r) => setAlerts(r.data));
    api.get('/suppliers/reorder-suggestions').then((r) => setSuggestions(r.data));
  }

  useEffect(reloadData, []);

  function openReviewModal(suggestion) {
    setSelectedSupplier(suggestion);
    setModalItems(suggestion.items.map(item => ({ ...item })));
  }

  function updateModalItem(index, key, val) {
    setModalItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: val };
      return next;
    });
  }

  async function submitBulkPurchase() {
    try {
      const payload = {
        supplierId: selectedSupplier.supplierId,
        items: modalItems.map(item => ({
          itemSizeId: item.itemSizeId,
          quantity: Number(item.suggestedQuantity) || 0,
          purchasePrice: Number(item.purchasePrice) || 0,
          sellingPrice: Number(item.sellingPrice) || 0,
        })).filter(item => item.quantity > 0)
      };

      if (payload.items.length === 0) {
        alert('Please add quantity for at least one item.');
        return;
      }

      await api.post('/suppliers/bulk-purchase', payload);
      setSelectedSupplier(null);
      reloadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record purchase');
    }
  }

  const modalTotal = modalItems.reduce((sum, item) => sum + (Number(item.suggestedQuantity) || 0) * (Number(item.purchasePrice) || 0), 0);

  return (
    <div className="max-w-6xl">
      <h1 className="font-display text-2xl mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Today's Sales" value={stats ? formatINR(stats.todaysSales) : '—'} accent="maroon" />
        <StatCard label="Today's Bills" value={stats?.todaysBills ?? '—'} />
        <StatCard label="Low Stock Alerts" value={stats?.lowStockAlerts ?? '—'} accent="gold" />
        <StatCard label="Out of Stock" value={stats?.outOfStock ?? '—'} accent="maroon" />
        <StatCard label="Total Stock" value={stats ? `${stats.totalStock.toLocaleString('en-IN')} items` : '—'} />
        <StatCard label="Revenue This Month" value={stats ? formatINR(stats.revenueThisMonth) : '—'} accent="gold" />
      </div>

      {/* Smart Reorder Suggestions section */}
      {suggestions.length > 0 && (
        <div className="mb-8 space-y-4">
          <h2 className="font-display text-xl flex items-center gap-2">
            <Truck className="text-black/75 font-semibold" size={22} /> Smart Reorder Suggestions
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {suggestions.map((s) => (
              <div key={s.supplierId} className="bg-white rounded-lg border border-black/5 shadow-sm overflow-hidden">
                <div className="bg-amber-50 border-b border-amber-100/50 px-4 py-3 flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-medium text-amber-800">{s.warning}</p>
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
                    <h3 className="font-medium text-black/80">Supplier: <span className="font-semibold text-black">{s.supplierName}</span></h3>
                    <button
                      onClick={() => openReviewModal(s)}
                      className="px-3.5 py-1.5 rounded-md text-white text-xs font-medium hover:opacity-95 transition-opacity self-start"
                      style={{ background: 'var(--color-maroon)' }}
                    >
                      Review &amp; Record Purchase
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="text-black/40 text-xs uppercase border-b border-black/5">
                          <th className="pb-2">Item</th>
                          <th className="pb-2">Gender</th>
                          <th className="pb-2 text-center">Size</th>
                          <th className="pb-2 text-right">Current Stock</th>
                          <th className="pb-2 text-right">Sales (30d)</th>
                          <th className="pb-2 text-right">Suggested Qty</th>
                          <th className="pb-2 text-right">Est. Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-black/[0.02] last:border-0 hover:bg-black/[0.005]">
                            <td className="py-2.5 font-medium">{item.name}</td>
                            <td className="py-2.5 text-black/60">{item.gender}</td>
                            <td className="py-2.5 text-center font-mono-num">{item.size}</td>
                            <td className="py-2.5 text-right font-mono-num">{item.stock}</td>
                            <td className="py-2.5 text-right font-mono-num">{item.sales30d}</td>
                            <td className="py-2.5 text-right font-mono-num text-[var(--color-maroon)] font-semibold">+{item.suggestedQuantity}</td>
                            <td className="py-2.5 text-right font-mono-num text-black/70">{formatINR(item.estimatedCost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alerts && (alerts.outOfStock.length > 0 || alerts.lowStock.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3 text-[var(--color-maroon)]">
              <XCircle size={18} />
              <h2 className="font-medium">Out of Stock ({alerts.outOfStockCount})</h2>
            </div>
            <ul className="space-y-1.5 text-sm max-h-64 overflow-auto">
              {alerts.outOfStock.map((r, i) => (
                <li key={i} className="flex justify-between">
                  <span>{r.name} <span className="text-black/40">({r.gender})</span></span>
                  <span className="font-mono-num text-black/60">Size {r.size}</span>
                </li>
              ))}
              {alerts.outOfStock.length === 0 && <li className="text-black/40">None right now.</li>}
            </ul>
          </div>
          <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--color-gold)' }}>
              <AlertTriangle size={18} />
              <h2 className="font-medium text-black/80">Low Stock ({alerts.lowStockCount})</h2>
            </div>
            <ul className="space-y-1.5 text-sm max-h-64 overflow-auto">
              {alerts.lowStock.map((r, i) => (
                <li key={i} className="flex justify-between">
                  <span>{r.name} <span className="text-black/40">({r.gender})</span></span>
                  <span className="font-mono-num text-black/60">Size {r.size} · Only {r.stock} left</span>
                </li>
              ))}
              {alerts.lowStock.length === 0 && <li className="text-black/40">None right now.</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Review purchase suggestions modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b pb-3 shrink-0">
              <div>
                <h2 className="font-display text-lg">Purchase Order Suggestion Review</h2>
                <p className="text-xs text-black/50 mt-0.5">Supplier: {selectedSupplier.supplierName}</p>
              </div>
              <button onClick={() => setSelectedSupplier(null)}><X size={20} className="text-black/60" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-black/40 text-xs uppercase border-b">
                    <th className="pb-2">Item Details</th>
                    <th className="pb-2 text-center">Stock</th>
                    <th className="pb-2 text-right">Order Qty</th>
                    <th className="pb-2 text-right">Purchase Price (₹)</th>
                    <th className="pb-2 text-right">Selling Price (₹)</th>
                    <th className="pb-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {modalItems.map((item, index) => (
                    <tr key={index} className="border-b border-black/[0.02]">
                      <td className="py-3 pr-2">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-black/40">{item.gender} · Size {item.size}</div>
                      </td>
                      <td className="py-3 text-center font-mono-num text-black/50">{item.stock}</td>
                      <td className="py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={item.suggestedQuantity}
                          onChange={(e) => updateModalItem(index, 'suggestedQuantity', Number(e.target.value))}
                          className="w-16 border rounded px-2 py-1 text-right font-mono-num focus:ring-1 focus:ring-[var(--color-maroon)] focus:outline-none"
                        />
                      </td>
                      <td className="py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={item.purchasePrice}
                          onChange={(e) => updateModalItem(index, 'purchasePrice', Number(e.target.value))}
                          className="w-20 border rounded px-2 py-1 text-right font-mono-num focus:ring-1 focus:ring-[var(--color-maroon)] focus:outline-none"
                        />
                      </td>
                      <td className="py-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={item.sellingPrice}
                          onChange={(e) => updateModalItem(index, 'sellingPrice', Number(e.target.value))}
                          className="w-20 border rounded px-2 py-1 text-right font-mono-num focus:ring-1 focus:ring-[var(--color-maroon)] focus:outline-none"
                        />
                      </td>
                      <td className="py-3 text-right font-mono-num font-medium text-black/80">
                        {formatINR((item.suggestedQuantity || 0) * (item.purchasePrice || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t pt-4 mt-4 shrink-0 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wide text-black/40">Total Estimated Cost</span>
                <div className="text-xl font-bold font-mono-num text-[var(--color-maroon)]">{formatINR(modalTotal)}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSupplier(null)}
                  className="px-4 py-2 rounded-md border border-black/10 hover:bg-black/5 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitBulkPurchase}
                  className="px-5 py-2 rounded-md text-white text-sm font-medium hover:opacity-95 transition-opacity"
                  style={{ background: 'var(--color-maroon)' }}
                >
                  Record Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
