// server/routes/upload.js — Upload d'images en base64
const router = require('express').Router()
const { protect, restrictTo } = require('../middleware/auth')
const { Product, Supplier, Event, HeroConfig } = require('../models/index')

const MAX_SIZE = 5 * 1024 * 1024 // 5MB en base64 ~ 6.7MB

// POST /api/upload/product/:id
router.post('/product/:id', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const { imageData, imageMime } = req.body
    if (!imageData || !imageMime) return res.status(400).json({ error: 'imageData et imageMime requis' })
    if (Buffer.byteLength(imageData, 'base64') > MAX_SIZE)
      return res.status(400).json({ error: 'Image trop grande (max 5MB)' })

    const product = await Product.findByPk(req.params.id)
    if (!product) return res.status(404).json({ error: 'Produit introuvable' })

    await product.update({ imageData, imageMime, imageUrl: null })
    res.json({ success: true, message: 'Image mise à jour' })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// GET /api/upload/product/:id/image — sert l'image du produit
router.get('/product/:id/image', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, { attributes:['imageData','imageMime','imageUrl'] })
    if (!product) return res.status(404).json({ error: 'Produit introuvable' })

    if (product.imageData) {
      const buf = Buffer.from(product.imageData, 'base64')
      res.set('Content-Type', product.imageMime || 'image/jpeg')
      res.set('Cache-Control', 'public, max-age=86400') // cache 24h
      return res.send(buf)
    }
    if (product.imageUrl) return res.redirect(product.imageUrl)
    res.status(404).json({ error: 'Pas d\'image' })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// POST /api/upload/supplier/:id
router.post('/supplier/:id', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const { imageData, imageMime } = req.body
    const supplier = await Supplier.findByPk(req.params.id)
    if (!supplier) return res.status(404).json({ error: 'Fournisseur introuvable' })
    await supplier.update({ logoData: imageData, logoMime: imageMime })
    res.json({ success: true })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// GET /api/upload/supplier/:id/logo
router.get('/supplier/:id/logo', async (req, res) => {
  try {
    const s = await Supplier.findByPk(req.params.id, { attributes:['logoData','logoMime'] })
    if (!s?.logoData) return res.status(404).json({ error: 'Pas de logo' })
    const buf = Buffer.from(s.logoData, 'base64')
    res.set('Content-Type', s.logoMime || 'image/jpeg')
    res.set('Cache-Control', 'public, max-age=86400')
    res.send(buf)
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// POST /api/upload/event/:id
router.post('/event/:id', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const { imageData, imageMime } = req.body
    const event = await Event.findByPk(req.params.id)
    if (!event) return res.status(404).json({ error: 'Événement introuvable' })
    await event.update({ imageData, imageMime, imageUrl: null })
    res.json({ success: true })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

module.exports = router