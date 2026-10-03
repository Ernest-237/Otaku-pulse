// server/routes/events.js — Sequelize
const express = require('express');
const models = require('../models/index');
const { Event, EventRegistration, User, sequelize } = models;
const { Op } = require('sequelize');
const { normalizeImageFields, versionedImage } = require('../utils/media');
const { eventPayload, pagination } = require('../utils/publication');
const { registerEvent, cameroonToday } = require('../services/eventBooking');
const { protect, restrictTo } = require('../middleware/auth');
const { sendTicketConfirmed } = require('../utils/mailer');
const router  = express.Router();

// ── Helper : normalise imageUrl (data URL → imageData/imageMime) ──
// même convention que server/routes/blog.js

const withImageUrl = (event) => {
  const j = event.toJSON ? event.toJSON() : { ...event };
  if (!j.imageUrl && j.imageMime) j.imageUrl = versionedImage(`/api/events/${j.id}/image`, j.updatedAt);
  delete j.imageData;
  return j;
};

// GET /api/events
router.get('/', async (req, res, next) => {
  try {
    const { status, city, limit = 10 } = req.query;
    const where = { status: { [Op.ne]: 'draft' } };
    if (req.query.period === 'upcoming') { where.date = { [Op.gte]: cameroonToday() }; where.status = ['upcoming','ongoing']; }
    if (req.query.period === 'past') where.date = { [Op.lt]: cameroonToday() };
    if (status && status !== 'draft') where.status = status;
    if (city)   where.city   = city;
    const { rows: events, count: total } = await Event.findAndCountAll({
      where, order: [['date','ASC']], limit: pagination(req.query, 24).limit, offset: pagination(req.query, 24).offset,
      attributes: { exclude: ['imageData'] },
    });
    res.json({ events: events.map(withImageUrl), total });
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

// GET /api/events/:id/registrations — admin, liste complète des inscrits (contact + paiement)
router.get('/:id/registrations', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const registrations = await EventRegistration.findAll({
      where: { eventId: req.params.id },
      order: [['createdAt', 'ASC']],
      include: [{ model: User, as: 'user', attributes: ['id','pseudo','avatar'] }],
    });
    res.json({ registrations });
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

    await sequelize.transaction(async transaction => {
      const event = await Event.findByPk(reg.eventId, { transaction, lock: transaction.LOCK.UPDATE });
      const current = await EventRegistration.findByPk(reg.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!current || current.status === 'cancelled') return;
      if (current.status === 'confirmed' && event) await event.update({ registered: Math.max(0, event.registered - (current.guests || 1)) }, { transaction });
      await current.update({ status: 'cancelled', ticketIssuedAt: null }, { transaction });
    });
    res.json({ message: 'Inscription annulée.' });
  } catch (err) { next(err); }
});

// PATCH /api/events/registrations/:id/confirm-payment — admin, accuse réception du paiement et émet le billet définitif
router.patch('/registrations/:id/confirm', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const entry = await EventRegistration.findByPk(req.params.id)
    if (!entry) return res.status(404).json({ error: 'Inscription introuvable.' })
    const registration = await sequelize.transaction(async transaction => {
      const event = await Event.findByPk(entry.eventId, { transaction, lock: transaction.LOCK.UPDATE })
      const reg = await EventRegistration.findByPk(entry.id, { transaction, lock: transaction.LOCK.UPDATE })
      if (!reg || !['waitlist','pending'].includes(reg.status)) throw Object.assign(new Error('Cette inscription ne peut pas être confirmée.'), { status: 400 })
      if (!event || !['upcoming','ongoing'].includes(event.status) || event.date < cameroonToday()) throw Object.assign(new Error('Les inscriptions sont fermées.'), { status: 400 })
      if (event.registered + reg.guests > event.capacity) throw Object.assign(new Error('Pas assez de places disponibles pour ce groupe.'), { status: 400 })
      const free = event.isFree || event.price === 0
      await reg.update({ status: 'confirmed', ...(free ? { paymentStatus: 'paid', paidAt: new Date(), ticketIssuedAt: new Date() } : {}) }, { transaction })
      await event.increment('registered', { by: reg.guests, transaction })
      return reg
    })
    res.json({ registration })
  } catch (err) { next(err) }
})

router.patch('/registrations/:id/confirm-payment', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const entry = await EventRegistration.findByPk(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Inscription introuvable.' });
    const result = await sequelize.transaction(async transaction => {
      // Même ordre de verrouillage que les réservations et annulations.
      const event = await Event.findByPk(entry.eventId, { transaction, lock: transaction.LOCK.UPDATE });
      const reg = await EventRegistration.findByPk(entry.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!reg || reg.status !== 'confirmed') throw Object.assign(new Error('Confirme une place avant de valider le paiement.'), { status: 400 });
      if (!event || ['draft', 'cancelled'].includes(event.status)) throw Object.assign(new Error('Cet événement ne peut pas émettre de billet.'), { status: 400 });
      if (reg.paymentStatus === 'paid') return { reg, event, repeated: true };
      const now = new Date();
      await reg.update({ paymentStatus: 'paid', paidAt: now, ticketIssuedAt: now }, { transaction });
      return { reg, event, repeated: false };
    });
    if (!result.repeated) {
      // Les notifications ne doivent jamais faire échouer un paiement déjà enregistré.
      Promise.resolve().then(async () => {
        const user = await User.findByPk(result.reg.userId);
        if (user) await sendTicketConfirmed(user, result.event, result.reg);
      }).catch(e => console.error('❌ Email billet:', e.message));
    }
    res.json({ message: result.repeated ? 'Paiement déjà confirmé.' : 'Paiement confirmé, billet disponible.', registration: result.reg });
  } catch (err) { next(err); }
});

router.get('/admin/list', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const { limit, offset } = pagination(req.query);
    const where = {};
    if (req.query.search) where.titleF = { [Op.iLike]: `%${req.query.search}%` };
    if (req.query.status) where.status = req.query.status;
    const { rows, count } = await Event.findAndCountAll({ where, limit, offset, order: [['date','DESC']], attributes: { exclude: ['imageData'] } });
    res.json({ events: rows.map(withImageUrl), total: count });
  } catch (err) { next(err); }
});

// GET /api/events/:id
router.get('/:id', async (req, res, next) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      attributes: { exclude: ['imageData'] },
    });
    if (!event || event.status === 'draft') return res.status(404).json({ error: 'Événement introuvable.' });
    res.json({ event: withImageUrl(event) });
  } catch (err) { next(err); }
});

// POST /api/events/register
router.post('/register', protect, async (req, res, next) => {
  try {
    res.json(await registerEvent(models, req.user, req.body));
  } catch (err) { next(err); }
});

// POST /api/events — admin
router.post('/', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const event = await Event.create(eventPayload(req.body));
    res.status(201).json({ event: withImageUrl(event) });
  } catch (err) { next(err); }
});

// PATCH /api/events/:id — admin
router.patch('/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const event = await sequelize.transaction(async transaction => {
      const current = await Event.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!current) throw Object.assign(new Error('Événement introuvable.'), { status: 404 });
      await current.update(eventPayload(req.body, current.toJSON()), { transaction });
      return current;
    });
    res.json({ event: withImageUrl(event) });
  } catch (err) { next(err); }
});

module.exports = router;
