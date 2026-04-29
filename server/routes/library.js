// server/routes/library.js — Bibliothèque utilisateur
const router = require('express').Router()
const { body, validationResult } = require('express-validator')
const { LibraryItem, Manga } = require('../models/index')
const { protect } = require('../middleware/auth')

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Données invalides', details: errors.array() })
  next()
}

// ── GET /api/library — ma bibliothèque ─────────────
router.get('/', protect, async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query
    const where = { userId: req.user.id }
    if (status) where.status = status

    const items = await LibraryItem.findAll({
      where,
      order: [['addedAt','DESC']],
      limit: Math.min(parseInt(limit), 100),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [{
        model: Manga, as: 'manga',
        attributes: { exclude: ['coverImageData','bannerImageData'] },
      }],
    })

    const result = items.map(i => {
      const j = i.toJSON()
      if (j.manga?.coverImageMime) j.manga.coverUrl = `/api/manga/${j.manga.id}/cover`
      return j
    })

    res.json({ library: result })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── POST /api/library/:mangaId — ajouter/changer ───
router.post('/:mangaId', protect, [
  body('status').optional().isIn(['reading','completed','plan_to_read','dropped','on_hold']),
  validate,
], async (req, res) => {
  try {
    const { status = 'reading' } = req.body
    const manga = await Manga.findByPk(req.params.mangaId)
    if (!manga) return res.status(404).json({ error: 'Manga introuvable' })

    const [item, created] = await LibraryItem.findOrCreate({
      where: { userId: req.user.id, mangaId: req.params.mangaId },
      defaults: { status, addedAt: new Date() },
    })
    if (!created) await item.update({ status })

    res.json({ item, created })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// ── DELETE /api/library/:mangaId ───────────────────
router.delete('/:mangaId', protect, async (req, res) => {
  try {
    await LibraryItem.destroy({ where: { userId: req.user.id, mangaId: req.params.mangaId } })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router