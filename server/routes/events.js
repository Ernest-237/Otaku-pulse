// server/routes/events.js — Sequelize
const express = require('express');
const { Event, EventRegistration, User } = require('../models/index');
const { protect, restrictTo } = require('../middleware/auth');
const router  = express.Router();

// GET /api/events
router.get('/', async (req, res, next) => {
  try {
    const { status, city, limit = 10 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (city)   where.city   = city;
    const events = await Event.findAll({ where, order: [['date','ASC']], limit: parseInt(limit) });
    res.json({ events });
  } catch (err) { next(err); }
});

// GET /api/events/:id
router.get('/:id', async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [{ model: EventRegistration, as: 'registrations',
        include: [{ model: User, as: 'user', attributes: ['id','pseudo','avatar'] }],
      }],
    });
    if (!event) return res.status(404).json({ error: 'Événement introuvable.' });
    res.json({ event });
  } catch (err) { next(err); }
});

// POST /api/events/register
router.post('/register', protect, async (req, res, next) => {
  try {
    const { eventId, guests = 1 } = req.body;
    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).json({ error: 'Événement introuvable.' });

    const already = await EventRegistration.findOne({ where: { eventId, userId: req.user.id } });
    if (already) return res.status(409).json({ error: 'Déjà inscrit.' });

    const isFull  = event.registered >= event.capacity;
    const status  = isFull ? 'waitlist' : 'confirmed';

    await EventRegistration.create({
      eventId, userId: req.user.id,
      name:  `${req.user.firstName || ''} ${req.user.lastName || req.user.pseudo}`.trim(),
      email: req.user.email,
      phone: req.user.phone,
      guests, status,
    });

    if (!isFull) await event.increment('registered', { by: guests });

    res.json({
      message: isFull ? "Ajouté en liste d'attente." : 'Inscription confirmée !',
      status,
    });
  } catch (err) { next(err); }
});

// POST /api/events — admin
router.post('/', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json({ event });
  } catch (err) { next(err); }
});

// PATCH /api/events/:id — admin
router.patch('/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Événement introuvable.' });
    await event.update(req.body);
    res.json({ event });
  } catch (err) { next(err); }
});

module.exports = router;