import { useEffect, useState } from 'react';
import api, { formatINR } from '../lib/api';
import { Plus, X, QrCode, Printer, Trash2 } from 'lucide-react';

const CATEGORIES = ['Shirt', 'Pant', 'Skirt', 'Lower', 'T-Shirt', 'Jacket', 'Sweater',
  'Tie', 'Belt', 'Socks', 'House T-Shirt', 'House Lower', 'Blazer', 'Cap'];
const SIZES = ['20', '22', '24', '26', '28', '30', '32', '34', '36', '38', '40', '42'];

function StatusBadge({ status }) {
  if (status === 'out_of_stock') return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Out of stock</span>;
  if (status === 'low_stock') return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Low stock</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">In stock</span>;
}

function BarcodeModal({ item, size, onClose }) {
  const [qr, setQr] = useState(null);

  useEffect(() => {
    api.get(`/items/sizes/${size.id}/qrcode`).then((r) => setQr(r.data));
  }, [size.id]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xs p-6">
        <div className="flex items-center justify-between mb-4 no-print">
          <h2 className="font-display text-lg">Stock Tag</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div id="print-barcode" className="text-center">
          <div className="font-medium">{item.name}</div>
          <div className="text-sm text-black/50 mb-2">{item.gender} · Size {size.size}</div>
          {qr && <img src={qr.qrDataUrl} alt="Barcode" className="mx-auto w-40 h-40" />}
          <div className="font-mono-num text-sm mt-2 tracking-wider">{qr?.barcode}</div>
          <div className="text-xs text-black/50 mt-1">{formatINR(size.selling_price)}</div>
        </div>
        <button onClick={() => window.print()}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-md text-white text-sm font-medium no-print"
          style={{ background: 'var(--color-maroon)' }}>
          <Printer size={15} /> Print Tag
        </button>
      </div>
    </div>
  );
}

function AddStockModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', category: 'Shirt', gender: 'Unisex', size: '28',
    quantity: '', purchasePrice: '', sellingPrice: '', minimumStock: 10, supplierId: '',
  });
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/suppliers').then((r) => setSuppliers(r.data)); }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSave() {
    setError('');
    if (!form.name || !form.quantity || !form.purchasePrice || !form.sellingPrice) {
      setError('Please fill in item name, quantity, purchase price and selling price.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/items', {
        ...form,
        quantity: Number(form.quantity),
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        minimumStock: Number(form.minimumStock),
        supplierId: form.supplierId ? Number(form.supplierId) : null,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg">Add Stock</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-black/50">Item</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. White Shirt"
              className="mt-1 w-full border border-black/10 rounded-md px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-black/50">Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}
                className="mt-1 w-full border border-black/10 rounded-md px-3 py-2">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-black/50">Gender</label>
              <select value={form.gender} onChange={(e) => set('gender', e.target.value)}
                className="mt-1 w-full border border-black/10 rounded-md px-3 py-2">
                <option>Boy</option><option>Girl</option><option>Unisex</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-black/50">Size</label>
              <select value={form.size} onChange={(e) => set('size', e.target.value)}
                className="mt-1 w-full border border-black/10 rounded-md px-3 py-2">
                {SIZES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-black/50">Quantity</label>
              <input type="number" value={form.quantity} onChange={(e) => set('quantity', e.target.value)}
                className="mt-1 w-full border border-black/10 rounded-md px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-black/50">Purchase Price (₹)</label>
              <input type="number" value={form.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)}
                className="mt-1 w-full border border-black/10 rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-black/50">Selling Price (₹)</label>
              <input type="number" value={form.sellingPrice} onChange={(e) => set('sellingPrice', e.target.value)}
                className="mt-1 w-full border border-black/10 rounded-md px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-black/50">Minimum Stock (low stock threshold)</label>
            <input type="number" value={form.minimumStock} onChange={(e) => set('minimumStock', e.target.value)}
              className="mt-1 w-full border border-black/10 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-black/50">Supplier (optional)</label>
            <select value={form.supplierId} onChange={(e) => set('supplierId', e.target.value)}
              className="mt-1 w-full border border-black/10 rounded-md px-3 py-2">
              <option value="">— None —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
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

export default function Stock() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('');
  const [barcodeFor, setBarcodeFor] = useState(null); // { item, size }

  function load() {
    api.get('/items').then((r) => setItems(r.data.items));
  }
  useEffect(load, []);

  async function handleDeleteItem(itemId, name, force = false) {
    if (!force) {
      if (!window.confirm(`Are you sure you want to delete the item "${name}" and all its sizes?`)) return;
    }
    try {
      await api.delete(`/items/${itemId}${force ? '?force=true' : ''}`);
      load();
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.error === 'history_exists') {
        const confirmForce = window.confirm(
          `This item "${name}" has associated billing or purchase history. Do you want to FORCE delete it?\n\nThis will permanently erase all referencing billing, purchase, and return history. This action is irreversible!`
        );
        if (confirmForce) {
          handleDeleteItem(itemId, name, true);
        }
      } else {
        alert(err.response?.data?.error || 'Failed to delete item');
      }
    }
  }

  async function handleDeleteSize(sizeId, itemName, size, force = false) {
    if (!force) {
      if (!window.confirm(`Are you sure you want to delete Size ${size} of "${itemName}"?`)) return;
    }
    try {
      await api.delete(`/items/sizes/${sizeId}${force ? '?force=true' : ''}`);
      load();
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.error === 'history_exists') {
        const confirmForce = window.confirm(
          `Size ${size} of "${itemName}" has associated billing or purchase history. Do you want to FORCE delete it?\n\nThis will permanently erase all referencing billing, purchase, and return history. This action is irreversible!`
        );
        if (confirmForce) {
          handleDeleteSize(sizeId, itemName, size, true);
        }
      } else {
        alert(err.response?.data?.error || 'Failed to delete size');
      }
    }
  }

  const filtered = filter ? items.filter((i) => i.category === filter) : items;

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl">Stock Management</h1>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-white text-sm font-medium"
          style={{ background: 'var(--color-maroon)' }}>
          <Plus size={16} /> Add Stock
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${!filter ? 'text-white' : 'bg-white border border-black/10'}`}
          style={!filter ? { background: 'var(--color-navy)' } : {}}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${filter === c ? 'text-white' : 'bg-white border border-black/10'}`}
            style={filter === c ? { background: 'var(--color-navy)' } : {}}>{c}</button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((item) => (
          <div key={item.id} className="bg-white rounded-lg border border-black/5 shadow-sm p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium">{item.name} <span className="text-black/40 text-sm">· {item.category} · {item.gender}</span></div>
              <button
                onClick={() => handleDeleteItem(item.id, item.name)}
                className="text-black/20 hover:text-[var(--color-maroon)] transition-colors p-1 rounded-md"
                title="Delete Item"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {item.sizes.map((s) => (
                <div key={s.id} className="border border-black/5 rounded-md p-2.5 text-sm relative group hover:border-black/15 transition-all">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-black/50 text-xs">Size {s.size}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="font-mono-num font-medium">{s.stock} <span className="text-black/40 font-normal">in stock</span></div>
                  <div className="text-black/50 font-mono-num text-xs">{formatINR(s.selling_price)}</div>
                  
                  <div className="flex justify-between items-center mt-1.5">
                    <button onClick={() => setBarcodeFor({ item, size: s })}
                      className="flex items-center gap-1 text-xs text-black/40 hover:text-[var(--color-maroon)] transition-colors">
                      <QrCode size={13} /> Barcode
                    </button>
                    <button
                      onClick={() => handleDeleteSize(s.id, item.name, s.size)}
                      className="opacity-0 group-hover:opacity-100 text-black/25 hover:text-[var(--color-maroon)] transition-all p-0.5 rounded"
                      title="Delete Size"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-black/40 text-sm">No items found.</div>}
      </div>

      {showModal && (
        <AddStockModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />
      )}
      {barcodeFor && (
        <BarcodeModal item={barcodeFor.item} size={barcodeFor.size} onClose={() => setBarcodeFor(null)} />
      )}
    </div>
  );
}
