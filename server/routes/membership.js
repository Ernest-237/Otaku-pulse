// server/routes/membership.js
const router = require('express').Router()
const { MembershipRequest, User } = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')
const {
  sendMembershipConfirmation,
  sendMembershipNotifAdmin,
  sendMembershipActivated,
} = require('../utils/mailer')

// POST /api/membership/request
router.post('/request', protect, async (req, res) => {
  try {
    const { plan, nom, email, phone, ville, message } = req.body
    if (!plan || !nom || !email || !phone)
      return res.status(400).json({ error: 'Champs obligatoires manquants' })

    const existing = await MembershipRequest.findOne({
      where: { userId: req.user.id, status: ['pending','active'] }
    })
    if (existing)
      return res.status(400).json({ error: "Tu as déjà une demande d'adhésion en cours ou active." })

    const request = await MembershipRequest.create({
      userId: req.user.id, plan, nom, email,
      phone, ville: ville || 'Yaoundé', message: message || '', status: 'pending',
    })

    // Emails non bloquants
    Promise.all([
      sendMembershipConfirmation(request).catch(e => console.error('❌ Email membre:', e.message)),
      sendMembershipNotifAdmin(request).catch(e => console.error('❌ Email admin:', e.message)),
    ])

    res.status(201).json({ request, message: 'Demande envoyée ! Nous vous contactons sous 24h.' })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// GET /api/membership/my
router.get('/my', protect, async (req, res) => {
  try {
    const membership = await MembershipRequest.findOne({
      where: { userId: req.user.id },
      order: [['createdAt','DESC']],
    })
    res.json({ membership: membership?.toJSON() || null })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// ── ADMIN ──
router.use(protect, restrictTo('admin','superadmin'))

// GET /api/membership
router.get('/', async (req, res) => {
  try {
    const { status, page=1, limit=50 } = req.query
    const where = {}
    if (status && status !== 'all') where.status = status
    const { rows, count } = await MembershipRequest.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id','pseudo','email','phone','avatar'] }],
      order: [['createdAt','DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page)-1)*parseInt(limit),
    })
    res.json({ requests: rows.map(r => r.toJSON()), total: count })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/membership/:id
router.patch('/:id', async (req, res) => {
  try {
    const m = await MembershipRequest.findByPk(req.params.id)
    if (!m) return res.status(404).json({ error: 'Demande introuvable' })

    const { status, adminNotes, cardId, expiresAt } = req.body
    const update = {}
    if (status     !== undefined) update.status     = status
    if (adminNotes !== undefined) update.adminNotes = adminNotes
    if (cardId)                   update.cardId     = cardId
    if (expiresAt)                update.expiresAt  = expiresAt

    // Génération auto ID carte si activation
    if (status === 'active' && !update.cardId) {
      update.cardId    = `OP-${Date.now().toString(36).toUpperCase()}`
      update.expiresAt = update.expiresAt || new Date(Date.now() + 365*24*60*60*1000)
    }

    await m.update(update)

    // Sync User
    if (status === 'active') {
      await User.update(
        { membershipPlan: m.plan, membershipStatus: 'active',
          membershipExpiry: update.expiresAt || m.expiresAt,
          membershipCardId: update.cardId || m.cardId },
        { where: { id: m.userId } }
      )
      // Email d'activation au membre
      sendMembershipActivated({ ...m.toJSON(), ...update })
        .catch(e => console.error('❌ Email activation:', e.message))
    }
    if (['cancelled','expired'].includes(status)) {
      await User.update(
        { membershipPlan: null, membershipStatus: null, membershipExpiry: null, membershipCardId: null },
        { where: { id: m.userId } }
      )
    }

    res.json({ request: m.toJSON() })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

module.exports = router