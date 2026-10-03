// server/routes/users.js — Sequelize
const express = require('express');
const { User, Product, Wishlist } = require('../models/index');
const { protect } = require('../middleware/auth');
const router  = express.Router();
const { versionedImage } = require('../utils/media');

router.get('/profile', protect, (req, res) => res.json({ user: req.user.toJSON() }));

router.patch('/profile', protect, async (req, res, next) => {
  try {
    const allowed = ['firstName','lastName','phone','whatsapp','quartier','city','lang','avatar'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    await req.user.update(updates);
    res.json({ user: req.user.toJSON(), message: 'Profil mis à jour.' });
  } catch (err) { next(err); }
});

router.patch('/password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'Mot de passe trop court.' });
    if (!(await req.user.comparePassword(currentPassword))) return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
    await req.user.update({ password: newPassword });
    res.json({ message: 'Mot de passe modifié.' });
  } catch (err) { next(err); }
});

// Toggle wishlist
router.put('/wishlist/:productId', protect, async (req, res, next) => {
  try {
    const where = { userId: req.user.id, productId: req.params.productId };
    if (req.body.enabled === false) { await Wishlist.destroy({ where }); return res.json({ added: false }); }
    const product = await Product.findByPk(req.params.productId, { attributes: ['id','isActive'] });
    if (!product || !product.isActive) return res.status(404).json({ error: 'Produit indisponible.' });
    await Wishlist.findOrCreate({ where });
    res.json({ added: true });
  } catch (err) { next(err); }
});

router.post('/wishlist/:productId', protect, async (req, res, next) => {
  try {
    const { productId } = req.params;
    const existing = await Wishlist.findOne({ where: { userId: req.user.id, productId } });
    if (existing) {
      await existing.destroy();
      return res.json({ added: false, message: 'Retiré de la wishlist.' });
    }
    await Wishlist.create({ userId: req.user.id, productId });
    res.json({ added: true, message: 'Ajouté à la wishlist.' });
  } catch (err) { next(err); }
});

router.get('/wishlist', protect, async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Product, as: 'wishlist', attributes: { exclude: ['imageData'] } }],
    });
    res.json({ wishlist: (user?.wishlist || []).map(p => { const j = p.toJSON(); if (p.imageMime) j.imageUrl = versionedImage(`/api/upload/product/${p.id}/image`, p.updatedAt); return j; }) });
  } catch (err) { next(err); }
});

module.exports = router;
