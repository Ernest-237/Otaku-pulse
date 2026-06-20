// server/routes/blog.js
// ═══════════════════════════════════════════════════════
// OTAKU PULSE — Routes Blog / Annonces / Partenaires
// ═══════════════════════════════════════════════════════
const express  = require('express');
const { Op }   = require('sequelize');
const { protect, restrictTo } = require('../middleware/auth');
const router   = express.Router();

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
    // ── IMAGES : fichier base64 (TEXT illimité) OU lien URL ──
    imageData:   { type: DataTypes.TEXT },          // base64 d'un fichier uploadé
    imageMime:   { type: DataTypes.STRING(50) },    // type MIME (image/png, image/jpeg...)
    imageUrl:    { type: DataTypes.TEXT },           // lien externe OU data URL (TEXT au lieu de STRING(500))
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
    logoUrl:     { type: DataTypes.TEXT },           // TEXT pour accepter base64 aussi
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

// ── Helper : normalise les champs image du body ──────────
// Si imageUrl contient une data URL base64 → on la déplace dans imageData/imageMime
// pour éviter de stocker une énorme base64 dans un champ inadapté.
function normalizeImageFields(body) {
  const out = { ...body };
  if (typeof out.imageUrl === 'string' && out.imageUrl.startsWith('data:')) {
    const match = out.imageUrl.match(/^data:([^;]+);base64,(.*)$/s);
    if (match) {
      out.imageMime = match[1];
      out.imageData = match[2];
      out.imageUrl  = null; // on ne garde pas la data URL dans imageUrl
    }
  }
  return out;
}

// ── GET /api/blog — liste publique ───────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { Post } = getBlogModels();
    const { category, limit = 20, page = 1 } = req.query;
    const where = { isPublished: true };
    if (category && category !== 'all') where.category = category;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows, count: total } = await Post.findAndCountAll({
      where, order: [['isFeatured','DESC'],['createdAt','DESC']],
      limit: parseInt(limit), offset,
      attributes: { exclude: ['imageData'] }, // ne pas charger la base64 dans la liste (lourd)
    });

    // Reconstruire une URL d'image utilisable pour chaque post
    const posts = rows.map(p => {
      const j = p.toJSON();
      if (!j.imageUrl && j.imageMime) {
        j.imageUrl = `/api/blog/${j.id}/image`; // pointer vers la route image
      }
      return j;
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

// ── GET /api/blog/:id/image — sert l'image base64 d'un post ──
router.get('/:id/image', async (req, res, next) => {
  try {
    const { Post } = getBlogModels();
    const post = await Post.findByPk(req.params.id, { attributes: ['imageData','imageMime'] });
    if (!post || !post.imageData) return res.status(404).send('No image');
    const buffer = Buffer.from(post.imageData, 'base64');
    res.set('Content-Type', post.imageMime || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err) { next(err); }
});

// ── GET /api/blog/:id ─────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { Post } = getBlogModels();
    const post = await Post.findByPk(req.params.id, { attributes: { exclude: ['imageData'] } });
    if (!post || !post.isPublished) return res.status(404).json({ error: 'Article introuvable.' });
    await post.increment('views');
    const j = post.toJSON();
    if (!j.imageUrl && j.imageMime) j.imageUrl = `/api/blog/${j.id}/image`;
    res.json({ post: j });
  } catch (err) { next(err); }
});

// ── POST /api/blog — créer article (admin) ────────────────
router.post('/', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const { Post } = getBlogModels();
    const payload = normalizeImageFields(req.body);
    const post = await Post.create({ ...payload, authorId: req.user.id });
    const j = post.toJSON();
    delete j.imageData;
    if (!j.imageUrl && j.imageMime) j.imageUrl = `/api/blog/${j.id}/image`;
    res.status(201).json({ post: j });
  } catch (err) { next(err); }
});

// ── PATCH /api/blog/:id — modifier (admin) ────────────────
router.patch('/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const { Post } = getBlogModels();
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: 'Article introuvable.' });
    const payload = normalizeImageFields(req.body);
    await post.update(payload);
    const j = post.toJSON();
    delete j.imageData;
    if (!j.imageUrl && j.imageMime) j.imageUrl = `/api/blog/${j.id}/image`;
    res.json({ post: j });
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

module.exports = router;