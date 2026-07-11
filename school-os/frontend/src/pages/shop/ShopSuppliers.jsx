import { useEffect, useState } from 'react';
import api, { formatINR } from '../../lib/shopApi';
import { useShopAuth } from '../../context/ShopAuthContext';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

function SupplierModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({ name: initial?.name || '', phone: initial?.phone || '', address: initial?.address || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!form.name) { setError('Supplier name is required.'); return; }
    setSaving(true); setError('');
    try {
      if (initial) {
        await api.put(`/suppliers/${initial.id}`, form);
      } else {
        await api.post('/suppliers', form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg">{initial ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-black/50">Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full border border-black/10 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-black/50">Phone</label>
            <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1 w-full border border-black/10 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-black/50">Address</label>
            <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="mt-1 w-full border border-black/10 rounded-md px-3 py-2" />
          </div>
          {error && <div className="text-sm text-[var(--color-maroon)]">{error}</div>}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-2.5 rounded-md text-white font-medium disabled:opacity-60"
            style={{ background: 'var(--color-maroon)' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SupplierDetail({ supplierId, onClose }) {
  const [data, setData] = useState(null);
  useEffect(() => { api.get(`/suppliers/${supplierId}`).then((r) => setData(r.data)); }, [supplierId]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg">{data?.supplier?.name || 'Loading…'}</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        {data && (
          <>
            <div className="text-sm text-black/50 mb-4">
              {data.supplier.phone} {data.supplier.address ? `· ${data.supplier.address}` : ''}
            </div>
            <div className="mb-4">
              <div className="text-xs text-black/50 uppercase">Total Purchased</div>
              <div className="font-mono-num text-xl">{formatINR(data.totalPurchased)}</div>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-black/40 text-xs uppercase"><th>Date</th><th>Item</th><th>Size</th><th>Qty</th><th>Price</th></tr></thead>
              <tbody>
                {data.purchases.map((p) => (
                  <tr key={p.id} className="border-t border-black/5">
                    <td className="py-1.5">{new Date(p.purchase_date).toLocaleDateString('en-IN')}</td>
                    <td>{p.item_name}</td><td>{p.size}</td>
                    <td className="font-mono-num">{p.quantity}</td>
                    <td className="font-mono-num">{formatINR(p.purchase_price)}</td>
                  </tr>
                ))}
                {data.purchases.length === 0 && <tr><td colSpan={5} className="text-black/40 py-2">No purchases recorded yet.</td></tr>}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export default function ShopSuppliers() {
  const { isAdmin } = useShopAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [modal, setModal] = useState(null);
  const [detailId, setDetailId] = useState(null);

  function load() { api.get('/suppliers').then((r) => setSuppliers(r.data)); }
  useEffect(load, []);

  async function handleDelete(s) {
    if (!window.confirm(`Delete supplier "${s.name}"? Existing purchase history will be kept.`)) return;
    await api.delete(`/suppliers/${s.id}`);
    load();
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Suppliers</h1>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-white text-sm font-medium"
          style={{ background: 'var(--color-maroon)' }}>
          <Plus size={16} /> Add Supplier
        </button>
      </div>

      <div className="bg-white rounded-lg border border-black/5 shadow-sm divide-y divide-black/5">
        {suppliers.map((s) => (
          <div key={s.id} className="p-4 flex items-center justify-between">
            <button className="text-left flex-1" onClick={() => setDetailId(s.id)}>
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-black/50">
                {s.phone} {s.address ? `· ${s.address}` : ''} · {s.purchase_count} purchase{s.purchase_count === 1 ? '' : 's'} · {formatINR(s.total_purchased)} total
              </div>
            </button>
            {isAdmin && (
              <div className="flex gap-2 shrink-0 ml-3">
                <button onClick={() => setModal(s)} className="p-1.5 rounded hover:bg-black/5">
                  <Pencil size={15} className="text-black/40" />
                </button>
                <button onClick={() => handleDelete(s)} className="p-1.5 rounded hover:bg-black/5">
                  <Trash2 size={15} className="text-black/40 hover:text-[var(--color-maroon)]" />
                </button>
              </div>
            )}
          </div>
        ))}
        {suppliers.length === 0 && <div className="p-6 text-sm text-black/40">No suppliers yet — add one to start tracking purchases.</div>}
      </div>

      {(modal === 'add' || (modal && modal.id)) && (
        <SupplierModal
          initial={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
      {detailId && <SupplierDetail supplierId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
