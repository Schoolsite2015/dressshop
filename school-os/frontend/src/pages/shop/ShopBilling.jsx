import { useEffect, useRef, useState } from 'react';
import api, { formatINR } from '../../lib/shopApi';
import { useShopAuth as useAuth } from '../../context/ShopAuthContext';
import { Trash2, Printer, Search, ScanLine, Camera, MessageCircle, Send, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

function buildShareText(bill, school) {
  const lines = [
    `${school?.name || 'Uniform Shop'}`,
    `Bill No: ${bill.bill.bill_number}`,
    `Date: ${new Date(bill.bill.created_at).toLocaleString('en-IN')}`,
    '',
    ...bill.items.map((it) => `${it.itemName} (${it.size}) x${it.quantity} — ${formatINR(it.lineTotal)}`),
    '',
    `Total: ${formatINR(bill.bill.grand_total)}`,
    '',
    'Thank you for shopping with us!',
  ];
  return lines.join('\n');
}

function cleanPhoneForWhatsApp(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export default function Billing() {
  const { school } = useAuth();
  const [customer, setCustomer] = useState({ name: '', phone: '', class: '', section: '' });
  const [customerFound, setCustomerFound] = useState(false);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedItemSizeId, setSelectedItemSizeId] = useState('');
  const [qty, setQty] = useState(1);
  const [gstPercent, setGstPercent] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [bill, setBill] = useState(null);
  const [error, setError] = useState('');
  const [scanCode, setScanCode] = useState('');
  const [scanMsg, setScanMsg] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const scanInputRef = useRef(null);

  useEffect(() => {
    api.get('/items').then((r) => setItems(r.data.items));
    scanInputRef.current?.focus();
  }, []);

  // Global Barcode Scanner Listener
  useEffect(() => {
    let buffer = '';
    let lastTime = Date.now();
    const onKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const now = Date.now();
      if (now - lastTime > 50) buffer = '';
      if (e.key === 'Enter' && buffer.length > 2) {
        handleScan(buffer);
        buffer = '';
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
      lastTime = now;
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const flatSizes = items.flatMap((item) =>
    item.sizes.map((s) => ({
      itemSizeId: s.id,
      label: `${item.name} (${item.gender}) — Size ${s.size} · ${formatINR(s.selling_price)} · ${s.stock} in stock`,
      stock: s.stock,
      price: s.selling_price,
      name: item.name,
      size: s.size,
    }))
  );

  async function lookupCustomer() {
    if (!customer.phone) return;
    const r = await api.get('/customers/lookup', { params: { phone: customer.phone } });
    if (r.data.customer) {
      setCustomer({
        name: r.data.customer.name, phone: r.data.customer.phone,
        class: r.data.customer.class || '', section: r.data.customer.section || '',
      });
      setCustomerFound(true);
    } else {
      setCustomerFound(false);
    }
  }

  function addItemToCart(itemSizeId, quantityToAdd) {
    const sel = flatSizes.find((s) => String(s.itemSizeId) === String(itemSizeId));
    if (!sel || quantityToAdd < 1) return false;
    setCart((c) => {
      const existing = c.find((x) => x.itemSizeId === sel.itemSizeId);
      if (existing) {
        return c.map((x) => x.itemSizeId === sel.itemSizeId ? { ...x, quantity: x.quantity + quantityToAdd } : x);
      }
      return [...c, { ...sel, quantity: quantityToAdd }];
    });
    return true;
  }

  function addToCart() {
    if (addItemToCart(selectedItemSizeId, Number(qty))) setQty(1);
  }

  async function handleScan(code) {
    const trimmed = (code || '').trim();
    if (!trimmed) return;
    setScanMsg('');
    try {
      const r = await api.get(`/items/barcode/${encodeURIComponent(trimmed)}`);
      const d = r.data;
      if (d.stock <= 0) {
        setScanMsg(`${d.item_name} (size ${d.size}) is out of stock.`);
      } else {
        setCart((c) => {
          const existing = c.find((x) => x.itemSizeId === d.id);
          if (existing) {
            return c.map((x) => x.itemSizeId === d.id ? { ...x, quantity: x.quantity + 1 } : x);
          }
          return [...c, { itemSizeId: d.id, name: d.item_name, size: d.size, price: d.selling_price, stock: d.stock, quantity: 1 }];
        });
        setScanMsg(`Added: ${d.item_name} (size ${d.size})`);
      }
    } catch (err) {
      setScanMsg(err.response?.data?.error || 'Barcode not recognized');
    } finally {
      setScanCode('');
      scanInputRef.current?.focus();
    }
  }

  useEffect(() => {
    if (!cameraOpen) return;
    if (!('BarcodeDetector' in window)) {
      setScanMsg('Camera scanning isn\'t supported in this browser. Use a USB barcode scanner, or type the code in manually.');
      setCameraOpen(false);
      return;
    }
    let stream;
    let stopped = false;
    const detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13', 'upc_a'] });

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        scanLoop();
      } catch (err) {
        setScanMsg('Could not access camera: ' + err.message);
        setCameraOpen(false);
      }
    }

    async function scanLoop() {
      if (stopped || !videoRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes.length > 0) {
          handleScan(codes[0].rawValue);
          setCameraOpen(false);
          return;
        }
      } catch {
        // ignore per-frame detection errors
      }
      requestAnimationFrame(scanLoop);
    }

    start();
    return () => {
      stopped = true;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [cameraOpen]);

  function removeFromCart(id) {
    setCart((c) => c.filter((x) => x.itemSizeId !== id));
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const gstAmount = Math.round((subtotal * gstPercent / 100) * 100) / 100;
  const grandTotal = Math.round((subtotal + gstAmount - Number(discount || 0)) * 100) / 100;

  async function generateBill() {
    setError('');
    if (!customer.name || !customer.phone) { setError('Customer name and phone are required.'); return; }
    if (cart.length === 0) { setError('Add at least one item to the bill.'); return; }
    try {
      const res = await api.post('/bills', {
        customer,
        items: cart.map((c) => ({ itemSizeId: c.itemSizeId, quantity: c.quantity })),
        gstPercent: Number(gstPercent), discount: Number(discount || 0), paymentMethod,
      });
      setBill({ ...res.data, customer });
      setCart([]); setCustomer({ name: '', phone: '', class: '', section: '' });
      setCustomerFound(false); setGstPercent(0); setDiscount(0);
      api.get('/items').then((r) => setItems(r.data.items));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate bill');
    }
  }

  if (bill) {
    return (
      <div className="max-w-md mx-auto">
        <div id="print-bill" className="bg-white border border-black/10 rounded-lg p-6 font-mono text-sm">
          <div className="text-center mb-3">
            {school?.logo_path && (
              <img src={school.logo_path.startsWith('/logos') ? school.logo_path.replace('/logos', '/shop-logos') : school.logo_path} alt="" className="w-14 h-14 mx-auto mb-1 object-cover rounded-full" />
            )}
            <div className="font-bold">{(school?.name || 'UNIFORM SHOP').toUpperCase()}</div>
            <div className="text-xs">{school?.address}</div>
          </div>
          <div className="border-t border-dashed border-black/30 my-2" />
          <div className="flex justify-between"><span>Bill No:</span><span>{bill.bill.bill_number}</span></div>
          <div className="flex justify-between"><span>Date:</span><span>{new Date(bill.bill.created_at).toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between"><span>Customer:</span><span>{bill.customer.name}</span></div>
          <div className="flex justify-between"><span>Phone:</span><span>{bill.customer.phone}</span></div>
          <div className="border-t border-dashed border-black/30 my-2" />
          {bill.items.map((it, i) => (
            <div key={i} className="flex justify-between">
              <span>{it.itemName} ({it.size}) {it.quantity}×{formatINR(it.unitPrice)}</span>
              <span>{formatINR(it.lineTotal)}</span>
            </div>
          ))}
          <div className="border-t border-dashed border-black/30 my-2" />
          <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(bill.bill.subtotal)}</span></div>
          {bill.bill.gst_amount > 0 && <div className="flex justify-between"><span>GST ({bill.bill.gst_percent}%)</span><span>{formatINR(bill.bill.gst_amount)}</span></div>}
          {bill.bill.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatINR(bill.bill.discount)}</span></div>}
          <div className="flex justify-between font-bold text-base mt-1"><span>Total</span><span>{formatINR(bill.bill.grand_total)}</span></div>
          <div className="border-t border-dashed border-black/30 my-2" />
          <div className="text-center">Thank You!</div>
          <div className="mt-4 flex justify-center">
            <QRCodeSVG value={`https://snpublicschool.edu.in/verify/shop-bill/${bill.bill.bill_number}`} size={64} level="Q" />
          </div>
        </div>
        <div className="flex gap-3 mt-4 no-print">
          <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-white font-medium" style={{ background: 'var(--color-maroon)' }}>
            <Printer size={16} /> Print
          </button>
          <button onClick={() => setBill(null)} className="flex-1 py-2.5 rounded-md border border-black/10 font-medium">New Bill</button>
        </div>
        <div className="flex gap-3 mt-3 no-print">
          <a
            href={`https://wa.me/${cleanPhoneForWhatsApp(bill.customer.phone)}?text=${encodeURIComponent(buildShareText(bill, school))}`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border border-black/10 font-medium text-sm hover:bg-black/5"
          >
            <MessageCircle size={16} className="text-emerald-600" /> Share via WhatsApp
          </a>
          <a
            href={`sms:${bill.customer.phone}?body=${encodeURIComponent(buildShareText(bill, school))}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border border-black/10 font-medium text-sm hover:bg-black/5"
          >
            <Send size={16} className="text-black/50" /> Share via SMS
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl mb-6">Billing</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
          <h2 className="font-medium mb-3">Customer</h2>
          <div className="flex gap-2 mb-3">
            <input value={customer.phone} onChange={(e) => { setCustomer((c) => ({ ...c, phone: e.target.value })); setCustomerFound(false); }}
              onKeyDown={(e) => e.key === 'Enter' && lookupCustomer()}
              placeholder="Phone number"
              className="flex-1 border border-black/10 rounded-md px-3 py-2" />
            <button onClick={lookupCustomer} className="px-3 py-2 rounded-md border border-black/10">
              <Search size={16} />
            </button>
          </div>
          {customerFound && <div className="text-xs text-emerald-700 mb-2">Existing customer loaded.</div>}
          <div className="space-y-2">
            <input value={customer.name} onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
              placeholder="Customer name" className="w-full border border-black/10 rounded-md px-3 py-2" />
            <div className="grid grid-cols-2 gap-2">
              <input value={customer.class} onChange={(e) => setCustomer((c) => ({ ...c, class: e.target.value }))}
                placeholder="Class" className="w-full border border-black/10 rounded-md px-3 py-2" />
              <input value={customer.section} onChange={(e) => setCustomer((c) => ({ ...c, section: e.target.value }))}
                placeholder="Section" className="w-full border border-black/10 rounded-md px-3 py-2" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5">
          <h2 className="font-medium mb-3">Add Item</h2>

          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <ScanLine size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/30" />
              <input
                ref={scanInputRef}
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan(scanCode)}
                placeholder="Scan or type barcode, then Enter"
                className="w-full border border-black/10 rounded-md pl-8 pr-3 py-2 text-sm"
              />
            </div>
            <button onClick={() => setCameraOpen(true)} title="Scan with camera"
              className="px-3 py-2 rounded-md border border-black/10">
              <Camera size={16} />
            </button>
          </div>
          {scanMsg && <div className="text-xs text-black/50 mb-3">{scanMsg}</div>}

          <div className="text-xs text-black/40 mb-2">— or pick manually —</div>
          <select value={selectedItemSizeId} onChange={(e) => setSelectedItemSizeId(e.target.value)}
            className="w-full border border-black/10 rounded-md px-3 py-2 mb-2 text-sm">
            <option value="">Select item &amp; size…</option>
            {flatSizes.map((s) => (
              <option key={s.itemSizeId} value={s.itemSizeId} disabled={s.stock <= 0}>
                {s.label}{s.stock <= 0 ? ' (out of stock)' : ''}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)}
              className="w-20 border border-black/10 rounded-md px-3 py-2" />
            <button onClick={addToCart} className="flex-1 py-2 rounded-md text-white font-medium" style={{ background: 'var(--color-navy)' }}>
              Add to Bill
            </button>
          </div>
        </div>
      </div>

      {cameraOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg">Scan Barcode</h2>
              <button onClick={() => setCameraOpen(false)}><X size={18} /></button>
            </div>
            <video ref={videoRef} className="w-full rounded-md bg-black" muted playsInline />
            <p className="text-xs text-black/50 mt-2">Point the camera at a barcode or QR tag.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-black/5 shadow-sm p-5 mt-6">
        <h2 className="font-medium mb-3">Bill Items</h2>
        {cart.length === 0 ? (
          <div className="text-sm text-black/40">No items added yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-black/40 text-xs uppercase">
                <th className="py-1">Item</th><th>Size</th><th>Qty</th><th>Price</th><th>Total</th><th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((c) => (
                <tr key={c.itemSizeId} className="border-t border-black/5">
                  <td className="py-2">{c.name}</td>
                  <td>{c.size}</td>
                  <td className="font-mono-num">{c.quantity}</td>
                  <td className="font-mono-num">{formatINR(c.price)}</td>
                  <td className="font-mono-num">{formatINR(c.price * c.quantity)}</td>
                  <td><button onClick={() => removeFromCart(c.itemSizeId)}><Trash2 size={15} className="text-black/30 hover:text-[var(--color-maroon)]" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="grid grid-cols-3 gap-3 mt-4 max-w-md">
          <div>
            <label className="text-xs uppercase tracking-wide text-black/50">GST %</label>
            <input type="number" value={gstPercent} onChange={(e) => setGstPercent(e.target.value)}
              className="mt-1 w-full border border-black/10 rounded-md px-3 py-1.5" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-black/50">Discount ₹</label>
            <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)}
              className="mt-1 w-full border border-black/10 rounded-md px-3 py-1.5" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-black/50">Payment</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-1 w-full border border-black/10 rounded-md px-3 py-1.5">
              <option>Cash</option><option>UPI</option><option>Card</option><option>Mixed</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center border-t border-black/5 pt-4">
          <div className="text-sm space-y-0.5">
            <div>Subtotal: <span className="font-mono-num">{formatINR(subtotal)}</span></div>
            <div>GST: <span className="font-mono-num">{formatINR(gstAmount)}</span></div>
            <div className="font-medium">Grand Total: <span className="font-mono-num">{formatINR(grandTotal)}</span></div>
          </div>
          <button onClick={generateBill} className="px-6 py-3 rounded-md text-white font-medium" style={{ background: 'var(--color-maroon)' }}>
            Generate Bill
          </button>
        </div>
        {error && <div className="text-sm text-[var(--color-maroon)] mt-2">{error}</div>}
      </div>
    </div>
  );
}
