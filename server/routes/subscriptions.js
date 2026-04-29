// server/routes/subscriptions.js — Plans d'abonnement
const router = require('express').Router()
const { Op } = require('sequelize')
const { body, validationResult } = require('express-validator')
const { Subscription, User } = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')
const { sendSubscriptionRequest, sendSubscriptionActivated, sendSubscriptionAdminNotif } = require('../utils/mailer')

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Données invalides', details: errors.array() })
  next()
}

// Plans tarifaires fixes (FCFA)
const PLANS = {
  daily:   { amount: 200,   durationDays: 1,   labelF: 'Day Pass',     labelE: 'Day Pass' },
  weekly:  { amount: 500,   durationDays: 7,   labelF: 'Hebdomadaire', labelE: 'Weekly'   },
  monthly: { amount: 1500,  durationDays: 30,  labelF: 'Mensuel',      labelE: 'Monthly'  },
  yearly:  { amount: 10000, durationDays: 365, labelF: 'Annuel',       labelE: 'Yearly'   },
}

// ── GET /api/subscriptions/plans — liste publique ──
router.get('/plans', (req, res) => res.json({ plans: PLANS }))

// ── GET /api/subscriptions/active — mon abo actif ──
router.get('/active', protect, async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      where: {
        userId: req.user.id,
        status: 'active',
        expiresAt: { [Op.gt]: new Date() }
      },
      order: [['expiresAt','DESC']],
    })
    res.json({ subscription: sub })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── GET /api/subscriptions/my — historique ─────────
router.get('/my', protect, async (req, res) => {
  try {
    const subs = await Subscription.findAll({
      where: { userId: req.user.id },
      order: [['createdAt','DESC']],
    })
    res.json({ subscriptions: subs })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── POST /api/subscriptions/request — demander un plan ──
router.post('/request', protect, [
  body('planType').isIn(['daily','weekly','monthly','yearly']),
  body('whatsappNumber').optional().isString(),
  validate,
], async (req, res) => {
  try {
    const { planType, whatsappNumber, paymentMethod = 'manual' } = req.body
    const plan = PLANS[planType]
    if (!plan) return res.status(400).json({ error: 'Plan invalide' })

    const sub = await Subscription.create({
      userId: req.user.id,
      planType,
      amount: plan.amount,
      currency: 'XAF',
      paymentMethod,
      whatsappNumber: whatsappNumber || req.user.whatsapp || req.user.phone,
      status: 'pending',
    })

    // Emails non-bloquants
    sendSubscriptionRequest(req.user, sub, plan).catch(e => console.error('❌ Email sub:', e.message))
    sendSubscriptionAdminNotif(req.user, sub, plan).catch(e => console.error('❌ Email sub admin:', e.message))

    res.status(201).json({ subscription: sub, plan })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// ══ ADMIN ROUTES ═══════════════════════════════════════

// ── GET /api/subscriptions — toutes (admin) ────────
router.get('/', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query
    const where = {}
    if (status) where.status = status

    const subs = await Subscription.findAll({
      where,
      order: [['createdAt','DESC']],
      limit: Math.min(parseInt(limit), 200),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [{ model: User, as: 'user', attributes: ['id','pseudo','email','whatsapp'] }],
    })
    const total = await Subscription.count({ where })
    res.json({ subscriptions: subs, total })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── PATCH /api/subscriptions/:id/activate — admin ──
router.patch('/:id/activate', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const sub = await Subscription.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }],
    })
    if (!sub) return res.status(404).json({ error: 'Abonnement introuvable' })

    const plan = PLANS[sub.planType]
    if (!plan) return res.status(400).json({ error: 'Plan invalide' })

    const startsAt  = new Date()
    const expiresAt = new Date(startsAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)

    await sub.update({
      status: 'active',
      startsAt,
      expiresAt,
      paymentReference: req.body.paymentReference || sub.paymentReference,
      adminNotes: req.body.adminNotes || sub.adminNotes,
    })

    sendSubscriptionActivated(sub.user, sub, plan).catch(e => console.error('❌ Email activated:', e.message))

    res.json({ subscription: sub })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// ── PATCH /api/subscriptions/:id — admin update ────
router.patch('/:id', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const sub = await Subscription.findByPk(req.params.id)
    if (!sub) return res.status(404).json({ error: 'Abonnement introuvable' })
    await sub.update(req.body)
    res.json({ subscription: sub })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

module.exports = router