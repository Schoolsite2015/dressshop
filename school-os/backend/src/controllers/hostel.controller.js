import { query } from "../config/db.js";

export async function listRooms(req, res) {
  const { rows } = await query(
    `SELECT r.*,
            COUNT(a.id) AS occupied
     FROM hostel_rooms r
     LEFT JOIN hostel_allocations a ON a.room_id = r.id
     GROUP BY r.id ORDER BY r.room_no`
  );
  res.json({ rooms: rows });
}

export async function addRoom(req, res) {
  const { roomNo, capacity } = req.body;
  if (!roomNo) return res.status(400).json({ error: "roomNo required." });
  const { rows } = await query(
    `INSERT INTO hostel_rooms (room_no, capacity) VALUES ($1,$2) RETURNING *`,
    [roomNo, capacity || 4]
  );
  res.status(201).json({ room: rows[0] });
}

export async function listAllocations(req, res) {
  const { roomId } = req.query;
  const { rows } = await query(
    `SELECT a.*, s.name AS student_name, s.admission_no, r.room_no
     FROM hostel_allocations a
     JOIN students s ON s.id = a.student_id
     JOIN hostel_rooms r ON r.id = a.room_id
     WHERE ($1::uuid IS NULL OR a.room_id = $1)
     ORDER BY r.room_no, s.name`,
    [roomId || null]
  );
  res.json({ allocations: rows });
}

export async function allocateRoom(req, res) {
  const { roomId, studentId } = req.body;
  if (!roomId || !studentId) return res.status(400).json({ error: "roomId and studentId required." });

  const { rows: room } = await query(
    `SELECT r.capacity, COUNT(a.id) AS occupied
     FROM hostel_rooms r LEFT JOIN hostel_allocations a ON a.room_id = r.id
     WHERE r.id = $1 GROUP BY r.id`,
    [roomId]
  );
  if (!room[0]) return res.status(404).json({ error: "Room not found." });
  if (Number(room[0].occupied) >= room[0].capacity)
    return res.status(409).json({ error: "Room is at full capacity." });

  const { rows } = await query(
    `INSERT INTO hostel_allocations (room_id, student_id) VALUES ($1,$2) RETURNING *`,
    [roomId, studentId]
  );
  res.status(201).json({ allocation: rows[0] });
}

export async function deallocateRoom(req, res) {
  await query(`DELETE FROM hostel_allocations WHERE id = $1`, [req.params.id]);
  res.json({ success: true });
}
