// server/routes/comments.js — Commentaires manga
const router = require('express').Router()
const { body, validationResult } = require('express-validator')
const { MangaComment, Manga, User } = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Données invalides', details: errors.array() })
  next()
}

// ── GET /api/comments/manga/:mangaId ───────────────
router.get('/manga/:mangaId', async (req, res) => {
  try {
    const { limit = 30, page = 1 } = req.query
    const comments = await MangaComment.findAll({
      where: { mangaId: req.params.mangaId, isHidden: false, parentId: null },
      order: [['createdAt','DESC']],
      limit: Math.min(parseInt(limit), 100),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [{ model: User, as: 'user', attributes: ['id','pseudo','avatar'] }],
    })
    res.json({ comments })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── GET /api/comments/chapter/:chapterId ───────────
router.get('/chapter/:chapterId', async (req, res) => {
  try {
    const comments = await MangaComment.findAll({
      where: { chapterId: req.params.chapterId, isHidden: false, parentId: null },
      order: [['createdAt','DESC']],
      include: [{ model: User, as: 'user', attributes: ['id','pseudo','avatar'] }],
    })
    res.json({ comments })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── POST /api/comments — créer un commentaire ──────
router.post('/', protect, [
  body('mangaId').isUUID(),
  body('content').trim().isLength({ min: 1, max: 1000 }),
  validate,
], async (req, res) => {
  try {
    const { mangaId, chapterId, content, pageIndex, parentId } = req.body
    const manga = await Manga.findByPk(mangaId)
    if (!manga) return res.status(404).json({ error: 'Manga introuvable' })

    const comment = await MangaComment.create({
      mangaId, chapterId: chapterId || null, userId: req.user.id,
      content, pageIndex: pageIndex ?? null, parentId: parentId || null,
    })

    await manga.increment('commentCount')

    const full = await MangaComment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id','pseudo','avatar'] }],
    })
    res.status(201).json({ comment: full })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// ── DELETE /api/comments/:id ───────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const c = await MangaComment.findByPk(req.params.id)
    if (!c) return res.status(404).json({ error: 'Commentaire introuvable' })

    const isOwner = c.userId === req.user.id
    const isAdmin = ['admin','superadmin'].includes(req.user.role)
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Non autorisé' })

    await c.destroy()
    await Manga.decrement('commentCount', { where: { id: c.mangaId } })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── PATCH /api/comments/:id/hide — admin ───────────
router.patch('/:id/hide', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const c = await MangaComment.findByPk(req.params.id)
    if (!c) return res.status(404).json({ error: 'Commentaire introuvable' })
    await c.update({ isHidden: !!req.body.isHidden })
    res.json({ comment: c })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

module.exports = router