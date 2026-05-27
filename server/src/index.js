import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { testConnection } from './config/db.js';

import authRoutes    from './routes/auth.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import alertsRoutes  from './routes/alerts.routes.js';

import { errorHandler } from './middleware/error.middleware.js';

const app  = express();
const PORT = process.env.PORT || 5000;

/* ─── Middleware ─────────────────────────────────── */
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ─── Routes ──────────────────────────────────────── */
app.use('/api/auth',      authRoutes);
app.use('/api/invoices',  invoiceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/alerts',    alertsRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

/* ─── Error handler (must be last) ───────────────── */
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  if (!process.env.DATABASE_URL) {
    console.warn(`⚠️  WARNING: DATABASE_URL is not set in .env — DB endpoints will fail.`);
  } else {
    try {
      await testConnection();
    } catch (err) {
      console.error('❌ Could not connect to Supabase:', err.message);
      console.error('   Check your DATABASE_URL and SSL settings in server/.env');
    }
  }
});
