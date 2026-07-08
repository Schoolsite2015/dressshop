import { useState } from 'react';
import api, { formatINR } from '../lib/api';
import { Search } from 'lucide-react';

export default function Customers() {
  const [phone, setPhone] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function handleSearch() {
    setError(''); setData(null);
    try {
      const r = await api.get(`/customers/${phone}/history`);
      setData(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Customer not found');
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl mb-6">Customer History</h1>
      <div className="flex gap-2 mb-6 max-w-md">
        <input value={phone} onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Enter phone number" className="flex-1 border border-black/10 rounded-md px-3 py-2 bg-white" />
        <button onClick={handleSearch} className="px-4 py-2 rounded-md text-white" style={{ background: 'var(--color-maroon)' }}>
          <Search size={16} />
        </button>
      </div>
      {error && <div className="text-sm text-[var(--color-maroon)]">{error}</div>}
      {data && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
            <div className="font-medium">{data.customer.name}</div>
            <div className="text-sm text-black/50">{data.customer.phone} {data.customer.class ? `· Class ${data.customer.class}` : ''} {data.customer.section ? `${data.customer.section}` : ''}</div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div><div className="text-xs text-black/50 uppercase">Bills</div><div className="font-mono-num text-lg">{data.billCount}</div></div>
              <div><div className="text-xs text-black/50 uppercase">Total Spent</div><div className="font-mono-num text-lg">{formatINR(data.totalSpending)}</div></div>
              <div><div className="text-xs text-black/50 uppercase">Last Visit</div><div className="text-sm">{data.lastVisit ? new Date(data.lastVisit).toLocaleDateString('en-IN') : '—'}</div></div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
            <h2 className="font-medium mb-3">Bills</h2>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-black/40 text-xs uppercase"><th>Bill No</th><th>Date</th><th>Total</th></tr></thead>
              <tbody>
                {data.bills.map((b) => (
                  <tr key={b.id} className="border-t border-black/5">
                    <td className="py-1.5">{b.bill_number}</td>
                    <td>{new Date(b.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="font-mono-num">{formatINR(b.grand_total)}</td>
                  </tr>
                ))}
                {data.bills.length === 0 && <tr><td colSpan={3} className="text-black/40 py-2">No bills yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
