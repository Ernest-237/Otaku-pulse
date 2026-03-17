// server/routes/orders.js — Sequelize
const express  = require('express');
const { Order, Product } = require('../models/index');
const { protect, restrictTo } = require('../middleware/auth');
const router   = express.Router();

// POST /api/orders
router.post('/', protect, async (req, res, next) => {
  try {
    const { items, delivery, paymentMethod = 'mtn_money', promoCode } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'Panier vide.' });

    const productIds = items.map(i => i.productId);
    const products   = await Product.findAll({ where: { id: productIds, isActive: true } });

    let subtotal = 0;
    const orderItems = items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) throw Object.assign(new Error(`Produit introuvable.`), { statusCode: 400 });
      if (prod.stock < item.quantity) throw Object.assign(new Error(`Stock insuffisant : ${prod.nameF}`), { statusCode: 400 });
      subtotal += prod.price * item.quantity;
      return { productId: prod.id, nameF: prod.nameF, nameE: prod.nameE, price: prod.price, quantity: item.quantity, emoji: prod.emoji };
    });

    const shipping = subtotal >= 15000 ? 0 : 2000;
    const PROMOS   = { DATTEBAYO: 500, NAKAMA: 0.1 };
    let discount = 0;
    if (promoCode && PROMOS[promoCode]) {
      const v = PROMOS[promoCode];
      discount = v < 1 ? Math.round(subtotal * v) : v;
    }

    const order = await Order.create({
      userId: req.user.id,
      items: orderItems,
      subtotal, shipping, discount, promoCode,
      total: subtotal + shipping - discount,
      paymentMethod,
      deliveryCity:    delivery?.city,
      deliveryAddress: delivery?.address,
      deliveryPhone:   delivery?.phone,
      deliveryNotes:   delivery?.notes,
    });

    // Décrémenter stock
    for (const item of items) {
      await Product.increment({ stock: -item.quantity, sold: item.quantity }, { where: { id: item.productId } });
    }

    res.status(201).json({ order, message: 'Commande créée.' });
  } catch (err) { next(err); }
});

// GET /api/orders/my
router.get('/my', protect, async (req, res, next) => {
  try {
    const orders = await Order.findAll({ where: { userId: req.user.id }, order: [['createdAt','DESC']] });
    res.json({ orders });
  } catch (err) { next(err); }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });
    if (order.userId !== req.user.id && req.user.role === 'user') return res.status(403).json({ error: 'Accès refusé.' });
    res.json({ order });
  } catch (err) { next(err); }
});

// PATCH /api/orders/:id/status — admin
router.patch('/:id/status', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });
    const history = [...(order.statusHistory || []), { status, note, changedAt: new Date() }];
    await order.update({ status, statusHistory: history });
    res.json({ order, message: `Statut : ${status}` });
  } catch (err) { next(err); }
});

module.exports = router;