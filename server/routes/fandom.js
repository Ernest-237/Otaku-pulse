// server/routes/fandom.js — FANDOM Otaku Fest West
// Cosplay (upload + votes), Quizz (questions + scores), Mini-jeux (scores), Classements
const router = require('express').Router()
const { Op, fn, col } = require('sequelize')
const {
  sequelize, CosplayEntry, CosplayVote, QuizQuestion, QuizScore, GameScore, User,
} = require('../models/index')
const { protect, restrictTo } = require('../middleware/auth')

// Helper : reconstruit l'URL image d'un cosplay
const cosplayUrl = (id) => `/api/fandom/cosplay/${id}/image`

/* ══════════════════════════════════════════════════════
   COSPLAY
   ══════════════════════════════════════════════════════ */

// GET /api/fandom/cosplay — liste des cosplays approuvés (+ si je les ai votés)
router.get('/cosplay', async (req, res, next) => {
  try {
    const entries = await CosplayEntry.findAll({
      where: { status: 'approved' },
      order: [['voteCount', 'DESC'], ['createdAt', 'DESC']],
      attributes: { exclude: ['imageData'] },
    })

    // Si user connecté, marquer ceux qu'il a votés
    let votedIds = []
    if (req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken')
        const token = req.headers.authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const votes = await CosplayVote.findAll({ where: { userId: decoded.id }, attributes: ['entryId'] })
        votedIds = votes.map(v => v.entryId)
      } catch (_) {}
    }

    const result = entries.map(e => {
      const j = e.toJSON()
      j.imageUrl = cosplayUrl(j.id)
      j.hasVoted = votedIds.includes(j.id)
      return j
    })
    res.json({ entries: result })
  } catch (err) { next(err) }
})

// GET /api/fandom/cosplay/:id/image — sert la photo cosplay
router.get('/cosplay/:id/image', async (req, res, next) => {
  try {
    const entry = await CosplayEntry.findByPk(req.params.id, { attributes: ['imageData','imageMime'] })
    if (!entry || !entry.imageData) return res.status(404).send('No image')
    const buffer = Buffer.from(entry.imageData, 'base64')
    res.set('Content-Type', entry.imageMime || 'image/jpeg')
    res.set('Cache-Control', 'public, max-age=3600')
    res.send(buffer)
  } catch (err) { next(err) }
})

// POST /api/fandom/cosplay — soumettre son cosplay (user connecté)
router.post('/cosplay', protect, async (req, res, next) => {
  try {
    const { characterName, animeName, description, imageData, imageMime } = req.body
    if (!characterName || !imageData) {
      return res.status(400).json({ error: 'Personnage et photo requis' })
    }
    const entry = await CosplayEntry.create({
      userId: req.user.id,
      pseudo: req.user.pseudo,
      characterName, animeName, description,
      imageData, imageMime: imageMime || 'image/jpeg',
      status: 'approved', // direct visible. Mets 'pending' si tu veux modérer avant
    })
    const j = entry.toJSON(); delete j.imageData
    j.imageUrl = cosplayUrl(j.id)
    res.status(201).json({ entry: j })
  } catch (err) { next(err) }
})

// POST /api/fandom/cosplay/:id/vote — voter / retirer son vote (toggle)
router.post('/cosplay/:id/vote', protect, async (req, res, next) => {
  const t = await sequelize.transaction()
  try {
    const entry = await CosplayEntry.findByPk(req.params.id, { transaction: t })
    if (!entry) { await t.rollback(); return res.status(404).json({ error: 'Cosplay introuvable' }) }

    // Interdire de voter pour soi-même
    if (entry.userId === req.user.id) {
      await t.rollback()
      return res.status(400).json({ error: 'Tu ne peux pas voter pour ton propre cosplay 😅' })
    }

    const existing = await CosplayVote.findOne({
      where: { userId: req.user.id, entryId: entry.id }, transaction: t,
    })

    if (existing) {
      await existing.destroy({ transaction: t })
      await CosplayEntry.decrement('voteCount', { where: { id: entry.id }, transaction: t })
      await t.commit()
      return res.json({ voted: false, message: 'Vote retiré' })
    } else {
      await CosplayVote.create({ userId: req.user.id, entryId: entry.id }, { transaction: t })
      await CosplayEntry.increment('voteCount', { where: { id: entry.id }, transaction: t })
      await t.commit()
      return res.json({ voted: true, message: 'Vote enregistré ❤️' })
    }
  } catch (err) { await t.rollback(); next(err) }
})

