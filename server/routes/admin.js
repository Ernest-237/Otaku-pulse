// server/routes/admin.js — PostgreSQL corrigé
const express  = require('express')
const { Op, fn, col, literal } = require('sequelize')
const { User, Product, Order, Event, Contact } = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')
const router = express.Router()

router.use(protect, restrictTo('admin','superadmin'))

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const month = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    const [
      totalUsers, newUsersMonth,
      totalOrders, ordersMonth, pendingOrders,
      totalProducts, lowStock,
      totalContacts, newContactsMonth,
      upcomingEvents,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { createdAt: { [Op.gte]: month } } }),
      Order.count(),
      Order.count({ where: { createdAt: { [Op.gte]: month } } }),
      Order.count({ where: { status: 'pending' } }),
      Product.count({ where: { isActive: true } }),
      Product.count({ where: { isActive: true, stock: { [Op.lte]: 3 } } }),
      Contact.count(),
      Contact.count({ where: { createdAt: { [Op.gte]: month }, status: 'new' } }),
      Event.count({ where: { status: 'upcoming' } }),
    ])

    // ── MANGA STATS (compact pour dashboard global) ──
    const { Manga, Subscription, PublisherApplication } = require('../models/index')
    const [mangaTotal, mangaPending, subActive, subPending, pubAppsPending] = await Promise.all([
      Manga.count({ where: { moderationStatus: 'approved' } }),
      Manga.count({ where: { moderationStatus: 'pending' } }),
      Subscription.count({ where: { status: 'active', expiresAt: { [Op.gt]: new Date() } } }),
      Subscription.count({ where: { status: 'pending' } }),
      PublisherApplication.count({ where: { status: 'pending' } }),
    ])

    const revenueAll   = await Order.sum('total', { where: { paymentStatus: 'paid' } }) || 0
    const revenueMonth = await Order.sum('total', {
      where: { paymentStatus: 'paid', createdAt: { [Op.gte]: month } }
    }) || 0

    const recentOrders = await Order.findAll({
      include: [{ model: User, as: 'user', attributes: ['pseudo','email'] }],
      order: [['createdAt','DESC']], limit: 5,
    })

    const recentContacts = await Contact.findAll({
      order: [['createdAt','DESC']], limit: 5,
    })

    // ✅ CA par mois — PostgreSQL : TO_CHAR au lieu de DATE_FORMAT
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)

    const revenueByMonth = await Order.findAll({
      where: { paymentStatus: 'paid', createdAt: { [Op.gte]: sixMonthsAgo } },
      attributes: [
        [fn('TO_CHAR', col('createdAt'), 'YYYY-MM'), 'month'],
        [fn('SUM', col('total')), 'revenue'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('TO_CHAR', col('createdAt'), 'YYYY-MM')],
      order: [[fn('TO_CHAR', col('createdAt'), 'YYYY-MM'), 'ASC']],
      raw: true,
    })

    // Inscriptions par mois (6 derniers mois)
    const usersByMonth = await User.findAll({
      where: { createdAt: { [Op.gte]: sixMonthsAgo } },
      attributes: [
        [fn('TO_CHAR', col('createdAt'), 'YYYY-MM'), 'month'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('TO_CHAR', col('createdAt'), 'YYYY-MM')],
      order: [[fn('TO_CHAR', col('createdAt'), 'YYYY-MM'), 'ASC']],
      raw: true,
    })

    // Commandes par statut
    const ordersByStatus = await Order.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    })

    // Produits par catégorie
    const productsByCategory = await Product.findAll({
      where: { isActive: true },
      attributes: ['category', [fn('COUNT', col('id')), 'count']],
      group: ['category'],
      raw: true,
    })

    res.json({
      stats: {
        users:    { total: totalUsers,    month: newUsersMonth },
        orders:   { total: totalOrders,   month: ordersMonth, pending: pendingOrders },
        revenue:  { total: revenueAll,    month: revenueMonth },
        products: { total: totalProducts, lowStock },
        contacts: { total: totalContacts, newMonth: newContactsMonth },
        events:   { upcoming: upcomingEvents },
        manga:    { total: mangaTotal, pending: mangaPending },
        subscriptions: { active: subActive, pending: subPending },
        publishers:    { pendingApps: pubAppsPending },
        
      },
      recentOrders:    recentOrders.map(o => o.toJSON()),
      recentContacts:  recentContacts.map(c => c.toJSON()),
      revenueByMonth,
      usersByMonth,
      ordersByStatus,
      productsByCategory,
    })
  } catch (err) {
    console.error('Dashboard error:', err.message)
    next(err)
  }
})

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query
    const where = {}
    if (role) where.role = role
    if (search) where[Op.or] = [
      { pseudo: { [Op.iLike]: `%${search}%` } },  // ✅ iLike pour PostgreSQL
      { email:  { [Op.iLike]: `%${search}%` } },
    ]
    const offset = (parseInt(page) - 1) * parseInt(limit)
    const { rows: users, count: total } = await User.findAndCountAll({
      where, order: [['createdAt','DESC']], limit: parseInt(limit), offset,
    })
    res.json({ users: users.map(u => u.toJSON()), total })
  } catch (err) { next(err) }
})

// PATCH /api/admin/users/:id
router.patch('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })
    const allowed = ['role','isVerified','isBanned','newsletterSubscribed']
    const update  = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k] })
    await user.update(update)
    res.json({ user: user.toJSON() })
  } catch (err) { next(err) }
})

// GET /api/admin/orders
router.get('/orders', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query
    const where = {}
    if (status) where.status = status
    const { rows: orders, count } = await Order.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['pseudo','email'] }],
      order: [['createdAt','DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page)-1) * parseInt(limit),
    })
    res.json({ orders: orders.map(o => o.toJSON()), total: count })
  } catch (err) { next(err) }
})

// GET /api/admin/contacts
router.get('/contacts', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query
    const where = {}
    if (status) where.status = status
    const { rows: contacts, count } = await Contact.findAndCountAll({
      where, order: [['createdAt','DESC']],
      limit: parseInt(limit), offset: (parseInt(page)-1) * parseInt(limit),
    })
    res.json({ contacts, total: count })
  } catch (err) { next(err) }
})

module.exports = router