// server/routes/hero.js
const router  = require('express').Router()
const { HeroConfig } = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')
const { validateImage, versionedImage } = require('../utils/media')
function serializeHero(hero) {
  const data = hero.toJSON()
  delete data.bgImageData
  if (!data.bgImageUrl && data.bgImageMime) data.bgImageUrl = versionedImage('/api/hero/image', data.updatedAt)
  return data
}
router.get('/image', async (req, res, next) => {
  try {
    const hero = await HeroConfig.findOne({ where: { isActive: true }, order: [['updatedAt','DESC']], attributes: ['bgImageData','bgImageMime'] })
    if (!hero?.bgImageData) return res.status(404).end()
    res.set('Content-Type', hero.bgImageMime || 'image/jpeg')
    res.set('Cache-Control', 'public, max-age=86400')
    res.send(Buffer.from(hero.bgImageData, 'base64'))
  } catch (err) { next(err) }
})

// GET /api/hero — public, no-cache
router.get('/', async (req, res) => {
  try {
    let hero = await HeroConfig.findOne({ where:{ isActive:true }, order:[['updatedAt','DESC']], attributes: { exclude: ['bgImageData'] } })
    if (!hero) hero = await HeroConfig.create({})
    
    // Anti-cache headers
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.set('Vary', 'Origin')
    res.json({ hero: serializeHero(hero) })
  } catch(err) { res.status(err.status || 500).json({ error: err.message }) }
})

// PATCH /api/hero — admin
router.patch('/', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    let hero = await HeroConfig.findOne({ where:{ isActive:true } })
    if (!hero) hero = await HeroConfig.create({})
    const { bgImageData, bgImageMime, id, ...payload } = req.body
    if (payload.bgImageUrl?.startsWith('/api/hero/image')) delete payload.bgImageUrl
    else if (payload.bgImageUrl) { payload.bgImageData = null; payload.bgImageMime = null }
    await hero.update(payload)
    res.json({ hero: serializeHero(hero) })
  } catch(err) { res.status(err.status || 500).json({ error: err.message }) }
})

// POST /api/hero/upload-bg
router.post('/upload-bg', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const { imageData, imageMime } = req.body
    validateImage(imageData, imageMime)
    if (!imageData || !imageMime) return res.status(400).json({ error: 'imageData et imageMime requis' })
    let hero = await HeroConfig.findOne({ where:{ isActive:true } })
    if (!hero) hero = await HeroConfig.create({})
    await hero.update({ bgImageData: imageData, bgImageMime: imageMime, bgImageUrl: null })
    res.json({ success: true })
  } catch(err) { res.status(err.status || 500).json({ error: err.message }) }
})

module.exports = router
