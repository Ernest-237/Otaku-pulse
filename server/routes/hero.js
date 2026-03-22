// server/routes/hero.js — Gestion Hero dynamique
const router  = require('express').Router()
const { HeroConfig } = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')

// GET /api/hero — public, retourne la config active
router.get('/', async (req, res) => {
  try {
    let hero = await HeroConfig.findOne({ where:{ isActive:true }, order:[['updatedAt','DESC']] })
    if (!hero) {
      // Créer une config par défaut si inexistante
      hero = await HeroConfig.create({})
    }
    res.json({ hero })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/hero — admin seulement
router.patch('/', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    let hero = await HeroConfig.findOne({ where:{ isActive:true } })
    if (!hero) hero = await HeroConfig.create({})
    await hero.update(req.body)
    res.json({ hero })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// POST /api/hero/upload-bg — upload image de fond en base64
router.post('/upload-bg', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const { imageData, imageMime } = req.body
    if (!imageData || !imageMime) return res.status(400).json({ error: 'imageData et imageMime requis' })
    let hero = await HeroConfig.findOne({ where:{ isActive:true } })
    if (!hero) hero = await HeroConfig.create({})
    await hero.update({ bgImageData: imageData, bgImageMime: imageMime, bgImageUrl: null })
    res.json({ success: true, message: 'Image de fond mise à jour' })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

module.exports = router