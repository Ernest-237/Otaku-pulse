// server/routes/anime.js — Planning animés (à venir/en cours), openings, personnages
const express = require('express');
const { Anime } = require('../models/index');
const { protect, restrictTo } = require('../middleware/auth');
const router  = express.Router();

const withCoverUrl = (anime) => {
  const j = anime.toJSON ? anime.toJSON() : { ...anime };
  if (j.coverImageMime) j.coverUrl = `/api/anime/${j.id}/cover`;
  delete j.coverImageData;
  return j;
};

// GET /api/anime — liste publique (filtrable par mois + statut)
router.get('/', async (req, res, next) => {
  try {
    const { status, month, limit = 30 } = req.query;
    const where = { isActive: true };
    if (status) where.status = status;
    if (month)  where.month  = month; // ex: '2026-08-01'
    const animes = await Anime.findAll({
      where, order: [['order', 'ASC'], ['createdAt', 'ASC']],
      limit: parseInt(limit),
      attributes: { exclude: ['coverImageData'] },
    });
    res.json({ animes: animes.map(withCoverUrl) });
  } catch (err) { next(err); }
});

// GET /api/anime/:id/cover — sert la cover base64
router.get('/:id/cover', async (req, res, next) => {
  try {
    const anime = await Anime.findByPk(req.params.id, { attributes: ['coverImageData','coverImageMime'] });
    if (!anime || !anime.coverImageData) return res.status(404).send('No image');
    const buffer = Buffer.from(anime.coverImageData, 'base64');
    res.set('Content-Type', anime.coverImageMime || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err) { next(err); }
});

// GET /api/anime/:id
router.get('/:id', async (req, res, next) => {
  try {
    const anime = await Anime.findByPk(req.params.id, { attributes: { exclude: ['coverImageData'] } });
    if (!anime) return res.status(404).json({ error: 'Anime introuvable.' });
    res.json({ anime: withCoverUrl(anime) });
  } catch (err) { next(err); }
});

// POST /api/anime — admin
router.post('/', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const anime = await Anime.create(req.body);
    res.status(201).json({ anime: withCoverUrl(anime) });
  } catch (err) { next(err); }
});

// PATCH /api/anime/:id — admin
router.patch('/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const anime = await Anime.findByPk(req.params.id);
    if (!anime) return res.status(404).json({ error: 'Anime introuvable.' });
    await anime.update(req.body);
    res.json({ anime: withCoverUrl(anime) });
  } catch (err) { next(err); }
});

// DELETE /api/anime/:id — admin
router.delete('/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    await Anime.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Anime supprimé.' });
  } catch (err) { next(err); }
});

module.exports = router;
