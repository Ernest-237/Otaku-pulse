// server/routes/chapters.js — Lecture de chapitres + gating
const router = require('express').Router()
const { getChapterAccess } = require('../services/chapterAccess')
const { chapterPayload } = require('../utils/chapterPolicy')
const crypto = require('crypto')
const { Op } = require('sequelize')
const { body, validationResult } = require('express-validator')
const { Chapter, Manga, ChapterView, Subscription } = require('../models/index')
const { protect, optionalAuth } = require('../middleware/auth')

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Données invalides', details: errors.array() })
  next()
}

// ── GET /api/chapters/by-manga/:mangaId ────────────
router.get('/by-manga/:mangaId', optionalAuth, async (req, res) => {
  try {
    const manga = await Manga.findByPk(req.params.mangaId, { attributes: ['id','authorId','moderationStatus'] })
    if (!manga) return res.status(404).json({ error: 'Manga introuvable' })
    const owner = req.user && (manga.authorId === req.user.id || ['admin','superadmin'].includes(req.user.role))
    if (!owner && manga.moderationStatus !== 'approved') return res.status(404).json({ error: 'Manga introuvable' })
    const chapters = await Chapter.findAll({
      where: { mangaId: manga.id, ...(owner ? {} : { isPublished: true }) },
      attributes: ['id','chapterNumber','title','pageCount','accessTier','publishedAt','viewCount','coinCost','isPublished'],
      order: [['chapterNumber','ASC']],
    })
    res.json({ chapters })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── GET /api/chapters/:id — récupérer chapitre + check accès ──
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const chapter = await Chapter.findByPk(req.params.id, {
      include: [{ model: Manga, as: 'manga' }],
    })
    if (!chapter) return res.status(404).json({ error: 'Chapitre introuvable' })
    if (!chapter.isPublished && (!req.user || (chapter.manga.authorId !== req.user.id && !['admin','superadmin'].includes(req.user.role)))) {
      return res.status(404).json({ error: 'Chapitre introuvable' })
    }

    const access = await getChapterAccess(req.user, chapter, chapter.manga)
    if (access.reason === 'not_found') return res.status(404).json({ error: 'Chapitre introuvable' })

    // Un refus d'accès ne doit inclure aucune image du chapitre.
    const j = chapter.toJSON()
    delete j.manga.coverImageData
    delete j.manga.bannerImageData

    delete j.manga.bgMusicData
    if (!access.allowed) {
      j.pages = []; j.accessGranted = false; j.gatingMessage = access.reason
      return res.json({ chapter: j, access })
    }

    j.accessGranted = true
    res.json({ chapter: j, access })

    // Comptage vue (asynchrone, ne bloque pas)
    countView(chapter, req.user, req.ip).catch(e => console.error('❌ countView:', e.message))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// Comptage de vue (1 fois par user/IP par chapitre par 24h)
async function countView(chapter, user, ip) {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const ipHash = crypto.createHash('sha256').update(ip || 'unknown').digest('hex').substring(0, 32)

  const where = user
    ? { chapterId: chapter.id, userId: user.id, viewedAt: { [Op.gt]: last24h } }
    : { chapterId: chapter.id, ipHash, userId: null, viewedAt: { [Op.gt]: last24h } }

  const existing = await ChapterView.findOne({ where })
  if (existing) return

  await ChapterView.create({
    chapterId: chapter.id,
    mangaId:   chapter.mangaId,
    userId:    user?.id || null,
    ipHash,
  })
  await chapter.increment('viewCount')
  await Manga.increment('viewCount', { where: { id: chapter.mangaId } })
}

// ── POST /api/chapters — créer (auteur du manga) ──
router.post('/', protect, [
  body('mangaId').isUUID(),
  body('chapterNumber').isFloat({ min: 0 }),
  validate,
], async (req, res) => {
  try {
    const manga = await Manga.findByPk(req.body.mangaId)
    if (!manga) return res.status(404).json({ error: 'Manga introuvable' })

    const isOwner = manga.authorId === req.user.id
    const isAdmin = ['admin','superadmin'].includes(req.user.role)
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Non autorisé' })

    const data = { ...chapterPayload(req.body), mangaId: manga.id }
    if (Array.isArray(data.pages)) data.pageCount = data.pages.length

    const chapter = await Chapter.create(data)

    // Mettre à jour le compteur du manga
    const total = await Chapter.count({ where: { mangaId: manga.id, isPublished: true } })
    await manga.update({ totalChapters: total, accessTier: await Chapter.count({ where: { mangaId: manga.id, isPublished: true, accessTier: 'premium' } }) ? 'premium' : 'free' })

    res.status(201).json({ chapter })
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ error: 'Ce numéro de chapitre existe déjà pour ce manga' })
    res.status(400).json({ error: err.message })
  }
})

// ── PATCH /api/chapters/:id ────────────────────────
router.patch('/:id', protect, async (req, res) => {
  try {
    const chapter = await Chapter.findByPk(req.params.id, { include: [{ model: Manga, as: 'manga' }] })
    if (!chapter) return res.status(404).json({ error: 'Chapitre introuvable' })

    const isOwner = chapter.manga.authorId === req.user.id
    const isAdmin = ['admin','superadmin'].includes(req.user.role)
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Non autorisé' })

    const updates = chapterPayload(req.body, chapter.toJSON())

    await chapter.update(updates)

    // Recompte chapitres publiés
    const total = await Chapter.count({ where: { mangaId: chapter.mangaId, isPublished: true } })
    await Manga.update({ totalChapters: total, accessTier: await Chapter.count({ where: { mangaId: chapter.mangaId, isPublished: true, accessTier: 'premium' } }) ? 'premium' : 'free' }, { where: { id: chapter.mangaId } })

    res.json({ chapter })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// ── DELETE /api/chapters/:id ───────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const chapter = await Chapter.findByPk(req.params.id, { include: [{ model: Manga, as: 'manga' }] })
    if (!chapter) return res.status(404).json({ error: 'Chapitre introuvable' })

    const isOwner = chapter.manga.authorId === req.user.id
    const isAdmin = ['admin','superadmin'].includes(req.user.role)
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Non autorisé' })

    await chapter.destroy()
    const total = await Chapter.count({ where: { mangaId: chapter.mangaId, isPublished: true } })
    await Manga.update({ totalChapters: total, accessTier: await Chapter.count({ where: { mangaId: chapter.mangaId, isPublished: true, accessTier: 'premium' } }) ? 'premium' : 'free' }, { where: { id: chapter.mangaId } })

    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
