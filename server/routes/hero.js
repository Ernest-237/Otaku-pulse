// server/routes/hero.js
const router  = require('express').Router()
const { HeroConfig } = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')

// GET /api/hero — public, no-cache
router.get('/', async (req, res) => {
  try {
    let hero = await HeroConfig.findOne({ where:{ isActive:true }, order:[['updatedAt','DESC']] })
    if (!hero) hero = await HeroConfig.create({})
    
    // Anti-cache headers
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    res.json({ hero })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/hero — admin
router.patch('/', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    let hero = await HeroConfig.findOne({ where:{ isActive:true } })
    if (!hero) hero = await HeroConfig.create({})
    await hero.update(req.body)
    res.json({ hero })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// POST /api/hero/upload-bg
router.post('/upload-bg', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const { imageData, imageMime } = req.body
    if (!imageData || !imageMime) return res.status(400).json({ error: 'imageData et imageMime requis' })
    let hero = await HeroConfig.findOne({ where:{ isActive:true } })
    if (!hero) hero = await HeroConfig.create({})
    await hero.update({ bgImageData: imageData, bgImageMime: imageMime, bgImageUrl: null })
    res.json({ success: true })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

module.exports = router