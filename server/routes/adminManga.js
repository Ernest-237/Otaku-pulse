// server/routes/adminManga.js — Endpoints admin pour la plateforme Manga
const express = require('express')
const { Op, fn, col } = require('sequelize')
const {
  User, Manga, Chapter, MangaComment, ChapterView,
  Subscription, PublisherApplication, ReadingProgress, LibraryItem,
} = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')
const router = express.Router()

router.use(protect, restrictTo('admin','superadmin'))

// ══════════════════════════════════════════════════════
// GET /api/admin/manga/dashboard — stats globales manga
// ══════════════════════════════════════════════════════
router.get('/dashboard', async (req, res, next) => {
  try {
    const month = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)

    const [
      totalMangas, pendingMangas, approvedMangas, rejectedMangas, featuredMangas,
      totalChapters,
      totalPublishers, pendingPublisherApps,
      totalSubs, activeSubs, pendingSubs, monthSubs,
      totalComments, hiddenComments,
      totalReaders,
    ] = await Promise.all([
      Manga.count(),
      Manga.count({ where: { moderationStatus: 'pending' } }),
      Manga.count({ where: { moderationStatus: 'approved' } }),
      Manga.count({ where: { moderationStatus: 'rejected' } }),
      Manga.count({ where: { isFeatured: true, moderationStatus: 'approved' } }),
      Chapter.count(),
      User.count({ where: { isPublisher: true } }),
      PublisherApplication.count({ where: { status: 'pending' } }),
      Subscription.count(),
      Subscription.count({ where: { status: 'active', expiresAt: { [Op.gt]: new Date() } } }),
      Subscription.count({ where: { status: 'pending' } }),
      Subscription.count({ where: { createdAt: { [Op.gte]: month } } }),
      MangaComment.count(),
      MangaComment.count({ where: { isHidden: true } }),
      ReadingProgress.count({ distinct: true, col: 'userId' }),
    ])

    // Revenus abonnements
    const subRevenueAll = await Subscription.sum('amount', { where: { status: 'active' } }) || 0
    const subRevenueMonth = await Subscription.sum('amount', {
      where: { status: 'active', createdAt: { [Op.gte]: month } },
    }) || 0

    // Vues totales
    const totalViews = await Manga.sum('viewCount') || 0
    const totalReads = await Manga.sum('readCount') || 0

    // Vues sur 30j
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const viewsLast30d = await ChapterView.count({ where: { viewedAt: { [Op.gte]: thirtyDaysAgo } } })

    // CA abonnements par mois (6 derniers mois)
    const subsByMonth = await Subscription.findAll({
      where: { status: 'active', createdAt: { [Op.gte]: sixMonthsAgo } },
      attributes: [
        [fn('TO_CHAR', col('createdAt'), 'YYYY-MM'), 'month'],
        [fn('SUM', col('amount')), 'revenue'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('TO_CHAR', col('createdAt'), 'YYYY-MM')],
      order: [[fn('TO_CHAR', col('createdAt'), 'YYYY-MM'), 'ASC']],
      raw: true,
    })

    // Plans répartition
    const plansDistribution = await Subscription.findAll({
      where: { status: 'active', expiresAt: { [Op.gt]: new Date() } },
      attributes: ['planType', [fn('COUNT', col('id')), 'count']],
      group: ['planType'],
      raw: true,
    })

    // Statuts mangas
    const mangaByStatus = await Manga.findAll({
      attributes: ['moderationStatus', [fn('COUNT', col('id')), 'count']],
      group: ['moderationStatus'],
      raw: true,
    })

    // Top 5 mangas (vues)
    const topMangas = await Manga.findAll({
      where: { moderationStatus: 'approved' },
      order: [['viewCount','DESC']],
      limit: 5,
      attributes: ['id','slug','titleF','titleE','viewCount','readCount','averageRating','authorName','coverImageMime'],
    })
    const topMangasWithUrl = topMangas.map(m => {
      const j = m.toJSON()
      if (m.coverImageMime) j.coverUrl = `/api/manga/${m.id}/cover`
      return j
    })

    // Top 5 chapitres
    const topChapters = await Chapter.findAll({
      where: { isPublished: true },
      order: [['viewCount','DESC']],
      limit: 5,
      attributes: ['id','mangaId','chapterNumber','title','viewCount','pageCount'],
      include: [{ model: Manga, as: 'manga', attributes: ['titleF','titleE','slug'] }],
    })

    // Mangas en attente (pour action rapide)
    const pendingMangaList = await Manga.findAll({
      where: { moderationStatus: 'pending' },
      order: [['createdAt','DESC']],
      limit: 5,
      attributes: ['id','slug','titleF','authorName','createdAt','language','accessTier'],
      include: [{ model: User, as: 'author', attributes: ['pseudo','email'] }],
    })

    // Candidatures publisher en attente
    const pendingApps = await PublisherApplication.findAll({
      where: { status: 'pending' },
      order: [['createdAt','DESC']],
      limit: 5,
      include: [{ model: User, as: 'user', attributes: ['pseudo','email','avatar'] }],
    })

    res.json({
      stats: {
        mangas: {
          total: totalMangas,
          pending: pendingMangas,
          approved: approvedMangas,
          rejected: rejectedMangas,
          featured: featuredMangas,
        },
        chapters: { total: totalChapters },
        publishers: { total: totalPublishers, pendingApps: pendingPublisherApps },
        subscriptions: {
          total: totalSubs,
          active: activeSubs,
          pending: pendingSubs,
          month: monthSubs,
        },
        comments: { total: totalComments, hidden: hiddenComments },
        readers: { total: totalReaders },
        revenue: { total: subRevenueAll, month: subRevenueMonth },
        engagement: { totalViews, totalReads, viewsLast30d },
      },
      subsByMonth,
      plansDistribution,
      mangaByStatus,
      topMangas: topMangasWithUrl,
      topChapters,
      pendingMangaList,
      pendingApps,
    })
  } catch (err) {
    console.error('Admin manga dashboard error:', err.message)
    next(err)
  }
})

