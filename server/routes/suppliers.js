// server/routes/suppliers.js — Gestion fournisseurs + boutiques partenaires en libre-service
const router  = require('express').Router()
const { Supplier, Product, User } = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')
const { Op } = require('sequelize')
const { isValidSlug } = require('../utils/slugify')
const { grantRole } = require('../utils/roles')

/* ══════════════════════════════════════════════════════
   BOUTIQUE PARTENAIRE — libre-service
   ══════════════════════════════════════════════════════ */

// POST /api/suppliers/apply — candidature boutique partenaire
router.post('/apply', protect, async (req, res) => {
  try {
    const existing = await Supplier.findOne({ where: { userId: req.user.id } })
    if (existing && ['pending','approved'].includes(existing.status)) {
      return res.status(409).json({ error: existing.status === 'approved' ? 'Tu as déjà une boutique.' : 'Candidature déjà en attente.' })
    }

    const { name, email, phone, whatsapp, city, description, logoData, logoMime } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Nom de la marque requis.' })

    const payload = {
      userId: req.user.id, name: name.trim(), email, phone, whatsapp, city, description,
      logoData: logoData || null, logoMime: logoMime || null,
      status: 'pending', rejectedReason: null,
    }

    let supplier
    if (existing) { await existing.update(payload); supplier = existing }
    else supplier = await Supplier.create(payload)

    res.status(201).json({ supplier })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// GET /api/suppliers/my — ma boutique (candidat ou partenaire)
router.get('/my', protect, async (req, res) => {
  try {
    const supplier = await Supplier.findOne({
      where: { userId: req.user.id },
      // Les images base64 sont servies par leurs routes dédiées : les inclure
      // ici alourdirait la réponse de plusieurs mégaoctets à chaque chargement
      // du tableau de bord partenaire.
      attributes: { exclude: ['logoData','bannerData'] },
    })
    const j = supplier?.toJSON() || null
    if (j?.logoMime)   j.logoUrl   = `/api/suppliers/${j.id}/logo`
    if (j?.bannerMime) j.bannerUrl = `/api/suppliers/${j.id}/banner`
    res.json({ supplier: j, isPartner: !!req.user.isPartner })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/suppliers/me — le partenaire édite sa propre boutique
router.patch('/me', protect, async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ where: { userId: req.user.id } })
    if (!supplier) return res.status(404).json({ error: 'Aucune boutique.' })
    if (supplier.status !== 'approved') return res.status(403).json({ error: 'Boutique pas encore validée.' })

    // Champs réservés à l'admin ou calculés, jamais modifiables par le
    // partenaire lui-même. `slug` est retiré du lot pour être validé à part :
    // il devient une URL publique et ne peut pas être accepté à l'aveugle.
    const {
      commission, bankName, bankAccount, status, isActive, userId,
      id, viewCount, createdAt, updatedAt, slug,
      ...allowed
    } = req.body

    if (slug !== undefined) {
      const wanted = String(slug).trim().toLowerCase()
      if (!isValidSlug(wanted)) {
        return res.status(400).json({
          error: 'Lien invalide. Utilise 3 à 50 caractères : lettres minuscules, chiffres et tirets (ex. otaku-store-yaounde).',
        })
      }
      if (wanted !== supplier.slug) {
        const taken = await Supplier.findOne({ where: { slug: wanted }, attributes: ['id'] })
        if (taken) return res.status(409).json({ error: 'Ce lien est déjà pris par une autre boutique.' })
        allowed.slug = wanted
      }
    }

    await supplier.update(allowed)
    const j = supplier.toJSON()
    if (j.logoMime)   j.logoUrl   = `/api/suppliers/${j.id}/logo`
    if (j.bannerMime) j.bannerUrl = `/api/suppliers/${j.id}/banner`
    res.json({ supplier: j })
  } catch (err) {
    // La contrainte d'unicité en base est le dernier rempart si deux
    // partenaires réclament le même lien au même instant.
    if (err.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ error: 'Ce lien est déjà pris par une autre boutique.' })
    res.status(400).json({ error: err.message })
  }
})

// GET /api/suppliers/slug-check/:slug — le lien est-il disponible ?
// Sert à donner un retour immédiat pendant la saisie, avant l'enregistrement.
router.get('/slug-check/:slug', protect, async (req, res) => {
  try {
    const wanted = String(req.params.slug || '').trim().toLowerCase()
    if (!isValidSlug(wanted))
      return res.json({ available: false, reason: 'format' })

    const mine  = await Supplier.findOne({ where: { userId: req.user.id }, attributes: ['id','slug'] })
    if (mine?.slug === wanted) return res.json({ available: true, reason: 'current' })

    const taken = await Supplier.findOne({ where: { slug: wanted }, attributes: ['id'] })
    res.json({ available: !taken, reason: taken ? 'taken' : 'ok' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

/* ══════════════════════════════════════════════════════
   VITRINE PUBLIQUE — /boutique/<slug>
   Aucune authentification : c'est le lien que le partenaire partage.
   ══════════════════════════════════════════════════════ */

// GET /api/suppliers/shop/:slug — la vitrine et ses produits
router.get('/shop/:slug', async (req, res) => {
  try {
    const supplier = await Supplier.findOne({
      where: {
        slug: String(req.params.slug || '').toLowerCase(),
        // Une boutique en attente, rejetée ou suspendue n'a pas de vitrine
        // publique — son lien renvoie un 404 comme n'importe quelle URL inconnue.
        status: 'approved',
        isActive: true,
      },
      // Les images sont servies par leurs propres routes : les inclure ici
      // ferait passer plusieurs mégaoctets de base64 dans chaque réponse.
      attributes: { exclude: ['logoData','bannerData','bankName','bankAccount','commission','notes','rejectedReason'] },
    })
    if (!supplier) return res.status(404).json({ error: 'Boutique introuvable.' })

    const products = await Product.findAll({
      where: { supplierId: supplier.id, isActive: true },
      attributes: { exclude: ['imageData'] },
      order: [['isFeatured','DESC'], ['createdAt','DESC']],
      limit: 200,
    })

    // Une seule requête pour savoir quels produits ont une image en base.
    const ids = products.map(p => p.id)
    const withImage = new Set(
      ids.length === 0 ? [] : (await Product.findAll({
        where: { id: { [Op.in]: ids }, imageData: { [Op.ne]: null } },
        attributes: ['id'],
        raw: true,
      })).map(r => r.id)
    )

    const items = products.map(p => {
      const j = p.toJSON()
      if (withImage.has(p.id)) j.imageUrl = `/api/upload/product/${p.id}/image`
      return j
    })

    const s = supplier.toJSON()
    if (s.logoMime)   s.logoUrl   = `/api/suppliers/${s.id}/logo`
    if (s.bannerMime) s.bannerUrl = `/api/suppliers/${s.id}/banner`
    // Coordonnées bancaires déjà exclues ci-dessus ; on retire aussi l'email
    // privé du partenaire, qui n'a pas à être exposé publiquement.
    delete s.email

    // Compteur de visites incrémenté sans bloquer la réponse : une erreur
    // d'écriture ne doit jamais empêcher l'affichage de la vitrine.
    Supplier.increment('viewCount', { where: { id: supplier.id } })
      .catch(e => console.warn('⚠️ viewCount:', e.message))

    // Catégories réellement présentes, pour les filtres de la vitrine.
    const categories = [...new Set(items.map(p => p.category))]

    res.json({ shop: s, products: items, categories, total: items.length })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/suppliers/:id/banner — image de couverture de la vitrine
router.get('/:id/banner', async (req, res) => {
  try {
    const s = await Supplier.findByPk(req.params.id, { attributes: ['bannerData','bannerMime'] })
    if (!s?.bannerData) return res.status(404).end()
    res.set('Content-Type', s.bannerMime || 'image/jpeg')
    res.set('Cache-Control', 'public, max-age=86400')
    res.send(Buffer.from(s.bannerData, 'base64'))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/suppliers/:id/review — admin approuve/rejette une candidature
router.patch('/:id/review', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const { status, reason } = req.body
    if (!['approved','rejected'].includes(status)) return res.status(400).json({ error: 'Statut invalide.' })

    const supplier = await Supplier.findByPk(req.params.id)
    if (!supplier) return res.status(404).json({ error: 'Introuvable.' })

    await supplier.update({
      status,
      rejectedReason: status === 'rejected' ? (reason || 'Non précisé') : null,
    })

    if (status === 'approved' && supplier.userId) {
      // `grantRole` préserve le rôle d'un admin : accorder une boutique ne
      // doit jamais retirer l'accès à l'administration. La capacité est
      // portée par `isPartner`, pas par le rôle.
      const owner = await User.findByPk(supplier.userId)
      if (owner) await owner.update({ role: grantRole(owner.role, 'partner'), isPartner: true })
    }

    res.json({ supplier })
  } catch (err) { res.status(400).json({ error: err.message }) }
})

// GET /api/suppliers — admin
router.get('/', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const { search, active } = req.query
    const where = {}
    if (active !== undefined) where.isActive = active === 'true'
    if (search) where.name = { [Op.iLike]: `%${search}%` }

    const suppliers = await Supplier.findAll({
      where,
      order: [['name','ASC']],
      attributes: { exclude:['logoData'] }, // ne pas retourner le binaire dans la liste
    })
    res.json({ suppliers })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// GET /api/suppliers/:id — admin
router.get('/:id', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const s = await Supplier.findByPk(req.params.id, {
      include:[{ model:Product, as:'products', attributes:['id','nameF','price','stock','isActive'] }]
    })
    if (!s) return res.status(404).json({ error: 'Fournisseur introuvable' })
    res.json({ supplier: s })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// POST /api/suppliers — admin
router.post('/', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const s = await Supplier.create(req.body)
    res.status(201).json({ supplier: s })
  } catch(err) { res.status(400).json({ error: err.message }) }
})

// PATCH /api/suppliers/:id — admin
router.patch('/:id', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const s = await Supplier.findByPk(req.params.id)
    if (!s) return res.status(404).json({ error: 'Fournisseur introuvable' })
    await s.update(req.body)
    res.json({ supplier: s })
  } catch(err) { res.status(400).json({ error: err.message }) }
})

// DELETE /api/suppliers/:id — soft delete
router.delete('/:id', protect, restrictTo('admin','superadmin'), async (req, res) => {
  try {
    const s = await Supplier.findByPk(req.params.id)
    if (!s) return res.status(404).json({ error: 'Fournisseur introuvable' })
    await s.update({ isActive: false })
    res.json({ success: true })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// GET /api/suppliers/:id/logo — retourne le logo en base64 image
router.get('/:id/logo', async (req, res) => {
  try {
    const s = await Supplier.findByPk(req.params.id, { attributes:['logoData','logoMime'] })
    if (!s || !s.logoData) return res.status(404).json({ error: 'Pas de logo' })
    const buf = Buffer.from(s.logoData, 'base64')
    res.set('Content-Type', s.logoMime || 'image/jpeg')
    res.send(buf)
  } catch(err) { res.status(500).json({ error: err.message }) }
})

// GET /api/suppliers/:id/stats — ventes par fournisseur (admin ou le partenaire lui-même)
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const { Product:Prod, Order } = require('../models/index')
    const { Op } = require('sequelize')
    const supplier = await Supplier.findByPk(req.params.id)
    if (!supplier) return res.status(404).json({ error: 'Introuvable' })
    const isAdmin = ['admin','superadmin'].includes(req.user.role)
    if (!isAdmin && supplier.userId !== req.user.id) return res.status(403).json({ error: 'Non autorisé.' })

    const products = await Prod.findAll({ where:{ supplierId: req.params.id } })
    const productIds = products.map(p => p.id)

    // Calcul des ventes depuis les commandes (items JSONB)
    const orders = await Order.findAll({
      where: { status:{ [Op.in]:['confirmed','preparing','shipped','delivered'] } }
    })

    let totalSales = 0, totalCommission = 0, unitsSold = 0
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        if (productIds.includes(item.productId)) {
          totalSales    += item.price * item.quantity
          totalCommission += item.price * item.quantity * (supplier.commission / 100)
          unitsSold     += item.quantity
        }
      })
    })

    res.json({
      supplier: supplier.name,
      productCount: products.length,
      totalSales,
      totalCommission: Math.round(totalCommission),
      unitsSold,
    })
  } catch(err) { res.status(500).json({ error: err.message }) }
})

module.exports = router