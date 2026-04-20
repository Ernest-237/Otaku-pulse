// server/routes/auth.js
const express = require('express')
const { body, validationResult } = require('express-validator')
const { User } = require('../models/index')
const { protect, generateTokens } = require('../middleware/auth')
const { sendPasswordReset, sendWelcome } = require('../utils/mailer')
const router = express.Router()

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Données invalides', details: errors.array() })
  next()
}

// POST /api/auth/register
router.post('/register', [
  body('pseudo').trim().isLength({min:3,max:20}).matches(/^[a-zA-Z0-9_-]+$/),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({min:8}),
  validate,
], async (req, res, next) => {
  try {
    const { pseudo, email, password } = req.body
    if (await User.findOne({ where: { email } }))
      return res.status(409).json({ error: 'Email déjà utilisé.' })
    if (await User.findOne({ where: { pseudo } }))
      return res.status(409).json({ error: 'Pseudo déjà pris.' })
    const user = await User.create({ pseudo, email, password })
    const { accessToken, refreshToken } = generateTokens(user.id)
    await user.update({ refreshToken, lastLogin: new Date(), loginCount: 1 })
    // Email de bienvenue non bloquant
    sendWelcome(user).catch(e => console.error('❌ Email bienvenue:', e.message))
    res.status(201).json({ message: 'Compte créé.', accessToken, refreshToken, user: user.toJSON() })
  } catch (err) { next(err) }
})

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
], async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ where: { email } })
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' })
    if (user.isBanned) return res.status(403).json({ error: 'Compte suspendu.' })
    const { accessToken, refreshToken } = generateTokens(user.id)
    await user.update({ refreshToken, lastLogin: new Date(), loginCount: (user.loginCount||0)+1 })
    res.json({ message: 'Connexion réussie.', accessToken, refreshToken, user: user.toJSON() })
  } catch (err) { next(err) }
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token manquant.' })
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const user = await User.findByPk(decoded.id)
    if (!user || user.refreshToken !== refreshToken)
      return res.status(401).json({ error: 'Refresh token invalide.' })
    const tokens = generateTokens(user.id)
    await user.update({ refreshToken: tokens.refreshToken })
    res.json(tokens)
  } catch { res.status(401).json({ error: 'Session expirée.' }) }
})

// POST /api/auth/logout
router.post('/logout', protect, async (req, res, next) => {
  try { await req.user.update({ refreshToken: null }); res.json({ message: 'Déconnexion réussie.' }) }
  catch (err) { next(err) }
})

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json({ user: req.user.toJSON() }))

// POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(), validate
], async (req, res, next) => {
  try {
    // Réponse générique (sécurité — ne pas révéler si l'email existe)
    res.json({ message: 'Si cet email existe, un code de réinitialisation a été envoyé.' })
    const user = await User.findOne({ where: { email: req.body.email } })
    if (!user) return
    const crypto = require('crypto')
    // Code 6 chiffres simple (pas de lien)
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const hashed = crypto.createHash('sha256').update(code).digest('hex')
    await user.update({
      passwordResetToken: hashed,
      passwordResetExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 min
    })
    sendPasswordReset(user, code).catch(e => console.error('❌ Email reset:', e.message))
    console.log(`🔑 Code reset (${user.email}): ${code}`)
  } catch (err) { next(err) }
})

// POST /api/auth/reset-password — avec le code à 6 chiffres
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('code').isLength({min:6, max:6}),
  body('password').isLength({min:8}),
  validate,
], async (req, res, next) => {
  try {
    const crypto = require('crypto')
    const { email, code, password } = req.body
    const hashed = crypto.createHash('sha256').update(code).digest('hex')
    const { Op } = require('sequelize')
    const user = await User.findOne({
      where: {
        email,
        passwordResetToken: hashed,
        passwordResetExpiry: { [Op.gt]: new Date() }
      }
    })
    if (!user) return res.status(400).json({ error: 'Code invalide ou expiré. Veuillez réessayer.' })
    await user.update({ password, passwordResetToken: null, passwordResetExpiry: null })
    res.json({ message: 'Mot de passe modifié avec succès !' })
  } catch (err) { next(err) }
})

module.exports = router