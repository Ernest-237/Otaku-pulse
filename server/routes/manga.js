// server/routes/manga.js — Catalogue manga + détail
const router = require('express').Router()
const { Op } = require('sequelize')
const { body, validationResult } = require('express-validator')
const { Manga, Chapter, User, MangaRating, ReadingProgress, LibraryItem } = require('../models/index')
const { protect, optionalAuth, restrictTo } = require('../middleware/auth')

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Données invalides', details: errors.array() })
  next()
}

const slugify = (str) => str.toLowerCase().trim()
  .replace(/[àáâãäå]/g,'a').replace(/[èéêë]/g,'e').replace(/[ìíîï]/g,'i')
  .replace(/[òóôõö]/g,'o').replace(/[ùúûü]/g,'u').replace(/[^a-z0-9]+/g,'-')
  .replace(/^-+|-+$/g,'').substring(0,100)

// ── GET /api/manga — public catalogue ──────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { genre, status, language, accessTier, search, sort = 'recent', limit = 24, page = 1, featured } = req.query

    const where = { moderationStatus: 'approved' }
    if (genre)       where.genres   = { [Op.contains]: [genre] }
    if (status)      where.status   = status
    if (language)    where.language = language
    if (accessTier)  where.accessTier = accessTier
    if (featured === 'true') where.isFeatured = true
    if (search) where[Op.or] = [
      { titleF:    { [Op.iLike]: `%${search}%` } },
      { titleE:    { [Op.iLike]: `%${search}%` } },
      { authorName:{ [Op.iLike]: `%${search}%` } },
    ]

    const orderMap = {
      recent:    [['publishedAt','DESC NULLS LAST'],['createdAt','DESC']],
      popular:   [['viewCount','DESC']],
      rating:    [['averageRating','DESC'],['ratingCount','DESC']],
      alphabet:  [['titleF','ASC']],
    }
    // Note: PostgreSQL accepte 'DESC NULLS LAST' mais Sequelize via array uniquement ['col','DESC']
    const order = sort === 'recent'
      ? [['publishedAt','DESC'],['createdAt','DESC']]
      : (orderMap[sort] || orderMap.recent)

    const mangas = await Manga.findAll({
      where, order,
      limit: Math.min(parseInt(limit), 100),
      offset: (parseInt(page) - 1) * parseInt(limit),
      attributes: { exclude: ['coverImageData','bannerImageData'] },
      include: [{ model: User, as: 'author', attributes: ['id','pseudo'] }],
    })
    const total = await Manga.count({ where })

    // Ajouter URL images
    const result = mangas.map(m => {
      const j = m.toJSON()
      if (m.coverImageMime)  j.coverUrl  = `/api/manga/${m.id}/cover`
      if (m.bannerImageMime) j.bannerUrl = `/api/manga/${m.id}/banner`
      return j
    })

    res.json({ mangas: result, total, page: parseInt(page) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── GET /api/manga/continue-reading — user en cours ─
router.get('/continue-reading', protect, async (req, res) => {
  try {
    const progress = await ReadingProgress.findAll({
      where: { userId: req.user.id, isCompleted: false },
      order: [['readAt','DESC']],
      limit: 12,
      include: [
        {
          model: Manga, as: 'manga',
          where: { moderationStatus: 'approved' },
          attributes: { exclude: ['coverImageData','bannerImageData','synopsisF','synopsisE'] },
        },
        { model: Chapter, as: 'chapter', attributes: ['id','chapterNumber','title','pageCount'] },
      ],
    })
    const result = progress.map(p => {
      const j = p.toJSON()
      if (j.manga?.coverImageMime) j.manga.coverUrl = `/api/manga/${j.manga.id}/cover`
      return j
    })
    res.json({ progress: result })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── GET /api/manga/:slug — détail public ───────────
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const m = await Manga.findOne({
      where: { slug: req.params.slug, moderationStatus: 'approved' },
      attributes: { exclude: ['coverImageData','bannerImageData'] },
      include: [{ model: User, as: 'author', attributes: ['id','pseudo','avatar','bio','publisherInfo'] }],
    })
    if (!m) return res.status(404).json({ error: 'Manga introuvable' })

    const chapters = await Chapter.findAll({
      where: { mangaId: m.id, isPublished: true },
      attributes: ['id','chapterNumber','title','pageCount','accessTier','publishedAt','viewCount'],
      order: [['chapterNumber','ASC']],
    })

    // Reading progress du user si connecté
    let progress = null
    let inLibrary = null
    if (req.user) {
      progress  = await ReadingProgress.findOne({ where: { userId: req.user.id, mangaId: m.id } })
      inLibrary = await LibraryItem.findOne({ where: { userId: req.user.id, mangaId: m.id } })
    }

    const j = m.toJSON()
    if (m.coverImageMime)  j.coverUrl  = `/api/manga/${m.id}/cover`
    if (m.bannerImageMime) j.bannerUrl = `/api/manga/${m.id}/banner`

    res.json({ manga: j, chapters, progress, inLibrary })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── GET /api/manga/:id/cover — sert l'image ────────
router.get('/:id/cover', async (req, res) => {
  try {
    const m = await Manga.findByPk(req.params.id, { attributes: ['coverImageData','coverImageMime'] })
    if (!m || !m.coverImageData) return res.status(404).end()
    res.set('Content-Type', m.coverImageMime || 'image/jpeg')
    res.set('Cache-Control', 'public, max-age=86400')
    res.send(Buffer.from(m.coverImageData, 'base64'))
  } catch { res.status(500).end() }
})

router.get('/:id/banner', async (req, res) => {
  try {
    const m = await Manga.findByPk(req.params.id, { attributes: ['bannerImageData','bannerImageMime'] })
    if (!m || !m.bannerImageData) return res.status(404).end()
    res.set('Content-Type', m.bannerImageMime || 'image/jpeg')
    res.set('Cache-Control', 'public, max-age=86400')
    res.send(Buffer.from(m.bannerImageData, 'base64'))
  } catch { res.status(500).end() }
})

// ── POST /api/manga — créer (publisher) ────────────
router.post('/', protect, restrictTo('publisher','admin','superadmin'), [
  body('titleF').trim().isLength({ min: 2, max: 200 }),
  body('language').isIn(['fr','en']),
  validate,
], async (req, res) => {
  try {
    const data = { ...req.body, authorId: req.user.id, authorName: req.user.pseudo }

    // Génération slug unique
    let slug = slugify(data.slug || data.titleF)
    let counter = 1
    let baseSlug = slug
    while (await Manga.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`
    }
    data.slug = slug

    // Si admin, possibilité d'auto-approuver
    if (['admin','superadmin'].includes(req.user.role) && req.body.autoApprove) {
      data.moderationStatus = 'approved'
      data.publishedAt = new Date()
    }

    const manga = await Manga.create(data)
    res.status(201).json({ manga })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// ── PATCH /api/manga/:id — éditer (auteur ou admin) ─
router.patch('/:id', protect, async (req, res) => {
  try {
    const manga = await Manga.findByPk(req.params.id)
    if (!manga) return res.status(404).json({ error: 'Manga introuvable' })

    const isOwner = manga.authorId === req.user.id
    const isAdmin = ['admin','superadmin'].includes(req.user.role)
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Non autorisé' })

    // Champs réservés à l'admin
    if (!isAdmin) {
      delete req.body.moderationStatus
      delete req.body.moderationNotes
      delete req.body.isFeatured
      delete req.body.authorId
    }

    await manga.update(req.body)
    res.json({ manga })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// ── PATCH /api/manga/:id/moderate — admin only ─────
router.patch('/:id/moderate', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const { status, notes } = req.body
    if (!['approved','rejected','suspended','pending'].includes(status))
      return res.status(400).json({ error: 'Statut invalide' })

    const manga = await Manga.findByPk(req.params.id)
    if (!manga) return res.status(404).json({ error: 'Manga introuvable' })

    const updates = { moderationStatus: status, moderationNotes: notes || null }
    if (status === 'approved' && !manga.publishedAt) updates.publishedAt = new Date()
    if (status === 'rejected') updates.rejectedReason = notes || 'Non précisé'

    await manga.update(updates)
    res.json({ manga })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// ── DELETE /api/manga/:id ──────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const manga = await Manga.findByPk(req.params.id)
    if (!manga) return res.status(404).json({ error: 'Manga introuvable' })

    const isOwner = manga.authorId === req.user.id
    const isAdmin = ['admin','superadmin'].includes(req.user.role)
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Non autorisé' })

    await manga.destroy()
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── POST /api/manga/:id/rate — noter un manga ──────
router.post('/:id/rate', protect, [
  body('rating').isInt({ min: 1, max: 5 }),
  validate,
], async (req, res) => {
  try {
    const manga = await Manga.findByPk(req.params.id)
    if (!manga) return res.status(404).json({ error: 'Manga introuvable' })

    const [rating, created] = await MangaRating.findOrCreate({
      where: { mangaId: manga.id, userId: req.user.id },
      defaults: { rating: req.body.rating, review: req.body.review || null },
    })
    if (!created) {
      await rating.update({ rating: req.body.rating, review: req.body.review })
    }

    // Recalcul moyenne dénormalisée
    const ratings = await MangaRating.findAll({ where: { mangaId: manga.id }, attributes: ['rating'] })
    const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
    await manga.update({ averageRating: parseFloat(avg.toFixed(2)), ratingCount: ratings.length })

    res.json({ rating, averageRating: manga.averageRating, ratingCount: manga.ratingCount })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// GET /api/manga/my/list — mangas du publisher connecté
router.get('/my/list', protect, async (req, res, next) => {
  try {
    if (!req.user.isPublisher && !['admin','superadmin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Réservé aux éditeurs' })
    }
    const { rows: mangas, count } = await Manga.findAndCountAll({
      where: { authorId: req.user.id },
      order: [['createdAt','DESC']],
      attributes: { exclude: ['coverImageData','bannerImageData'] },
    })
    const result = mangas.map(m => {
      const j = m.toJSON()
      if (m.coverImageMime) j.coverUrl = `/api/manga/${m.id}/cover`
      return j
    })
    res.json({ mangas: result, total: count })
  } catch (err) { next(err) }
})

module.exports = router