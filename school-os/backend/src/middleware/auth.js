import jwt from "jsonwebtoken";

import { tenantContext } from "../config/db.js";

// Verifies the JWT sent in the Authorization header and attaches
// req.user = { id, role, email, name }
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing authentication token." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Cross-check JWT tenant with the requested tenant header context
    const requestedTenant = tenantContext.getStore();
    
    if (requestedTenant && payload.tenantId !== requestedTenant && payload.role !== 'super_admin') {
      return res.status(403).json({ error: "Tenant mismatch. Token does not belong to this school." });
    }
    
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "TokenExpiredError", message: "Access token has expired." });
    }
    return res.status(401).json({ error: "Invalid session.", message: "Invalid or expired session. Please log in again." });
  }
}

// Restricts a route to one or more roles.
// Usage: requireRole("principal", "office")
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to access this." });
    }
    next();
  };
}
