// server/index.js — OTAKU PULSE + PostgreSQL
require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const path      = require('path');

const { testConnection, sequelize } = require('./config/database');
const { syncDatabase }              = require('./models/index');

const app = express();

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'https://otaku-pulse.com'],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use('/api/',      rateLimit({ windowMs: 15*60*1000, max: 200, standardHeaders: true }));
app.use('/api/auth/', rateLimit({ windowMs: 15*60*1000, max: 20,  standardHeaders: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/events',     require('./routes/events'));
app.use('/api/contact',    require('./routes/contact'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/admin',      require('./routes/admin'));
app.use('/api/payment',    require('./routes/payment'));

app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try { await sequelize.authenticate(); dbStatus = 'connected'; } catch (_) {}
  res.json({ status: 'OK', version: '1.0.0', db: dbStatus, env: process.env.NODE_ENV });
});

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '../dist');
  app.use(express.static(dist));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) res.sendFile(path.join(dist, 'index.html'));
  });
}

app.use((req, res) => res.status(404).json({ error: `Route introuvable : ${req.method} ${req.path}` }));

app.use((err, req, res, next) => {
  console.error('🔥', err.message);
  if (err.name === 'SequelizeUniqueConstraintError')
    return res.status(409).json({ error: err.errors[0]?.message || 'Valeur déjà utilisée.' });
  if (err.name === 'SequelizeValidationError')
    return res.status(400).json({ error: 'Données invalides.', details: err.errors.map(e => e.message) });
  if (err.name === 'JsonWebTokenError')  return res.status(401).json({ error: 'Token invalide.' });
  if (err.name === 'TokenExpiredError')  return res.status(401).json({ error: 'Session expirée.' });
  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Erreur serveur.' : err.message,
  });
});

const PORT = process.env.PORT || 5000;
(async () => {
  await testConnection();
  await syncDatabase(false); // false = alter, true = reset complet
  app.listen(PORT, () => {
    console.log(`\n  ⚡ OTAKU PULSE — Port ${PORT} — PostgreSQL\n`);
  });
})();

module.exports = app;