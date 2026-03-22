// server/routes/suppliers.js — Gestion fournisseurs
const router  = require('express').Router()
const { Supplier, Product } = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')
const { Op } = require('sequelize')

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

// GET /api/suppliers/:id/stats — ventes par fournisseur
router.get('/:id/stats', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const { Product:Prod, Order } = require('../models/index')
    const { Op } = require('sequelize')
    const supplier = await Supplier.findByPk(req.params.id)
    if (!supplier) return res.status(404).json({ error: 'Introuvable' })

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