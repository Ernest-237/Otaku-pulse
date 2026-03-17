// server/routes/products.js — Sequelize
const express  = require('express');
const { Op }   = require('sequelize');
const { Product } = require('../models/index');
const { protect, restrictTo } = require('../middleware/auth');
const router   = express.Router();

// GET /api/products
router.get('/', async (req, res, next) => {
  try {
    const { category, search, sort = 'createdAt', order = 'DESC', limit = 20, page = 1 } = req.query;
    const where = { isActive: true };
    if (category && category !== 'all') where.category = category;
    if (search) where[Op.or] = [
      { nameF: { [Op.like]: `%${search}%` } },
      { nameE: { [Op.like]: `%${search}%` } },
    ];

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows: products, count: total } = await Product.findAndCountAll({
      where, order: [[sort, order]], limit: parseInt(limit), offset,
    });

    res.json({ products, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const product = await Product.findOne({ where: { slug: req.params.slug, isActive: true } });
    if (!product) return res.status(404).json({ error: 'Produit introuvable.' });
    res.json({ product });
  } catch (err) { next(err); }
});

// POST /api/products — admin
router.post('/', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ product });
  } catch (err) { next(err); }
});

// PATCH /api/products/:id — admin
router.patch('/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produit introuvable.' });
    await product.update(req.body);
    res.json({ product });
  } catch (err) { next(err); }
});

// DELETE /api/products/:id — soft delete
router.delete('/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    await Product.update({ isActive: false }, { where: { id: req.params.id } });
    res.json({ message: 'Produit désactivé.' });
  } catch (err) { next(err); }
});

module.exports = router;