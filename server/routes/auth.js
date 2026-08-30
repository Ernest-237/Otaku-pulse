// server/routes/auth.js
const express = require('express')
const { body, validationResult } = require('express-validator')
const { User } = require('../models/index')
const { protect, generateTokens } = require('../middleware/auth')
const { sendPasswordReset, sendWelcome } = require('../utils/mailer')
const { verifyGoogleIdToken, isGoogleAuthEnabled } = require('../services/googleAuth')
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

// POST /api/auth/accept-policy — validation de la politique de confidentialité/utilisation
const CURRENT_POLICY_VERSION = '1.0'
router.post('/accept-policy', protect, async (req, res, next) => {
  try {
    const policyAcceptanceId = `CGU-${Date.now().toString(36).toUpperCase()}`
    await req.user.update({
      hasAcceptedPolicy: true,
      policyAcceptedAt: new Date(),
      policyVersion: CURRENT_POLICY_VERSION,
      policyAcceptanceId,
    })
    res.json({ user: req.user.toJSON() })
  } catch (err) { next(err) }
})

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


// ══════════════════════════════════════════════════════
// CONNEXION GOOGLE
// ══════════════════════════════════════════════════════

// Le pseudo doit respecter la contrainte du modèle : 3-20 caractères, uniquement
// [a-zA-Z0-9_-]. Un nom Google comme "Ernest Tsimi Patrick" ou "José Ngué" ne
// passe pas tel quel — on translittère, on nettoie, puis on suffixe si le pseudo
// est déjà pris.
async function generateUniquePseudo(profile) {
  const base = (profile.givenName || profile.name || profile.email.split('@')[0] || 'otaku')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // retire les accents
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 14) || 'otaku'
  const root = base.length >= 3 ? base : (base + 'otaku').slice(0, 14)

  if (!(await User.findOne({ where: { pseudo: root } }))) return root
  // Jusqu'à 50 tentatives déterministes, puis repli sur un suffixe temporel.
  for (let i = 2; i <= 50; i++) {
    const candidate = `${root}${i}`.slice(0, 20)
    if (!(await User.findOne({ where: { pseudo: candidate } }))) return candidate
  }
  return `${root.slice(0, 12)}${Date.now().toString(36).slice(-6)}`.slice(0, 20)
}

// GET /api/auth/google/config — le front sait s'il doit afficher le bouton
router.get('/google/config', (req, res) => {
  res.json({ enabled: isGoogleAuthEnabled(), clientId: process.env.GOOGLE_CLIENT_ID || null })
})

// POST /api/auth/google — connexion / inscription via un ID token Google
router.post('/google', async (req, res, next) => {
  try {
    if (!isGoogleAuthEnabled())
      return res.status(503).json({ error: "La connexion Google n'est pas activée sur ce serveur." })

    const { credential } = req.body
    let profile
    try {
      profile = await verifyGoogleIdToken(credential)
    } catch (err) {
      // Message déjà en français et compréhensible, remonté tel quel.
      return res.status(401).json({ error: err.message })
    }

    // 1. Compte déjà lié à ce compte Google
    let user = await User.findOne({ where: { googleId: profile.googleId } })
    let created = false

    // 2. Sinon, un compte existe-t-il avec cette adresse ? L'email Google est
    //    vérifié (contrôlé dans le service), le rattachement est donc sûr :
    //    l'utilisateur prouve qu'il possède bien cette adresse.
    if (!user) {
      user = await User.findOne({ where: { email: profile.email } })
      if (user) {
        await user.update({
          googleId:   profile.googleId,
          isVerified: true,
          avatar:     user.avatar || profile.picture || '',
        })
      }
    }

    // 3. Sinon, création du compte
    if (!user) {
      user = await User.create({
        pseudo:       await generateUniquePseudo(profile),
        email:        profile.email,
        password:     null,                 // aucun mot de passe : connexion Google uniquement
        firstName:    profile.givenName  || null,
        lastName:     profile.familyName || null,
        avatar:       profile.picture    || '',
        googleId:     profile.googleId,
        authProvider: 'google',
        isVerified:   true,
      })
      created = true
      sendWelcome(user).catch(e => console.error('❌ Email bienvenue:', e.message))
    }

    if (user.isBanned) return res.status(403).json({ error: 'Compte suspendu.' })

    const { accessToken, refreshToken } = generateTokens(user.id)
    await user.update({
      refreshToken,
      lastLogin:  new Date(),
      loginCount: (user.loginCount || 0) + 1,
    })

    res.status(created ? 201 : 200).json({
      message: created ? 'Compte créé via Google.' : 'Connexion réussie.',
      created, accessToken, refreshToken, user: user.toJSON(),
    })
  } catch (err) { next(err) }
})

module.exports = router