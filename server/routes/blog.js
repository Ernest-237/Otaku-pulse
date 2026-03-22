// server/routes/blog.js
// ═══════════════════════════════════════════════════════
// OTAKU PULSE — Routes Blog / Annonces / Partenaires
// ═══════════════════════════════════════════════════════
const express  = require('express');
const { Op }   = require('sequelize');
const { protect, restrictTo } = require('../middleware/auth');
const router   = express.Router();

// ── Charger les modèles Blog (définis dans models/index.js) ──
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// ── Définir les modèles Blog si pas encore fait ──────────
function getBlogModels() {
  const { sequelize: db } = require('../config/database');

  // Post
  const Post = db.models.Post || db.define('Post', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title:       { type: DataTypes.STRING(255), allowNull: false },
    excerpt:     { type: DataTypes.TEXT },
    content:     { type: DataTypes.TEXT('long'), allowNull: false },
    category:    { type: DataTypes.ENUM('blog','event','promo','partner'), defaultValue: 'blog' },
    imageUrl:    { type: DataTypes.STRING(500) },
    emoji:       { type: DataTypes.STRING(10), defaultValue: '📰' },
    isFeatured:  { type: DataTypes.BOOLEAN, defaultValue: false },
    isPublished: { type: DataTypes.BOOLEAN, defaultValue: true },
    authorId:    { type: DataTypes.UUID },
    views:       { type: DataTypes.INTEGER, defaultValue: 0 },
    // Pour les promos
    promoCode:   { type: DataTypes.STRING(30) },
    promoExpiry: { type: DataTypes.DATE },
  }, { tableName: 'posts', timestamps: true });

  // Partner
  const Partner = db.models.Partner || db.define('Partner', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name:        { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.STRING(255) },
    logo:        { type: DataTypes.STRING(10), defaultValue: '🤝' },
    logoUrl:     { type: DataTypes.STRING(500) },
    url:         { type: DataTypes.STRING(500) },
    isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
    order:       { type: DataTypes.INTEGER, defaultValue: 0 },
  }, { tableName: 'partners', timestamps: true });

  // PromoPopup
  const PromoPopup = db.models.PromoPopup || db.define('PromoPopup', {
    id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title:    { type: DataTypes.STRING(100), allowNull: false },
    text:     { type: DataTypes.TEXT },
    emoji:    { type: DataTypes.STRING(10), defaultValue: '🔥' },
    code:     { type: DataTypes.STRING(30) },
    url:      { type: DataTypes.STRING(500) },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: false },
    expiresAt:{ type: DataTypes.DATE },
  }, { tableName: 'promo_popups', timestamps: true });

  // Sync tables
  Post.sync({ alter: true }).catch(() => {});
  Partner.sync({ alter: true }).catch(() => {});
  PromoPopup.sync({ alter: true }).catch(() => {});

  return { Post, Partner, PromoPopup };
}

// ── GET /api/blog — liste publique ───────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { Post } = getBlogModels();
    const { category, limit = 20, page = 1 } = req.query;
    const where = { isPublished: true };
    if (category && category !== 'all') where.category = category;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: posts, count: total } = await Post.findAndCountAll({
      where, order: [['isFeatured','DESC'],['createdAt','DESC']],
      limit: parseInt(limit), offset,
    });

    res.json({ posts, total });
  } catch (err) { next(err); }
});

// ── GET /api/blog/partners ────────────────────────────────
router.get('/partners', async (req, res, next) => {
  try {
    const { Partner } = getBlogModels();
    const partners = await Partner.findAll({
      where: { isActive: true }, order: [['order','ASC'],['createdAt','ASC']],
    });
    res.json({ partners });
  } catch (err) { next(err); }
});

// ── GET /api/blog/popup — promo popup active ──────────────
router.get('/popup', async (req, res, next) => {
  try {
    const { PromoPopup } = getBlogModels();
    const { Op } = require('sequelize');
    const popup = await PromoPopup.findOne({
      where: {
        isActive: true,
        [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: new Date() } }],
      },
      order: [['createdAt','DESC']],
    });
    res.json({ popup });
  } catch (err) { next(err); }
});

// ── GET /api/blog/:id ─────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { Post } = getBlogModels();
    const post = await Post.findByPk(req.params.id);
    if (!post || !post.isPublished) return res.status(404).json({ error: 'Article introuvable.' });
    await post.increment('views');
    res.json({ post });
  } catch (err) { next(err); }
});

// ── POST /api/blog — créer article (admin) ────────────────
router.post('/', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const { Post } = getBlogModels();
    const post = await Post.create({ ...req.body, authorId: req.user.id });
    res.status(201).json({ post });
  } catch (err) { next(err); }
});

// ── PATCH /api/blog/:id — modifier (admin) ────────────────
router.patch('/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const { Post } = getBlogModels();
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Article introuvable.' });
    await post.update(req.body);
    res.json({ post });
  } catch (err) { next(err); }
});

// ── DELETE /api/blog/:id (soft) ───────────────────────────
router.delete('/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const { Post } = getBlogModels();
    await Post.update({ isPublished: false }, { where: { id: req.params.id } });
    res.json({ message: 'Article masqué.' });
  } catch (err) { next(err); }
});

// ── PARTNERS CRUD (admin) ─────────────────────────────────
router.post('/partners', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const { Partner } = getBlogModels();
    const partner = await Partner.create(req.body);
    res.status(201).json({ partner });
  } catch (err) { next(err); }
});

router.patch('/partners/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const { Partner } = getBlogModels();
    const partner = await Partner.findByPk(req.params.id);
    if (!partner) return res.status(404).json({ error: 'Partenaire introuvable.' });
    await partner.update(req.body);
    res.json({ partner });
  } catch (err) { next(err); }
});

router.delete('/partners/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const { Partner } = getBlogModels();
    await Partner.update({ isActive: false }, { where: { id: req.params.id } });
    res.json({ message: 'Partenaire désactivé.' });
  } catch (err) { next(err); }
});

// ── POPUP CRUD (admin) ────────────────────────────────────
router.post('/popup', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const { PromoPopup } = getBlogModels();
    // Désactiver les anciens popups
    await PromoPopup.update({ isActive: false }, { where: {} });
    const popup = await PromoPopup.create({ ...req.body, isActive: true });
    res.status(201).json({ popup });
  } catch (err) { next(err); }
});

router.patch('/popup/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const { PromoPopup } = getBlogModels();
    const popup = await PromoPopup.findByPk(req.params.id);
    if (!popup) return res.status(404).json({ error: 'Popup introuvable.' });
    await popup.update(req.body);
    res.json({ popup });
  } catch (err) { next(err); }
});

// ── POST /api/orders/notify — notification commande ──────
// (utilisé par profil.html après confirmation commande)

module.exports = router;