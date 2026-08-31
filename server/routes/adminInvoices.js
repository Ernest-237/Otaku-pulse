// server/routes/adminInvoices.js — Facturation (manuelle et automatique)
//
// Principe directeur : le frontend ne calcule jamais un montant qui sera stocké.
// Il affiche un aperçu pour le confort de saisie, mais le serveur recalcule tout
// à partir des lignes reçues. Une facture est une pièce comptable ; on ne fait
// pas confiance à un total qui arrive dans un corps de requête.
const router = require('express').Router()
const { Op } = require('sequelize')
const { Invoice, Order, User } = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')

router.use(protect, restrictTo('admin', 'superadmin'))

// ══════════════════════════════════════════════════════
// CONFIGURATION — source de vérité serveur
// (même logique que COIN_PACKS dans routes/coins.js)
// ══════════════════════════════════════════════════════

// Taux en points de base entiers : 1925 = 19,25 %.
// 19,25 % est le taux camerounais courant (17,5 % de TVA + 10 % de centimes
// additionnels communaux calculés sur la TVA). Beaucoup de petites structures
// relèvent de l'impôt libératoire et ne facturent aucune TVA : le taux par
// défaut est donc 0, à activer explicitement par l'admin selon son régime.
const TAX_PRESETS = [
  { id: 'none',    label: 'Aucune taxe',           taxLabel: '',             rate: 0    },
  { id: 'tva1925', label: 'TVA 19,25 %',           taxLabel: 'TVA 19,25 %',  rate: 1925 },
  { id: 'tva175',  label: 'TVA 17,5 % (hors CAC)', taxLabel: 'TVA 17,5 %',   rate: 1750 },
]

const COMPANY = {
  name:     process.env.COMPANY_NAME    || 'Otaku Pulse',
  tagline:  process.env.COMPANY_TAGLINE || "Vivez l'expérience Otaku · Cameroun",
  email:    process.env.COMPANY_EMAIL   || 'contact@otaku-pulse.com',
  phone:    process.env.COMPANY_PHONE   || '+237 670 63 36 70',
  website:  process.env.COMPANY_SITE    || 'otaku-pulse.com',
  address:  process.env.COMPANY_ADDRESS || 'Yaoundé · Douala · Bafoussam',
  // Champs légaux — à renseigner dès que la structure est enregistrée.
  // Laissés vides plutôt que remplis d'un numéro inventé : une facture portant
  // un identifiant fiscal faux est bien pire qu'une facture qui n'en porte pas.
  rccm:     process.env.COMPANY_RCCM    || '',
  niu:      process.env.COMPANY_NIU     || '',
  momoMtn:    process.env.COMPANY_MOMO_MTN    || '+237 670 63 36 70',
  momoOrange: process.env.COMPANY_MOMO_ORANGE || '+237 657 32 57 97',
}

const PAYMENT_METHODS = [
  { id: 'mtn_money',    label: 'MTN Mobile Money'  },
  { id: 'orange_money', label: 'Orange Money'      },
  { id: 'cash',         label: 'Espèces'           },
  { id: 'transfer',     label: 'Virement bancaire' },
  { id: 'card',         label: 'Carte bancaire'    },
]

// ══════════════════════════════════════════════════════
// CALCULS
// ══════════════════════════════════════════════════════

const toInt = (v) => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) ? n : 0
}

/**
 * Normalise et recalcule l'intégralité des montants d'une facture.
 * Le FCFA n'ayant pas de sous-unité, tout est entier de bout en bout — aucune
 * virgule flottante n'intervient dans un montant stocké.
 */
function computeTotals({ items, discount, shipping, taxRate }) {
  const cleanItems = (Array.isArray(items) ? items : [])
    .map(it => {
      const qty       = Math.max(0, toInt(it.qty ?? 1))
      const unitPrice = Math.max(0, toInt(it.unitPrice))
      return {
        label: String(it.label || '').trim().slice(0, 200),
        qty,
        unitPrice,
        total: qty * unitPrice,
      }
    })
    .filter(it => it.label.length > 0)

  const subtotal = cleanItems.reduce((s, it) => s + it.total, 0)
  const disc     = Math.min(Math.max(0, toInt(discount)), subtotal) // jamais > sous-total
  const ship     = Math.max(0, toInt(shipping))
  const rate     = Math.max(0, Math.min(10000, toInt(taxRate)))     // plafonné à 100 %

  // Au Cameroun la TVA porte aussi sur les frais de livraison facturés.
  const taxableBase = subtotal - disc + ship
  const taxAmount   = Math.round(taxableBase * rate / 10000)

  return {
    items: cleanItems,
    subtotal,
    discount: disc,
    shipping: ship,
    taxRate: rate,
    taxAmount,
    total: taxableBase + taxAmount,
  }
}

