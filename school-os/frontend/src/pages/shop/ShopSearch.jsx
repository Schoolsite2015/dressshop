import { useState } from 'react';
import api, { formatINR } from '../../lib/shopApi';
import { Search as SearchIcon } from 'lucide-react';

export default function ShopSearch() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);

  async function handleSearch() {
    if (!q.trim()) return;
    const r = await api.get('/search', { params: { q } });
    setResults(r.data);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl mb-6">Search Anything</h1>
      <div className="flex gap-2 mb-6">
        <input value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Shirt, size, bill number, customer name or phone…"
          className="flex-1 border border-black/10 rounded-md px-3 py-2 bg-white" />
        <button onClick={handleSearch} className="px-4 py-2 rounded-md text-white" style={{ background: 'var(--color-maroon)' }}>
          <SearchIcon size={16} />
        </button>
      </div>

      {results && (
        <div className="space-y-6">
          {results.items.length > 0 && (
            <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
              <h2 className="font-medium mb-3">Items</h2>
              <ul className="space-y-1.5 text-sm">
                {results.items.map((i, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{i.name} ({i.gender}) — Size {i.size}</span>
                    <span className="font-mono-num text-black/60">{i.stock} in stock · {formatINR(i.selling_price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {results.bills.length > 0 && (
            <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
              <h2 className="font-medium mb-3">Bills</h2>
              <ul className="space-y-1.5 text-sm">
                {results.bills.map((b) => (
                  <li key={b.id} className="flex justify-between">
                    <span>#{b.bill_number} — {b.customer_name || 'Walk-in'}</span>
                    <span className="font-mono-num text-black/60">{formatINR(b.grand_total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {results.customers.length > 0 && (
            <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
              <h2 className="font-medium mb-3">Customers</h2>
              <ul className="space-y-1.5 text-sm">
                {results.customers.map((c) => (
                  <li key={c.id} className="flex justify-between">
                    <span>{c.name}</span><span className="text-black/60">{c.phone}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {results.items.length === 0 && results.bills.length === 0 && results.customers.length === 0 && (
            <div className="text-black/40 text-sm">No results found.</div>
          )}
        </div>
      )}
    </div>
  );
}
