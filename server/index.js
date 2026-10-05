// server/index.js — OTAKU PULSE v2
require('dotenv').config()
const express   = require('express')
const cors      = require('cors')
const helmet    = require('helmet')
const morgan    = require('morgan')
const rateLimit = require('express-rate-limit')
const path      = require('path')

const { sequelize } = require('./config/database')
const { syncDatabase } = require('./models/index')

const app = express()
let dbStatus = 'connecting'

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://otaku-pulse.com',
    'https://www.otaku-pulse.com',
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
app.use(express.json({ limit: '60mb' }))  // 40 Mo d'images de chapitre + encodage base64 et métadonnées.
app.use(express.urlencoded({ extended:true, limit:'60mb' }))

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
app.use('/api/admin/manga',    require('./routes/adminManga'))    
app.use('/api/coins',          require('./routes/coins'))
app.use('/api/admin/coins',    require('./routes/adminCoins'))
app.use('/api/admin/invoices', require('./routes/adminInvoices'))
app.use('/api/follows',        require('./routes/follows'))

// ── Routes Fandom ────────────────────────────
app.use('/api/fandom', require('./routes/fandom'))
app.use('/api/anime',  require('./routes/anime'))

// Health
app.get('/api/health', (req, res) => {
  res.json({ status:'OK', version:'2.0.0', db:dbStatus, env:process.env.NODE_ENV })
})



app.use((req, res) => res.status(404).json({ error:`Route introuvable : ${req.method} ${req.path}` }))
app.use((err, req, res, next) => {
  console.error('🔥', err.message)
  if (err.name === 'SequelizeUniqueConstraintError')
    return res.status(409).json({ error: err.errors[0]?.message || 'Valeur déjà utilisée.' })
  if (err.type === 'entity.too.large' || err.status === 413)
    return res.status(413).json({ error: 'Fichiers trop volumineux au total — réduis le nombre de pages ou compresse tes images.' })
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500
  res.status(status).json({ error: status < 500 || process.env.NODE_ENV !== 'production' ? err.message : 'Erreur serveur' })
})

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`🚀 Otaku Pulse API v2 — port ${PORT}`)
})

const initialize = async () => {
  try {
    await sequelize.authenticate()
    dbStatus = 'connected'
  } catch (error) {
    dbStatus = 'disconnected'
    console.error('❌ PostgreSQL connexion échouée :', error.message)
    return
  }

  if (process.env.NODE_ENV !== 'production') {
    try {
      await syncDatabase(false)
    } catch (error) {
      console.error('❌ Synchronisation développement échouée :', error.message)
      return
    }
  }

  for (const [name, start] of [
    ['anime', () => require('./jobs/animeCron').startAnimeCron()],
    ['communauté', () => require('./jobs/communityCron').startCommunityCron()],
  ]) {
    try {
      start()
    } catch (error) {
      console.error(`❌ Démarrage du job ${name} échoué :`, error.message)
    }
  }
}

initialize().catch((error) => console.error('❌ Erreur initialisation :', error))
