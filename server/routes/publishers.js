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