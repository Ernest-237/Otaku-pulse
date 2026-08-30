// server/services/googleAuth.js — Vérification des jetons d'identité Google
//
// Pourquoi pas `google-auth-library` : la vérification d'un ID token Google est
// une simple vérification de signature RS256 contre les clés publiques de Google.
// Node 24 sait convertir une JWK en KeyObject nativement, et `jsonwebtoken` est
// déjà une dépendance du projet — inutile d'en ajouter une.
//
// Pourquoi pas l'endpoint /tokeninfo : il ajoute un aller-retour réseau bloquant
// sur le chemin critique de la connexion. Le backend tourne sur Render (plan
// gratuit, réveil lent) ; on évite tout ce qui rallonge un login.
const crypto = require('crypto')
const jwt    = require('jsonwebtoken')

const JWKS_URL     = 'https://www.googleapis.com/oauth2/v3/certs'
const VALID_ISSUER = ['https://accounts.google.com', 'accounts.google.com']

// Cache des clés publiques. Google fait tourner ses clés régulièrement et
// renvoie la durée de validité dans l'en-tête Cache-Control ; on la respecte
// plutôt que de coder un TTL en dur.
let jwksCache = { keys: null, expiresAt: 0 }

async function fetchJwks() {
  const now = Date.now()
  if (jwksCache.keys && now < jwksCache.expiresAt) return jwksCache.keys

  const res = await fetch(JWKS_URL)
  if (!res.ok) throw new Error(`Impossible de récupérer les clés Google (HTTP ${res.status})`)
  const body = await res.json()

  const maxAge = /max-age=(\d+)/.exec(res.headers.get('cache-control') || '')
  const ttlMs  = maxAge ? parseInt(maxAge[1], 10) * 1000 : 3600 * 1000

  jwksCache = { keys: body.keys || [], expiresAt: now + ttlMs }
  return jwksCache.keys
}

// Retrouve la clé correspondant au `kid` de l'en-tête du jeton. Si le kid est
// inconnu, c'est probablement une rotation de clés : on vide le cache et on
// retente une fois avant d'abandonner.
async function getPublicKey(kid, allowRefetch = true) {
  const keys = await fetchJwks()
  const jwk  = keys.find(k => k.kid === kid)
  if (!jwk) {
    if (!allowRefetch) throw new Error('Clé de signature Google introuvable.')
    jwksCache = { keys: null, expiresAt: 0 }
    return getPublicKey(kid, false)
  }
  return crypto.createPublicKey({ key: jwk, format: 'jwk' })
}

/**
 * Vérifie un ID token Google et renvoie le profil qu'il contient.
 * Lève une Error avec un message français si le jeton est invalide.
 */
async function verifyGoogleIdToken(idToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID non configuré côté serveur.')
  if (!idToken || typeof idToken !== 'string') throw new Error('Jeton Google manquant.')

  const decoded = jwt.decode(idToken, { complete: true })
  if (!decoded?.header?.kid) throw new Error('Jeton Google malformé.')
  if (decoded.header.alg !== 'RS256') throw new Error('Algorithme de signature non autorisé.')

  const key = await getPublicKey(decoded.header.kid)

  let payload
  try {
    payload = jwt.verify(idToken, key, {
      algorithms: ['RS256'],
      // `audience` garantit que le jeton a bien été émis POUR notre application.
      // Sans ce contrôle, un jeton valide obtenu par n'importe quelle autre
      // application Google serait accepté ici.
      audience: clientId,
      issuer:   VALID_ISSUER,
      clockTolerance: 10, // secondes, tolère une petite dérive d'horloge serveur
    })
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw new Error('Session Google expirée, réessaie.')
    throw new Error('Jeton Google invalide.')
  }

  // Un email non vérifié permettrait de revendiquer l'adresse d'un compte
  // existant et d'en prendre le contrôle. On refuse.
  if (payload.email_verified !== true && payload.email_verified !== 'true')
    throw new Error("Cette adresse Google n'est pas vérifiée.")
  if (!payload.email) throw new Error('Le compte Google ne fournit pas d\'adresse email.')

  return {
    googleId:   payload.sub,
    email:      payload.email.toLowerCase().trim(),
    name:       payload.name       || '',
    givenName:  payload.given_name || '',
    familyName: payload.family_name|| '',
    picture:    payload.picture    || '',
  }
}

const isGoogleAuthEnabled = () => !!process.env.GOOGLE_CLIENT_ID

module.exports = { verifyGoogleIdToken, isGoogleAuthEnabled }