// DELETE /api/fandom/cosplay/:id — supprimer (proprio ou admin)
router.delete('/cosplay/:id', protect, async (req, res, next) => {
  try {
    const entry = await CosplayEntry.findByPk(req.params.id)
    if (!entry) return res.status(404).json({ error: 'Introuvable' })
    const isAdmin = ['admin','superadmin'].includes(req.user.role)
    if (entry.userId !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: 'Non autorisé' })
    }
    await entry.destroy()
    res.json({ message: 'Cosplay supprimé' })
  } catch (err) { next(err) }
})

// GET /api/fandom/cosplay/leaderboard — top cosplays par votes
router.get('/cosplay/leaderboard', async (req, res, next) => {
  try {
    const top = await CosplayEntry.findAll({
      where: { status: 'approved' },
      order: [['voteCount', 'DESC']],
      limit: 20,
      attributes: { exclude: ['imageData'] },
    })
    res.json({ leaderboard: top.map(e => { const j = e.toJSON(); j.imageUrl = cosplayUrl(j.id); return j }) })
  } catch (err) { next(err) }
})

/* ══════════════════════════════════════════════════════
   QUIZ
   ══════════════════════════════════════════════════════ */

// GET /api/fandom/quiz/questions — questions pour jouer (SANS la bonne réponse)
router.get('/quiz/questions', async (req, res, next) => {
  try {
    const { category, limit = 10 } = req.query
    const where = { isActive: true }
    if (category && category !== 'all') where.category = category
    const questions = await QuizQuestion.findAll({
      where, order: sequelize.random(), limit: parseInt(limit),
      attributes: ['id', 'question', 'options', 'category', 'difficulty', 'points'], // PAS correctIndex
    })
    res.json({ questions })
  } catch (err) { next(err) }
})

// POST /api/fandom/quiz/submit — soumettre les réponses, calculer le score
router.post('/quiz/submit', protect, async (req, res, next) => {
  try {
    const { answers } = req.body // [{ questionId, answerIndex }]
    if (!Array.isArray(answers) || !answers.length) {
      return res.status(400).json({ error: 'Aucune réponse fournie' })
    }
    const ids = answers.map(a => a.questionId)
    const questions = await QuizQuestion.findAll({ where: { id: ids } })
    const qMap = {}
    questions.forEach(q => { qMap[q.id] = q })

    let score = 0, correct = 0
    const details = answers.map(a => {
      const q = qMap[a.questionId]
      if (!q) return { questionId: a.questionId, correct: false }
      const isCorrect = q.correctIndex === a.answerIndex
      if (isCorrect) { score += q.points; correct++ }
      return { questionId: a.questionId, correct: isCorrect, correctIndex: q.correctIndex }
    })

    // Mettre à jour le meilleur score
    let scoreRow = await QuizScore.findOne({ where: { userId: req.user.id } })
    if (!scoreRow) {
      scoreRow = await QuizScore.create({
        userId: req.user.id, pseudo: req.user.pseudo,
        bestScore: score, totalGames: 1, totalCorrect: correct, lastPlayedAt: new Date(),
      })
    } else {
      await scoreRow.update({
        bestScore: Math.max(scoreRow.bestScore, score),
        totalGames: scoreRow.totalGames + 1,
        totalCorrect: scoreRow.totalCorrect + correct,
        lastPlayedAt: new Date(),
      })
    }

    res.json({ score, correct, total: answers.length, details, bestScore: scoreRow.bestScore })
  } catch (err) { next(err) }
})

