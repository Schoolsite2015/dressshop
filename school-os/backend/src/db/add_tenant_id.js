import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.join(__dirname, 'schema.sql');
let sql = fs.readFileSync(schemaPath, 'utf8');

// 1. Add super_admin to user_role ENUM
sql = sql.replace(
  /'librarian', 'admin'/,
  "'librarian', 'admin', 'super_admin'"
);

// 2. Prepend tenants table creation
const tenantsTable = `
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active'
);
`;

if (!sql.includes("CREATE TABLE tenants")) {
  sql = sql.replace(
    /CREATE EXTENSION IF NOT EXISTS "pgcrypto";/,
    `CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n${tenantsTable}`
  );
}

// 3. Inject tenant_id into EVERY table (except tenants)
// Regex to find: CREATE TABLE table_name (
const createTableRegex = /CREATE TABLE ([a-zA-Z_0-9]+) \(/g;

let updatedSql = '';
let lastIndex = 0;
let match;

while ((match = createTableRegex.exec(sql)) !== null) {
  const tableName = match[1];
  updatedSql += sql.substring(lastIndex, match.index + match[0].length);
  lastIndex = match.index + match[0].length;

  if (tableName !== 'tenants') {
    updatedSql += `\n  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT NULLIF(current_setting('app.current_tenant', true), '')::uuid,`;
  }
}
updatedSql += sql.substring(lastIndex);
sql = updatedSql;

// 4. Update UNIQUE constraints that contain email to include tenant_id
// E.g., email TEXT UNIQUE NOT NULL -> email TEXT NOT NULL, UNIQUE(email, tenant_id)
// We will just do this manually for users email and phone
sql = sql.replace(/email\s+TEXT\s+UNIQUE\s+NOT NULL/g, 'email TEXT NOT NULL');

// Append composite unique constraints at the end of the users table (we'll just use ALTER TABLE)
const alterTableConstraints = `
-- ==========================================
-- MULTI-TENANCY RLS POLICIES & CONSTRAINTS
-- ==========================================

ALTER TABLE users ADD CONSTRAINT users_email_tenant_unique UNIQUE (email, tenant_id);
`;

if (!sql.includes("MULTI-TENANCY RLS POLICIES")) {
  sql += alterTableConstraints;
}

// 5. Append RLS enablement for all tables
const allTables = [...sql.matchAll(/CREATE TABLE ([a-zA-Z_0-9]+) \(/g)]
  .map(m => m[1])
  .filter(t => t !== 'tenants');

let rlsScript = `\n-- ENABLING ROW LEVEL SECURITY --\n`;
allTables.forEach(t => {
  rlsScript += `ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;\n`;
  rlsScript += `DROP POLICY IF EXISTS tenant_isolation ON ${t};\n`;
  rlsScript += `CREATE POLICY tenant_isolation ON ${t} USING (tenant_id = NULLIF(current_setting('app.current_tenant', true), '')::uuid);\n\n`;
});

if (!sql.includes("ENABLING ROW LEVEL SECURITY")) {
  sql += rlsScript;
}

fs.writeFileSync(schemaPath, sql);
console.log("Schema rewritten for Multi-tenancy with RLS.");
