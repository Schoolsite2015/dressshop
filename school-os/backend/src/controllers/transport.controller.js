import { query } from "../config/db.js";

export async function listRoutes(req, res) {
  const { rows } = await query(`SELECT * FROM transport_routes ORDER BY name`);
  res.json({ routes: rows });
}

export async function listBuses(req, res) {
  const { rows } = await query(
    `SELECT b.*, r.name AS route_name
     FROM buses b LEFT JOIN transport_routes r ON r.id = b.route_id
     ORDER BY b.number_plate`
  );
  res.json({ buses: rows });
}

export async function getBusInfo(req, res) {
  const { rows } = await query(
    `SELECT b.*, r.name AS route_name
     FROM buses b LEFT JOIN transport_routes r ON r.id = b.route_id
     WHERE b.id = $1`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Bus not found." });
  res.json({ bus: rows[0] });
}

export async function updateBusLocation(req, res) {
  const { lat, lng } = req.body;
  if (lat == null || lng == null) return res.status(400).json({ error: "lat and lng required." });
  const { rows } = await query(
    `UPDATE buses SET last_lat=$1, last_lng=$2, last_ping_at=now() WHERE id=$3 RETURNING *`,
    [lat, lng, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: "Bus not found." });

  // Emit to socket room for real-time tracking
  if (req.app.get("io")) {
    req.app.get("io").to(`bus:${req.params.id}`).emit("bus:location", {
      busId: req.params.id, lat, lng, at: Date.now(),
    });
  }
  res.json({ bus: rows[0] });
}

export async function addRoute(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name required." });
  const { rows } = await query(`INSERT INTO transport_routes (name) VALUES ($1) RETURNING *`, [name]);
  res.status(201).json({ route: rows[0] });
}

export async function addBus(req, res) {
  const { routeId, numberPlate, driverName, driverPhone } = req.body;
  if (!numberPlate) return res.status(400).json({ error: "numberPlate required." });
  const { rows } = await query(
    `INSERT INTO buses (route_id, number_plate, driver_name, driver_phone) VALUES ($1,$2,$3,$4) RETURNING *`,
    [routeId || null, numberPlate, driverName || null, driverPhone || null]
  );
  res.status(201).json({ bus: rows[0] });
}

// Returns the bus assigned to the logged-in student or the parent's child
export async function getMyBus(req, res) {
  const userId = req.user.id;
  const role   = req.user.role;

  let studentQuery;
  if (role === "student") {
    // Find student record by user_id
    studentQuery = await query(`SELECT id FROM students WHERE user_id = $1 LIMIT 1`, [userId]);
  } else if (role === "parent") {
    // Find the child linked to this parent
    studentQuery = await query(`SELECT id FROM students WHERE parent_user_id = $1 LIMIT 1`, [userId]);
  } else {
    return res.status(403).json({ error: "This endpoint is for students and parents only." });
  }

  if (!studentQuery.rows[0]) {
    return res.json({ bus: null, message: "No student record found." });
  }
  const studentId = studentQuery.rows[0].id;

  // Find transport assignment
  const { rows } = await query(
    `SELECT b.*, r.name AS route_name, st.pickup_point
     FROM student_transport st
     JOIN buses b ON b.id = st.bus_id
     LEFT JOIN transport_routes r ON r.id = b.route_id
     WHERE st.student_id = $1
     LIMIT 1`,
    [studentId]
  );

  if (!rows[0]) {
    return res.json({ bus: null, message: "No bus assigned to this student." });
  }

  res.json({ bus: rows[0] });
}

