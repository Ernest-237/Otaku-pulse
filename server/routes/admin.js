// server/routes/admin.js — Sequelize
const express  = require('express');
const { Op, fn, col, literal } = require('sequelize');
const { User, Product, Order, Event, Contact } = require('../models/index');
const { protect, restrictTo } = require('../middleware/auth');
const router = express.Router();

router.use(protect, restrictTo('admin','superadmin'));

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

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
    ]);

    // Revenus
    const revenueAll = await Order.sum('total', { where: { paymentStatus: 'paid' } }) || 0;
    const revenueMonth = await Order.sum('total', {
      where: { paymentStatus: 'paid', createdAt: { [Op.gte]: month } }
    }) || 0;

    // Commandes récentes
    const recentOrders = await Order.findAll({
      include: [{ model: User, as: 'user', attributes: ['pseudo','email'] }],
      order: [['createdAt','DESC']], limit: 5,
    });

    // Demandes récentes
    const recentContacts = await Contact.findAll({ order: [['createdAt','DESC']], limit: 5 });

    // CA par mois (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const revenueByMonth = await Order.findAll({
      where: { paymentStatus: 'paid', createdAt: { [Op.gte]: sixMonthsAgo } },
      attributes: [
        [fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'month'],
        [fn('SUM', col('total')), 'revenue'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('DATE_FORMAT', col('createdAt'), '%Y-%m')],
      order: [[fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'ASC']],
      raw: true,
    });

    res.json({
      stats: {
        users:    { total: totalUsers,    month: newUsersMonth },
        orders:   { total: totalOrders,   month: ordersMonth, pending: pendingOrders },
        revenue:  { total: revenueAll,    month: revenueMonth },
        products: { total: totalProducts, lowStock },
        contacts: { total: totalContacts, newMonth: newContactsMonth },
        events:   { upcoming: upcomingEvents },
      },
      recentOrders,
      recentContacts,
      revenueByMonth,
    });
  } catch (err) { next(err); }
});

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) where[Op.or] = [
      { pseudo: { [Op.like]: `%${search}%` } },
      { email:  { [Op.like]: `%${search}%` } },
    ];
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows: users, count: total } = await User.findAndCountAll({
      where, order: [['createdAt','DESC']], limit: parseInt(limit), offset,
    });
    res.json({ users: users.map(u => u.toJSON()), total });
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user.id && req.body.role) {
      return res.status(400).json({ error: 'Impossible de modifier votre propre rôle.' });
    }
    const allowed = ['role','isBanned','isVerified'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const [n, [user]] = await User.update(updates, { where: { id: req.params.id }, returning: true });
    if (!n) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    res.json({ user: user.toJSON(), message: 'Utilisateur mis à jour.' });
  } catch (err) { next(err); }
});

// GET /api/admin/orders
router.get('/orders', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows: orders, count: total } = await Order.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['pseudo','email','phone'] }],
      order: [['createdAt','DESC']], limit: parseInt(limit), offset,
    });
    res.json({ orders, total });
  } catch (err) { next(err); }
});

// GET /api/admin/contacts
router.get('/contacts', async (req, res, next) => {
  try {
    const { status, pack, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (pack)   where.pack   = pack;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows: contacts, count: total } = await Contact.findAndCountAll({
      where, order: [['createdAt','DESC']], limit: parseInt(limit), offset,
    });
    res.json({ contacts, total });
  } catch (err) { next(err); }
});

module.exports = router;