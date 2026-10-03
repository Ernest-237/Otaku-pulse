// server/routes/orders.js — Commandes avec emails + WhatsApp
const router  = require('express').Router()
const { Op }  = require('sequelize')
const models = require('../models/index')
const { Order, Product, User } = models
const { createCheckout, normalizeOrderItems } = require('../services/checkout')
const { protect, restrictTo }  = require('../middleware/auth')
const {
  sendOrderConfirmation,
  sendOrderNotifAdmin,
  sendOrderStatusUpdate,
} = require('../utils/mailer')

// Numéro de commande unique par lot (même checkout = même numéro)
function genOrderNumber() {
  const rand = Math.floor(10000 + Math.random() * 90000)
  return `OP-${new Date().getFullYear()}-${rand}`
}

// Notif WhatsApp via lien wa.me (no Twilio needed)
function buildWhatsAppMessage(order, user) {
  const items = (order.items || []).map(i => `• ${i.emoji || ''} ${i.nameF} ×${i.quantity} — ${i.lineTotal?.toLocaleString()} FCFA`).join('\n')
  return encodeURIComponent(
    `🎌 *OTAKU PULSE — Nouvelle commande*\n\n` +
    `📦 *N° ${order.orderNumber}*\n` +
    `👤 ${user.pseudo} (${user.email})\n` +
    `📱 ${order.whatsappNumber}\n` +
    `📍 ${order.quartier}, ${order.city}\n\n` +
    `*Articles:*\n${items}\n\n` +
    `💰 *Total: ${order.total?.toLocaleString()} FCFA*\n` +
    `💳 Paiement: ${order.paymentMethod}\n\n` +
    `Gérer: https://otaku-pulse.com/admin`
  )
}

router.post('/quote', protect, async (req, res, next) => {
  try {
    const items = normalizeOrderItems(req.body.items)
    const products = await Product.findAll({ where: { id: items.map(i => i.id) }, attributes: { exclude: ['imageData'] } })
    const lines = items.map(item => {
      const product = products.find(p => p.id === item.id)
      return { id: item.id, name: product?.nameF || 'Article indisponible', price: Number(product?.price || 0), qty: item.quantity, stock: product?.isActive ? product.stock : 0, emoji: product?.emoji, imageUrl: product?.imageUrl || (product?.imageMime ? `/api/upload/product/${product.id}/image?v=${new Date(product.updatedAt).getTime()}` : '') }
    })
    res.json({ items: lines })
  } catch (err) { next(err) }
})

// ── POST /api/orders — Créer une commande (lot = 1 seul orderNumber) ──
router.post('/', protect, async (req, res) => {
  try {
    const { order, repeated } = await createCheckout(models, req.user, req.body)
    if (repeated) return res.json({ order, message: 'Commande déjà enregistrée.' })

    // Charger le user pour les emails
    const user = req.user

    // ── Emails non bloquants ──
    Promise.all([
      sendOrderConfirmation(order, user)
        .then(() => console.log(`✅ Email commande → ${user.email}`))
        .catch(e  => console.error('❌ Email client commande:', e.message)),
      sendOrderNotifAdmin(order, user)
        .then(() => console.log('✅ Email admin commande'))
        .catch(e  => console.error('❌ Email admin commande:', e.message)),
    ])

    // ── Lien WhatsApp admin (log pour copier/coller) ──
    const waLink = `https://wa.me/237670633670?text=${buildWhatsAppMessage(order, user)}`
    console.log(`📱 WhatsApp admin: ${waLink}`)

    res.status(201).json({
      order,
      whatsappAdminLink: waLink,
      message: 'Commande créée avec succès !'
    })
  } catch(err) {
    console.error('Order creation error:', err)
    res.status(err.status || 500).json({ error: err.message })
  }
})

// ── GET /api/orders/my ──
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      order: [['createdAt','DESC']],
    })
    res.json({ orders })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// ── GET /api/orders/:id ──
router.get('/:id', protect, async (req, res) => {
  try {
    const where = { id: req.params.id }
    if (!['admin','superadmin'].includes(req.user.role)) where.userId = req.user.id
    const order = await Order.findOne({
      where,
      include: [{ model: User, as: 'user', attributes: ['id','pseudo','email','phone'] }]
    })
    if (!order) return res.status(404).json({ error: 'Commande introuvable' })
    res.json({ order })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// ── PATCH /api/orders/:id/status — Admin met à jour le statut ──
router.patch('/:id/status', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const { status, note } = req.body
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['email','pseudo','phone','whatsapp'] }]
    })
    if (!order) return res.status(404).json({ error: 'Commande introuvable' })

    const validStatuses = ['pending','confirmed','preparing','shipped','delivered','cancelled','refunded']
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: 'Statut invalide' })

    const statusMessages = {
      confirmed: 'Votre commande a été confirmée ! Nous la préparons.',
      preparing: 'Votre commande est en cours de préparation.',
      shipped:   'Votre commande est en route ! 🚚',
      delivered: 'Votre commande a été livrée. Merci pour votre confiance ! 🎌',
      cancelled: 'Votre commande a été annulée.',
      refunded:  'Votre commande a été remboursée.',
    }

    const history = [...(order.statusHistory || []), {
      status,
      date: new Date().toISOString(),
      note: note || statusMessages[status] || `Statut mis à jour : ${status}`,
    }]

    await order.update({ status, statusHistory: history })

    // Email mise à jour statut au client
    if (order.user?.email && ['confirmed','preparing','shipped','delivered'].includes(status)) {
      sendOrderStatusUpdate(order, order.user, status, note)
        .then(() => console.log(`✅ Email statut ${status} → ${order.user.email}`))
        .catch(e  => console.error('❌ Email statut:', e.message))
    }

    res.json({ order })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// ── GET /api/orders — Admin liste toutes les commandes ──
router.get('/', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query
    const where = {}
    if (status) where.status = status
    const { rows: orders, count } = await Order.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['pseudo','email','phone'] }],
      order: [['createdAt','DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page)-1) * parseInt(limit),
    })
    res.json({ orders: orders.map(o => o.toJSON()), total: count })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
