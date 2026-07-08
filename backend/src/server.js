import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import billRoutes from './routes/bills.js';
import customerRoutes from './routes/customers.js';
import supplierRoutes from './routes/suppliers.js';
import reportRoutes from './routes/reports.js';
import searchRoutes from './routes/search.js';
import adminRoutes from './routes/admin.js';
import returnRoutes from './routes/returns.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/logos', express.static(path.join(process.cwd(), 'public', 'logos')));

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/returns', returnRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Nightly automatic backup ---
function runBackup() {
  try {
    const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'shop.db');
    const backupDir = path.join(process.cwd(), 'data', 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 10);
    const dest = path.join(backupDir, `shop-${stamp}.db`);
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, dest);
      console.log(`[backup] Saved ${dest}`);
    }
  } catch (err) {
    console.error('[backup] Failed:', err.message);
  }
}

function scheduleNightlyBackup() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(2, 0, 0, 0); // 2 AM
  if (next <= now) next.setDate(next.getDate() + 1);
  const msUntil = next - now;
  setTimeout(() => {
    runBackup();
    setInterval(runBackup, 24 * 60 * 60 * 1000);
  }, msUntil);
}

scheduleNightlyBackup();

app.listen(PORT, () => {
  console.log(`Dress Shop API running on http://localhost:${PORT}`);
});
