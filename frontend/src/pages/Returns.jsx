import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { formatINR } from '../lib/api';
import { Search, Undo2, ArrowRightLeft } from 'lucide-react';

export default function Returns() {
  const [billNumber, setBillNumber] = useState('');
  const [data, setData] = useState(null);
  const [quantities, setQuantities] = useState({}); // billItemId -> qty to return
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  async function lookup() {
    setError(''); setData(null); setResult(null); setQuantities({});
    if (!billNumber) return;
    try {
      const r = await api.get(`/returns/lookup/${billNumber}`);
      setData(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Bill not found');
    }
  }

  function setQty(billItemId, qty, max) {
    const clamped = Math.max(0, Math.min(Number(qty) || 0, max));
    setQuantities((q) => ({ ...q, [billItemId]: clamped }));
  }

  const refundPreview = data
    ? data.items.reduce((sum, it) => sum + (quantities[it.id] || 0) * it.unit_price, 0)
    : 0;

  async function processReturn() {
    setError('');
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([billItemId, quantity]) => ({ billItemId: Number(billItemId), quantity }));
    if (items.length === 0) { setError('Select at least one item and quantity to return.'); return; }
    try {
      const res = await api.post('/returns', { billNumber, items, reason });
      setResult(res.data);
      setData(null); setQuantities({}); setReason('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process return');
    }
  }

  if (result) {
    return (
      <div className="max-w-lg">
        <h1 className="font-display text-2xl mb-6">Return Processed</h1>
        <div className="bg-white rounded-lg border border-black/5 shadow-sm p-6">
          <div className="text-sm text-black/50 mb-1">Refund Total</div>
          <div className="font-display text-3xl font-mono-num mb-4">{formatINR(result.return.refund_total)}</div>
          <ul className="space-y-1.5 text-sm mb-6">
            {result.items.map((it, i) => (
              <li key={i} className="flex justify-between">
                <span>{it.itemName} (Size {it.size}) × {it.quantity}</span>
                <span className="font-mono-num">{formatINR(it.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-black/50 mb-4">Stock has been restored automatically.</p>
          <div className="flex gap-3">
            <button onClick={() => { setResult(null); setBillNumber(''); }}
              className="flex-1 py-2.5 rounded-md border border-black/10 font-medium">
              Process Another Return
            </button>
            <button onClick={() => navigate('/billing')}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-white font-medium"
              style={{ background: 'var(--color-maroon)' }}>
              <ArrowRightLeft size={16} /> Bill Exchange Items
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl mb-2">Returns &amp; Exchanges</h1>
      <p className="text-sm text-black/50 mb-6">
        For an exchange: process the return here first (it restores stock and refunds the
        old items), then go to Billing to sell the new items separately.
      </p>

      <div className="flex gap-2 mb-6">
        <input value={billNumber} onChange={(e) => setBillNumber(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && lookup()}
          placeholder="Enter bill number (e.g. 000001)"
          className="flex-1 border border-black/10 rounded-md px-3 py-2 bg-white" />
        <button onClick={lookup} className="px-4 py-2 rounded-md text-white" style={{ background: 'var(--color-navy)' }}>
          <Search size={16} />
        </button>
      </div>

      {error && <div className="text-sm text-[var(--color-maroon)] mb-4">{error}</div>}

      {data && (
        <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
          <div className="mb-4">
            <div className="font-medium">Bill #{data.bill.bill_number} — {data.bill.customer_name || 'Walk-in'}</div>
            <div className="text-xs text-black/50">{new Date(data.bill.created_at).toLocaleString('en-IN')} · {formatINR(data.bill.grand_total)}</div>
          </div>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-left text-black/40 text-xs uppercase">
                <th className="py-1">Item</th><th>Size</th><th>Billed</th><th>Already Returned</th><th>Return Qty</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((it) => (
                <tr key={it.id} className="border-t border-black/5">
                  <td className="py-2">{it.item_name}</td>
                  <td>{it.size}</td>
                  <td className="font-mono-num">{it.quantity}</td>
                  <td className="font-mono-num text-black/40">{it.alreadyReturned}</td>
                  <td>
                    <input type="number" min="0" max={it.returnable} disabled={it.returnable === 0}
                      value={quantities[it.id] || ''}
                      onChange={(e) => setQty(it.id, e.target.value, it.returnable)}
                      placeholder="0"
                      className="w-20 border border-black/10 rounded-md px-2 py-1 disabled:bg-black/5 disabled:text-black/30" />
                    {it.returnable === 0 && <span className="text-xs text-black/30 ml-1">fully returned</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div>
            <label className="text-xs uppercase tracking-wide text-black/50">Reason (optional)</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. wrong size, defective, customer changed mind"
              className="mt-1 w-full border border-black/10 rounded-md px-3 py-2" />
          </div>

          <div className="flex justify-between items-center mt-5 pt-4 border-t border-black/5">
            <div className="text-sm">Refund: <span className="font-mono-num font-medium">{formatINR(refundPreview)}</span></div>
            <button onClick={processReturn}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md text-white font-medium"
              style={{ background: 'var(--color-maroon)' }}>
              <Undo2 size={16} /> Process Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
