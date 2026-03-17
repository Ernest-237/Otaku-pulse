// server/routes/auth.js — PostgreSQL/Sequelize
const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models/index');
const { protect, generateTokens } = require('../middleware/auth');
const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Données invalides', details: errors.array() });
  next();
};

// POST /api/auth/register
router.post('/register', [
  body('pseudo').trim().isLength({min:3,max:20}).matches(/^[a-zA-Z0-9_-]+$/),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({min:8}),
  validate,
], async (req, res, next) => {
  try {
    const { pseudo, email, password } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email déjà utilisé.' });
    const existingPseudo = await User.findOne({ where: { pseudo } });
    if (existingPseudo) return res.status(409).json({ error: 'Pseudo déjà pris.' });

    const user = await User.create({ pseudo, email, password });
    const { accessToken, refreshToken } = generateTokens(user.id);

    await user.update({ refreshToken, lastLogin: new Date(), loginCount: 1 });

    res.status(201).json({ message: 'Compte créé.', accessToken, refreshToken, user: user.toJSON() });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
], async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }
    if (user.isBanned) return res.status(403).json({ error: 'Compte suspendu.' });

    const { accessToken, refreshToken } = generateTokens(user.id);
    await user.update({ refreshToken, lastLogin: new Date(), loginCount: (user.loginCount || 0) + 1 });

    res.json({ message: 'Connexion réussie.', accessToken, refreshToken, user: user.toJSON() });
  } catch (err) { next(err); }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token manquant.' });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Refresh token invalide.' });
    }
    const tokens = generateTokens(user.id);
    await user.update({ refreshToken: tokens.refreshToken });
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Session expirée.' });
  }
});

// POST /api/auth/logout
router.post('/logout', protect, async (req, res, next) => {
  try {
    await req.user.update({ refreshToken: null });
    res.json({ message: 'Déconnexion réussie.' });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => res.json({ user: req.user.toJSON() }));

// POST /api/auth/forgot-password
router.post('/forgot-password', [body('email').isEmail().normalizeEmail(), validate], async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user) return res.json({ message: 'Si cet email existe, un lien a été envoyé.' });
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    await user.update({
      passwordResetToken: crypto.createHash('sha256').update(resetToken).digest('hex'),
      passwordResetExpiry: new Date(Date.now() + 15 * 60 * 1000),
    });
    // TODO: await sendPasswordResetEmail(user, resetToken);
    console.log(`🔑 Reset token (${user.email}): ${resetToken}`);
    res.json({ message: 'Si cet email existe, un lien a été envoyé.' });
  } catch (err) { next(err); }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', [body('password').isLength({min:8}), validate], async (req, res, next) => {
  try {
    const crypto = require('crypto');
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const { Op } = require('sequelize');
    const user = await User.findOne({
      where: { passwordResetToken: hashed, passwordResetExpiry: { [Op.gt]: new Date() } },
    });
    if (!user) return res.status(400).json({ error: 'Token invalide ou expiré.' });
    await user.update({ password: req.body.password, passwordResetToken: null, passwordResetExpiry: null });
    res.json({ message: 'Mot de passe modifié.' });
  } catch (err) { next(err); }
});

module.exports = router;