/**
 * Numéro de facture séquentiel par année : FA-2026-00042.
 *
 * Sans séquence Postgres dédiée (le dépôt n'a pas de migrations), on lit le
 * dernier numéro de l'année puis on incrémente. Deux admins émettant au même
 * instant peuvent viser le même numéro : la contrainte d'unicité en base fait
 * échouer le perdant, et on retente. Le volume de facturation manuelle rend
 * cette collision très rare, et la contrainte garantit qu'aucun doublon ne peut
 * exister — ce qui est la seule chose qui compte vraiment ici.
 */
async function nextInvoiceNumber() {
  const year   = new Date().getFullYear()
  const prefix = `FA-${year}-`

  const last = await Invoice.findOne({
    where: { invoiceNumber: { [Op.like]: `${prefix}%` } },
    order: [['invoiceNumber', 'DESC']],
    attributes: ['invoiceNumber'],
    paranoid: false,          // une facture archivée consomme quand même son numéro
  })

  const lastSeq = last ? parseInt(last.invoiceNumber.slice(prefix.length), 10) : 0
  const next    = (Number.isFinite(lastSeq) ? lastSeq : 0) + 1
  return `${prefix}${String(next).padStart(5, '0')}`
}

async function createWithNumber(payload, maxRetries = 5) {
  let lastError
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const invoiceNumber = await nextInvoiceNumber()
      return await Invoice.create({ ...payload, invoiceNumber })
    } catch (err) {
      lastError = err
      const isDuplicate = err.name === 'SequelizeUniqueConstraintError'
        && String(err.errors?.[0]?.path || '').includes('invoiceNumber')
      // Collision entre deux émissions simultanées : on relit et on retente.
      if (!isDuplicate) throw err
    }
  }
  throw lastError
}

// ══════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════

// ── GET /config — presets de taxe, coordonnées, moyens de paiement ──
router.get('/config', (req, res) => {
  res.json({ taxPresets: TAX_PRESETS, company: COMPANY, paymentMethods: PAYMENT_METHODS })
})

// ── GET /stats — widgets du tableau de bord ──
router.get('/stats', async (req, res, next) => {
  try {
    const now        = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const OPEN = ['issued', 'partial']   // émises, pas encore soldées

    const [draft, issued, partial, paid, cancelled,
           cashedTotal, cashedMonth, billedOpen, cashedOpen] = await Promise.all([
      Invoice.count({ where: { status: 'draft' } }),
      Invoice.count({ where: { status: 'issued' } }),
      Invoice.count({ where: { status: 'partial' } }),
      Invoice.count({ where: { status: 'paid' } }),
      Invoice.count({ where: { status: 'cancelled' } }),
      // On somme les ENCAISSEMENTS réels, pas les totaux facturés : une facture
      // partiellement réglée ne doit compter que pour ce qui est entré en caisse.
      Invoice.sum('amountPaid', { where: { status: { [Op.ne]: 'cancelled' } } }),
      Invoice.sum('amountPaid', { where: { status: 'paid', paidAt: { [Op.gte]: monthStart } } }),
      Invoice.sum('total',      { where: { status: OPEN } }),
      Invoice.sum('amountPaid', { where: { status: OPEN } }),
    ])

    res.json({
      stats: {
        counts: { draft, issued, partial, paid, cancelled },
        paidTotal:  cashedTotal || 0,
        monthTotal: cashedMonth || 0,
        // Le reste à encaisser = ce qui est facturé sur les factures ouvertes,
        // moins les acomptes déjà reçus dessus.
        outstanding: (billedOpen || 0) - (cashedOpen || 0),
      },
    })
  } catch (err) { next(err) }
})

