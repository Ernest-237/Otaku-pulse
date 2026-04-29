// server/routes/reading.js — Auto-save progression de lecture
const router = require('express').Router()
const { body, validationResult } = require('express-validator')
const { ReadingProgress, Chapter, Manga } = require('../models/index')
const { protect } = require('../middleware/auth')

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Données invalides', details: errors.array() })
  next()
}

// ── POST /api/reading/progress — auto-save ─────────
router.post('/progress', protect, [
  body('mangaId').isUUID(),
  body('chapterId').isUUID(),
  body('pageIndex').isInt({ min: 0 }),
  validate,
], async (req, res) => {
  try {
    const { mangaId, chapterId, pageIndex, isCompleted } = req.body

    const chapter = await Chapter.findByPk(chapterId)
    if (!chapter) return res.status(404).json({ error: 'Chapitre introuvable' })

    const wasCompleted = await ReadingProgress.findOne({
      where: { userId: req.user.id, mangaId },
      attributes: ['isCompleted','chapterId'],
    })

    const [progress, created] = await ReadingProgress.findOrCreate({
      where: { userId: req.user.id, mangaId },
      defaults: { chapterId, pageIndex, isCompleted: !!isCompleted, readAt: new Date() },
    })

    if (!created) {
      await progress.update({ chapterId, pageIndex, isCompleted: !!isCompleted, readAt: new Date() })
    }

    // Si c'est la 1ère fois qu'on complete CE chapitre → incrémenter readCount du manga
    const becameCompleted = isCompleted && (!wasCompleted?.isCompleted || wasCompleted?.chapterId !== chapterId)
    if (becameCompleted) {
      await Manga.increment('readCount', { where: { id: mangaId } })
    }

    res.json({ progress })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// ── GET /api/reading/progress/:mangaId ─────────────
router.get('/progress/:mangaId', protect, async (req, res) => {
  try {
    const progress = await ReadingProgress.findOne({
      where: { userId: req.user.id, mangaId: req.params.mangaId },
      include: [{ model: Chapter, as: 'chapter', attributes: ['id','chapterNumber','title','pageCount'] }],
    })
    res.json({ progress })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── DELETE /api/reading/progress/:mangaId ──────────
router.delete('/progress/:mangaId', protect, async (req, res) => {
  try {
    await ReadingProgress.destroy({ where: { userId: req.user.id, mangaId: req.params.mangaId } })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router