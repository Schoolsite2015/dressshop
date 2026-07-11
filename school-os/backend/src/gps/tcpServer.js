import net from "net";
import { pool } from "../config/db.js";

// Helper to convert NMEA DDMM.MMMM to decimal degrees
function nmeaToDecimal(nmea, direction) {
  if (!nmea || !direction) return null;
  const dotIndex = nmea.indexOf('.');
  if (dotIndex === -1) return null;
  
  const degreesLength = dotIndex === 5 ? 3 : 2; // e.g. 11404.1234 -> 3 deg, 2232.1234 -> 2 deg
  const degrees = parseFloat(nmea.substring(0, degreesLength));
  const minutes = parseFloat(nmea.substring(degreesLength));
  
  let decimal = degrees + (minutes / 60);
  if (direction === 'S' || direction === 'W') {
    decimal = decimal * -1;
  }
  return decimal;
}

export function startGPSServer(io, port = 4005) {
  const server = net.createServer((socket) => {
    // console.log(`[GPS] New connection from ${socket.remoteAddress}:${socket.remotePort}`);

    socket.on("data", async (data) => {
      const payload = data.toString('utf8').trim();
      if (!payload) return;
      
      // console.log(`[GPS] Received payload: ${payload}`);

      // Basic generic parsing for TK103 / Coban string
      // Format: (012345678901234,BR00,260723,A,2232.1234,N,11404.1234,E,0.0,0,...)
      // We will look for an IMEI (11-15 digits), and the A, lat, N/S, lng, E/W pattern.
      
      const tk103Regex = /\((\d+),[A-Z0-9]+,\d+,([AV]),(\d+\.\d+),([NS]),(\d+\.\d+),([EW])/;
      const match = payload.match(tk103Regex);

      if (match) {
        const imei = match[1];
        const status = match[2]; // A = valid, V = invalid
        
        if (status === 'A') {
          const latNmea = match[3];
          const latDir = match[4];
          const lngNmea = match[5];
          const lngDir = match[6];

          const lat = nmeaToDecimal(latNmea, latDir);
          const lng = nmeaToDecimal(lngNmea, lngDir);

          if (lat && lng) {
            // Update database
            try {
              const { rows } = await pool.query(
                `UPDATE buses 
                 SET last_lat = $1, last_lng = $2, last_ping_at = NOW() 
                 WHERE gps_device_id = $3 
                 RETURNING id, tenant_id`,
                [lat, lng, imei]
              );
              
              if (rows.length > 0) {
                const busId = rows[0].id;
                // Broadcast to frontend
                io.to(`bus:${busId}`).emit("bus:location", {
                  busId,
                  lat,
                  lng,
                  at: Date.now()
                });
                // console.log(`[GPS] Updated bus ${busId} (IMEI: ${imei}) at ${lat}, ${lng}`);
              }
            } catch (err) {
              console.error("[GPS] DB Update Error:", err.message);
            }
          }
        }
      }
      
      // Respond to keep connection alive if required by trackers (LOAD response)
      socket.write("LOAD");
    });

    socket.on("error", (err) => {
      if (err.code !== "ECONNRESET") {
        console.error("[GPS] Socket Error:", err);
      }
    });
  });

  server.listen(port, () => {
    console.log(`📡 GPS TCP Server listening on port ${port}`);
  });

  return server;
}