// ── GET / — liste filtrable ──
router.get('/', async (req, res, next) => {
  try {
    const { status, search, from, to, limit = 100, offset = 0 } = req.query
    const where = {}

    if (status && status !== 'all') where.status = status

    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt[Op.gte] = new Date(from)
      if (to) {
        // Borne haute inclusive : « jusqu'au 31 » doit contenir le 31 en entier.
        const end = new Date(to)
        end.setHours(23, 59, 59, 999)
        where.createdAt[Op.lte] = end
      }
    }

    if (search) {
      const q = `%${String(search).trim()}%`
      where[Op.or] = [
        { invoiceNumber: { [Op.iLike]: q } },
        { clientName:    { [Op.iLike]: q } },
        { clientPhone:   { [Op.iLike]: q } },
        { clientEmail:   { [Op.iLike]: q } },
      ]
    }

    const { rows, count } = await Invoice.findAndCountAll({
      where,
      order:  [['createdAt', 'DESC']],
      limit:  Math.min(parseInt(limit, 10) || 100, 200),
      offset: parseInt(offset, 10) || 0,
    })

    res.json({ invoices: rows, total: count })
  } catch (err) { next(err) }
})

// ── GET /:id — détail ──
router.get('/:id', async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [{ model: User, as: 'client', attributes: ['id', 'pseudo', 'email', 'phone', 'whatsapp'] }],
    })
    if (!invoice) return res.status(404).json({ error: 'Facture introuvable.' })
    res.json({ invoice, company: COMPANY })
  } catch (err) { next(err) }
})

// ── POST / — création manuelle ──
router.post('/', async (req, res, next) => {
  try {
    const b = req.body || {}
    if (!b.clientName || !String(b.clientName).trim())
      return res.status(400).json({ error: 'Le nom du client est obligatoire.' })

    const totals = computeTotals(b)
    if (totals.items.length === 0)
      return res.status(400).json({ error: 'Ajoute au moins une ligne à la facture.' })

    const invoice = await createWithNumber({
      source: 'manual',
      userId: b.userId || null,
      clientName:     String(b.clientName).trim().slice(0, 120),
      clientPhone:    b.clientPhone    || null,
      clientEmail:    b.clientEmail    || null,
      clientCity:     b.clientCity     || 'Yaoundé',
      clientQuartier: b.clientQuartier || null,
      clientAddress:  b.clientAddress  || null,
      destLat:        b.destLat ?? null,
      destLng:        b.destLng ?? null,
      destLandmark:   b.destLandmark   || null,
      taxLabel:       b.taxLabel || (totals.taxRate > 0 ? 'TVA' : ''),
      paymentMethod:  b.paymentMethod  || null,
      dueAt:          b.dueAt ? new Date(b.dueAt) : null,
      notes:          b.notes      || null,
      adminNotes:     b.adminNotes || null,
      status:         'draft',
      ...totals,
    })

    res.status(201).json({ invoice, message: `Facture ${invoice.invoiceNumber} créée.` })
  } catch (err) { next(err) }
})

// ── POST /from-order/:orderId — génération automatique ──
router.post('/from-order/:orderId', async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.orderId, {
      include: [{
        model: User, as: 'user',
        attributes: ['id', 'pseudo', 'email', 'phone', 'whatsapp', 'firstName', 'lastName'],
      }],
    })
    if (!order) return res.status(404).json({ error: 'Commande introuvable.' })

    // Une commande ne donne qu'une facture. Si elle existe déjà, on la renvoie
    // au lieu d'en créer une seconde qui ferait double emploi en comptabilité.
    const existing = await Invoice.findOne({ where: { orderId: order.id } })
    if (existing)
      return res.status(200).json({
        invoice: existing,
        existed: true,
        message: `Cette commande a déjà la facture ${existing.invoiceNumber}.`,
      })

    // Les lignes de commande sont recopiées : la facture doit rester lisible même
    // si le produit est renommé ou supprimé du catalogue plus tard.
    const items = (order.items || []).map(it => ({
      label:     it.name || it.title || it.label || 'Article',
      qty:       toInt(it.qty ?? it.quantity ?? 1),
      unitPrice: toInt(it.price ?? it.unitPrice ?? 0),
    }))

    const u = order.user
    const clientName = [u?.firstName, u?.lastName].filter(Boolean).join(' ')
      || u?.pseudo
      || 'Client'

    const totals = computeTotals({
      items,
      discount: 0,
      shipping: order.shipping || 0,
      taxRate:  toInt(req.body?.taxRate) || 0,
    })

    const invoice = await createWithNumber({
      source:  'auto',
      orderId: order.id,
      userId:  order.userId,
      clientName,
      clientPhone:    order.whatsappNumber || u?.whatsapp || u?.phone || null,
      clientEmail:    u?.email || null,
      clientCity:     order.city     || 'Yaoundé',
      clientQuartier: order.quartier || null,
      clientAddress:  order.fullAddress || null,
      destLat:        req.body?.destLat ?? null,
      destLng:        req.body?.destLng ?? null,
      taxLabel:       totals.taxRate > 0 ? 'TVA' : '',
      paymentMethod:  order.paymentMethod || null,
      status:         'draft',
      // Une commande déjà réglée produit une facture acquittée d'emblée.
      paidAt:         order.paymentStatus === 'paid' ? (order.paidAt || new Date()) : null,
      notes:          `Commande ${order.orderNumber}`,
      ...totals,
    })

    res.status(201).json({
      invoice,
      message: `Facture ${invoice.invoiceNumber} générée depuis ${order.orderNumber}.`,
    })
  } catch (err) { next(err) }
})

