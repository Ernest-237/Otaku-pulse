// server/routes/events.js — Sequelize
const express = require('express');
const { Event, EventRegistration, User } = require('../models/index');
const { protect, restrictTo } = require('../middleware/auth');
const router  = express.Router();

// ── Helper : normalise imageUrl (data URL → imageData/imageMime) ──
// même convention que server/routes/blog.js
function normalizeImageFields(body) {
  const out = { ...body };
  if (typeof out.imageUrl === 'string' && out.imageUrl.startsWith('data:')) {
    const match = out.imageUrl.match(/^data:([^;]+);base64,(.*)$/s);
    if (match) { out.imageMime = match[1]; out.imageData = match[2]; out.imageUrl = null; }
  }
  return out;
}
const withImageUrl = (event) => {
  const j = event.toJSON ? event.toJSON() : { ...event };
  if (!j.imageUrl && j.imageMime) j.imageUrl = `/api/events/${j.id}/image`;
  delete j.imageData;
  return j;
};

// GET /api/events
router.get('/', async (req, res, next) => {
  try {
    const { status, city, limit = 10 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (city)   where.city   = city;
    const events = await Event.findAll({
      where, order: [['date','ASC']], limit: parseInt(limit),
      attributes: { exclude: ['imageData'] },
    });
    res.json({ events: events.map(withImageUrl) });
  } catch (err) { next(err); }
});

// GET /api/events/:id/image — sert l'image base64 d'un événement
router.get('/:id/image', async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id, { attributes: ['imageData','imageMime'] });
    if (!event || !event.imageData) return res.status(404).send('No image');
    const buffer = Buffer.from(event.imageData, 'base64');
    res.set('Content-Type', event.imageMime || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err) { next(err); }
});

// GET /api/events/mine — mes inscriptions ("mes billets")
router.get('/mine', protect, async (req, res, next) => {
  try {
    const registrations = await EventRegistration.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [{ model: Event, as: 'event', attributes: { exclude: ['imageData'] } }],
    });
    res.json({ registrations: registrations.map(r => {
      const j = r.toJSON()
      if (j.event) j.event = withImageUrl(j.event)
      return j
    }) });
  } catch (err) { next(err); }
});

// DELETE /api/events/registrations/:id — annuler son inscription
router.delete('/registrations/:id', protect, async (req, res, next) => {
  try {
    const reg = await EventRegistration.findByPk(req.params.id);
    if (!reg) return res.status(404).json({ error: 'Inscription introuvable.' });
    const isAdmin = ['admin','superadmin'].includes(req.user.role);
    if (reg.userId !== req.user.id && !isAdmin) return res.status(403).json({ error: 'Non autorisé.' });

    if (reg.status === 'confirmed') {
      const event = await Event.findByPk(reg.eventId);
      if (event) await event.decrement('registered', { by: reg.guests || 1 });
    }
    await reg.destroy();
    res.json({ message: 'Inscription annulée.' });
  } catch (err) { next(err); }
});

// GET /api/events/:id
router.get('/:id', async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      attributes: { exclude: ['imageData'] },
      include: [{ model: EventRegistration, as: 'registrations',
        include: [{ model: User, as: 'user', attributes: ['id','pseudo','avatar'] }],
      }],
    });
    if (!event) return res.status(404).json({ error: 'Événement introuvable.' });
    res.json({ event: withImageUrl(event) });
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
    const event = await Event.create(normalizeImageFields(req.body));
    res.status(201).json({ event: withImageUrl(event) });
  } catch (err) { next(err); }
});

// PATCH /api/events/:id — admin
router.patch('/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Événement introuvable.' });
    await event.update(normalizeImageFields(req.body));
    res.json({ event: withImageUrl(event) });
  } catch (err) { next(err); }
});

module.exports = router;