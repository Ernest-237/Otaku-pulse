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
// ══════════════════════════════════════════════════════
// GESTION DES MEMBRES
// ══════════════════════════════════════════════════════

const STAFF = ['admin', 'superadmin']

/** Nombre de comptes à privilèges encore actifs (non suspendus). */
async function countActiveStaff(excludeId = null) {
  const where = { role: STAFF, isBanned: false }
  if (excludeId) where.id = { [Op.ne]: excludeId }
  return User.count({ where })
}

// PATCH /api/admin/users/:id — champs courants
//
// `role` a été RETIRÉ de cette route : c'était une élévation de privilèges.
// N'importe quel `admin` pouvait s'y promouvoir `superadmin` ou rétrograder le
// propriétaire du site. Le changement de rôle a désormais sa propre route,
// réservée au superadmin (voir plus bas).
router.patch('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    if (req.body.role !== undefined && req.body.role !== user.role) {
      return res.status(403).json({
        error: 'Le changement de rôle passe par PATCH /api/admin/users/:id/role (superadmin uniquement).',
      })
    }

    // Se bannir soi-même revient à se verrouiller dehors : `protect` refuse
    // ensuite le compte avec un 403 avant même d'atteindre `restrictTo`.
    if (req.body.isBanned === true && user.id === req.user.id) {
      return res.status(409).json({ error: 'Tu ne peux pas suspendre ton propre compte.' })
    }
    // Suspendre le dernier administrateur actif rend le site inadministrable.
    if (req.body.isBanned === true && STAFF.includes(user.role)) {
      const remaining = await countActiveStaff(user.id)
      if (remaining === 0) {
        return res.status(409).json({
          error: 'Impossible : c\'est le dernier compte administrateur actif. Promeus quelqu\'un d\'autre d\'abord.',
        })
      }
    }

    const allowed = ['isVerified', 'isBanned', 'newsletterSubscribed']
    const update  = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k] })
    await user.update(update)
    res.json({ user: user.toJSON() })
  } catch (err) { next(err) }
})

// PATCH /api/admin/users/:id/role — accorder ou retirer un rôle
//
// Réservé au superadmin : seul le propriétaire du site décide qui administre.
// Un `admin` ne peut donc ni se promouvoir, ni promouvoir quelqu'un d'autre.
router.patch('/users/:id/role', restrictTo('superadmin'), async (req, res, next) => {
  try {
    const { role } = req.body || {}
    const VALID = ['user', 'publisher', 'partner', 'admin', 'superadmin']
    if (!VALID.includes(role))
      return res.status(400).json({ error: `Rôle invalide. Attendu : ${VALID.join(', ')}.` })

    const user = await User.findByPk(req.params.id)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    if (user.role === role)
      return res.json({ user: user.toJSON(), message: `Ce compte est déjà « ${role} ».` })

    // ── Garde-fou n°1 : ne pas se rétrograder soi-même ──
    // C'est exactement ce qui a rendu le site inadministrable : le seul
    // superadmin s'est retiré ses propres privilèges, et plus personne ne
    // pouvait les lui rendre depuis l'interface.
    if (user.id === req.user.id && !STAFF.includes(role)) {
      return res.status(409).json({
        error: 'Tu ne peux pas retirer tes propres privilèges. Demande à un autre superadmin de le faire.',
      })
    }

    // ── Garde-fou n°2 : ne jamais retirer le dernier administrateur ──
    if (STAFF.includes(user.role) && !STAFF.includes(role)) {
      const remaining = await countActiveStaff(user.id)
      if (remaining === 0) {
        return res.status(409).json({
          error: 'Impossible : c\'est le dernier compte administrateur actif. Promeus quelqu\'un d\'autre d\'abord.',
        })
      }
    }

    const previous = user.role
    await user.update({
      role,
      // Un compte promu doit pouvoir se connecter : inutile de lui donner des
      // privilèges s'il reste suspendu.
      isBanned: STAFF.includes(role) ? false : user.isBanned,
      // Les capacités fonctionnelles suivent le rôle quand c'en est un.
      isPublisher: role === 'publisher' ? true : user.isPublisher,
      isPartner:   role === 'partner'   ? true : user.isPartner,
    })

    // Journalisation : un changement de rôle est une action sensible, elle doit
    // laisser une trace consultable dans les logs Render.
    console.log(
      `🔐 RÔLE MODIFIÉ — ${user.pseudo} <${user.email}> : ${previous} → ${role}`
      + ` (par ${req.user.pseudo} <${req.user.email}>)`
    )

    res.json({
      user: user.toJSON(),
      message: `${user.pseudo} est maintenant « ${role} ».`,
      previousRole: previous,
    })
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