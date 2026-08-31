// server/services/animeSync.js — bot d'import du planning anime
//
// Source : AniList (https://graphql.anilist.co) — GraphQL, gratuit, SANS clé
// d'API. Une seule requête ramène tendances, saison à venir et calendrier de
// diffusion. Jikan/MyAnimeList aurait imposé 3 requêtes/seconde et plusieurs
// appels séparés pour le même résultat.
//
// RÈGLE ABSOLUE : le bot ne touche jamais
//   · une fiche `source: 'manual'`  (saisie à la main par l'admin)
//   · une fiche `isLocked: true`    (fiche importée puis retouchée)
// Sans ces deux gardes, chaque passage nocturne effacerait le travail manuel.
const { Op } = require('sequelize')
const { Anime } = require('../models/index')

const ANILIST_URL = 'https://graphql.anilist.co'

// AniList limite à ~90 requêtes/minute. On en fait 3 par synchronisation :
// très loin du plafond, mais on espace quand même pour rester courtois.
const PAUSE_MS = 700
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ══════════════════════════════════════════════════════
// REQUÊTE GRAPHQL
// ══════════════════════════════════════════════════════

const MEDIA_FIELDS = `
  id
  title { romaji english native }
  description(asHtml: false)
  coverImage { extraLarge large color }
  bannerImage
  season
  seasonYear
  startDate { year month day }
  status
  episodes
  averageScore
  popularity
  genres
  siteUrl
  studios(isMain: true) { nodes { name } }
  trailer { id site }
  nextAiringEpisode { episode airingAt }
`

const QUERY = `
query ($page: Int, $perPage: Int, $sort: [MediaSort], $season: MediaSeason, $seasonYear: Int, $status: MediaStatus) {
  Page(page: $page, perPage: $perPage) {
    media(type: ANIME, sort: $sort, season: $season, seasonYear: $seasonYear, status: $status, isAdult: false) {
      ${MEDIA_FIELDS}
    }
  }
}`

async function anilist(variables) {
  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: QUERY, variables }),
  })

  if (res.status === 429) {
    // AniList renvoie le délai d'attente ; on le respecte plutôt que de marteler.
    const wait = parseInt(res.headers.get('retry-after') || '60', 10)
    throw new Error(`AniList : quota atteint, réessayer dans ${wait}s`)
  }
  if (!res.ok) throw new Error(`AniList a répondu ${res.status}`)

  const body = await res.json()
  if (body.errors?.length) throw new Error(`AniList : ${body.errors[0].message}`)
  return body.data?.Page?.media || []
}

// ══════════════════════════════════════════════════════
// SAISONS
// ══════════════════════════════════════════════════════

const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL']

/** Saison AniList correspondant à un mois (0-11). */
function seasonOf(monthIndex) {
  return SEASONS[Math.floor(monthIndex / 3)]
}

function currentSeason(now = new Date()) {
  return { season: seasonOf(now.getMonth()), seasonYear: now.getFullYear() }
}

function nextSeason(now = new Date()) {
  const i = Math.floor(now.getMonth() / 3)
  return i === 3
    ? { season: 'WINTER', seasonYear: now.getFullYear() + 1 }
    : { season: SEASONS[i + 1], seasonYear: now.getFullYear() }
}

// ══════════════════════════════════════════════════════
// NORMALISATION
// ══════════════════════════════════════════════════════

const WEEKDAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

/**
 * AniList renvoie une description avec des balises HTML légères et des
 * entités. On la nettoie et on la tronque : le carrousel affiche deux lignes,
 * un pavé de 1500 caractères n'y sert à rien et alourdit chaque réponse API.
 */
function cleanDescription(html, max = 400) {
  if (!html) return null
  const text = String(html)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= max) return text
  // Coupe sur une fin de phrase quand c'est possible, sinon sur un espace.
  const cut = text.slice(0, max)
  const dot = cut.lastIndexOf('. ')
  return (dot > max * 0.6 ? cut.slice(0, dot + 1) : cut.slice(0, cut.lastIndexOf(' '))) + '…'
}

/** Statut AniList → statut interne. */
function mapStatus(m) {
  if (m.status === 'RELEASING') return 'airing'
  if (m.status === 'FINISHED')  return 'ended'
  return 'upcoming'   // NOT_YET_RELEASED, HIATUS, CANCELLED
}

