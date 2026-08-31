// server/services/animeSync.test.js — tests du bot de planning anime
//
//   cd server && npm test
//
// Aucun accès réseau ni base de données : on teste les fonctions pures de
// normalisation, celles qui décident de ce qui sera écrit en base.
require('dotenv').config()
const { test } = require('node:test')
const assert = require('node:assert/strict')
const {
  cleanDescription, mapStatus, monthOf, toAnime, currentSeason, nextSeason,
} = require('./animeSync')

// ── Nettoyage des descriptions ───────────────────────

test('description — les balises et entités HTML sont retirées', () => {
  const html = 'Un héros <b>ordinaire</b>.<br><br>Puis tout bascule &amp; il découvre &quot;la vérité&quot;.'
  const out = cleanDescription(html)
  assert.ok(!out.includes('<'), 'aucune balise ne doit subsister')
  assert.ok(!out.includes('&amp;'), 'entités décodées')
  assert.ok(out.includes('"la vérité"'), 'guillemets restitués')
  assert.ok(out.includes('& il découvre'))
})

test('description — troncature sans jamais couper un mot en deux', () => {
  const long = 'Première phrase courte. ' + 'abracadabrantesque '.repeat(40)
  const out = cleanDescription(long, 120)

  assert.ok(out.length <= 121, `longueur ${out.length}`)
  assert.ok(out.endsWith('…'), 'la troncature est signalée')

  // La vraie propriété à vérifier : le texte conservé est un préfixe exact de
  // l'original, et il s'arrête sur une frontière de mot. Une coupure au milieu
  // de « abracadabrantesque » donnerait « abracada… », illisible.
  const kept = out.slice(0, -1)
  assert.ok(long.startsWith(kept), 'doit rester un préfixe de l’original')
  const nextChar = long[kept.length]
  assert.ok(
    nextChar === undefined || nextChar === ' ',
    `coupure au milieu d’un mot : « …${kept.slice(-15)} » suivi de « ${nextChar} »`
  )
})

test('description — coupure préférée sur une fin de phrase quand elle tombe bien', () => {
  // Point final situé au-delà de 60 % de la limite : on coupe là plutôt qu'au
  // milieu de la phrase suivante, c'est plus lisible.
  const txt = 'A'.repeat(90) + '. Suite de la description qui déborde largement la limite fixée.'
  const out = cleanDescription(txt, 120)
  assert.ok(out.includes('.…') || out.endsWith('. …') || out.endsWith('.…'),
    `attendu une coupure après le point, obtenu « …${out.slice(-20)} »`)
})

test('description — courte, elle est laissée intacte et sans ellipse', () => {
  const out = cleanDescription('Court synopsis.')
  assert.equal(out, 'Court synopsis.')
  assert.ok(!out.endsWith('…'))
})

test('description — valeurs vides tolérées', () => {
  for (const v of [null, undefined, '']) assert.equal(cleanDescription(v), null)
})

// ── Correspondance des statuts ───────────────────────

test('statut — RELEASING devient « airing »', () => {
  assert.equal(mapStatus({ status: 'RELEASING' }), 'airing')
})

test('statut — FINISHED devient « ended »', () => {
  assert.equal(mapStatus({ status: 'FINISHED' }), 'ended')
})

test('statut — tout le reste retombe sur « upcoming »', () => {
  // NOT_YET_RELEASED, HIATUS, CANCELLED, ou un statut inconnu ajouté plus tard
  // par AniList : aucun ne doit produire une valeur hors de l'ENUM du modèle.
  for (const s of ['NOT_YET_RELEASED', 'HIATUS', 'CANCELLED', 'INCONNU', undefined]) {
    assert.equal(mapStatus({ status: s }), 'upcoming', `statut « ${s} »`)
  }
})

// ── Mois de rattachement ─────────────────────────────

test('mois — déduit de la date de début', () => {
  assert.equal(monthOf({ startDate: { year: 2026, month: 4, day: 12 } }), '2026-04-01')
  assert.equal(monthOf({ startDate: { year: 2026, month: 11, day: 1 } }), '2026-11-01')
})

test('mois — repli sur le mois courant si la date est inconnue', () => {
  // `month` est allowNull:false sur le modèle : sans ce repli, une annonce sans
  // date de diffusion ferait échouer l'insertion.
  const out = monthOf({ startDate: { year: null, month: null } })
  assert.match(out, /^\d{4}-\d{2}-01$/)
})

// ── Saisons ──────────────────────────────────────────