// ── PATCH /:id — modification (brouillon uniquement) ──
router.patch('/:id', async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Facture introuvable.' })

    // Une facture émise est un document remis au client : la modifier après coup
    // la rendrait incohérente avec l'exemplaire qu'il détient. On annule et on
    // réémet plutôt que de réécrire l'histoire.
    if (invoice.status !== 'draft')
      return res.status(409).json({
        error: 'Cette facture est déjà émise. Annule-la et crée-en une nouvelle pour la corriger.',
      })

    const b = req.body || {}
    const totals = computeTotals({
      items:    b.items    ?? invoice.items,
      discount: b.discount ?? invoice.discount,
      shipping: b.shipping ?? invoice.shipping,
      taxRate:  b.taxRate  ?? invoice.taxRate,
    })

    const editable = [
      'clientName', 'clientPhone', 'clientEmail', 'clientCity', 'clientQuartier',
      'clientAddress', 'destLat', 'destLng', 'destLandmark', 'taxLabel',
      'paymentMethod', 'notes', 'adminNotes', 'userId',
    ]
    const patch = {}
    for (const k of editable) if (k in b) patch[k] = b[k]
    if ('dueAt' in b) patch.dueAt = b.dueAt ? new Date(b.dueAt) : null

    await invoice.update({ ...patch, ...totals })
    res.json({ invoice, message: 'Facture mise à jour.' })
  } catch (err) { next(err) }
})

// ══════════════════════════════════════════════════════
// ENCAISSEMENTS ET CYCLE DE VIE
// ══════════════════════════════════════════════════════

/**
 * Déduit le statut d'encaissement à partir du montant réellement encaissé.
 *
 * Le statut n'est jamais posé à la main pour `partial` / `paid` : une valeur
 * saisie manuellement se désynchroniserait des montants dès le premier
 * acompte, et la facture mentirait sur sa propre réalité comptable.
 */
function statusFromPayments(invoice, amountPaid) {
  if (amountPaid <= 0) {
    // Aucun encaissement : la facture retrouve son état documentaire.
    return invoice.issuedAt ? 'issued' : 'draft'
  }
  return amountPaid >= invoice.total ? 'paid' : 'partial'
}

