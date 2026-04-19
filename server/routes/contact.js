// server/routes/contact.js
const express = require('express')
const { body, validationResult } = require('express-validator')
const { Contact } = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')
const {
  sendReservationConfirmation,
  sendReservationNotifAdmin,
} = require('../utils/mailer')

const router = express.Router()

const validate = (req, res, next) => {
  const errs = validationResult(req)
  if (!errs.isEmpty()) return res.status(400).json({ error: 'Données invalides', details: errs.array() })
  next()
}

// POST /api/contact — Réservation événement
router.post('/', [
  body('nom').trim().notEmpty(),
  body('prenom').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty(),
  body('theme').notEmpty(),
  body('guests').isInt({ min: 1 }),
  body('date').isISO8601(),
  body('ville').notEmpty(),
  validate,
], async (req, res, next) => {
  try {
    // Pack optionnel (réservation peut venir de la page Reservation ou du formulaire contact)
    const pack = req.body.pack || 'custom'
    const contact = await Contact.create({
      ...req.body,
      pack,
      date: new Date(req.body.date),
      status: 'new',
    })

    // ── Envoi des emails (non bloquant) ──
    Promise.all([
      sendReservationConfirmation(contact).catch(err =>
        console.error('❌ Email client échoué:', err.message)
      ),
      sendReservationNotifAdmin(contact).catch(err =>
        console.error('❌ Email admin échoué:', err.message)
      ),
    ])

    console.log(`📬 Réservation : ${contact.prenom} ${contact.nom} — Pack ${pack}`)
    res.status(201).json({
      message: 'Demande reçue ! Notre équipe vous contacte sous 24h.',
      id: contact.id,
    })
  } catch (err) { next(err) }
})

// GET /api/contact — admin
router.get('/', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const { status, pack, page = 1, limit = 50 } = req.query
    const where = {}
    if (status) where.status = status
    if (pack)   where.pack   = pack
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const { rows: contacts, count: total } = await Contact.findAndCountAll({
      where, order: [['createdAt','DESC']], limit: parseInt(limit), offset,
    })
    res.json({ contacts, total, page: parseInt(page) })
  } catch (err) { next(err) }
})

// PATCH /api/contact/:id/status — admin
router.patch('/:id/status', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const contact = await Contact.findByPk(req.params.id)
    if (!contact) return res.status(404).json({ error: 'Demande introuvable.' })
    await contact.update({ status: req.body.status, adminNotes: req.body.adminNotes })
    res.json({ contact })
  } catch (err) { next(err) }
})

// Alias PATCH /api/contact/:id (pour compatibilité admin)
router.patch('/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const contact = await Contact.findByPk(req.params.id)
    if (!contact) return res.status(404).json({ error: 'Demande introuvable.' })
    const { status, adminNotes } = req.body
    const update = {}
    if (status !== undefined)     update.status     = status
    if (adminNotes !== undefined) update.adminNotes = adminNotes
    await contact.update(update)
    res.json({ contact })
  } catch (err) { next(err) }
})

module.exports = router