// ══════════════════════════════════════════════════════
// GET /api/admin/manga/list — tous les mangas (admin)
// ══════════════════════════════════════════════════════
router.get('/list', async (req, res, next) => {
  try {
    const { status, search, accessTier, language, limit = 50, page = 1 } = req.query
    const where = {}
    if (status && status !== 'all')          where.moderationStatus = status
    if (accessTier && accessTier !== 'all')  where.accessTier = accessTier
    if (language && language !== 'all')      where.language = language
    if (search) where[Op.or] = [
      { titleF:    { [Op.iLike]: `%${search}%` } },
      { titleE:    { [Op.iLike]: `%${search}%` } },
      { authorName:{ [Op.iLike]: `%${search}%` } },
      { slug:      { [Op.iLike]: `%${search}%` } },
    ]

    const { rows: mangas, count } = await Manga.findAndCountAll({
      where,
      order: [['createdAt','DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      attributes: { exclude: ['coverImageData','bannerImageData','synopsisF','synopsisE'] },
      include: [{ model: User, as: 'author', attributes: ['id','pseudo','email'] }],
    })

    const result = mangas.map(m => {
      const j = m.toJSON()
      if (m.coverImageMime) j.coverUrl = `/api/manga/${m.id}/cover`
      return j
    })

    res.json({ mangas: result, total: count })
  } catch (err) { next(err) }
})

// ══════════════════════════════════════════════════════
// PATCH /api/admin/manga/:id — admin update général
// ══════════════════════════════════════════════════════
router.patch('/manga/:id', async (req, res, next) => {
  try {
    const m = await Manga.findByPk(req.params.id)
    if (!m) return res.status(404).json({ error: 'Manga introuvable' })
    const allowed = ['isFeatured','accessTier','moderationStatus','moderationNotes','rejectedReason','status','ageRating','genres','tags']
    const updates = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })
    if (updates.moderationStatus === 'approved' && !m.publishedAt) {
      updates.publishedAt = new Date()
    }
    await m.update(updates)
    res.json({ manga: m })
  } catch (err) { next(err) }
})

// DELETE /api/admin/manga/:id
router.delete('/manga/:id', async (req, res, next) => {
  try {
    const m = await Manga.findByPk(req.params.id)
    if (!m) return res.status(404).json({ error: 'Manga introuvable' })
    await m.destroy()
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ══════════════════════════════════════════════════════
// COMMENTS — listing + modération
// ══════════════════════════════════════════════════════
router.get('/comments/list', async (req, res, next) => {
  try {
    const { mangaId, hidden, search, limit = 100, page = 1 } = req.query
    const where = {}
    if (mangaId)               where.mangaId = mangaId
    if (hidden === 'true')     where.isHidden = true
    if (hidden === 'false')    where.isHidden = false
    if (search) where.content = { [Op.iLike]: `%${search}%` }

    const { rows: comments, count } = await MangaComment.findAndCountAll({
      where,
      order: [['createdAt','DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [
        { model: User, as: 'user', attributes: ['id','pseudo','email','avatar'] },
        { model: Manga, as: 'manga', attributes: ['id','slug','titleF'] },
      ],
    })

    res.json({ comments, total: count })
  } catch (err) { next(err) }
})

router.delete('/comments/:id', async (req, res, next) => {
  try {
    const c = await MangaComment.findByPk(req.params.id)
    if (!c) return res.status(404).json({ error: 'Commentaire introuvable' })
    const mangaId = c.mangaId
    await c.destroy()
    await Manga.decrement('commentCount', { where: { id: mangaId } })
    res.json({ success: true })
  } catch (err) { next(err) }
})

// ══════════════════════════════════════════════════════
// PUBLISHERS — gestion globale
// ══════════════════════════════════════════════════════
router.get('/publishers/list', async (req, res, next) => {
  try {
    const publishers = await User.findAll({
      where: { isPublisher: true },
      attributes: { exclude: ['password','refreshToken','passwordResetToken','passwordResetExpiry'] },
      order: [['createdAt','DESC']],
    })

    // Stats par publisher
    const result = await Promise.all(publishers.map(async p => {
      const j = p.toJSON()
      const [mangaCount, totalViews, totalReads] = await Promise.all([
        Manga.count({ where: { authorId: p.id } }),
        Manga.sum('viewCount', { where: { authorId: p.id } }) || 0,
        Manga.sum('readCount', { where: { authorId: p.id } }) || 0,
      ])
      j.stats = { mangaCount, totalViews, totalReads }
      return j
    }))

    res.json({ publishers: result })
  } catch (err) { next(err) }
})

// PATCH /api/admin/manga/publishers/:userId — révoquer / restaurer
router.patch('/publishers/:userId', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })
    if (['admin','superadmin'].includes(user.role)) {
      return res.status(403).json({ error: 'Impossible de modifier le rôle d\'un admin' })
    }
    const { revoke } = req.body
    if (revoke) {
      await user.update({ role: 'user', isPublisher: false })
    } else {
      await user.update({ role: 'publisher', isPublisher: true })
    }
    res.json({ user: user.toJSON() })
  } catch (err) { next(err) }
})

module.exports = router