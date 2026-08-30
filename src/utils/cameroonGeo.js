// src/utils/cameroonGeo.js — repères géographiques pour la mini-carte de livraison
//
// ⚠️ IMPORTANT — nature des données ci-dessous
// Les coordonnées de quartiers sont des CENTROÏDES APPROXIMATIFS, saisis pour
// donner un repère visuel à un livreur, pas une position exacte. Un quartier
// comme Biyem-Assi s'étend sur plusieurs kilomètres : le point ne désigne pas
// une adresse.
//
// C'est pourquoi toute facture peut porter des coordonnées `destLat`/`destLng`
// saisies à la main, qui PRIMENT TOUJOURS sur cette table. Quand l'admin relève
// le point GPS réel chez le client, c'est lui qui s'affiche.
//
// Pour affiner un quartier : ouvrir Google Maps, clic droit sur le point,
// copier les coordonnées, et corriger la ligne correspondante ici.

// Centres-villes de référence (points bien identifiés, fiables).
export const CITIES = {
  'Yaoundé':   { lat: 3.8667, lng: 11.5167, label: 'Yaoundé',   spanKm: 16 },
  'Douala':    { lat: 4.0511, lng:  9.7679, label: 'Douala',    spanKm: 18 },
  'Bafoussam': { lat: 5.4737, lng: 10.4179, label: 'Bafoussam', spanKm: 10 },
}

// Quartiers connus, par ville. Approximatifs — voir l'avertissement ci-dessus.
export const QUARTIERS = {
  'Yaoundé': {
    'Bastos':        [3.8869, 11.5088],
    'Centre-ville':  [3.8667, 11.5167],
    'Nlongkak':      [3.8790, 11.5170],
    'Tsinga':        [3.8790, 11.4990],
    'Mokolo':        [3.8760, 11.5120],
    'Essos':         [3.8760, 11.5390],
    'Ngousso':       [3.8940, 11.5410],
    'Etoudi':        [3.9060, 11.5300],
    'Emana':         [3.9260, 11.5140],
    'Mvog-Mbi':      [3.8462, 11.5286],
    'Mvog-Ada':      [3.8530, 11.5290],
    'Melen':         [3.8620, 11.4870],
    'Ngoa-Ekelle':   [3.8580, 11.5010],
    'Biyem-Assi':    [3.8280, 11.4720],
    'Mendong':       [3.8180, 11.4560],
    'Nkolbisson':    [3.8660, 11.4370],
    'Etoug-Ebe':     [3.8460, 11.4780],
    'Ekounou':       [3.8280, 11.5490],
    'Odza':          [3.8010, 11.5480],
    'Mvan':          [3.8130, 11.5310],
    'Nsam':          [3.8330, 11.5220],
    'Obili':         [3.8560, 11.4930],
    'Damas':         [3.8380, 11.4930],
    'Nkoldongo':     [3.8660, 11.5410],
    'Mimboman':      [3.8600, 11.5480],
    'Messassi':      [3.9130, 11.5230],
    'Nkolmesseng':   [3.9000, 11.5480],
    'Simbock':       [3.8140, 11.4900],
    'Ahala':         [3.7900, 11.5100],
  },
  'Douala': {
    'Akwa':          [4.0500, 9.7000],
    'Bonanjo':       [4.0430, 9.6890],
    'Bonapriso':     [4.0350, 9.6950],
    'Bali':          [4.0400, 9.6920],
    'Deido':         [4.0640, 9.7050],
    'New Bell':      [4.0350, 9.7130],
    'Ndokotti':      [4.0530, 9.7290],
    'Bepanda':       [4.0670, 9.7280],
    'Makepe':        [4.0770, 9.7440],
    'Bonamoussadi':  [4.0930, 9.7370],
    'Logpom':        [4.0880, 9.7620],
    'Logbessou':     [4.0930, 9.7690],
    'Kotto':         [4.0840, 9.7530],
    'Bonabéri':      [4.0700, 9.6720],
    'Village':       [4.0250, 9.7050],
    'Cité SIC':      [4.0580, 9.7180],
    'Yassa':         [4.0060, 9.7830],
    'PK 12':         [4.0730, 9.7960],
    'Japoma':        [4.0180, 9.8100],
    'Ange Raphaël':  [4.0480, 9.7180],
  },
  'Bafoussam': {
    'Centre-ville':  [5.4737, 10.4179],
    'Kamkop':        [5.4880, 10.4090],
    'Tamdja':        [5.4620, 10.4290],
    'Djeleng':       [5.4800, 10.4250],
    'Banengo':       [5.4680, 10.4080],
    'Tougang':       [5.4830, 10.4340],
    'Ndiendam':      [5.4650, 10.4180],
    'Famla':         [5.4560, 10.4110],
  },
}

// ── Recherche tolérante ───────────────────────────────
// L'admin tape « biyem assi », « Biyem-Assi » ou « BIYEM ASSI » selon l'humeur
// et le clavier. On normalise avant de comparer plutôt que d'imposer une saisie
// exacte, qui ferait échouer la localisation une fois sur deux.
function normalize(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')                         // retire tirets, espaces, points
}

