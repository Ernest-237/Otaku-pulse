// server/routes/contact.js — Sequelize
const express = require('express');
const { body, validationResult } = require('express-validator');
const { Contact } = require('../models/index');
const { protect, restrictTo } = require('../middleware/auth');
const router  = express.Router();

const validate = (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ error: 'Données invalides', details: errs.array() });
  next();
};

// POST /api/contact
router.post('/', [
  body('nom').trim().notEmpty(),
  body('prenom').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty(),
  body('pack').isIn(['genin','chunin','hokage','custom']),
  body('theme').notEmpty(),
  body('guests').isInt({ min: 1 }),
  body('date').isISO8601(),
  body('ville').notEmpty(),
  validate,
], async (req, res, next) => {
  try {
    const contact = await Contact.create({ ...req.body, date: new Date(req.body.date) });
    // TODO: await sendBookingConfirmation(contact);
    console.log(`📬 Réservation : ${contact.prenom} ${contact.nom} — Pack ${contact.pack}`);
    res.status(201).json({ message: 'Demande reçue ! Réponse sous 24h.', id: contact.id });
  } catch (err) { next(err); }
});

// GET /api/contact — admin
router.get('/', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const { status, pack, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (pack)   where.pack   = pack;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { rows: contacts, count: total } = await Contact.findAndCountAll({
      where, order: [['createdAt','DESC']], limit: parseInt(limit), offset,
    });
    res.json({ contacts, total, page: parseInt(page) });
  } catch (err) { next(err); }
});

// PATCH /api/contact/:id/status — admin
router.patch('/:id/status', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Demande introuvable.' });
    await contact.update({ status: req.body.status, adminNotes: req.body.adminNotes });
    res.json({ contact });
  } catch (err) { next(err); }
});

module.exports = router;