/** Mois de rattachement : date de début si connue, sinon le mois courant. */
function monthOf(m) {
  const d = m.startDate
  if (d?.year && d?.month) {
    return `${d.year}-${String(d.month).padStart(2, '0')}-01`
  }
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

/** Transforme une entrée AniList en attributs du modèle Anime. */
function toAnime(m) {
  const romaji  = m.title?.romaji || m.title?.english || m.title?.native || 'Sans titre'
  const english = m.title?.english || romaji
  const next    = m.nextAiringEpisode

  return {
    // Le titre d'un animé est le même dans les deux langues : on remplit les
    // deux champs, sinon l'interface anglaise afficherait du vide.
    titleF: romaji.slice(0, 200),
    titleE: english.slice(0, 200),

    // AniList ne fournit pas de synopsis français. On remplit `synopsisE` et on
    // laisse `synopsisF` vide : l'affichage retombe sur l'anglais, et l'admin
    // peut traduire à son rythme (la fiche se verrouille alors d'elle-même).
    synopsisE: cleanDescription(m.description),

    status:  mapStatus(m),
    month:   monthOf(m),
    weekday: next?.airingAt ? WEEKDAYS_FR[new Date(next.airingAt * 1000).getDay()] : null,
    studio:  m.studios?.nodes?.[0]?.name?.slice(0, 120) || null,

    coverImageUrl:  m.coverImage?.extraLarge || m.coverImage?.large || null,
    bannerImageUrl: m.bannerImage || null,

    score:      m.averageScore ?? null,
    popularity: m.popularity ?? 0,
    episodes:   m.episodes ?? null,
    genres:     Array.isArray(m.genres) ? m.genres.slice(0, 6) : [],
    siteUrl:    m.siteUrl || null,
    trailerUrl: m.trailer?.id && m.trailer?.site === 'youtube'
      ? `https://www.youtube.com/watch?v=${m.trailer.id}` : null,

    nextEpisodeNumber: next?.episode ?? null,
    nextEpisodeAt:     next?.airingAt ? new Date(next.airingAt * 1000) : null,

    source: 'auto',
    externalSource: 'anilist',
    externalId: m.id,
    syncedAt: new Date(),
  }
}

// ══════════════════════════════════════════════════════
// SYNCHRONISATION
// ══════════════════════════════════════════════════════

/**
 * Lance une synchronisation complète.
 *
 * @param {object} opts
 * @param {number} opts.perPage  nombre d'entrées par catégorie (défaut 20)
 * @returns {Promise<{created,updated,skipped,total,errors}>}
 */
async function syncAnime({ perPage = 20 } = {}) {
  const started = Date.now()
  const cur  = currentSeason()
  const nxt  = nextSeason()

  // Trois passes complémentaires. Les doublons entre elles sont normaux : un
  // animé en cours est souvent aussi dans les tendances. La déduplication se
  // fait par `externalId` juste après.
  const batches = [
    { label: 'en cours',   vars: { page: 1, perPage, sort: ['POPULARITY_DESC'], status: 'RELEASING' } },
    { label: 'à venir',    vars: { page: 1, perPage, sort: ['POPULARITY_DESC'], season: nxt.season, seasonYear: nxt.seasonYear } },
    { label: 'tendances',  vars: { page: 1, perPage, sort: ['TRENDING_DESC'], season: cur.season, seasonYear: cur.seasonYear } },
  ]

  const byId = new Map()
  const errors = []

  for (const b of batches) {
    try {
      const media = await anilist(b.vars)
      for (const m of media) if (!byId.has(m.id)) byId.set(m.id, m)
      console.log(`   · ${b.label} : ${media.length} entrées`)
    } catch (err) {
      // Une catégorie en échec ne doit pas annuler les autres.
      errors.push(`${b.label} : ${err.message}`)
      console.warn(`   ⚠️ ${b.label} — ${err.message}`)
    }
    await sleep(PAUSE_MS)
  }

  if (byId.size === 0) {
    return { created: 0, updated: 0, skipped: 0, total: 0, errors, ms: Date.now() - started }
  }

  let created = 0, updated = 0, skipped = 0

  for (const m of byId.values()) {
    const payload = toAnime(m)
    try {
      const existing = await Anime.findOne({
        where: { externalSource: 'anilist', externalId: m.id },
      })

      if (!existing) {
        await Anime.create(payload)
        created++
        continue
      }

      // ── Les deux gardes anti-écrasement ──
      if (existing.source === 'manual' || existing.isLocked) {
        skipped++
        continue
      }

      // On ne réécrit pas `isActive` ni `order` : ce sont des choix d'affichage
      // que l'admin peut avoir ajustés sans pour autant verrouiller la fiche.
      const { source, externalSource, externalId, ...refreshable } = payload
      await existing.update(refreshable)
      updated++
    } catch (err) {
      errors.push(`#${m.id} : ${err.message}`)
    }
  }

  const ms = Date.now() - started
  console.log(`✅ Planning anime synchronisé — ${created} ajoutés, ${updated} mis à jour, ${skipped} préservés (${ms} ms)`)
  return { created, updated, skipped, total: byId.size, errors, ms }
}

/**
 * Marque « terminés » les animés dont la diffusion est passée depuis longtemps,
 * pour que le carrousel ne traîne pas d'anciennes saisons indéfiniment.
 */
async function pruneStale({ olderThanDays = 120 } = {}) {
  const limit = new Date(Date.now() - olderThanDays * 86400000)
  const [n] = await Anime.update(
    { status: 'ended' },
    {
      where: {
        source: 'auto',
        isLocked: false,
        status: 'airing',
        // Aucun épisode annoncé et dernière mise à jour ancienne : la série
        // est terminée, AniList a simplement cessé de la remonter.
        nextEpisodeAt: { [Op.is]: null },
        updatedAt: { [Op.lt]: limit },
      },
    }
  )
  if (n > 0) console.log(`🧹 ${n} animé(s) basculé(s) en « terminé »`)
  return n
}

module.exports = {
  syncAnime,
  pruneStale,
  // Exportés pour les tests : ces fonctions sont pures et testables sans réseau.
  cleanDescription,
  mapStatus,
  monthOf,
  toAnime,
  currentSeason,
  nextSeason,
}
