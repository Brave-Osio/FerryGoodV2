// server.js — Ferry Good Express API Server
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedules');
const customerRoutes = require('./routes/customers');

const app = express();
const PORT = process.env.PORT || 4000;

// ============================================================
// Security middleware
// ============================================================
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// ============================================================
// Body parsing
// ============================================================
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ============================================================
// Routes
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/customers', customerRoutes);

// ============================================================
// Health check
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'Ferry Good API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================================
// 404 handler
// ============================================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ============================================================
// Global error handler
// ============================================================
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ============================================================
// Start
// ============================================================
app.listen(PORT, () => {
  console.log(`
  ⛴️  Ferry Good API Server
  ─────────────────────────────────────
  🚀 Running at http://localhost:${PORT}
  📊 Health: http://localhost:${PORT}/api/health
  🗄️  DB: ${process.env.DB_PATH || 'C:\\FerryGood\\database\\FerryGood.accdb'}
  🌍 CORS: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}
  ─────────────────────────────────────
  `);
});

module.exports = app;