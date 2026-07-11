import { tenantContext } from '../config/db.js';
import { query } from '../config/db.js';

export async function tenantMiddleware(req, res, next) {
  // Try to get tenant id from header (Option B) or subdomain
  const tenantIdHeader = req.headers['x-tenant-id'];
  const subdomainHeader = req.headers['x-tenant-subdomain'];
  let tenantId = null;

  if (tenantIdHeader && tenantIdHeader !== 'null' && tenantIdHeader !== 'undefined') {
    tenantId = tenantIdHeader;
  }

  // If no tenantId is found, we can either reject (for tenant-specific routes)
  // or allow it (for super admin / public routes). We will allow it and let the controller handle auth.
  if (tenantId) {
    // Validate tenant exists (Optional but good for security)
    try {
      // Bypass RLS to verify tenant, since tenant table doesn't have RLS anyway
      const { rows } = await query(`SELECT id FROM tenants WHERE id = $1 AND status = 'active'`, [tenantId]);
      if (rows.length === 0) {
        return res.status(403).json({ error: "Invalid or inactive tenant" });
      }
    } catch (e) {
      console.error("Tenant validation error:", e);
      return res.status(400).json({ error: "Invalid tenant format" });
    }
  } else if (subdomainHeader && subdomainHeader !== 'null' && subdomainHeader !== 'undefined') {
    try {
      const { rows } = await query(`SELECT id FROM tenants WHERE subdomain = $1 AND status = 'active'`, [subdomainHeader]);
      if (rows.length > 0) {
        tenantId = rows[0].id;
      } else {
        return res.status(403).json({ error: "Invalid or inactive tenant subdomain" });
      }
    } catch (e) {
      console.error("Tenant lookup error:", e);
      return res.status(400).json({ error: "Error looking up tenant" });
    }
  }

  req.tenantId = tenantId;

  // Run the request in the context of this tenant
  tenantContext.run(tenantId, () => {
    next();
  });
}
