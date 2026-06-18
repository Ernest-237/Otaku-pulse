// server/routes/coins.js — Système de coins
const router = require('express').Router()
const { Op } = require('sequelize')
const {
  sequelize, CoinWallet, CoinTransaction, CoinPurchaseRequest,
  ChapterUnlock, Chapter, Manga, User,
} = require('../models/index')
const { protect } = require('../middleware/auth')

// ══════════════════════════════════════════════════════
// CONFIG PACKS (source de vérité backend)
// ══════════════════════════════════════════════════════
const COIN_PACKS = {
  starter:  { id: 'starter',  coins: 50,  bonus: 0,   priceXAF: 500,  label: 'Starter'  },
  standard: { id: 'standard', coins: 120, bonus: 20,  priceXAF: 1000, label: 'Standard' },
  premium:  { id: 'premium',  coins: 300, bonus: 50,  priceXAF: 2500, label: 'Premium'  },
  mega:     { id: 'mega',     coins: 700, bonus: 150, priceXAF: 5000, label: 'Méga'     },
}

const PAYMENT_NUMBERS = {
  mtn_money:    { number: '675 71 27 39', label: 'MTN Mobile Money' },
  orange_money: { number: '690 82 37 42', label: 'Orange Money' },
}

const DEFAULT_CHAPTER_COST = 5

// ══════════════════════════════════════════════════════
// Helper : récupérer ou créer le wallet d'un user
// ══════════════════════════════════════════════════════
async function getOrCreateWallet(userId, transaction = null) {
  const [wallet] = await CoinWallet.findOrCreate({
    where: { userId },
    defaults: { userId, balance: 0, totalPurchased: 0, totalSpent: 0 },
    transaction,
  })
  return wallet
}

// ── GET /api/coins/packs — liste des packs + numéros ──
router.get('/packs', (req, res) => {
  res.json({
    packs: Object.values(COIN_PACKS),
    paymentNumbers: PAYMENT_NUMBERS,
    chapterCost: DEFAULT_CHAPTER_COST,
  })
})

// ── GET /api/coins/wallet — mon solde + stats ──
router.get('/wallet', protect, async (req, res, next) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id)
    res.json({ wallet })
  } catch (err) { next(err) }
})

// ── GET /api/coins/transactions — mon historique ──
router.get('/transactions', protect, async (req, res, next) => {
  try {
    const { limit = 50 } = req.query
    const transactions = await CoinTransaction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: Math.min(parseInt(limit), 100),
    })
    res.json({ transactions })
  } catch (err) { next(err) }
})

// ── POST /api/coins/purchase — demander un achat de coins ──
router.post('/purchase', protect, async (req, res, next) => {
  try {
    const { packId, paymentMethod, transactionId, whatsappNumber } = req.body

    // Validations
    const pack = COIN_PACKS[packId]
    if (!pack) return res.status(400).json({ error: 'Pack invalide' })
    if (!['mtn_money','orange_money'].includes(paymentMethod))
      return res.status(400).json({ error: 'Méthode de paiement invalide' })
    if (!transactionId || transactionId.trim().length < 3)
      return res.status(400).json({ error: 'ID de transaction requis' })

    // Vérifier qu'il n'y a pas déjà une demande pending pour cet ID
    const existing = await CoinPurchaseRequest.findOne({
      where: { transactionId: transactionId.trim(), status: 'pending' },
    })
    if (existing) return res.status(409).json({ error: 'Cet ID de transaction est déjà en cours de traitement' })

    const request = await CoinPurchaseRequest.create({
      userId: req.user.id,
      packId: pack.id,
      coinsAmount: pack.coins,
      bonusCoins: pack.bonus,
      totalCoins: pack.coins + pack.bonus,
      priceXAF: pack.priceXAF,
      paymentMethod,
      transactionId: transactionId.trim(),
      whatsappNumber: whatsappNumber || req.user.whatsapp || req.user.phone || null,
      status: 'pending',
    })

    res.status(201).json({
      request,
      message: 'Demande envoyée ! Notre équipe vérifie ton paiement et crédite tes coins sous peu.',
    })
  } catch (err) { next(err) }
})

