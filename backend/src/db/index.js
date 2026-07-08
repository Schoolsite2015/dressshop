import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 5)) {
  console.error(`
========================================================================
 ERROR: This app needs Node.js v22.5.0 or newer.
 You are running Node.js v${process.versions.node}.

 This app uses Node's built-in SQLite support (the "node:sqlite" module),
 which was only added in Node v22.5.0. On an older Node version this
 fails immediately, before the server can even start.

 Fix: install a newer Node.js (https://nodejs.org, or via nvm:
 "nvm install 22 && nvm use 22"), then run this command again.
========================================================================
`);
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/shop.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');

// Single shared database. Every school's data lives in the same tables,
// scoped by a `school_id` column. This keeps things simple (one file, one
// connection, ordinary joins) while still fully separating each school's
// stock, bills, and customers from every other school's.
db.exec(`
CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_path TEXT, -- e.g. /logos/logo_chandrabhan.jpg, served statically
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff', -- 'admin' | 'staff'
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  gender TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(school_id, name, category, gender)
);

CREATE TABLE IF NOT EXISTS item_sizes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 10,
  purchase_price REAL NOT NULL DEFAULT 0,
  selling_price REAL NOT NULL DEFAULT 0,
  barcode TEXT,
  UNIQUE(item_id, size)
);

CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_size_id INTEGER NOT NULL REFERENCES item_sizes(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  quantity INTEGER NOT NULL,
  purchase_price REAL NOT NULL,
  purchase_date TEXT DEFAULT (datetime('now')),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  class TEXT,
  section TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(school_id, phone)
);

CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  bill_number TEXT NOT NULL,
  customer_id INTEGER REFERENCES customers(id),
  subtotal REAL NOT NULL,
  gst_percent REAL NOT NULL DEFAULT 0,
  gst_amount REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  grand_total REAL NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  created_by INTEGER REFERENCES users(id),
  UNIQUE(school_id, bill_number)
);

CREATE TABLE IF NOT EXISTS bill_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  item_size_id INTEGER NOT NULL REFERENCES item_sizes(id),
  item_name TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  line_total REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL REFERENCES schools(id),
  bill_id INTEGER NOT NULL REFERENCES bills(id),
  reason TEXT,
  refund_total REAL NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  created_by INTEGER REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS return_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  return_id INTEGER NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  bill_item_id INTEGER NOT NULL REFERENCES bill_items(id),
  item_size_id INTEGER NOT NULL REFERENCES item_sizes(id),
  item_name TEXT NOT NULL,
  size TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  line_total REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_item_sizes_item ON item_sizes(item_id);
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(created_at);
CREATE INDEX IF NOT EXISTS idx_bills_school ON bills(school_id);
CREATE INDEX IF NOT EXISTS idx_customers_school_phone ON customers(school_id, phone);
CREATE INDEX IF NOT EXISTS idx_items_school ON items(school_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_school ON suppliers(school_id);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_returns_bill ON returns(bill_id);
CREATE INDEX IF NOT EXISTS idx_returns_school ON returns(school_id);
CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id);
`);

// Migration: older databases created before barcodes/returns existed won't have
// the new column. CREATE TABLE IF NOT EXISTS never alters an existing table, so
// add it by hand if missing.
const itemSizeCols = db.prepare("PRAGMA table_info(item_sizes)").all().map(c => c.name);
if (!itemSizeCols.includes('barcode')) {
  db.exec('ALTER TABLE item_sizes ADD COLUMN barcode TEXT;');
  console.log('[db] Migrated: added barcode column to item_sizes.');
}
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_item_sizes_barcode ON item_sizes(barcode);');

// Backfill barcodes for any existing rows that don't have one yet (e.g. right
// after the migration above, or items seeded before this feature existed).
const missingBarcodes = db.prepare('SELECT id FROM item_sizes WHERE barcode IS NULL').all();
if (missingBarcodes.length > 0) {
  const setBarcode = db.prepare('UPDATE item_sizes SET barcode = ? WHERE id = ?');
  for (const row of missingBarcodes) {
    setBarcode.run(`SKU${String(row.id).padStart(8, '0')}`, row.id);
  }
  console.log(`[db] Backfilled barcodes for ${missingBarcodes.length} item size(s).`);
}

export default db;
