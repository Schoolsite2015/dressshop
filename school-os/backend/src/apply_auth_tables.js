import { pool } from "./config/db.js";

async function apply() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        device_info TEXT,
        ip_address TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id UUID,
        details JSONB DEFAULT '{}',
        ip_address TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    console.log("Tables created successfully.");
  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    await pool.end();
  }
}

apply();
