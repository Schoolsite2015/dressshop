import { query } from "../config/db.js";

// Inline table creation (idempotent)
const INIT = `
  CREATE TABLE IF NOT EXISTS messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id   UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    body        TEXT NOT NULL,
    read        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_messages_sender    ON messages(sender_id);
  CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
`;

let initialized = false;
async function init() {
  if (!initialized) { await query(INIT); initialized = true; }
}

export async function listConversations(req, res) {
  await init();
  const userId = req.user.id;
  const { rows } = await query(
    `SELECT DISTINCT ON (other_user)
            other_user, other_name, other_role,
            last_msg, last_at, unread
     FROM (
       SELECT
         CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END AS other_user,
         CASE WHEN m.sender_id = $1 THEN ru.name ELSE su.name END AS other_name,
         CASE WHEN m.sender_id = $1 THEN ru.role ELSE su.role END AS other_role,
         m.body AS last_msg,
         m.created_at AS last_at,
         COUNT(*) FILTER (WHERE m.recipient_id = $1 AND NOT m.read) OVER (PARTITION BY
           CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END) AS unread
       FROM messages m
       JOIN users su ON su.id = m.sender_id
       JOIN users ru ON ru.id = m.recipient_id
       WHERE m.sender_id = $1 OR m.recipient_id = $1
       ORDER BY m.created_at DESC
     ) sub
     ORDER BY other_user, last_at DESC`,
    [userId]
  );
  res.json({ conversations: rows });
}

export async function getThread(req, res) {
  await init();
  const { userId: otherUserId } = req.params;
  const myId = req.user.id;
  const { rows } = await query(
    `SELECT m.*, u.name AS sender_name, u.role AS sender_role
     FROM messages m JOIN users u ON u.id = m.sender_id
     WHERE (m.sender_id = $1 AND m.recipient_id = $2)
        OR (m.sender_id = $2 AND m.recipient_id = $1)
     ORDER BY m.created_at ASC`,
    [myId, otherUserId]
  );
  // Mark as read
  await query(
    `UPDATE messages SET read = TRUE WHERE recipient_id = $1 AND sender_id = $2 AND read = FALSE`,
    [myId, otherUserId]
  );
  res.json({ messages: rows });
}

export async function sendMessage(req, res) {
  await init();
  const { recipientId, body } = req.body;
  if (!recipientId || !body) return res.status(400).json({ error: "recipientId and body required." });
  const { rows } = await query(
    `INSERT INTO messages (sender_id, recipient_id, body) VALUES ($1,$2,$3) RETURNING *`,
    [req.user.id, recipientId, body.trim()]
  );
  res.status(201).json({ message: rows[0] });
}

export async function listContacts(req, res) {
  await init();
  // Returns users a given role can message
  const { role } = req.user;
  let roleFilter = [];
  if (role === "parent") roleFilter = ["teacher", "office", "principal"];
  else if (role === "teacher") roleFilter = ["parent", "principal", "office", "teacher"];
  else roleFilter = ["teacher", "parent", "student", "office", "principal"];

  const { rows } = await query(
    `SELECT id, name, role, email FROM users
     WHERE role = ANY($1) AND id != $2 AND is_active = TRUE
     ORDER BY role, name`,
    [roleFilter, req.user.id]
  );
  res.json({ contacts: rows });
}
