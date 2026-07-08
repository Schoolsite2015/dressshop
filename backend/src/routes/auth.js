import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

function schoolFor(schoolId) {
  return db.prepare('SELECT id, name, address, phone, email, logo_path FROM schools WHERE id = ?').get(schoolId);
}

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const token = signToken(user);
  const school = schoolFor(user.school_id);
  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role, school_id: user.school_id },
    school,
  });
});

router.get('/me', requireAuth, (req, res) => {
  const school = schoolFor(req.schoolId);
  res.json({ user: req.user, school });
});

export default router;