test('saisons — découpage trimestriel correct', () => {
  assert.equal(currentSeason(new Date('2026-01-15')).season, 'WINTER')
  assert.equal(currentSeason(new Date('2026-05-15')).season, 'SPRING')
  assert.equal(currentSeason(new Date('2026-08-15')).season, 'SUMMER')
  assert.equal(currentSeason(new Date('2026-11-15')).season, 'FALL')
})

test('saisons — décembre bascule sur l’hiver de l’année suivante', () => {
  const n = nextSeason(new Date('2026-12-20'))
  assert.equal(n.season, 'WINTER')
  assert.equal(n.seasonYear, 2027, 'le passage d’année doit être géré')
})

// ── Transformation complète ──────────────────────────

const SAMPLE = {
  id: 21,
  title: { romaji: 'ONE PIECE', english: 'One Piece', native: 'ワンピース' },
  description: 'Gold Roger était connu comme le <b>Roi des Pirates</b>.',
  coverImage: { extraLarge: 'https://cdn/xl.jpg', large: 'https://cdn/l.jpg' },
  bannerImage: 'https://cdn/banner.jpg',
  startDate: { year: 1999, month: 10, day: 20 },
  status: 'RELEASING',
  episodes: null,
  averageScore: 87,
  popularity: 300000,
  genres: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Shounen', 'Extra'],
  siteUrl: 'https://anilist.co/anime/21',
  studios: { nodes: [{ name: 'Toei Animation' }] },
  trailer: { id: 'abc123', site: 'youtube' },
  nextAiringEpisode: { episode: 1177, airingAt: 1788652800 },
}

test('transformation — les deux titres sont remplis', () => {
  const a = toAnime(SAMPLE)
  // `titleF` est allowNull:false ; laisser l'un des deux vide afficherait un
  // trou dans l'interface de l'autre langue.
  assert.equal(a.titleF, 'ONE PIECE')
  assert.equal(a.titleE, 'One Piece')
})

test('transformation — la fiche est marquée comme importée', () => {
  const a = toAnime(SAMPLE)
  assert.equal(a.source, 'auto')
  assert.equal(a.externalSource, 'anilist')
  assert.equal(a.externalId, 21)
  assert.ok(a.syncedAt instanceof Date)
})

test('transformation — image CDN préférée à la version large', () => {
  assert.equal(toAnime(SAMPLE).coverImageUrl, 'https://cdn/xl.jpg')
  const sansXL = { ...SAMPLE, coverImage: { large: 'https://cdn/l.jpg' } }
  assert.equal(toAnime(sansXL).coverImageUrl, 'https://cdn/l.jpg')
})

test('transformation — le jour de diffusion est en français', () => {
  const a = toAnime(SAMPLE)
  const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
  assert.ok(jours.includes(a.weekday), `« ${a.weekday} » doit être un jour français`)
  assert.equal(a.nextEpisodeNumber, 1177)
  assert.ok(a.nextEpisodeAt instanceof Date)
})

test('transformation — les genres sont plafonnés à 6', () => {
  assert.equal(toAnime(SAMPLE).genres.length, 6)
})

test('transformation — bande-annonce seulement si elle est sur YouTube', () => {
  assert.equal(toAnime(SAMPLE).trailerUrl, 'https://www.youtube.com/watch?v=abc123')
  const dailymotion = { ...SAMPLE, trailer: { id: 'x', site: 'dailymotion' } }
  assert.equal(toAnime(dailymotion).trailerUrl, null, 'autre plateforme ignorée')
  assert.equal(toAnime({ ...SAMPLE, trailer: null }).trailerUrl, null)
})

test('transformation — synopsis français laissé vide', () => {
  const a = toAnime(SAMPLE)
  // AniList ne fournit pas de traduction française. On remplit l'anglais et on
  // laisse le champ français vide plutôt que d'y recopier de l'anglais en le
  // faisant passer pour du français.
  assert.ok(a.synopsisE?.length > 0)
  assert.equal(a.synopsisF, undefined)
})

test('transformation — une entrée minimale ne fait pas planter', () => {
  // AniList renvoie beaucoup de champs nuls sur une annonce toute fraîche.
  const minimal = { id: 999, title: {}, startDate: {}, status: 'NOT_YET_RELEASED' }
  const a = toAnime(minimal)
  assert.equal(a.titleF, 'Sans titre')
  assert.equal(a.status, 'upcoming')
  assert.equal(a.externalId, 999)
  assert.match(a.month, /^\d{4}-\d{2}-01$/)
  assert.deepEqual(a.genres, [])
})