// ── POST /:id/payment — enregistrer un versement ──
//
// C'est la SEULE façon de faire passer une facture en « partiel » ou
// « réglée » : on enregistre de l'argent reçu, et le statut suit.
router.post('/:id/payment', async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Facture introuvable.' })
    if (invoice.status === 'cancelled')
      return res.status(409).json({ error: 'Cette facture est annulée : aucun encaissement possible.' })

    const { amount, paymentMethod, note } = req.body || {}
    const value = toInt(amount)
    if (value === 0)
      return res.status(400).json({ error: 'Indique le montant encaissé.' })

    const already   = toInt(invoice.amountPaid)
    const newPaid   = already + value
    if (newPaid < 0)
      return res.status(400).json({ error: 'Le total encaissé ne peut pas devenir négatif.' })
    // Un versement supérieur au solde est presque toujours une faute de frappe
    // (un zéro en trop). On refuse plutôt que d'enregistrer un trop-perçu muet.
    if (newPaid > invoice.total)
      return res.status(400).json({
        error: `Montant trop élevé. Il reste ${(invoice.total - already).toLocaleString('fr-FR')} ${invoice.currency} à encaisser.`,
      })

    const entry = {
      amount: value,
      method: paymentMethod || invoice.paymentMethod || null,
      note:   note ? String(note).slice(0, 200) : null,
      at:     new Date().toISOString(),
      by:     req.user.pseudo,
    }

    const status = statusFromPayments(invoice, newPaid)
    await invoice.update({
      amountPaid: newPaid,
      payments:   [...(invoice.payments || []), entry],
      status,
      paymentMethod: paymentMethod || invoice.paymentMethod,
      // Encaisser sur un brouillon vaut émission : la facture devient un
      // document opposable au moment où de l'argent change de mains.
      issuedAt: invoice.issuedAt || new Date(),
      issuedBy: invoice.issuedBy || req.user.id,
      paidAt:   status === 'paid' ? new Date() : null,
    })

    const remaining = invoice.total - newPaid
    res.json({
      invoice,
      message: status === 'paid'
        ? 'Facture intégralement réglée.'
        : `Acompte enregistré. Reste ${remaining.toLocaleString('fr-FR')} ${invoice.currency}.`,
      remaining,
    })
  } catch (err) { next(err) }
})

// ── PATCH /:id/status — émettre ou annuler ──
//
// Ne gère plus que les transitions DOCUMENTAIRES. Le passage en « partiel » ou
// « réglée » dépend des montants encaissés et passe par /payment ci-dessus.
const ALLOWED_STATUS = {
  draft:     ['issued', 'cancelled'],
  issued:    ['cancelled'],
  partial:   ['cancelled'],
  paid:      ['cancelled'],   // remboursement ou erreur de saisie
  cancelled: [],              // terminal
}

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body || {}
    const invoice = await Invoice.findByPk(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Facture introuvable.' })

    if (['partial', 'paid'].includes(status))
      return res.status(409).json({
        error: 'Un encaissement se déclare via « Enregistrer un paiement », pas en changeant le statut.',
      })

    const allowed = ALLOWED_STATUS[invoice.status] || []
    if (!allowed.includes(status))
      return res.status(409).json({
        error: `Transition impossible : ${invoice.status} → ${status}.`,
        allowed,
      })

    const patch = { status }
    if (status === 'issued') {
      patch.issuedAt = new Date()
      patch.issuedBy = req.user.id
    }

    await invoice.update(patch)
    res.json({ invoice, message: 'Statut mis à jour.' })
  } catch (err) { next(err) }
})

// ── DELETE /:id/payment/:index — annuler un versement mal saisi ──
router.delete('/:id/payment/:index', async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Facture introuvable.' })

    const list = [...(invoice.payments || [])]
    const i = parseInt(req.params.index, 10)
    if (!Number.isInteger(i) || i < 0 || i >= list.length)
      return res.status(404).json({ error: 'Versement introuvable.' })

    const [removed] = list.splice(i, 1)
    const newPaid = Math.max(0, toInt(invoice.amountPaid) - toInt(removed.amount))
    const status  = statusFromPayments(invoice, newPaid)

    await invoice.update({
      payments: list,
      amountPaid: newPaid,
      status,
      paidAt: status === 'paid' ? invoice.paidAt : null,
    })

    res.json({ invoice, message: 'Versement annulé.' })
  } catch (err) { next(err) }
})

// ── DELETE /:id — archivage (jamais de suppression physique) ──
router.delete('/:id', async (req, res, next) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id)
    if (!invoice) return res.status(404).json({ error: 'Facture introuvable.' })
    // `paranoid: true` sur le modèle : destroy() ne fait que poser deletedAt.
    // Le numéro reste consommé, la séquence ne présente donc aucun trou suspect.
    await invoice.destroy()
    res.json({ message: `Facture ${invoice.invoiceNumber} archivée.` })
  } catch (err) { next(err) }
})

module.exports = router

// Exposé pour les tests : le calcul des montants doit être vérifiable sans
// base de données. Attacher la fonction au routeur permet de la sortir sans
// changer la forme de l'export attendue par app.use().
module.exports.computeTotals = computeTotals