// GET /api/fandom/quiz/leaderboard — classement quiz
router.get('/quiz/leaderboard', async (req, res, next) => {
  try {
    const top = await QuizScore.findAll({
      order: [['bestScore', 'DESC'], ['totalCorrect', 'DESC']],
      limit: 20,
      include: [{ model: User, as: 'user', attributes: ['pseudo', 'avatar'] }],
    })
    res.json({ leaderboard: top })
  } catch (err) { next(err) }
})

/* ══════════════════════════════════════════════════════
   MINI-JEUX (scores génériques)
   ══════════════════════════════════════════════════════ */

// POST /api/fandom/games/:gameKey/score — enregistrer un score
router.post('/games/:gameKey/score', protect, async (req, res, next) => {
  try {
    const { score } = req.body
    const { gameKey } = req.params
    if (typeof score !== 'number') return res.status(400).json({ error: 'Score invalide' })

    let row = await GameScore.findOne({ where: { userId: req.user.id, gameKey } })
    if (!row) {
      row = await GameScore.create({
        userId: req.user.id, pseudo: req.user.pseudo, gameKey,
        bestScore: score, totalPlays: 1, lastPlayedAt: new Date(),
      })
    } else {
      await row.update({
        bestScore: Math.max(row.bestScore, score),
        totalPlays: row.totalPlays + 1,
        lastPlayedAt: new Date(),
      })
    }
    res.json({ bestScore: row.bestScore, totalPlays: row.totalPlays })
  } catch (err) { next(err) }
})

// GET /api/fandom/games/:gameKey/leaderboard — classement d'un mini-jeu
router.get('/games/:gameKey/leaderboard', async (req, res, next) => {
  try {
    const top = await GameScore.findAll({
      where: { gameKey: req.params.gameKey },
      order: [['bestScore', 'DESC']],
      limit: 20,
      include: [{ model: User, as: 'user', attributes: ['pseudo', 'avatar'] }],
    })
    res.json({ leaderboard: top })
  } catch (err) { next(err) }
})

/* ══════════════════════════════════════════════════════
   ADMIN — Gestion des questions quiz
   ══════════════════════════════════════════════════════ */

// GET /api/fandom/admin/questions — toutes les questions (avec réponses)
router.get('/admin/questions', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const questions = await QuizQuestion.findAll({ order: [['createdAt', 'DESC']] })
    res.json({ questions })
  } catch (err) { next(err) }
})

// POST /api/fandom/admin/questions — créer une question
router.post('/admin/questions', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const q = await QuizQuestion.create(req.body)
    res.status(201).json({ question: q })
  } catch (err) { next(err) }
})

// PATCH /api/fandom/admin/questions/:id
router.patch('/admin/questions/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const q = await QuizQuestion.findByPk(req.params.id)
    if (!q) return res.status(404).json({ error: 'Question introuvable' })
    await q.update(req.body)
    res.json({ question: q })
  } catch (err) { next(err) }
})

// DELETE /api/fandom/admin/questions/:id
router.delete('/admin/questions/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    await QuizQuestion.destroy({ where: { id: req.params.id } })
    res.json({ message: 'Question supprimée' })
  } catch (err) { next(err) }
})

// GET /api/fandom/admin/cosplay — tous les cosplays (modération)
router.get('/admin/cosplay', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const entries = await CosplayEntry.findAll({
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['imageData'] },
    })
    res.json({ entries: entries.map(e => { const j = e.toJSON(); j.imageUrl = cosplayUrl(j.id); return j }) })
  } catch (err) { next(err) }
})

// PATCH /api/fandom/admin/cosplay/:id — modérer un cosplay
router.patch('/admin/cosplay/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const entry = await CosplayEntry.findByPk(req.params.id)
    if (!entry) return res.status(404).json({ error: 'Introuvable' })
    await entry.update({ status: req.body.status, adminNotes: req.body.adminNotes })
    res.json({ message: 'Cosplay modéré' })
  } catch (err) { next(err) }
})

module.exports = router