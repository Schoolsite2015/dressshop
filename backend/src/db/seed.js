import bcrypt from 'bcryptjs';
import db from './index.js';

function ensureSchool({ name, address, phone, email, logoPath }) {
  let school = db.prepare('SELECT * FROM schools WHERE name = ?').get(name);
  if (!school) {
    const r = db.prepare(`INSERT INTO schools (name, address, phone, email, logo_path)
      VALUES (?, ?, ?, ?, ?)`).run(name, address, phone, email, logoPath || null);
    school = { id: Number(r.lastInsertRowid), name };
    console.log(`Seeded school: ${name} (id ${school.id})`);
  }
  return school;
}

function ensureUser({ schoolId, username, password, role }) {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (!existing) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (school_id, username, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(schoolId, username, hash, role);
    console.log(`Created ${role} user -> username: ${username}, password: ${password}`);
  }
}

function seedCatalogIfEmpty(schoolId, schoolLabel) {
  const itemCount = db.prepare('SELECT COUNT(*) as c FROM items WHERE school_id = ?').get(schoolId).c;
  if (itemCount > 0) return;

  const supplier = db.prepare('INSERT INTO suppliers (school_id, name, phone, address) VALUES (?, ?, ?, ?)')
    .run(schoolId, 'Ganga Textiles', '9415012345', 'Pindra, Varanasi');

  const catalog = [
    { name: 'White Shirt', category: 'Shirt', gender: 'Boy' },
    { name: 'White Shirt', category: 'Shirt', gender: 'Girl' },
    { name: 'Grey Pant', category: 'Pant', gender: 'Boy' },
    { name: 'Grey Skirt', category: 'Skirt', gender: 'Girl' },
    { name: 'Navy Lower', category: 'Lower', gender: 'Unisex' },
    { name: 'House T-Shirt Red', category: 'House T-Shirt', gender: 'Unisex' },
    { name: 'House T-Shirt Blue', category: 'House T-Shirt', gender: 'Unisex' },
    { name: 'School Tie', category: 'Tie', gender: 'Unisex' },
    { name: 'Black Belt', category: 'Belt', gender: 'Unisex' },
    { name: 'School Blazer', category: 'Blazer', gender: 'Unisex' },
    { name: 'Woollen Sweater', category: 'Sweater', gender: 'Unisex' },
  ];
  const sizes = ['22', '24', '26', '28', '30', '32', '34', '36'];

  const insertItem = db.prepare('INSERT INTO items (school_id, name, category, gender) VALUES (?, ?, ?, ?)');
  const insertSize = db.prepare(`INSERT INTO item_sizes
    (item_id, size, stock, minimum_stock, purchase_price, selling_price) VALUES (?, ?, ?, ?, ?, ?)`);
  const setBarcode = db.prepare('UPDATE item_sizes SET barcode = ? WHERE id = ?');
  const insertPurchase = db.prepare(`INSERT INTO purchases
    (item_size_id, supplier_id, quantity, purchase_price) VALUES (?, ?, ?, ?)`);

  for (const c of catalog) {
    const res = insertItem.run(schoolId, c.name, c.category, c.gender);
    const itemId = Number(res.lastInsertRowid);
    const basePrice = c.category === 'Blazer' ? 900 : c.category === 'Sweater' ? 450
      : c.category === 'Tie' || c.category === 'Belt' ? 120 : 350;
    for (const s of sizes) {
      const stock = Math.floor(Math.random() * 60) + 5;
      const purchasePrice = Math.round(basePrice * 0.65);
      const sizeRes = insertSize.run(itemId, s, stock, 10, purchasePrice, basePrice);
      const sizeId = Number(sizeRes.lastInsertRowid);
      setBarcode.run(`SKU${String(sizeId).padStart(8, '0')}`, sizeId);
      insertPurchase.run(sizeId, Number(supplier.lastInsertRowid), stock, purchasePrice);
    }
  }
  db.prepare(`UPDATE item_sizes SET stock = 7 WHERE size = '32' AND item_id =
    (SELECT id FROM items WHERE school_id = ? AND name='White Shirt' AND gender='Boy')`).run(schoolId);
  db.prepare(`UPDATE item_sizes SET stock = 0 WHERE size = '22' AND item_id =
    (SELECT id FROM items WHERE school_id = ? AND name='Grey Skirt')`).run(schoolId);

  console.log(`Seeded ${catalog.length} items x ${sizes.length} sizes for ${schoolLabel}.`);
}

// --- School 1: S.N. Uniform Shop ---
const school1 = ensureSchool({
  name: 'S.N. Uniform Shop',
  address: 'Pindra, Varanasi',
  phone: '+91-9415012345',
  email: 'snuniform@gmail.com',
  logoPath: null,
});
ensureUser({ schoolId: school1.id, username: 'admin', password: 'admin123', role: 'admin' });
ensureUser({ schoolId: school1.id, username: 'staff', password: 'staff123', role: 'staff' });
seedCatalogIfEmpty(school1.id, 'S.N. Uniform Shop');

// --- School 2: Chandrabhan International Academy ---
const school2 = ensureSchool({
  name: 'Chandrabhan International Academy',
  address: 'Phoolpur, Trilochan Bazar, Jaunpur, Uttar Pradesh',
  phone: '+91-9860204409, +91-7459894828',
  email: 'chandrabhansingh4409@gmail.com',
  logoPath: '/logos/logo_chandrabhan.jpg',
});
ensureUser({ schoolId: school2.id, username: 'chandrabhan', password: 'chandrabhan@123', role: 'admin' });
ensureUser({ schoolId: school2.id, username: 'cb_staff', password: 'staff123', role: 'staff' });
seedCatalogIfEmpty(school2.id, 'Chandrabhan International Academy');

// --- School 3: St. S.N. Public School ---
const school3 = ensureSchool({
  name: 'St. S.N. Public School',
  address: 'Lucknow - Varanasi Rd, Pindra, Uttar Pradesh 221206',
  phone: '091513 12209',
  email: 'snpublic@gmail.com',
  logoPath: '/logos/logo_sn_public.png',
});
ensureUser({ schoolId: school3.id, username: 'snpublic', password: 'snpublic@123', role: 'admin' });
ensureUser({ schoolId: school3.id, username: 'sn_staff', password: 'staff123', role: 'staff' });
seedCatalogIfEmpty(school3.id, 'St. S.N. Public School');

// Sample customer for School 1
const customerCount = db.prepare('SELECT COUNT(*) as c FROM customers WHERE school_id = ?').get(school1.id).c;
if (customerCount === 0) {
  db.prepare('INSERT INTO customers (school_id, name, phone, class, section) VALUES (?, ?, ?, ?, ?)')
    .run(school1.id, 'Ravi Kumar', '9876543210', '6', 'A');
  console.log('Seeded sample customer for S.N. Uniform Shop.');
}

console.log('Seed complete.');
