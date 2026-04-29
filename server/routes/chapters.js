// server/routes/chapters.js — Lecture de chapitres + gating
const router = require('express').Router()
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

// Helper : a-t-il un abonnement actif ?
async function hasActiveSubscription(userId) {
  if (!userId) return false
  const sub = await Subscription.findOne({
    where: { userId, status: 'active', expiresAt: { [Op.gt]: new Date() } },
    order: [['expiresAt','DESC']],
  })
  return !!sub
}

// Helper : ce user peut-il lire ce chapitre ?
async function canRead(user, chapter, manga, pageIndex = 0) {
  // Premier chapitre toujours accessible aux 1ères pages (teaser)
  const isFirstChapter = parseFloat(chapter.chapterNumber) === 1

  // Anonyme : 1ère page de chaque chapitre free OK, sinon login obligatoire
  if (!user) {
    if (chapter.accessTier === 'free' && pageIndex === 0) return { allowed: true, reason: 'free_first_page' }
    return { allowed: false, reason: 'login_required' }
  }

  // Admin / superadmin : tout
  if (['admin','superadmin'].includes(user.role)) return { allowed: true, reason: 'admin' }

  // Auteur du manga : tout
  if (manga.authorId === user.id) return { allowed: true, reason: 'author' }

  // Chapitre free : OK
  if (chapter.accessTier === 'free') return { allowed: true, reason: 'free_chapter' }
  // Manga free : OK
  if (manga.accessTier === 'free')   return { allowed: true, reason: 'free_manga' }

  // Premier chapitre toujours free pour les connectés (teaser)
  if (isFirstChapter) return { allowed: true, reason: 'first_chapter_teaser' }

  // Abonnement actif requis
  const hasSub = await hasActiveSubscription(user.id)
  if (hasSub) return { allowed: true, reason: 'subscription' }

  return { allowed: false, reason: 'subscription_required' }
}

// ── GET /api/chapters/by-manga/:mangaId ────────────
router.get('/by-manga/:mangaId', async (req, res) => {
  try {
    const chapters = await Chapter.findAll({
      where: { mangaId: req.params.mangaId, isPublished: true },
      attributes: ['id','chapterNumber','title','pageCount','accessTier','publishedAt','viewCount'],
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

    const access = await canRead(req.user, chapter, chapter.manga, 0)

    // Si pas le droit : retourner uniquement la 1ère page (teaser) ou un message
    const j = chapter.toJSON()
    delete j.manga.coverImageData
    delete j.manga.bannerImageData

    if (!access.allowed) {
      // Pour anonyme/sans-abo : on retourne quand même 1 page si "login_required" (teaser)
      // Pour subscription_required : on retourne 1 page teaser si premier chapitre, sinon rien
      if (access.reason === 'login_required' && chapter.accessTier === 'free' && chapter.pages.length > 0) {
        j.pages = [chapter.pages[0]]
        j.gatingMessage = 'login_required'
      } else if (access.reason === 'subscription_required') {
        j.pages = chapter.pages.slice(0, 1)
        j.gatingMessage = 'subscription_required'
      } else {
        j.pages = []
        j.gatingMessage = access.reason
      }
      j.accessGranted = false
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

    const data = { ...req.body }
    if (Array.isArray(data.pages)) data.pageCount = data.pages.length

    const chapter = await Chapter.create(data)

    // Mettre à jour le compteur du manga
    const total = await Chapter.count({ where: { mangaId: manga.id, isPublished: true } })
    await manga.update({ totalChapters: total })

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

    const updates = { ...req.body }
    if (Array.isArray(updates.pages)) updates.pageCount = updates.pages.length

    // Si publication pour la 1ère fois : set publishedAt
    if (updates.isPublished && !chapter.isPublished) updates.publishedAt = new Date()

    await chapter.update(updates)

    // Recompte chapitres publiés
    const total = await Chapter.count({ where: { mangaId: chapter.mangaId, isPublished: true } })
    await Manga.update({ totalChapters: total }, { where: { id: chapter.mangaId } })

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
    await Manga.update({ totalChapters: total }, { where: { id: chapter.mangaId } })

    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router