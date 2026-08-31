// server/routes/anime.js — Planning animés (à venir/en cours), openings, personnages
const express = require('express');
const { Op } = require('sequelize');
const { Anime } = require('../models/index');
const { protect, restrictTo } = require('../middleware/auth');
const { syncAnime, pruneStale } = require('../services/animeSync');
const router  = express.Router();

// L'image téléversée à la main l'emporte sur celle importée : si un admin a
// pris la peine d'uploader sa propre affiche, c'est un choix délibéré.
const withCoverUrl = (anime) => {
  const j = anime.toJSON ? anime.toJSON() : { ...anime };
  if (j.coverImageMime)        j.coverUrl = `/api/anime/${j.id}/cover`;
  else if (j.coverImageUrl)    j.coverUrl = j.coverImageUrl;   // CDN AniList
  delete j.coverImageData;
  return j;
};

// Étend une date 'YYYY-MM-DD' (ou 'YYYY-MM') à l'intervalle [1er du mois, 1er du mois suivant[
function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  const start = `${y}-${String(m).padStart(2,'0')}-01`;
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  const end   = `${nextY}-${String(nextM).padStart(2,'0')}-01`;
  return { start, end };
}

// GET /api/anime — liste publique (filtrable par mois + statut)
router.get('/', async (req, res, next) => {
  try {
    const { status, month, limit = 30 } = req.query;
    const where = { isActive: true };
    if (status) where.status = status;
    if (month) {
      const { start, end } = monthRange(month); // accepte 'YYYY-MM' ou 'YYYY-MM-DD'
      where.month = { [Op.gte]: start, [Op.lt]: end };
    }
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
    // Une fiche créée ici est toujours manuelle : le bot ne doit jamais la
    // considérer comme sienne, même si son titre correspond à un animé AniList.
    const anime = await Anime.create({
      ...req.body,
      source: 'manual',
      externalSource: null,
      externalId: null,
    });
    res.status(201).json({ anime: withCoverUrl(anime) });
  } catch (err) { next(err); }
});

// PATCH /api/anime/:id — admin
router.patch('/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const anime = await Anime.findByPk(req.params.id);
    if (!anime) return res.status(404).json({ error: 'Anime introuvable.' });

    // `source`, `externalId` et `externalSource` ne sont pas modifiables : ils
    // identifient l'origine de la fiche et servent de clé de déduplication.
    const { source, externalId, externalSource, ...allowed } = req.body;

    // Toute modification de CONTENU verrouille la fiche : le bot ne la
    // réécrira plus jamais. C'est ce qui garantit qu'un titre traduit ou une
    // affiche choisie à la main survivent à la synchro de la nuit suivante.
    //
    // Les champs purement d'affichage (ordre, visibilité) ne verrouillent pas :
    // réordonner le carrousel ne doit pas figer la fiche pour toujours.
    const DISPLAY_ONLY = ['order', 'isActive', 'isLocked'];
    const touchesContent = Object.keys(allowed).some(k => !DISPLAY_ONLY.includes(k));
    if (touchesContent && anime.source === 'auto') allowed.isLocked = true;

    await anime.update(allowed);
    res.json({
      anime: withCoverUrl(anime),
      locked: anime.isLocked,
      message: touchesContent && anime.isLocked
        ? 'Fiche modifiée et verrouillée : le bot ne l\'écrasera plus.'
        : 'Fiche mise à jour.',
    });
  } catch (err) { next(err); }
});

// DELETE /api/anime/:id — admin
router.delete('/:id', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    await Anime.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Anime supprimé.' });
  } catch (err) { next(err); }
});


// ══════════════════════════════════════════════════════
// BOT DE SYNCHRONISATION
// ══════════════════════════════════════════════════════

// POST /api/anime/sync — déclenchement manuel (admin)
// Le bot tourne seul (voir jobs/animeCron.js) ; cette route sert à forcer
// un rafraîchissement immédiat sans attendre le passage de 4 h.
router.post('/sync', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const perPage = Math.min(parseInt(req.body?.perPage, 10) || 25, 50);
    const result  = await syncAnime({ perPage });
    if (req.body?.prune) result.pruned = await pruneStale();
    res.json({
      ...result,
      message: `${result.created} ajouté(s), ${result.updated} mis à jour, ${result.skipped} préservé(s).`,
    });
  } catch (err) { next(err); }
});

// GET /api/anime/sync/status — état du bot (admin)
router.get('/sync/status', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const [auto, manual, locked, airing, upcoming, last] = await Promise.all([
      Anime.count({ where: { source: 'auto' } }),
      Anime.count({ where: { source: 'manual' } }),
      Anime.count({ where: { isLocked: true } }),
      Anime.count({ where: { status: 'airing' } }),
      Anime.count({ where: { status: 'upcoming' } }),
      Anime.max('syncedAt'),
    ]);
    res.json({
      counts: { auto, manual, locked, airing, upcoming },
      lastSyncAt: last || null,
      enabled: process.env.ANIME_SYNC_ENABLED !== 'false',
    });
  } catch (err) { next(err); }
});

// PATCH /api/anime/:id/lock — (dé)verrouiller une fiche (admin)
// Déverrouiller rend la fiche au bot : elle sera écrasée à la prochaine
// synchronisation. Utile pour annuler une retouche ratée.
router.patch('/:id/lock', protect, restrictTo('admin','superadmin'), async (req, res, next) => {
  try {
    const anime = await Anime.findByPk(req.params.id);
    if (!anime) return res.status(404).json({ error: 'Animé introuvable.' });
    await anime.update({ isLocked: !!req.body.isLocked });
    res.json({
      anime: withCoverUrl(anime),
      message: anime.isLocked
        ? 'Fiche verrouillée : le bot ne la modifiera plus.'
        : 'Fiche déverrouillée : elle sera rafraîchie à la prochaine synchro.',
    });
  } catch (err) { next(err); }
});

module.exports = router;
