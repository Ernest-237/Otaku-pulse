// server/routes/follows.js — Système de followers (s'abonner à un manga)
const router = require('express').Router()
const { sequelize, MangaFollow, Manga, User } = require('../models/index')
const { protect } = require('../middleware/auth')

// ── POST /api/follows/:mangaId — suivre / ne plus suivre (toggle) ──
router.post('/:mangaId', protect, async (req, res, next) => {
  const t = await sequelize.transaction()
  try {
    const manga = await Manga.findByPk(req.params.mangaId, { transaction: t })
    if (!manga) {
      await t.rollback()
      return res.status(404).json({ error: 'Manga introuvable' })
    }

    const existing = await MangaFollow.findOne({
      where: { userId: req.user.id, mangaId: manga.id },
      transaction: t,
    })

    if (existing) {
      // Unfollow
      await existing.destroy({ transaction: t })
      await Manga.decrement('followerCount', { where: { id: manga.id }, transaction: t })
      await t.commit()
      return res.json({ following: false, message: 'Tu ne suis plus ce manga' })
    } else {
      // Follow
      await MangaFollow.create({
        userId: req.user.id,
        mangaId: manga.id,
        authorId: manga.authorId,
      }, { transaction: t })
      await Manga.increment('followerCount', { where: { id: manga.id }, transaction: t })
      await t.commit()
      return res.json({ following: true, message: 'Tu suis maintenant ce manga !' })
    }
  } catch (err) {
    await t.rollback()
    next(err)
  }
})

// ── GET /api/follows/:mangaId/status — est-ce que je suis ce manga ? ──
router.get('/:mangaId/status', protect, async (req, res, next) => {
  try {
    const exists = await MangaFollow.findOne({
      where: { userId: req.user.id, mangaId: req.params.mangaId },
    })
    res.json({ following: !!exists })
  } catch (err) { next(err) }
})

// ── GET /api/follows/my — mes mangas suivis ──
router.get('/my', protect, async (req, res, next) => {
  try {
    const follows = await MangaFollow.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [{
        model: Manga, as: 'manga',
        attributes: { exclude: ['coverImageData','bannerImageData','synopsisF','synopsisE'] },
      }],
    })
    const result = follows.map(f => {
      const j = f.toJSON()
      if (f.manga?.coverImageMime) j.manga.coverUrl = `/api/manga/${f.manga.id}/cover`
      return j
    })
    res.json({ follows: result })
  } catch (err) { next(err) }
})

module.exports = router