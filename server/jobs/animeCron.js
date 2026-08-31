// server/jobs/animeCron.js — planification du bot anime
//
// Deux passages complémentaires :
//   · 04h00 — synchronisation complète (nouveautés, saison à venir, tendances)
//   · toutes les 6 h — rafraîchissement du calendrier de diffusion
//
// Pourquoi deux fréquences : les fiches (titre, synopsis, affiche) ne bougent
// quasiment jamais, alors que `nextAiringEpisode` change à chaque épisode
// diffusé. Tout resynchroniser toutes les 6 h serait du gaspillage ; ne le
// faire qu'une fois par jour laisserait le planning faux la moitié du temps.
const cron = require('node-cron')
const { syncAnime, pruneStale } = require('../services/animeSync')

// Fuseau du Cameroun. Sans ça, node-cron suit l'horloge du serveur Render
// (UTC) et « 04h00 » tomberait à 5h du matin heure locale.
const TZ = process.env.CRON_TZ || 'Africa/Douala'

// Empêche deux exécutions simultanées : un passage lent (Render en veille,
// AniList qui traîne) ne doit pas se faire doubler par le suivant.
let running = false

async function runSync(label, opts = {}) {
  if (running) {
    console.log(`⏭️  Synchro anime (${label}) ignorée : une autre est en cours`)
    return null
  }
  running = true
  try {
    console.log(`🤖 Synchro anime — ${label}`)
    const result = await syncAnime(opts)
    if (opts.prune) await pruneStale()
    return result
  } catch (err) {
    // Une erreur du bot ne doit JAMAIS faire tomber l'API : le planning est
    // une fonctionnalité d'agrément, la boutique et les commandes non.
    console.error('❌ Synchro anime échouée :', err.message)
    return null
  } finally {
    running = false
  }
}

function startAnimeCron() {
  // Désactivable sans toucher au code (utile en développement local).
  if (process.env.ANIME_SYNC_ENABLED === 'false') {
    console.log('⏸️  Bot anime désactivé (ANIME_SYNC_ENABLED=false)')
    return
  }

  // Passage complet, une fois par nuit.
  cron.schedule('0 4 * * *', () => runSync('complète', { perPage: 25, prune: true }), { timezone: TZ })

  // Calendrier de diffusion, quatre fois par jour.
  cron.schedule('0 */6 * * *', () => runSync('calendrier', { perPage: 20 }), { timezone: TZ })

  console.log(`🤖 Bot anime programmé (${TZ}) — complète 04h00, calendrier toutes les 6 h`)

  // Premier remplissage au démarrage si la base est vide, pour qu'une
  // installation neuve n'attende pas jusqu'à 4 h du matin pour afficher
  // quelque chose. Différé de 20 s : la connexion Postgres doit être établie
  // et le serveur doit d'abord répondre aux requêtes.
  setTimeout(async () => {
    try {
      const { Anime } = require('../models/index')
      const n = await Anime.count({ where: { source: 'auto' } })
      if (n === 0) {
        console.log('🌱 Aucun animé importé — premier remplissage automatique')
        await runSync('initiale', { perPage: 25 })
      }
    } catch (err) {
      console.warn('⚠️ Remplissage initial ignoré :', err.message)
    }
  }, 20000)
}

module.exports = { startAnimeCron, runSync }