// ── GET /api/coins/my-purchases — mes demandes d'achat ──
router.get('/my-purchases', protect, async (req, res, next) => {
  try {
    const purchases = await CoinPurchaseRequest.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 30,
    })
    res.json({ purchases })
  } catch (err) { next(err) }
})

// ══════════════════════════════════════════════════════
// POST /api/coins/unlock/:chapterId — débloquer un chapitre
// ══════════════════════════════════════════════════════
router.post('/unlock/:chapterId', protect, async (req, res, next) => {
  const t = await sequelize.transaction()
  try {
    const chapter = await Chapter.findByPk(req.params.chapterId, { transaction: t })
    if (!chapter) {
      await t.rollback()
      return res.status(404).json({ error: 'Chapitre introuvable' })
    }

    // Chapitre gratuit = pas besoin de débloquer
    if (chapter.accessTier !== 'premium') {
      await t.rollback()
      return res.status(400).json({ error: 'Ce chapitre est gratuit' })
    }

    // Déjà débloqué ?
    const already = await ChapterUnlock.findOne({
      where: { userId: req.user.id, chapterId: chapter.id },
      transaction: t,
    })
    if (already) {
      await t.rollback()
      return res.json({ alreadyUnlocked: true, message: 'Chapitre déjà débloqué' })
    }

    const cost = chapter.coinCost || DEFAULT_CHAPTER_COST

    // Vérifier le solde
    const wallet = await getOrCreateWallet(req.user.id, t)
    if (wallet.balance < cost) {
      await t.rollback()
      return res.status(402).json({
        error: 'Solde insuffisant',
        needed: cost,
        balance: wallet.balance,
        missing: cost - wallet.balance,
      })
    }

    // Déduire les coins
    const newBalance = wallet.balance - cost
    await wallet.update({
      balance: newBalance,
      totalSpent: wallet.totalSpent + cost,
    }, { transaction: t })

    // Créer le déblocage
    await ChapterUnlock.create({
      userId: req.user.id,
      chapterId: chapter.id,
      mangaId: chapter.mangaId,
      coinsSpent: cost,
    }, { transaction: t })

    // Transaction de débit
    await CoinTransaction.create({
      userId: req.user.id,
      type: 'unlock',
      amount: -cost,
      balanceAfter: newBalance,
      description: `Déblocage chapitre ${chapter.chapterNumber}`,
      chapterId: chapter.id,
      mangaId: chapter.mangaId,
    }, { transaction: t })

    // ── Créditer l'éditeur (revenus) ──
    const manga = await Manga.findByPk(chapter.mangaId, { transaction: t })
    if (manga && manga.authorId && manga.authorId !== req.user.id) {
      // L'éditeur touche 70% des coins dépensés (30% plateforme)
      const editorShare = Math.floor(cost * 0.7)
      const author = await User.findByPk(manga.authorId, { transaction: t })
      if (author) {
        await author.update({
          coinsEarned: (author.coinsEarned || 0) + editorShare,
          coinsBalance: (author.coinsBalance || 0) + editorShare,
        }, { transaction: t })

        await CoinTransaction.create({
          userId: author.id,
          type: 'earning',
          amount: editorShare,
          balanceAfter: (author.coinsBalance || 0) + editorShare,
          description: `Revenu : chapitre ${chapter.chapterNumber} débloqué`,
          chapterId: chapter.id,
          mangaId: chapter.mangaId,
        }, { transaction: t })
      }
    }

    await t.commit()
    res.json({
      success: true,
      newBalance,
      message: `Chapitre débloqué ! (-${cost} coins)`,
    })
  } catch (err) {
    await t.rollback()
    next(err)
  }
})

// ── GET /api/coins/unlocks/:mangaId — mes chapitres débloqués d'un manga ──
router.get('/unlocks/:mangaId', protect, async (req, res, next) => {
  try {
    const unlocks = await ChapterUnlock.findAll({
      where: { userId: req.user.id, mangaId: req.params.mangaId },
      attributes: ['chapterId', 'coinsSpent', 'createdAt'],
    })
    res.json({ unlockedChapterIds: unlocks.map(u => u.chapterId) })
  } catch (err) { next(err) }
})

module.exports = router