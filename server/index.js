// server/index.js — OTAKU PULSE v2
require('dotenv').config()
const express   = require('express')
const cors      = require('cors')
const helmet    = require('helmet')
const morgan    = require('morgan')
const rateLimit = require('express-rate-limit')
const path      = require('path')

const { testConnection, sequelize } = require('./config/database')
const { syncDatabase } = require('./models/index')

const app = express()

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://otaku-pulse.com',
    'http://localhost:5173',
  ],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}))
// Header CORP global — autorise le chargement d'images cross-origin
app.use((req, res, next) => {
  res.set('Cross-Origin-Resource-Policy', 'cross-origin')
  next()
})

app.use('/api/',      rateLimit({ windowMs:15*60*1000, max:300, standardHeaders:true }))
app.use('/api/auth/', rateLimit({ windowMs:15*60*1000, max:25,  standardHeaders:true }))
app.use(express.json({ limit: '20mb' }))  // 20MB pour les images base64
app.use(express.urlencoded({ extended:true, limit:'20mb' }))

// ── Routes ────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'))
app.use('/api/users',      require('./routes/users'))
app.use('/api/products',   require('./routes/products'))
app.use('/api/orders',     require('./routes/orders'))
app.use('/api/events',     require('./routes/events'))
app.use('/api/contact',    require('./routes/contact'))
app.use('/api/newsletter', require('./routes/newsletter'))
app.use('/api/admin',      require('./routes/admin'))
app.use('/api/payment',    require('./routes/payment'))
app.use('/api/blog',       require('./routes/blog'))
app.use('/api/hero',       require('./routes/hero'))        // NOUVEAU
app.use('/api/suppliers',  require('./routes/suppliers'))   // NOUVEAU
app.use('/api/upload',     require('./routes/upload'))      // NOUVEAU
// ── Routes Manga Platform ────────────────────────────
app.use('/api/manga',          require('./routes/manga'))
app.use('/api/chapters',       require('./routes/chapters'))
app.use('/api/reading',        require('./routes/reading'))
app.use('/api/library',        require('./routes/library'))
app.use('/api/subscriptions',  require('./routes/subscriptions'))
app.use('/api/publishers',     require('./routes/publishers'))
app.use('/api/comments',       require('./routes/comments'))
app.use('/api/admin/manga',    require('./routes/adminManga'))    // ← AJOUT

// Health
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected'
  try { await sequelize.authenticate(); dbStatus = 'connected' } catch (_) {}
  res.json({ status:'OK', version:'2.0.0', db:dbStatus, env:process.env.NODE_ENV })
})

// SPA fallback
if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '../dist')
  app.use(express.static(dist))
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) res.sendFile(path.join(dist, 'index.html'))
  })
}

app.use((req, res) => res.status(404).json({ error:`Route introuvable : ${req.method} ${req.path}` }))
app.use((err, req, res, next) => {
  console.error('🔥', err.message)
  if (err.name === 'SequelizeUniqueConstraintError')
    return res.status(409).json({ error: err.errors[0]?.message || 'Valeur déjà utilisée.' })
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Erreur serveur' : err.message })
})

const PORT = process.env.PORT || 4000
const start = async () => {
  await testConnection()
  await syncDatabase(false)
  app.listen(PORT, () => console.log(`🚀 Otaku Pulse API v2 — port ${PORT}`))
}
start()