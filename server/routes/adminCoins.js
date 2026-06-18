// server/routes/adminCoins.js — Admin : validation des achats de coins
const router = require('express').Router()
const { Op, fn, col } = require('sequelize')
const {
  sequelize, CoinPurchaseRequest, CoinWallet, CoinTransaction, User,
} = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')

router.use(protect, restrictTo('admin','superadmin'))

// ── GET /api/admin/coins/dashboard — stats ──
router.get('/dashboard', async (req, res, next) => {
  try {
    const month = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    const [pendingCount, approvedCount, totalRevenue, monthRevenue, totalCoinsSold] = await Promise.all([
      CoinPurchaseRequest.count({ where: { status: 'pending' } }),
      CoinPurchaseRequest.count({ where: { status: 'approved' } }),
      CoinPurchaseRequest.sum('priceXAF', { where: { status: 'approved' } }) || 0,
      CoinPurchaseRequest.sum('priceXAF', { where: { status: 'approved', reviewedAt: { [Op.gte]: month } } }) || 0,
      CoinPurchaseRequest.sum('totalCoins', { where: { status: 'approved' } }) || 0,
    ])

    res.json({
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        totalRevenue: totalRevenue || 0,
        monthRevenue: monthRevenue || 0,
        totalCoinsSold: totalCoinsSold || 0,
      },
    })
  } catch (err) { next(err) }
})

// ── GET /api/admin/coins/requests — liste des demandes ──
router.get('/requests', async (req, res, next) => {
  try {
    const { status = 'pending', search, limit = 100 } = req.query
    const where = {}
    if (status && status !== 'all') where.status = status
    if (search) where.transactionId = { [Op.iLike]: `%${search}%` }

    const requests = await CoinPurchaseRequest.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      include: [{ model: User, as: 'user', attributes: ['id','pseudo','email','whatsapp','phone'] }],
    })
    res.json({ requests })
  } catch (err) { next(err) }
})

// ══════════════════════════════════════════════════════
// PATCH /api/admin/coins/requests/:id/approve — valider
// ══════════════════════════════════════════════════════
router.patch('/requests/:id/approve', async (req, res, next) => {
  const t = await sequelize.transaction()
  try {
    const request = await CoinPurchaseRequest.findByPk(req.params.id, { transaction: t })
    if (!request) {
      await t.rollback()
      return res.status(404).json({ error: 'Demande introuvable' })
    }
    if (request.status !== 'pending') {
      await t.rollback()
      return res.status(400).json({ error: `Demande déjà ${request.status}` })
    }

    // Créditer le wallet
    const [wallet] = await CoinWallet.findOrCreate({
      where: { userId: request.userId },
      defaults: { userId: request.userId, balance: 0, totalPurchased: 0, totalSpent: 0 },
      transaction: t,
    })

    const newBalance = wallet.balance + request.totalCoins
    await wallet.update({
      balance: newBalance,
      totalPurchased: wallet.totalPurchased + request.totalCoins,
    }, { transaction: t })

    // Transaction de crédit
    await CoinTransaction.create({
      userId: request.userId,
      type: 'purchase',
      amount: request.totalCoins,
      balanceAfter: newBalance,
      description: `Achat ${request.packId} (${request.coinsAmount}+${request.bonusCoins} bonus)`,
      purchaseRequestId: request.id,
    }, { transaction: t })

    // Marquer la demande comme approuvée
    await request.update({
      status: 'approved',
      adminNotes: req.body.adminNotes || null,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
    }, { transaction: t })

    await t.commit()
    res.json({
      success: true,
      newBalance,
      message: `${request.totalCoins} coins crédités à l'utilisateur`,
    })
  } catch (err) {
    await t.rollback()
    next(err)
  }
})

// ── PATCH /api/admin/coins/requests/:id/reject — rejeter ──
router.patch('/requests/:id/reject', async (req, res, next) => {
  try {
    const request = await CoinPurchaseRequest.findByPk(req.params.id)
    if (!request) return res.status(404).json({ error: 'Demande introuvable' })
    if (request.status !== 'pending') return res.status(400).json({ error: `Demande déjà ${request.status}` })

    await request.update({
      status: 'rejected',
      adminNotes: req.body.adminNotes || 'Paiement non vérifié',
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
    })
    res.json({ success: true, message: 'Demande rejetée' })
  } catch (err) { next(err) }
})

// ── POST /api/admin/coins/adjust — ajustement manuel (cadeau, correction) ──
router.post('/adjust', async (req, res, next) => {
  const t = await sequelize.transaction()
  try {
    const { userId, amount, reason } = req.body
    if (!userId || !amount) {
      await t.rollback()
      return res.status(400).json({ error: 'userId et amount requis' })
    }

    const [wallet] = await CoinWallet.findOrCreate({
      where: { userId },
      defaults: { userId, balance: 0, totalPurchased: 0, totalSpent: 0 },
      transaction: t,
    })

    const newBalance = Math.max(0, wallet.balance + parseInt(amount))
    await wallet.update({ balance: newBalance }, { transaction: t })

    await CoinTransaction.create({
      userId,
      type: 'admin_adjust',
      amount: parseInt(amount),
      balanceAfter: newBalance,
      description: reason || `Ajustement admin (${amount > 0 ? '+' : ''}${amount})`,
    }, { transaction: t })

    await t.commit()
    res.json({ success: true, newBalance })
  } catch (err) {
    await t.rollback()
    next(err)
  }
})

module.exports = router