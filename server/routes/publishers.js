// server/routes/publishers.js — Candidatures éditeurs
const router = require('express').Router()
const { body, validationResult } = require('express-validator')
const { PublisherApplication, User } = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')
const { sendPublisherApproved, sendPublisherRejected, sendPublisherAdminNotif } = require('../utils/mailer')

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Données invalides', details: errors.array() })
  next()
}

// ── POST /api/publishers/apply — postuler ──────────
router.post('/apply', protect, [
  body('bio').trim().isLength({ min: 30, max: 2000 }),
  validate,
], async (req, res) => {
  try {
    if (req.user.role === 'publisher' || ['admin','superadmin'].includes(req.user.role)) {
      return res.status(409).json({ error: 'Vous êtes déjà éditeur.' })
    }

    const existing = await PublisherApplication.findOne({
      where: { userId: req.user.id, status: 'pending' }
    })
    if (existing) return res.status(409).json({ error: 'Vous avez déjà une candidature en attente.' })

    const app = await PublisherApplication.create({
      userId:         req.user.id,
      pseudo:         req.user.pseudo,
      realName:       req.body.realName || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
      email:          req.user.email,
      phone:          req.body.phone || req.user.phone,
      bio:            req.body.bio,
      portfolioLinks: req.body.portfolioLinks || [],
      sampleData:     req.body.sampleData,
      sampleMime:     req.body.sampleMime,
      status:         'pending',
    })

    sendPublisherAdminNotif(req.user, app).catch(e => console.error('❌ Email pub admin:', e.message))

    res.status(201).json({ application: app })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// ── GET /api/publishers/my — ma candidature ────────
router.get('/my', protect, async (req, res) => {
  try {
    const app = await PublisherApplication.findOne({
      where: { userId: req.user.id },
      order: [['createdAt','DESC']],
    })
    res.json({ application: app, isPublisher: req.user.role === 'publisher' || ['admin','superadmin'].includes(req.user.role) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── GET /api/publishers — toutes (admin) ───────────
router.get('/', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const { status, limit = 50 } = req.query
    const where = {}
    if (status) where.status = status

    const apps = await PublisherApplication.findAll({
      where,
      order: [['createdAt','DESC']],
      limit: Math.min(parseInt(limit), 200),
      include: [{ model: User, as: 'user', attributes: ['id','pseudo','email','avatar'] }],
    })
    res.json({ applications: apps })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ══════════════════════════════════════════════════════
// GET /api/publishers/dashboard — tableau de bord créateur
// ══════════════════════════════════════════════════════
router.get('/dashboard', protect, async (req, res, next) => {
  try {
    const { Manga, MangaFollow, CoinTransaction, User, sequelize } = require('../models/index')
    const { Op, fn, col } = require('sequelize')

    // Mes mangas
    const myMangas = await Manga.findAll({
      where: { authorId: req.user.id },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['coverImageData','bannerImageData','synopsisF','synopsisE'] },
    })
    const mangasWithUrl = myMangas.map(m => {
      const j = m.toJSON()
      if (m.coverImageMime) j.coverUrl = `/api/manga/${m.id}/cover`
      return j
    })

    // Stats agrégées
    const totalMangas = myMangas.length
    const approvedMangas = myMangas.filter(m => m.moderationStatus === 'approved').length
    const pendingMangas = myMangas.filter(m => m.moderationStatus === 'pending').length
    const totalChapters = myMangas.reduce((s, m) => s + (m.totalChapters || 0), 0)
    const totalViews = myMangas.reduce((s, m) => s + (m.viewCount || 0), 0)
    const totalReads = myMangas.reduce((s, m) => s + (m.readCount || 0), 0)
    const totalFollowers = myMangas.reduce((s, m) => s + (m.followerCount || 0), 0)

    // Revenus en coins (depuis User)
    const me = await User.findByPk(req.user.id, { attributes: ['coinsEarned','coinsBalance'] })

    // Revenus du mois (transactions earning)
    const month = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const monthEarnings = await CoinTransaction.sum('amount', {
      where: { userId: req.user.id, type: 'earning', createdAt: { [Op.gte]: month } },
    }) || 0

    // Classement : rang du créateur par vues totales (parmi tous les éditeurs)
    const allAuthorsViews = await Manga.findAll({
      where: { moderationStatus: 'approved' },
      attributes: ['authorId', [fn('SUM', col('viewCount')), 'totalViews']],
      group: ['authorId'],
      order: [[fn('SUM', col('viewCount')), 'DESC']],
      raw: true,
    })
    const myRank = allAuthorsViews.findIndex(a => a.authorId === req.user.id) + 1
    const totalCreators = allAuthorsViews.length

    // Top mangas (les miens, par vues)
    const topMangas = [...mangasWithUrl]
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 5)

    res.json({
      mangas: mangasWithUrl,
      stats: {
        totalMangas, approvedMangas, pendingMangas,
        totalChapters, totalViews, totalReads, totalFollowers,
        coinsEarned: me?.coinsEarned || 0,
        coinsBalance: me?.coinsBalance || 0,
        monthEarnings,
        rank: myRank || null,
        totalCreators,
      },
      topMangas,
    })
  } catch (err) { next(err) }
})

// ── PATCH /api/publishers/:id/review — admin ───────
router.patch('/:id/review', protect, restrictTo('admin','superadmin'), [
  body('status').isIn(['approved','rejected']),
  validate,
], async (req, res) => {
  try {
    const app = await PublisherApplication.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }]
    })
    if (!app) return res.status(404).json({ error: 'Candidature introuvable' })

    await app.update({
      status: req.body.status,
      adminNotes: req.body.adminNotes || null,
      reviewedAt: new Date(),
      reviewedBy: req.user.id,
    })

    if (req.body.status === 'approved') {
      // Promouvoir le user
      await app.user.update({
        role: 'publisher',
        isPublisher: true,
        publisherInfo: {
          bio: app.bio,
          portfolioLinks: app.portfolioLinks,
          validatedAt: new Date().toISOString(),
        },
      })
      sendPublisherApproved(app.user).catch(e => console.error('❌ Email approved:', e.message))
    } else {
      sendPublisherRejected(app.user, req.body.adminNotes).catch(e => console.error('❌ Email rejected:', e.message))
    }

    res.json({ application: app })
  } catch (err) { res.status(400).json({ error: err.message }) }
})


module.exports = router