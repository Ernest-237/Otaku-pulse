// server/routes/payment.js — Sequelize
const express = require('express');
const { Order } = require('../models/index');
const { protect } = require('../middleware/auth');
const router  = express.Router();

router.post('/initiate', protect, async (req, res, next) => {
  try {
    const { orderId, method } = req.body;
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });
    if (order.userId !== req.user.id) return res.status(403).json({ error: 'Accès refusé.' });
    if (order.paymentStatus === 'paid') return res.status(409).json({ error: 'Déjà payée.' });

    if (method === 'stripe') {
      // TODO: intégrer Stripe
      return res.json({ method: 'stripe', message: 'Stripe — à configurer.' });
    }

    if (['mtn_money','orange_money','transfer'].includes(method)) {
      const ref = `OP-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
      await order.update({ paymentMethod: method, paymentReference: ref });
      const instructions = {
        mtn_money:    `Envoyez ${order.total.toLocaleString()} FCFA au +237 6XX XXX XXX (MTN MoMo). Réf: ${ref}`,
        orange_money: `Envoyez ${order.total.toLocaleString()} FCFA au +237 6XX XXX XXX (Orange Money). Réf: ${ref}`,
        transfer:     `Virement Afriland First Bank — IBAN: XXXXXXXX — Réf: ${ref}`,
      };
      return res.json({ method, reference: ref, amount: order.total, instructions: instructions[method] });
    }

    res.status(400).json({ error: 'Méthode inconnue.' });
  } catch (err) { next(err); }
});

router.post('/confirm', protect, async (req, res, next) => {
  try {
    const { orderId, reference } = req.body;
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ error: 'Commande introuvable.' });
    const history = [...(order.statusHistory || []), { status: 'confirmed', note: 'Paiement confirmé.', changedAt: new Date() }];
    await order.update({
      paymentStatus: 'paid', paidAt: new Date(),
      paymentReference: reference || order.paymentReference,
      status: 'confirmed', statusHistory: history,
    });
    // TODO: await sendOrderConfirmationEmail(order);
    res.json({ message: 'Paiement confirmé.', order });
  } catch (err) { next(err); }
});

router.post('/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  // TODO: vérifier signature Stripe
  res.json({ received: true });
});

module.exports = router;