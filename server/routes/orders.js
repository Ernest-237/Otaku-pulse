// server/routes/orders.js — Commandes avec suivi dynamique
const router  = require('express').Router()
const { Op }  = require('sequelize')
const { Order, Product, User } = require('../models/index')
const { protect, restrictTo }  = require('../middleware/auth')

const STATUS_LABELS = {
  pending:   { fr:'En attente',   en:'Pending' },
  confirmed: { fr:'Confirmée',    en:'Confirmed' },
  preparing: { fr:'En préparation', en:'Preparing' },
  shipped:   { fr:'Expédiée',     en:'Shipped' },
  delivered: { fr:'Livrée ✅',    en:'Delivered ✅' },
  cancelled: { fr:'Annulée',      en:'Cancelled' },
  refunded:  { fr:'Remboursée',   en:'Refunded' },
}

// Générer numéro de commande
function genOrderNumber() {
  const rand = Math.floor(10000 + Math.random() * 90000)
  return `OP-${new Date().getFullYear()}-${rand}`
}

// ── POST /api/orders — Créer commande ──────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { items, paymentMethod, whatsappNumber, quartier, city, fullAddress } = req.body

    if (!items?.length) return res.status(400).json({ error: 'Panier vide' })
    if (!whatsappNumber) return res.status(400).json({ error: 'Numéro WhatsApp requis' })
    if (!quartier) return res.status(400).json({ error: 'Quartier de livraison requis' })

    // Calculer total en vérifiant les prix en BD
    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const product = await Product.findByPk(item.productId, {
        include:[{ association:'supplier', attributes:['id','name','commission'] }]
      })
      if (!product || !product.isActive) continue
      if (product.stock < item.quantity)
        return res.status(400).json({ error: `Stock insuffisant pour ${product.nameF}` })

      const lineTotal = product.price * item.quantity
      subtotal += lineTotal

      orderItems.push({
        productId:     product.id,
        nameF:         product.nameF,
        nameE:         product.nameE || product.nameF,
        emoji:         product.emoji,
        price:         product.price,
        quantity:      item.quantity,
        lineTotal,
        supplierId:    product.supplierId || null,
        supplierName:  product.supplier?.name || null,
        isOwnProduct:  product.isOwnProduct,
        commission:    product.supplier?.commission || 0,
      })

      // Décrémenter stock
      await product.update({
        stock: product.stock - item.quantity,
        sold:  product.sold + item.quantity,
      })
    }

    const shipping = subtotal >= 15000 ? 0 : 2000
    const total    = subtotal + shipping

    const order = await Order.create({
      orderNumber:   genOrderNumber(),
      userId:        req.user.id,
      items:         orderItems,
      subtotal,
      shipping,
      total,
      paymentMethod: paymentMethod || 'mtn_money',
      whatsappNumber,
      quartier,
      city:          city || req.user.city,
      fullAddress,
      statusHistory: [{ status:'pending', date: new Date().toISOString(), note:'Commande reçue — en attente de confirmation' }]
    })

    res.status(201).json({ order })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// ── GET /api/orders/my — Commandes du user ─────────────
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      order: [['createdAt','DESC']],
    })
    res.json({ orders })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// ── GET /api/orders/:id — Détail commande ──────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const where = { id: req.params.id }
    if (req.user.role === 'user') where.userId = req.user.id // user ne voit que ses commandes

    const order = await Order.findOne({ where, include:[{ model:User, as:'user', attributes:['id','pseudo','email','phone'] }] })
    if (!order) return res.status(404).json({ error: 'Commande introuvable' })
    res.json({ order })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// ── PATCH /api/orders/:id/status — Admin met à jour statut
router.patch('/:id/status', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const { status, note } = req.body
    const order = await Order.findByPk(req.params.id, { include:[{ model:User, as:'user', attributes:['email','pseudo','whatsapp'] }] })
    if (!order) return res.status(404).json({ error: 'Commande introuvable' })

    const validStatuses = ['pending','confirmed','preparing','shipped','delivered','cancelled','refunded']
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Statut invalide' })

    const statusHistory = [
      ...(order.statusHistory || []),
      {
        status,
        date: new Date().toISOString(),
        note: note || STATUS_LABELS[status]?.fr || status,
        changedBy: req.user.pseudo,
      }
    ]

    await order.update({ status, statusHistory })

    // Mettre à jour paymentStatus si livré
    if (status === 'delivered') await order.update({ paymentStatus: 'paid' })
    if (status === 'refunded')  await order.update({ paymentStatus: 'refunded' })

    res.json({ order })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// ── POST /api/orders/notify ────────────────────────────
router.post('/notify', protect, async (req, res) => {
  try {
    const { orderId, orderNum, userEmail, userPhone, userName, total, whatsappNumber, quartier } = req.body
    console.log(`📱 NOUVELLE COMMANDE ${orderNum} — ${userName} — ${total} FCFA — WhatsApp: ${whatsappNumber} — Quartier: ${quartier}`)
    // TODO: Twilio WhatsApp + Nodemailer
    res.json({ success: true })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

module.exports = router