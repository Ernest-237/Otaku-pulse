// server/routes/newsletter.js — Sequelize
const express = require('express');
const { Newsletter, User } = require('../models/index');
const router = express.Router();

router.post('/subscribe', async (req, res, next) => {
  try {
    const { email, lang = 'fr', source } = req.body;
    if (!email?.includes('@')) return res.status(400).json({ error: 'Email invalide.' });

    const [sub, created] = await Newsletter.findOrCreate({
      where: { email: email.toLowerCase() },
      defaults: { isActive: true, lang, source },
    });
    if (!created) await sub.update({ isActive: true });

    // Sync avec User si compte existant
    await User.update({ newsletterSubscribed: true }, { where: { email: email.toLowerCase() } });

    console.log(`📧 Newsletter: ${email}`);
    res.json({ message: 'Abonnement confirmé ! Bienvenue dans la communauté.' });
  } catch (err) { next(err); }
});

router.post('/unsubscribe', async (req, res, next) => {
  try {
    await Newsletter.update({ isActive: false }, { where: { email: req.body.email?.toLowerCase() } });
    await User.update({ newsletterSubscribed: false }, { where: { email: req.body.email?.toLowerCase() } });
    res.json({ message: 'Désabonnement effectué.' });
  } catch (err) { next(err); }
});

module.exports = router;