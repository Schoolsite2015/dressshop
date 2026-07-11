import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

import { createProxyMiddleware } from "http-proxy-middleware";

import authRoutes        from "./routes/auth.routes.js";
import studentsRoutes    from "./routes/students.routes.js";
import attendanceRoutes  from "./routes/attendance.routes.js";
import feesRoutes        from "./routes/fees.routes.js";
import admissionsRoutes  from "./routes/admissions.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import visitorsRoutes from "./routes/visitors.routes.js";
import examsRoutes       from "./routes/exams.routes.js";
import timetableRoutes   from "./routes/timetable.routes.js";
import homeworkRoutes    from "./routes/homework.routes.js";
import noticesRoutes     from "./routes/notices.routes.js";
import libraryRoutes     from "./routes/library.routes.js";
import transportRoutes   from "./routes/transport.routes.js";
import hostelRoutes      from "./routes/hostel.routes.js";
import inventoryRoutes   from "./routes/inventory.routes.js";
import hrRoutes          from "./routes/hr.routes.js";
import certificatesRoutes from "./routes/certificates.routes.js";
import eventsRoutes      from "./routes/events.routes.js";
import messagesRoutes    from "./routes/messages.routes.js";


dotenv.config();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || "*", methods: ["GET", "POST"] },
});

import { startGPSServer } from "./gps/tcpServer.js";

app.set("io", io);

// Start GPS TCP Server for live SIM card tracking
startGPSServer(io, process.env.GPS_PORT || 4005);

// Security & Performance Middlewares
app.use(helmet());
app.use(compression());

// Rate Limiting (100 reqs per 15 mins per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests from this IP, please try again later." }
});
app.use("/api", limiter);

// CORS Lockdown
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",") 
  : [process.env.FRONTEND_URL || "http://localhost:5173", "http://localhost:4001"];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.startsWith('http://localhost') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// ── Dress Shop proxy ─────────────────────────────────────────────────────────
// All /api/shop/* requests are forwarded to the Dress Shop backend on port 4001.
// Since express.js strips the "/api/shop" prefix from req.url, we rewrite '^/' to
// '/api/' to prepend it, so the target receives '/api/auth/login' etc.
const SHOP_ORIGIN = process.env.SHOP_BACKEND_URL || "http://localhost:4001";

app.use(
  "/api/shop",
  createProxyMiddleware({
    target: SHOP_ORIGIN,
    changeOrigin: true,
    pathRewrite: { "^/": "/api/" },
    on: {
      error: (_err, _req, res) => {
        res.status(502).json({ error: "Dress Shop service is unavailable. Make sure it is running on port 4001." });
      },
    },
  })
);

// Proxy dress shop logo images
app.use(
  "/shop-logos",
  createProxyMiddleware({
    target: SHOP_ORIGIN,
    changeOrigin: true,
    pathRewrite: { "^/": "/logos/" },
  })
);
// ─────────────────────────────────────────────────────────────────────────────
import { tenantMiddleware } from "./middleware/tenant.js";

app.use(express.json());
app.use(tenantMiddleware);
app.use(morgan("dev"));

// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));


app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", school: "St. S.N. Public School, Pindra, Varanasi" })
);


app.use("/api/auth",         authRoutes);
app.use("/api/students",     studentsRoutes);
app.use("/api/attendance",   attendanceRoutes);
app.use("/api/fees",         feesRoutes);
app.use("/api/admissions",   admissionsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/visitors", visitorsRoutes);
app.use("/api/exams",        examsRoutes);
app.use("/api/timetable",    timetableRoutes);
app.use("/api/homework",     homeworkRoutes);
app.use("/api/notices",      noticesRoutes);
app.use("/api/library",      libraryRoutes);
app.use("/api/transport",    transportRoutes);
app.use("/api/hostel",       hostelRoutes);
app.use("/api/inventory",    inventoryRoutes);
app.use("/api/hr",           hrRoutes);
app.use("/api/certificates", certificatesRoutes);
app.use("/api/events",       eventsRoutes);
app.use("/api/messages",     messagesRoutes);
app.use("/api/admin",        adminRoutes);

// Socket.IO — bus tracking + live notifications
io.on("connection", (socket) => {
  socket.on("bus:subscribe", (busId) => socket.join(`bus:${busId}`));
  socket.on("bus:location", ({ busId, lat, lng }) => {
    io.to(`bus:${busId}`).emit("bus:location", { busId, lat, lng, at: Date.now() });
  });
});

app.use((_req, res) => res.status(404).json({ error: "Route not found." }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`\n🏫  School OS backend → http://localhost:${PORT}\n`)
);
