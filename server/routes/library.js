// server/routes/library.js — Bibliothèque utilisateur
const router = require('express').Router()
const { body, validationResult } = require('express-validator')
const { Op, fn, col } = require('sequelize')
const { LibraryItem, Manga, User, ReadingProgress, Chapter } = require('../models/index')
const { protect } = require('../middleware/auth')

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Données invalides', details: errors.array() })
  next()
}

// ══════════════════════════════════════════════════════
// GET /api/library/counts — compteurs par status (pour les tabs)
// ⚠️ Doit être AVANT GET / pour éviter conflit de routing
// ══════════════════════════════════════════════════════
router.get('/counts', protect, async (req, res, next) => {
  try {
    const counts = await LibraryItem.findAll({
      where: { userId: req.user.id },
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    })
    const result = {}
    counts.forEach(c => { result[c.status] = parseInt(c.count) })
    res.json({ counts: result })
  } catch (err) { next(err) }
})

// ══════════════════════════════════════════════════════
// GET /api/library — ma bibliothèque (avec progress + auteur)
// ══════════════════════════════════════════════════════
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, limit = 200, page = 1 } = req.query
    const where = { userId: req.user.id }
    if (status) where.status = status

    const items = await LibraryItem.findAll({
      where,
      order: [['updatedAt', 'DESC']],
      limit: Math.min(parseInt(limit), 200),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [{
        model: Manga,
        as: 'manga',
        attributes: { exclude: ['coverImageData','bannerImageData'] },
        include: [{ model: User, as: 'author', attributes: ['pseudo'] }],
      }],
    })

    // Attach reading progress + cover URL
    const enriched = await Promise.all(items.map(async it => {
      const j = it.toJSON()
      if (it.manga?.coverImageMime) {
        j.manga.coverUrl = `/api/manga/${it.manga.id}/cover`
      }
      // Latest progress on this manga
      const progress = await ReadingProgress.findOne({
        where: { userId: req.user.id, mangaId: it.mangaId },
        include: [{ model: Chapter, as: 'chapter', attributes: ['id','chapterNumber','pageCount'] }],
      })
      if (progress) j.progress = progress.toJSON()
      return j
    }))

    // ✅ Compatibilité ancienne API (renvoie aussi `library` pour l'ancien front)
    res.json({ items: enriched, library: enriched })
  } catch (err) { next(err) }
})

// ══════════════════════════════════════════════════════
// POST /api/library/:mangaId — ajouter / changer status
// ══════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════
// DELETE /api/library/:mangaId — retirer de la bibliothèque
// ══════════════════════════════════════════════════════
router.delete('/:mangaId', protect, async (req, res) => {
  try {
    await LibraryItem.destroy({ where: { userId: req.user.id, mangaId: req.params.mangaId } })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router