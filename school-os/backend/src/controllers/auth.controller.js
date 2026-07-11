import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { query } from "../config/db.js";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

// Helper to hash tokens
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Helper to generate a random token
const generateRefreshToken = () => crypto.randomBytes(40).toString('hex');

export async function login(req, res) {
  const { email, password, deviceInfo } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const { rows } = await query("SELECT * FROM users WHERE email = $1 AND is_active = TRUE", [email]);
  const user = rows[0];

  if (!user) {
    return res.status(401).json({ error: "No account found with that email." });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Incorrect password." });
  }

  // Generate tokens
  const accessToken = jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name, tenantId: user.tenant_id },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = generateRefreshToken();
  const tokenHash = hashToken(refreshToken);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  // Store refresh token
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [user.id, tokenHash, deviceInfo || req.headers['user-agent'] || 'Unknown Device', ipAddress, expiresAt]
  );

  let photo_url = null;
  if (user.role === 'student' || user.role === 'parent') {
    const { rows: student } = await query(`SELECT photo_url FROM students WHERE user_id = $1 OR parent_user_id = $1 LIMIT 1`, [user.id]);
    photo_url = student[0]?.photo_url;
  } else {
    const { rows: staff } = await query(`SELECT photo_url FROM staff WHERE user_id = $1 LIMIT 1`, [user.id]);
    photo_url = staff[0]?.photo_url;
  }

  res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, photo_url },
  });
}

export async function refreshToken(req, res) {
  const { refreshToken, deviceInfo } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token is required." });
  }

  const tokenHash = hashToken(refreshToken);

  // Find valid token
  const { rows } = await query(
    `SELECT * FROM refresh_tokens 
     WHERE token_hash = $1 
       AND revoked_at IS NULL 
       AND expires_at > now()`,
    [tokenHash]
  );

  const activeToken = rows[0];

  if (!activeToken) {
    return res.status(401).json({ error: "Invalid or expired refresh token." });
  }

  // Token is valid. Revoke it for token rotation.
  await query(`UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1`, [activeToken.id]);

  // Find the user to issue a new token
  const { rows: userRows } = await query("SELECT * FROM users WHERE id = $1 AND is_active = TRUE", [activeToken.user_id]);
  const user = userRows[0];

  if (!user) {
    return res.status(401).json({ error: "User is no longer active." });
  }

  // Generate new tokens
  const newAccessToken = jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name, tenantId: user.tenant_id },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashToken(newRefreshToken);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  // Store new refresh token
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [user.id, newTokenHash, deviceInfo || req.headers['user-agent'] || 'Unknown Device', ipAddress, expiresAt]
  );

  res.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
}

export async function getSessions(req, res) {
  const userId = req.user.id;
  const { rows } = await query(
    `SELECT id, device_info, ip_address, created_at, expires_at 
     FROM refresh_tokens 
     WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC`,
    [userId]
  );
  res.json({ sessions: rows });
}

export async function revokeSession(req, res) {
  const { sessionId } = req.params;
  const userId = req.user.id;
  
  // Only allow users to revoke their own sessions
  await query(
    `UPDATE refresh_tokens SET revoked_at = now() 
     WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );
  
  res.json({ message: "Session revoked successfully." });
}

export async function me(req, res) {
  const { id, role } = req.user;
  try {
    const { rows } = await query(`SELECT name, email FROM users WHERE id = $1`, [id]);
    if (rows.length === 0) return res.status(401).json({ error: "User not found" });
    
    let photo_url = null;
    if (role === 'student' || role === 'parent') {
      const { rows: student } = await query(`SELECT photo_url FROM students WHERE user_id = $1 OR parent_user_id = $1 LIMIT 1`, [id]);
      photo_url = student[0]?.photo_url;
    } else {
      const { rows: staff } = await query(`SELECT photo_url FROM staff WHERE user_id = $1 LIMIT 1`, [id]);
      photo_url = staff[0]?.photo_url;
    }

    res.json({ user: { ...req.user, name: rows[0].name, photo_url } });
  } catch (err) {
    res.json({ user: req.user });
  }
}
