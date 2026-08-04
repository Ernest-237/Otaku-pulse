// server/routes/suppliers.js — Gestion fournisseurs + boutiques partenaires en libre-service
const router  = require('express').Router()
const { Supplier, Product, User } = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')
const { Op } = require('sequelize')

/* ══════════════════════════════════════════════════════
   BOUTIQUE PARTENAIRE — libre-service
   ══════════════════════════════════════════════════════ */

// POST /api/suppliers/apply — candidature boutique partenaire
router.post('/apply', protect, async (req, res) => {
  try {
    const existing = await Supplier.findOne({ where: { userId: req.user.id } })
    if (existing && ['pending','approved'].includes(existing.status)) {
      return res.status(409).json({ error: existing.status === 'approved' ? 'Tu as déjà une boutique.' : 'Candidature déjà en attente.' })
    }

    const { name, email, phone, whatsapp, city, description, logoData, logoMime } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Nom de la marque requis.' })

    const payload = {
      userId: req.user.id, name: name.trim(), email, phone, whatsapp, city, description,
      logoData: logoData || null, logoMime: logoMime || null,
      status: 'pending', rejectedReason: null,
    }

    let supplier
    if (existing) { await existing.update(payload); supplier = existing }
    else supplier = await Supplier.create(payload)

    res.status(201).json({ supplier })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// GET /api/suppliers/my — ma boutique (candidat ou partenaire)
router.get('/my', protect, async (req, res) => {
  try {
    const supplier = await Supplier.findOne({
      where: { userId: req.user.id },
      attributes: { exclude: ['logoData'] },
    })
    const j = supplier?.toJSON() || null
    if (j?.logoMime) j.logoUrl = `/api/suppliers/${j.id}/logo`
    res.json({ supplier: j, isPartner: !!req.user.isPartner })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/suppliers/me — le partenaire édite sa propre boutique
router.patch('/me', protect, async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ where: { userId: req.user.id } })
    if (!supplier) return res.status(404).json({ error: 'Aucune boutique.' })
    if (supplier.status !== 'approved') return res.status(403).json({ error: 'Boutique pas encore validée.' })

    // Champs réservés à l'admin, jamais modifiables par le partenaire lui-même
    const { commission, bankName, bankAccount, status, isActive, userId, ...allowed } = req.body
    await supplier.update(allowed)
    const j = supplier.toJSON()
    if (j.logoMime) j.logoUrl = `/api/suppliers/${j.id}/logo`
    res.json({ supplier: j })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// PATCH /api/suppliers/:id/review — admin approuve/rejette une candidature
router.patch('/:id/review', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const { status, reason } = req.body
    if (!['approved','rejected'].includes(status)) return res.status(400).json({ error: 'Statut invalide.' })

    const supplier = await Supplier.findByPk(req.params.id)
    if (!supplier) return res.status(404).json({ error: 'Introuvable.' })

    await supplier.update({
      status,
      rejectedReason: status === 'rejected' ? (reason || 'Non précisé') : null,
    })

    if (status === 'approved' && supplier.userId) {
      await User.update({ role: 'partner', isPartner: true }, { where: { id: supplier.userId } })
    }

    res.json({ supplier })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// GET /api/suppliers — admin
router.get('/', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const { search, active } = req.query
    const where = {}
    if (active !== undefined) where.isActive = active === 'true'
    if (search) where.name = { [Op.iLike]: `%${search}%` }

    const suppliers = await Supplier.findAll({
      where,
      order: [['name','ASC']],
      attributes: { exclude:['logoData'] }, // ne pas retourner le binaire dans la liste
    })
    res.json({ suppliers })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// GET /api/suppliers/:id — admin
router.get('/:id', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const s = await Supplier.findByPk(req.params.id, {
      include:[{ model:Product, as:'products', attributes:['id','nameF','price','stock','isActive'] }]
    })
    if (!s) return res.status(404).json({ error: 'Fournisseur introuvable' })
    res.json({ supplier: s })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// POST /api/suppliers — admin
router.post('/', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const s = await Supplier.create(req.body)
    res.status(201).json({ supplier: s })
  } catch(err) { res.status(400).json({ error: err.message }) }
})

// PATCH /api/suppliers/:id — admin
router.patch('/:id', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const s = await Supplier.findByPk(req.params.id)
    if (!s) return res.status(404).json({ error: 'Fournisseur introuvable' })
    await s.update(req.body)
    res.json({ supplier: s })
  } catch(err) { res.status(400).json({ error: err.message }) }
})

// DELETE /api/suppliers/:id — soft delete
router.delete('/:id', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const s = await Supplier.findByPk(req.params.id)
    if (!s) return res.status(404).json({ error: 'Fournisseur introuvable' })
    await s.update({ isActive: false })
    res.json({ success: true })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// GET /api/suppliers/:id/logo — retourne le logo en base64 image
router.get('/:id/logo', async (req, res) => {
  try {
    const s = await Supplier.findByPk(req.params.id, { attributes:['logoData','logoMime'] })
    if (!s || !s.logoData) return res.status(404).json({ error: 'Pas de logo' })
    const buf = Buffer.from(s.logoData, 'base64')
    res.set('Content-Type', s.logoMime || 'image/jpeg')
    res.send(buf)
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// GET /api/suppliers/:id/stats — ventes par fournisseur (admin ou le partenaire lui-même)
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const { Product:Prod, Order } = require('../models/index')
    const { Op } = require('sequelize')
    const supplier = await Supplier.findByPk(req.params.id)
    if (!supplier) return res.status(404).json({ error: 'Introuvable' })
    const isAdmin = ['admin','superadmin'].includes(req.user.role)
    if (!isAdmin && supplier.userId !== req.user.id) return res.status(403).json({ error: 'Non autorisé.' })

    const products = await Prod.findAll({ where:{ supplierId: req.params.id } })
    const productIds = products.map(p => p.id)

    // Calcul des ventes depuis les commandes (items JSONB)
    const orders = await Order.findAll({
      where: { status:{ [Op.in]:['confirmed','preparing','shipped','delivered'] } }
    })

    let totalSales = 0, totalCommission = 0, unitsSold = 0
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        if (productIds.includes(item.productId)) {
          totalSales    += item.price * item.quantity
          totalCommission += item.price * item.quantity * (supplier.commission / 100)
          unitsSold     += item.quantity
        }
      })
    })

    res.json({
      supplier: supplier.name,
      productCount: products.length,
      totalSales,
      totalCommission: Math.round(totalCommission),
      unitsSold,
    })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

module.exports = router