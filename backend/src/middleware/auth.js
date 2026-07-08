import jwt from 'jsonwebtoken';
import db from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(payload.id);
    if (!userExists) {
      return res.status(401).json({ error: 'User account has been deleted' });
    }
    req.user = payload; // { id, username, role, school_id }
    req.schoolId = payload.school_id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, school_id: user.school_id },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}
