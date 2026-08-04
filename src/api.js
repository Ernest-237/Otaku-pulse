// src/api.js — OTAKU PULSE v2
export const API_BASE = import.meta.env.VITE_API_URL || 'https://api-pulse-v9vy.onrender.com'

function getToken()  { return localStorage.getItem('op_token') }
function headers(auth = true) {
  const h = { 'Content-Type': 'application/json' }
  if (auth) { const t = getToken(); if (t) h['Authorization'] = `Bearer ${t}` }
  return h
}
async function refreshToken() {
  const rt = localStorage.getItem('op_refresh')
  if (!rt) return false
  const opts = { method:'POST', headers:headers(false), body:JSON.stringify({ refreshToken:rt }) }
  // 1 tentative + 1 retry : une connexion instable ne doit pas déconnecter l'utilisateur pour rien.
  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/auth/refresh`, opts)
      if (!res.ok) return false
      const data = await res.json()
      localStorage.setItem('op_token',   data.accessToken)
      localStorage.setItem('op_refresh', data.refreshToken)
      return true
    } catch (err) {
      const isNetworkError = err.name === 'AbortError' || err instanceof TypeError
      if (!isNetworkError || attempt === 1) return false
      await sleep(900)
    }
  }
  return false
}

// ── Résilience réseau ─────────────────────────────────
// Le backend (Render, plan gratuit) se met en veille après inactivité et peut
// prendre 20-50s à se réveiller ; combiné à des connexions mobiles instables
// (coupures, ERR_CONNECTION_RESET), une seule tentative sans délai suffisant
// fait échouer beaucoup de requêtes pour rien. On retente automatiquement les
// échecs réseau (jamais les erreurs applicatives 4xx/5xx, déjà traitées par le serveur).
const REQUEST_TIMEOUT_MS = 15000
const MAX_RETRIES = 2
const RETRY_BASE_DELAY_MS = 900

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function fetchWithTimeout(url, opts) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, { ...opts, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function request(method, path, body = null, auth = true) {
  const opts = { method, headers: headers(auth) }
  if (body) opts.body = JSON.stringify(body)

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      let res = await fetchWithTimeout(`${API_BASE}${path}`, opts)

      if (res.status === 401 && auth) {
        const ok = await refreshToken()
        if (ok) { opts.headers = headers(true); res = await fetchWithTimeout(`${API_BASE}${path}`, opts) }
        else { localStorage.removeItem('op_token'); localStorage.removeItem('op_refresh'); localStorage.removeItem('op_user'); window.location.href = '/'; return null }
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (err.details?.length) throw new Error(err.details.map(d => d.msg).join(', '))
        throw new Error(err.error || `Erreur ${res.status}`)
      }
      return await res.json()
    } catch (err) {
      const isNetworkError = err.name === 'AbortError' || err instanceof TypeError
      if (!isNetworkError || attempt === MAX_RETRIES) {
        throw isNetworkError
          ? new Error('Connexion instable — vérifie ta connexion internet et réessaie dans quelques secondes.')
          : err
      }
      await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt)
    }
  }
}

// ── AUTH ──────────────────────────────────────────────
export const authApi = {
  login:    (email, password)         => request('POST', '/api/auth/login', { email, password }, false),
  register: (pseudo, email, password) => request('POST', '/api/auth/register', { pseudo, email, password }, false),
  logout:   ()                        => request('POST', '/api/auth/logout'),
  me:       ()                        => request('GET',  '/api/auth/me'),
}

// ── PRODUCTS ──────────────────────────────────────────
export const productsApi = {
  getAll:   (p = {}) => request('GET', `/api/products?${new URLSearchParams(p)}`, null, false),
  getBySlug:(slug)   => request('GET', `/api/products/${slug}`, null, false),
  create:   (data)   => request('POST', '/api/products', data),
  update:   (id, d)  => request('PATCH', `/api/products/${id}`, d),
  delete:   (id)     => request('DELETE', `/api/products/${id}`),
  uploadImage: (id, imageData, imageMime) => request('POST', `/api/upload/product/${id}`, { imageData, imageMime }),
  getImageUrl: (id)  => `${API_BASE}/api/upload/product/${id}/image`,
  // ── Mes produits (boutique partenaire) ──
  getMine:   ()       => request('GET', '/api/products/mine'),
  createMine:(data)   => request('POST', '/api/products/mine', data),
  updateMine:(id, d)  => request('PATCH', `/api/products/mine/${id}`, d),
  deleteMine:(id)     => request('DELETE', `/api/products/mine/${id}`),
}

// ── ORDERS ────────────────────────────────────────────
export const ordersApi = {
  create:       (payload) => request('POST', '/api/orders', payload),
  getMy:        ()        => request('GET',  '/api/orders/my'),
  getById:      (id)      => request('GET',  `/api/orders/${id}`),
  updateStatus: (id, status, note) => request('PATCH', `/api/orders/${id}/status`, { status, note }),
  notify:       (data)    => request('POST', '/api/orders/notify', data),
}

// ── EVENTS ────────────────────────────────────────────
export const eventsApi = {
  getAll:   (p = {}) => request('GET', `/api/events?${new URLSearchParams(p)}`, null, false),
  getById:  (id)     => request('GET', `/api/events/${id}`, null, false),
  register: (eventId, guests, whatsapp) => request('POST', '/api/events/register', { eventId, guests, whatsapp }),
  create:   (data)   => request('POST', '/api/events', data),
  update:   (id, d)  => request('PATCH', `/api/events/${id}`, d),
  getMine:  ()        => request('GET', '/api/events/mine'),
  cancel:   (registrationId) => request('DELETE', `/api/events/registrations/${registrationId}`),
}

// ── USERS ─────────────────────────────────────────────
export const usersApi = {
  updateProfile:  (data) => request('PATCH', '/api/users/profile', data),
  changePassword: (data) => request('PATCH', '/api/users/password', data),
  getWishlist:    ()     => request('GET',   '/api/users/wishlist'),
  toggleWishlist: (pid)  => request('POST',  `/api/users/wishlist/${pid}`),
}

// ── ADMIN ─────────────────────────────────────────────
export const adminApi = {
  getDashboard: ()         => request('GET', '/api/admin/dashboard'),
  getUsers:     (p = {})   => request('GET', `/api/admin/users?${new URLSearchParams(p)}`),
  updateUser:   (id, d)    => request('PATCH', `/api/admin/users/${id}`, d),
  getOrders:    (p = {})   => request('GET', `/api/admin/orders?${new URLSearchParams(p)}`),
  getContacts:  (p = {})   => request('GET', `/api/admin/contacts?${new URLSearchParams(p)}`),
}

// ── CONTACT ───────────────────────────────────────────
export const contactApi = {
  send:         (payload) => request('POST',  '/api/contact', payload, false),
  updateStatus: (id, d)   => request('PATCH', `/api/contact/${id}/status`, d),
}

// ── NEWSLETTER ────────────────────────────────────────
export const newsletterApi = {
  subscribe: (email, lang = 'fr') => request('POST', '/api/newsletter/subscribe', { email, lang }, false),
}

// ── BLOG ──────────────────────────────────────────────
export const blogApi = {
  getPosts:      (p = {})  => request('GET', `/api/blog?${new URLSearchParams(p)}`, null, false),
  getPost:       (id)      => request('GET', `/api/blog/${id}`, null, false),
  createPost:    (data)    => request('POST',   '/api/blog', data),
  updatePost:    (id, d)   => request('PATCH',  `/api/blog/${id}`, d),
  deletePost:    (id)      => request('DELETE', `/api/blog/${id}`),
  getPartners:   ()        => request('GET', '/api/blog/partners', null, false),
  createPartner: (data)    => request('POST', '/api/blog/partners', data),
  deletePartner: (id)      => request('DELETE', `/api/blog/partners/${id}`),
  getPopup:      ()        => request('GET', '/api/blog/popup', null, false),
  savePopup:     (data)    => request('POST', '/api/blog/popup', data),
}

// ── HERO ──────────────────────────────────────────────
export const heroApi = {
  get:      ()       => request('GET',   '/api/hero', null, false),
  update:   (data)   => request('PATCH', '/api/hero', data),
  uploadBg: (imageData, imageMime) => request('POST', '/api/hero/upload-bg', { imageData, imageMime }),
}

// ── SUPPLIERS ─────────────────────────────────────────
export const suppliersApi = {
  getAll:      (p = {}) => request('GET', `/api/suppliers?${new URLSearchParams(p)}`),
  getById:     (id)     => request('GET', `/api/suppliers/${id}`),
  create:      (data)   => request('POST',   '/api/suppliers', data),
  update:      (id, d)  => request('PATCH',  `/api/suppliers/${id}`, d),
  delete:      (id)     => request('DELETE', `/api/suppliers/${id}`),
  getStats:    (id)     => request('GET', `/api/suppliers/${id}/stats`),
  getLogoUrl:  (id)     => `${API_BASE}/api/upload/supplier/${id}/logo`,
  uploadLogo:  (id, imageData, imageMime) => request('POST', `/api/upload/supplier/${id}`, { imageData, imageMime }),
  // ── Boutique partenaire en libre-service ──
  apply:       (data)   => request('POST',  '/api/suppliers/apply', data),
  getMy:       ()       => request('GET',   '/api/suppliers/my'),
  updateMe:    (data)   => request('PATCH', '/api/suppliers/me', data),
  review:      (id, status, reason) => request('PATCH', `/api/suppliers/${id}/review`, { status, reason }),
}

// ── UPLOAD helper ─────────────────────────────────────
// Convertit un File en base64 → retourne { data, mime }
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => {
      const result = reader.result // data:image/jpeg;base64,xxx
      const [meta, data] = result.split(',')
      const mime = meta.match(/:(.*?);/)[1]
      resolve({ data, mime })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ══════════════════════════════════════════════════════
// MANGA PLATFORM
// ══════════════════════════════════════════════════════

// ── MANGA ─────────────────────────────────────────────
export const mangaApi = {
  getAll:          (p = {})           => request('GET', `/api/manga?${new URLSearchParams(p)}`, null, false),
  getBySlug:       (slug)             => request('GET', `/api/manga/${slug}`, null, false),
  continueReading: ()                 => request('GET', '/api/manga/continue-reading'),
  getMy:           (p = {})           => request('GET', `/api/manga/my/list?${new URLSearchParams(p)}`),
  create:          (data)             => request('POST',  '/api/manga', data),
  update:          (id, data)         => request('PATCH', `/api/manga/${id}`, data),
  moderate:        (id, status, notes)=> request('PATCH', `/api/manga/${id}/moderate`, { status, notes }),
  delete:          (id)               => request('DELETE', `/api/manga/${id}`),
  rate:            (id, rating, review) => request('POST', `/api/manga/${id}/rate`, { rating, review }),
  getCoverUrl:     (id)               => `${API_BASE}/api/manga/${id}/cover`,
  getBannerUrl:    (id)               => `${API_BASE}/api/manga/${id}/banner`,
}

// ── CHAPTERS ──────────────────────────────────────────
export const chaptersApi = {
  getByManga: (mangaId)        => request('GET', `/api/chapters/by-manga/${mangaId}`, null, false),
  getById:    (id)             => request('GET', `/api/chapters/${id}`, null, true),
  // Création d'un chapitre rattaché à un manga : (mangaId, data)
  create:     (mangaId, data)  => request('POST', '/api/chapters', { ...data, mangaId }),
  update:     (id, data)       => request('PATCH', `/api/chapters/${id}`, data),
  delete:     (id)             => request('DELETE', `/api/chapters/${id}`),
}

// ── READING ───────────────────────────────────────────
export const readingApi = {
  saveProgress:  (data)     => request('POST', '/api/reading/progress', data),
  getProgress:   (mangaId)  => request('GET',  `/api/reading/progress/${mangaId}`),
  resetProgress: (mangaId)  => request('DELETE', `/api/reading/progress/${mangaId}`),
}

// ── LIBRARY ───────────────────────────────────────────
export const libraryApi = {
  getAll:       (p = {})         => request('GET', `/api/library?${new URLSearchParams(p)}`),
  getMyLibrary: (p = {})         => request('GET', `/api/library?${new URLSearchParams(p)}`),
  getCounts:    ()               => request('GET', '/api/library/counts'),
  add:          (mangaId, status)=> request('POST', `/api/library/${mangaId}`, { status }),
  remove:       (mangaId)        => request('DELETE', `/api/library/${mangaId}`),
}

// ── SUBSCRIPTIONS ─────────────────────────────────────
export const subscriptionsApi = {
  getPlans:    ()         => request('GET', '/api/subscriptions/plans', null, false),
  getActive:   ()         => request('GET', '/api/subscriptions/active'),
  getMy:       ()         => request('GET', '/api/subscriptions/my'),
  request:     (data)     => request('POST', '/api/subscriptions/request', data),
  // Admin
  getAll:      (p = {})   => request('GET', `/api/subscriptions?${new URLSearchParams(p)}`),
  activate:    (id, data) => request('PATCH', `/api/subscriptions/${id}/activate`, data),
  update:      (id, data) => request('PATCH', `/api/subscriptions/${id}`, data),
}

// ── PUBLISHERS ────────────────────────────────────────
export const publishersApi = {
  apply:            (data)              => request('POST', '/api/publishers/apply', data),
  getMy:            ()                  => request('GET',  '/api/publishers/my'),
  getMyApplication: ()                  => request('GET',  '/api/publishers/my-application'),
  getDashboard:     ()                  => request('GET',  '/api/publishers/dashboard'),
  // Admin
  getAll:           (p = {})            => request('GET', `/api/publishers?${new URLSearchParams(p)}`),
  review:           (id, status, notes) => request('PATCH', `/api/publishers/${id}/review`, { status, adminNotes: notes }),
}

// ── COMMENTS ──────────────────────────────────────────
export const commentsApi = {
  getForManga:   (mangaId, p={})  => request('GET', `/api/comments/manga/${mangaId}?${new URLSearchParams(p)}`, null, false),
  getForChapter: (chapterId)      => request('GET', `/api/comments/chapter/${chapterId}`, null, false),
  create:        (data)           => request('POST', '/api/comments', data),
  delete:        (id)             => request('DELETE', `/api/comments/${id}`),
  hide:          (id, isHidden)   => request('PATCH', `/api/comments/${id}/hide`, { isHidden }),
}

// ── COINS ─────────────────────────────────────────────
export const coinsApi = {
  // Public
  getPacks:        ()              => request('GET',  '/api/coins/packs', null, false),
  // Protégées
  getWallet:       ()              => request('GET',  '/api/coins/wallet'),
  getTransactions: (p = {})        => request('GET',  `/api/coins/transactions?${new URLSearchParams(p)}`),
  purchase:        (data)          => request('POST', '/api/coins/purchase', data),
  getMyPurchases:  ()              => request('GET',  '/api/coins/my-purchases'),
  unlockChapter:   (chapterId)     => request('POST', `/api/coins/unlock/${chapterId}`),
  getUnlocks:      (mangaId)       => request('GET',  `/api/coins/unlocks/${mangaId}`),
}

// ── FOLLOWS (s'abonner à un manga) ────────────────────
export const followApi = {
  toggle:    (mangaId) => request('POST', `/api/follows/${mangaId}`),
  getStatus: (mangaId) => request('GET',  `/api/follows/${mangaId}/status`),
  getMy:     ()        => request('GET',  '/api/follows/my'),
}

// ══════════════════════════════════════════════════════
// ADMIN — COINS
// ══════════════════════════════════════════════════════
export const adminCoinsApi = {
  getDashboard:   ()             => request('GET',   '/api/admin/coins/dashboard'),
  getRequests:    (p = {})       => request('GET',   `/api/admin/coins/requests?${new URLSearchParams(p)}`),
  approve:        (id, data={})  => request('PATCH', `/api/admin/coins/requests/${id}/approve`, data),
  reject:         (id, data={})  => request('PATCH', `/api/admin/coins/requests/${id}/reject`, data),
  adjust:         (data)         => request('POST',  '/api/admin/coins/adjust', data),
}

// ══════════════════════════════════════════════════════
// ADMIN — MANGA
// ══════════════════════════════════════════════════════
export const adminMangaApi = {
  getDashboard:     ()              => request('GET', '/api/admin/manga/dashboard'),
  getMangas:        (p = {})        => request('GET', `/api/admin/manga/list?${new URLSearchParams(p)}`),
  updateManga:      (id, data)      => request('PATCH', `/api/admin/manga/manga/${id}`, data),
  deleteManga:      (id)            => request('DELETE', `/api/admin/manga/manga/${id}`),
  moderateManga:    (id, status, notes='') => request('PATCH', `/api/admin/manga/manga/${id}`, {
                                          moderationStatus: status,
                                          ...(status === 'rejected' ? { rejectedReason: notes } : { moderationNotes: notes }),
                                        }),
  toggleOfficial:   (id)            => request('PATCH', `/api/admin/manga/manga/${id}/official`),
  // Chapitres (modération)
  getChapters:      (mangaId)       => request('GET', `/api/admin/manga/manga/${mangaId}/chapters`),
  moderateChapter:  (id, data)      => request('PATCH', `/api/admin/manga/chapters/${id}`, data),
  deleteChapter:    (id)            => request('DELETE', `/api/admin/manga/chapters/${id}`),
  // Commentaires
  getComments:      (p = {})        => request('GET', `/api/admin/manga/comments/list?${new URLSearchParams(p)}`),
  deleteComment:    (id)            => request('DELETE', `/api/admin/manga/comments/${id}`),
  hideComment:      (id, isHidden)  => request('PATCH', `/api/comments/${id}/hide`, { isHidden }),
  // Publishers
  getPublishers:    ()              => request('GET', '/api/admin/manga/publishers/list'),
  togglePublisher:  (userId, revoke)=> request('PATCH', `/api/admin/manga/publishers/${userId}`, { revoke }),
  // Candidatures publisher
  getPubApps:       (p = {})        => request('GET', `/api/publishers?${new URLSearchParams(p)}`),
  reviewPubApp:     (id, status, notes) => request('PATCH', `/api/publishers/${id}/review`, { status, adminNotes: notes }),
  // Abonnements
  getSubscriptions: (p = {})        => request('GET', `/api/subscriptions?${new URLSearchParams(p)}`),
  activateSub:      (id, data = {}) => request('PATCH', `/api/subscriptions/${id}/activate`, data),
  updateSub:        (id, data)      => request('PATCH', `/api/subscriptions/${id}`, data),
}

// ══════════════════════════════════════════════════════
// ADMIN — FANDOM
// ══════════════════════════════════════════════════════
// ══ FANDOM (titraille/activités admin-gérées) ══════════
// À AJOUTER dans src/api.js (avant le checkHealth final)
export const fandomApi = {
  // Cosplay
  getCosplays:      ()              => request('GET',  '/api/fandom/cosplay', null, false),
  submitCosplay:    (data)          => request('POST', '/api/fandom/cosplay', data),
  voteCosplay:      (id)            => request('POST', `/api/fandom/cosplay/${id}/vote`),
  deleteCosplay:    (id)            => request('DELETE', `/api/fandom/cosplay/${id}`),
  cosplayLeaderboard: ()            => request('GET',  '/api/fandom/cosplay/leaderboard', null, false),
  // Quiz
  getQuizQuestions: (p = {})        => request('GET',  `/api/fandom/quiz/questions?${new URLSearchParams(p)}`, null, false),
  submitQuiz:       (answers)       => request('POST', '/api/fandom/quiz/submit', { answers }),
  quizLeaderboard:  ()              => request('GET',  '/api/fandom/quiz/leaderboard', null, false),
  // Mini-jeux
  saveGameScore:    (gameKey, score)=> request('POST', `/api/fandom/games/${gameKey}/score`, { score }),
  gameLeaderboard:  (gameKey)       => request('GET',  `/api/fandom/games/${gameKey}/leaderboard`, null, false),
  // Admin
  adminGetQuestions:()              => request('GET',  '/api/fandom/admin/questions'),
  adminCreateQuestion: (data)       => request('POST', '/api/fandom/admin/questions', data),
  adminUpdateQuestion: (id, data)   => request('PATCH', `/api/fandom/admin/questions/${id}`, data),
  adminDeleteQuestion: (id)         => request('DELETE', `/api/fandom/admin/questions/${id}`),
  adminGetCosplays: ()              => request('GET',  '/api/fandom/admin/cosplay'),
  adminModerateCosplay: (id, data)  => request('PATCH', `/api/fandom/admin/cosplay/${id}`, data),
  // Page config (titraille/badge)
  getConfig:        ()              => request('GET',  '/api/fandom/config', null, false),
  adminUpdateConfig: (data)         => request('PATCH', '/api/fandom/admin/config', data),
  // Activités
  getActivities:    ()              => request('GET',  '/api/fandom/activities', null, false),
  adminGetActivities: ()            => request('GET',  '/api/fandom/admin/activities'),
  adminCreateActivity: (data)       => request('POST', '/api/fandom/admin/activities', data),
  adminUpdateActivity: (id, data)   => request('PATCH', `/api/fandom/admin/activities/${id}`, data),
  adminDeleteActivity: (id)         => request('DELETE', `/api/fandom/admin/activities/${id}`),
}

// ── ANIME (planning à venir/en cours) ────────────────
export const animeApi = {
  getAll:   (p = {}) => request('GET', `/api/anime?${new URLSearchParams(p)}`, null, false),
  getById:  (id)     => request('GET', `/api/anime/${id}`, null, false),
  create:   (data)   => request('POST', '/api/anime', data),
  update:   (id, d)  => request('PATCH', `/api/anime/${id}`, d),
  delete:   (id)     => request('DELETE', `/api/anime/${id}`),
}

// ── HEALTH ────────────────────────────────────────────
export const checkHealth = async () => {
  try { const res = await fetch(`${API_BASE}/api/health`); return res.ok } catch { return false }
}