/**
 * Localise un quartier. Renvoie toujours un objet exploitable :
 *   { lat, lng, source, matchedName }
 * `source` vaut 'manual' (coordonnées fournies), 'quartier' (trouvé dans la
 * table), ou 'city' (repli sur le centre-ville, quartier inconnu).
 */
export function locate({ city, quartier, lat, lng }) {
  const cityKey  = resolveCity(city)
  const cityRef  = CITIES[cityKey]

  // 1. Coordonnées saisies à la main : elles priment toujours.
  const hasManual = lat != null && lng != null
    && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))
    && Number(lat) !== 0 && Number(lng) !== 0
  if (hasManual) {
    return { lat: Number(lat), lng: Number(lng), source: 'manual', matchedName: quartier || null, cityKey, cityRef }
  }

  // 2. Correspondance dans la table de quartiers.
  const table = QUARTIERS[cityKey] || {}
  const needle = normalize(quartier)
  if (needle) {
    for (const [name, [qLat, qLng]] of Object.entries(table)) {
      const hay = normalize(name)
      // Égalité d'abord, puis inclusion : « Bonamoussadi Carrefour » doit
      // trouver « Bonamoussadi ».
      if (hay === needle || needle.includes(hay) || hay.includes(needle)) {
        return { lat: qLat, lng: qLng, source: 'quartier', matchedName: name, cityKey, cityRef }
      }
    }
  }

  // 3. Repli : le centre-ville. Mieux vaut un repère large et annoncé comme tel
  //    qu'aucune carte du tout.
  return { lat: cityRef.lat, lng: cityRef.lng, source: 'city', matchedName: null, cityKey, cityRef }
}

export function resolveCity(city) {
  const needle = normalize(city)
  for (const key of Object.keys(CITIES)) if (normalize(key) === needle) return key
  for (const key of Object.keys(CITIES)) if (needle && normalize(key).includes(needle)) return key
  return 'Yaoundé'   // ville par défaut de la plateforme
}

/** Liste des quartiers d'une ville, pour alimenter un <datalist> de saisie. */
export function quartiersOf(city) {
  return Object.keys(QUARTIERS[resolveCity(city)] || {}).sort((a, b) => a.localeCompare(b, 'fr'))
}

// ── Calculs géographiques ─────────────────────────────
const R_EARTH_KM = 6371
const toRad = d => d * Math.PI / 180
const toDeg = r => r * 180 / Math.PI

/** Distance haversine en kilomètres. */
export function distanceKm(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R_EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

const CARDINALS = ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ouest', 'ouest', 'nord-ouest']

/** Azimut de a vers b, en degrés depuis le nord (0-360). */
export function bearingDeg(a, b) {
  const dLng = toRad(b.lng - a.lng)
  const y = Math.sin(dLng) * Math.cos(toRad(b.lat))
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat))
    - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLng)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/** Direction cardinale en français : « nord-est », « sud »… */
export function cardinal(a, b) {
  return CARDINALS[Math.round(bearingDeg(a, b) / 45) % 8]
}

/**
 * Phrase de repérage prête à imprimer.
 * Sous 400 m du centre on ne parle pas de direction : l'angle n'a plus de sens
 * et « 0,1 km au sud-ouest du centre » induirait le livreur en erreur.
 */
export function describePosition(point, cityRef) {
  const d = distanceKm(cityRef, point)
  if (d < 0.4) return `Centre-ville de ${cityRef.label}`
  const km  = d < 10 ? d.toFixed(1).replace('.', ',') : Math.round(d)
  const dir = cardinal(cityRef, point)
  // « au nord », mais « à l'est » et « à l'ouest » : l'élision est obligatoire
  // devant une voyelle. Les composés (nord-est, sud-ouest) gardent « au ».
  const prep = (dir === 'est' || dir === 'ouest') ? "à l'" : 'au '
  return `${km} km ${prep}${dir} du centre de ${cityRef.label}`
}

/** Lien de navigation, à imprimer en clair sur la facture. */
export function mapsUrl(lat, lng) {
  return `https://www.google.com/maps?q=${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`
}

/**
 * Projette un point en coordonnées SVG (0-1 sur chaque axe) dans un cadre
 * centré sur la ville, de `spanKm` de côté.
 *
 * Projection équirectangulaire : à 4° de latitude, la déformation est
 * négligeable sur 20 km, et elle garde le calcul lisible. Une projection
 * Mercator n'apporterait rien à cette échelle.
 */
export function projectToBox(point, cityRef, spanKm) {
  const span = spanKm || cityRef.spanKm || 14
  const kmPerDegLat = 111.32
  const kmPerDegLng = 111.32 * Math.cos(toRad(cityRef.lat))

  const dxKm = (point.lng - cityRef.lng) * kmPerDegLng
  const dyKm = (point.lat - cityRef.lat) * kmPerDegLat

  return {
    // 0.5 = centre du cadre ; l'axe Y est inversé car en SVG il descend.
    x: 0.5 + dxKm / span,
    y: 0.5 - dyKm / span,
    // Signale au composant que le point sort du cadre : il faut alors élargir
    // l'échelle plutôt que dessiner un marqueur collé au bord.
    outside: Math.abs(dxKm) > span / 2 || Math.abs(dyKm) > span / 2,
  }
}
