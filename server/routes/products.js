// server/routes/products.js — Produits avec fournisseurs + images BD
const router  = require('express').Router()
const { Op }  = require('sequelize')
const { Product, Supplier } = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')

const ALL_CATS = ['posters','stickers','accessoires','kits','manga','livre','dessin','nutrition','echange','jeux']

// ── GET /api/products — public ─────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 50, page = 1, featured } = req.query
    const where = { isActive: true }
    if (category && category !== 'all') where.category = category
    if (featured === 'true') where.isFeatured = true
    if (search) where[Op.or] = [
      { nameF:{ [Op.iLike]:`%${search}%` } },
      { nameE:{ [Op.iLike]:`%${search}%` } },
    ]

    const products = await Product.findAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page)-1) * parseInt(limit),
      order: [['isFeatured','DESC'],['createdAt','DESC']],
      // Exclure imageData pour alléger la réponse liste
      attributes: { exclude: ['imageData'] },
      include:[{
        model: Supplier,
        as: 'supplier',
        attributes: ['id','name'],
        required: false,
      }]
    })

    // Ajouter URL image servie par l'API si imageData existe
    const productsWithImageUrl = await Promise.all(products.map(async p => {
      const hasImageData = await Product.count({ where:{ id:p.id, imageData:{ [Op.ne]:null } } })
      const pJson = p.toJSON()
      if (hasImageData) pJson.imageUrl = `/api/upload/product/${p.id}/image`
      return pJson
    }))

    const total = await Product.count({ where })
    res.json({ products: productsWithImageUrl, total, page: parseInt(page) })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// ── GET /api/products/:slug ────────────────────────────
router.get('/:slug', async (req, res) => {
  try {
    const p = await Product.findOne({
      where: { slug: req.params.slug, isActive: true },
      attributes: { exclude: ['imageData'] },
      include:[{ model:Supplier, as:'supplier', attributes:['id','name','logoMime'] }]
    })
    if (!p) return res.status(404).json({ error: 'Produit introuvable' })
    const pJson = p.toJSON()
    if (p.imageMime) pJson.imageUrl = `/api/upload/product/${p.id}/image`
    res.json({ product: pJson })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// ── POST /api/products — admin ─────────────────────────
router.post('/', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    if (!ALL_CATS.includes(req.body.category))
      return res.status(400).json({ error: `Catégorie invalide. Valides: ${ALL_CATS.join(', ')}` })
    const product = await Product.create(req.body)
    res.status(201).json({ product })
  } catch(err) {
    if (err.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ error: 'Ce slug existe déjà.' })
    res.status(400).json({ error: err.message })
  }
})

// ── PATCH /api/products/:id — admin ───────────────────
router.patch('/:id', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id)
    if (!product) return res.status(404).json({ error: 'Produit introuvable' })
    if (req.body.category && !ALL_CATS.includes(req.body.category))
      return res.status(400).json({ error: 'Catégorie invalide' })
    await product.update(req.body)
    const pJson = product.toJSON()
    if (product.imageMime) pJson.imageUrl = `/api/upload/product/${product.id}/image`
    res.json({ product: pJson })
  } catch(err) { res.status(400).json({ error: err.message }) }
})

// ── DELETE /api/products/:id — admin ──────────────────
router.delete('/:id', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id)
    if (!product) return res.status(404).json({ error: 'Produit introuvable' })
    await product.update({ isActive: false })
    res.json({ success: true })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

module.exports = router