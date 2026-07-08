import { Router } from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import db from '../db/index.js';
import { requireAuth, requireAdmin, signToken } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

// Users are scoped to the admin's own school — an admin can never see or
// manage another school's accounts.
router.get('/users', (req, res) => {
  res.json(db.prepare('SELECT id, username, role, created_at FROM users WHERE school_id = ?').all(req.schoolId));
});

router.post('/users', (req, res) => {
  const { username, password, role = 'staff' } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const r = db.prepare('INSERT INTO users (school_id, username, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(req.schoolId, username, hash, role);
    res.status(201).json({ id: Number(r.lastInsertRowid), username, role });
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

router.delete('/users/:id', (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  const target = db.prepare('SELECT id FROM users WHERE id = ? AND school_id = ?').get(req.params.id, req.schoolId);
  if (!target) return res.status(404).json({ error: 'User not found' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Manual backup: copy the whole shared database (all schools live in one file)
router.post('/backup', (req, res) => {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'shop.db');
  const backupDir = path.join(process.cwd(), 'data', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(backupDir, `shop-${stamp}.db`);
  fs.copyFileSync(dbPath, dest);
  res.json({ success: true, file: dest });
});

// Logo upload endpoint
router.post('/upload-logo', (req, res) => {
  const { logo } = req.body;
  if (!logo) return res.status(400).json({ error: 'No logo data provided' });

  try {
    const matches = logo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let ext = '.png';
    let base64Data = logo;

    if (matches && matches.length === 3) {
      const mime = matches[1];
      base64Data = matches[2];
      if (mime === 'image/jpeg' || mime === 'image/jpg') ext = '.jpg';
      else if (mime === 'image/gif') ext = '.gif';
      else if (mime === 'image/svg+xml') ext = '.svg';
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `logo_${Date.now()}${ext}`;
    const dir = path.join(process.cwd(), 'public', 'logos');
    fs.mkdirSync(dir, { recursive: true });
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, buffer);

    res.json({ url: `/logos/${filename}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// List all schools
router.get('/schools', (req, res) => {
  try {
    const schools = db.prepare('SELECT * FROM schools ORDER BY name').all();
    res.json(schools);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new school
router.post('/schools', (req, res) => {
  const { name, address, phone, email, logoPath } = req.body;
  if (!name) return res.status(400).json({ error: 'School name is required' });

  try {
    const r = db.prepare(`
      INSERT INTO schools (name, address, phone, email, logo_path)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, address || null, phone || null, email || null, logoPath || null);
    
    const schoolId = Number(r.lastInsertRowid);
    const school = db.prepare('SELECT * FROM schools WHERE id = ?').get(schoolId);
    res.status(201).json(school);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'School name already exists' });
  }
});

// Switch session to another school
router.post('/schools/:id/switch', (req, res) => {
  const targetId = Number(req.params.id);
  try {
    const school = db.prepare('SELECT * FROM schools WHERE id = ?').get(targetId);
    if (!school) return res.status(404).json({ error: 'School not found' });

    const token = signToken({
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      school_id: school.id
    });

    res.json({
      token,
      user: { id: req.user.id, username: req.user.username, role: req.user.role, school_id: school.id },
      school
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Securely delete a school (transactional cascade)
router.delete('/schools/:id', (req, res) => {
  const targetId = Number(req.params.id);
  if (targetId === req.schoolId) {
    return res.status(400).json({ error: 'Cannot delete the school you are currently logged into' });
  }

  const school = db.prepare('SELECT * FROM schools WHERE id = ?').get(targetId);
  if (!school) return res.status(404).json({ error: 'School not found' });

  db.exec('BEGIN TRANSACTION');
  try {
    // 1. Delete from return_items
    db.prepare(`
      DELETE FROM return_items WHERE return_id IN (
        SELECT id FROM returns WHERE school_id = ?
      )
    `).run(targetId);

    // 2. Delete from returns
    db.prepare('DELETE FROM returns WHERE school_id = ?').run(targetId);

    // 3. Delete from bill_items
    db.prepare(`
      DELETE FROM bill_items WHERE bill_id IN (
        SELECT id FROM bills WHERE school_id = ?
      )
    `).run(targetId);

    // 4. Delete from bills
    db.prepare('DELETE FROM bills WHERE school_id = ?').run(targetId);

    // 5. Delete from purchases
    db.prepare(`
      DELETE FROM purchases WHERE item_size_id IN (
        SELECT isz.id FROM item_sizes isz
        JOIN items i ON i.id = isz.item_id
        WHERE i.school_id = ?
      )
    `).run(targetId);

    // 6. Delete from item_sizes
    db.prepare(`
      DELETE FROM item_sizes WHERE item_id IN (
        SELECT id FROM items WHERE school_id = ?
      )
    `).run(targetId);

    // 7. Delete from items
    db.prepare('DELETE FROM items WHERE school_id = ?').run(targetId);

    // 8. Delete from suppliers
    db.prepare('DELETE FROM suppliers WHERE school_id = ?').run(targetId);

    // 9. Delete from customers
    db.prepare('DELETE FROM customers WHERE school_id = ?').run(targetId);

    // 10. Delete from users
    db.prepare('DELETE FROM users WHERE school_id = ?').run(targetId);

    // 11. Delete from school
    db.prepare('DELETE FROM schools WHERE id = ?').run(targetId);

    db.exec('COMMIT');

    // Physical logo deletion
    if (school.logo_path) {
      const cleanPath = school.logo_path.startsWith('/') ? school.logo_path.slice(1) : school.logo_path;
      const filename = path.basename(cleanPath);
      const fullPath = path.join(process.cwd(), 'public', 'logos', filename);
      
      try {
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`[admin] Deleted logo file: ${fullPath}`);
        }
      } catch (fileErr) {
        console.error(`[admin] Failed to delete logo file ${fullPath}:`, fileErr.message);
      }
    }

    res.json({ success: true });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to delete school: ' + err.message });
  }
});

export default router;
