// server/routes/contact.js — Validation assouplie
const express = require('express')
const { Contact } = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')
const {
  sendReservationConfirmation,
  sendReservationNotifAdmin,
} = require('../utils/mailer')

const router = express.Router()

// POST /api/contact — Réservation événement
router.post('/', async (req, res, next) => {
  try {
    const {
      nom, prenom, email, phone, theme,
      guests, date, ville, pack, quartier,
      message, source, lang, whatsapp,
    } = req.body

    // Validation manuelle souple
    const errors = []
    if (!nom?.trim())    errors.push('nom requis')
    if (!prenom?.trim()) errors.push('prenom requis')
    if (!email?.includes('@')) errors.push('email invalide')
    if (!phone?.trim()) errors.push('téléphone requis')

    if (errors.length > 0) {
      return res.status(422).json({ error: 'Données invalides', details: errors })
    }

    // Conversion sécurisée des types
    const guestsInt = parseInt(guests) || 1
    let dateObj = null
    if (date) {
      dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) dateObj = new Date()
    } else {
      dateObj = new Date()
    }

    const contact = await Contact.create({
      nom:      nom.trim(),
      prenom:   prenom.trim(),
      email:    email.toLowerCase().trim(),
      phone:    phone.trim(),
      whatsapp: whatsapp || phone,
      theme:    theme || 'Non précisé',
      guests:   guestsInt,
      date:     dateObj,
      ville:    ville || 'Non précisée',
      quartier: quartier || '',
      pack:     pack || 'custom',
      message:  message || '',
      source:   source || 'web',
      status:   'new',
    })

    // Envoi emails — non bloquant (n'empêche pas la réponse)
    Promise.all([
      sendReservationConfirmation(contact)
        .then(() => console.log(`✅ Email confirmation → ${contact.email}`))
        .catch(err => console.error('❌ Email client:', err.message)),
      sendReservationNotifAdmin(contact)
        .then(() => console.log('✅ Email admin envoyé'))
        .catch(err => console.error('❌ Email admin:', err.message)),
    ])

    console.log(`📬 Réservation créée : ${contact.prenom} ${contact.nom} — Pack ${pack}`)
    res.status(201).json({
      message: 'Demande reçue ! Notre équipe vous contacte sous 24h.',
      id: contact.id,
    })
  } catch (err) {
    console.error('Contact route error:', err)
    next(err)
  }
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

// PATCH /api/contact/:id — admin (statut + notes)
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

// Alias ancienne route
router.patch('/:id/status', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const contact = await Contact.findByPk(req.params.id)
    if (!contact) return res.status(404).json({ error: 'Demande introuvable.' })
    await contact.update({ status: req.body.status, adminNotes: req.body.adminNotes })
    res.json({ contact })
  } catch (err) { next(err) }
})

module.exports = router