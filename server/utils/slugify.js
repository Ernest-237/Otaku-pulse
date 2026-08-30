// server/utils/slugify.js — génération de slugs d'URL
//
// Utilisé pour les liens publics de boutiques partenaires : /boutique/<slug>.
// Un slug est une URL permanente partagée par le partenaire ; il doit être
// stable, lisible, et ne jamais entrer en collision avec une route du site.

// Segments déjà utilisés par l'application ou réservés pour plus tard.
// `partenaire` existe comme route statique (/boutique/partenaire) : React Router
// lui donnerait la priorité, et une boutique portant ce slug serait donc
// définitivement inaccessible. Mieux vaut le refuser à la saisie.
const RESERVED = new Set([
  'partenaire', 'partner', 'admin', 'api', 'boutique', 'shop', 'new', 'nouveau',
  'edit', 'settings', 'parametres', 'login', 'logout', 'register', 'profil',
  'profile', 'panier', 'cart', 'checkout', 'commande', 'orders', 'manga',
  'fandom', 'blog', 'legal', 'membership', 'poles', 'reservation', 'null',
  'undefined', 'index', 'assets', 'static', 'public', 'www',
])

/**
 * Transforme un texte libre en slug d'URL.
 * « Otaku Store — Yaoundé ! » → « otaku-store-yaounde »
 */
function slugify(input) {
  return String(input || '')
    .normalize('NFD')
    // Retire les diacritiques (é → e, ç → c) : un slug ne doit contenir que de
    // l'ASCII, sinon l'URL est réencodée en %C3%A9 et devient illisible une
    // fois copiée-collée dans WhatsApp.
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')   // tout le reste devient un tiret
    .replace(/^-+|-+$/g, '')       // pas de tiret en début ni en fin
    .replace(/-{2,}/g, '-')        // jamais deux tirets de suite
    .slice(0, 50)
    .replace(/-+$/, '')            // la troncature peut laisser un tiret orphelin
}

/** Un slug est-il utilisable ? (format et non-réservé) */
function isValidSlug(slug) {
  if (typeof slug !== 'string') return false
  if (slug.length < 3 || slug.length > 50) return false
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return false
  if (RESERVED.has(slug)) return false
  return true
}

/**
 * Génère un slug unique à partir d'un texte.
 *
 * @param {string} source           texte de départ (nom de la boutique)
 * @param {(slug:string)=>Promise<boolean>} isTaken  renvoie true si déjà pris
 * @param {string|null} fallback    base de repli si le nom ne donne rien
 *                                  d'exploitable (nom entièrement en
 *                                  caractères non latins, par exemple)
 */
async function generateUniqueSlug(source, isTaken, fallback = 'boutique') {
  let base = slugify(source)
  if (base.length < 3 || RESERVED.has(base)) base = slugify(`${fallback}-${base}`) || 'boutique'
  if (base.length < 3) base = 'boutique'

  if (!RESERVED.has(base) && !(await isTaken(base))) return base

  // Suffixes numériques déterministes, puis repli temporel. La boucle est
  // bornée : au-delà, on ne veut pas marteler la base.
  for (let i = 2; i <= 60; i++) {
    const candidate = `${base}-${i}`.slice(0, 50)
    if (!(await isTaken(candidate))) return candidate
  }
  return `${base.slice(0, 40)}-${Date.now().toString(36).slice(-6)}`
}

module.exports = { slugify, isValidSlug, generateUniqueSlug, RESERVED }
