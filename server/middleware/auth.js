// server/middleware/auth.js — Sequelize version
const jwt  = require('jsonwebtoken');
const { User } = require('../models/index');

exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token manquant.' });
    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findByPk(decoded.id);
    if (!user)        return res.status(401).json({ error: 'Utilisateur introuvable.' });
    if (user.isBanned) return res.status(403).json({ error: 'Compte suspendu.' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Session expirée.' });
    return res.status(401).json({ error: 'Token invalide.' });
  }
};

exports.optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id);
    }
  } catch (_) {}
  next();
};

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!req.user)               return res.status(401).json({ error: 'Non authentifié.' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Accès refusé.' });
  next();
};

exports.generateTokens = (userId) => ({
  accessToken:  jwt.sign({ id: userId }, process.env.JWT_SECRET,         { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }),
  refreshToken: jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }),
});