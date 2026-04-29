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
  try {
    const res  = await fetch(`${API_BASE}/api/auth/refresh`, { method:'POST', headers:headers(false), body:JSON.stringify({ refreshToken:rt }) })
    if (!res.ok) return false
    const data = await res.json()
    localStorage.setItem('op_token',   data.accessToken)
    localStorage.setItem('op_refresh', data.refreshToken)
    return true
  } catch { return false }
}

export async function request(method, path, body = null, auth = true) {
  const opts = { method, headers: headers(auth) }
  if (body) opts.body = JSON.stringify(body)
  let res = await fetch(`${API_BASE}${path}`, opts)
  if (res.status === 401 && auth) {
    const ok = await refreshToken()
    if (ok) { opts.headers = headers(true); res = await fetch(`${API_BASE}${path}`, opts) }
    else { localStorage.removeItem('op_token'); localStorage.removeItem('op_refresh'); localStorage.removeItem('op_user'); window.location.href = '/'; return null }
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    if (err.details?.length) throw new Error(err.details.map(d => d.msg).join(', '))
    throw new Error(err.error || `Erreur ${res.status}`)
  }
  return res.json()
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
}

// ── UPLOAD helper ─────────────────────────────────────
// Convertit un File en base64
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

// ── MANGA PLATFORM ────────────────────────────────────
export const mangaApi = {
  getAll:        (p = {})         => request('GET', `/api/manga?${new URLSearchParams(p)}`, null, false),
  getBySlug:     (slug)           => request('GET', `/api/manga/${slug}`, null, false),
  continueReading:()              => request('GET', '/api/manga/continue-reading'),
  create:        (data)           => request('POST',  '/api/manga', data),
  update:        (id, data)       => request('PATCH', `/api/manga/${id}`, data),
  moderate:      (id, status, notes) => request('PATCH', `/api/manga/${id}/moderate`, { status, notes }),
  delete:        (id)             => request('DELETE', `/api/manga/${id}`),
  rate:          (id, rating, review) => request('POST', `/api/manga/${id}/rate`, { rating, review }),
  getCoverUrl:   (id)             => `${API_BASE}/api/manga/${id}/cover`,
  getBannerUrl:  (id)             => `${API_BASE}/api/manga/${id}/banner`,
}

export const chaptersApi = {
  getByManga:    (mangaId)        => request('GET', `/api/chapters/by-manga/${mangaId}`, null, false),
  getById:       (id)             => request('GET', `/api/chapters/${id}`, null, true), // optionalAuth side
  create:        (data)           => request('POST', '/api/chapters', data),
  update:        (id, data)       => request('PATCH', `/api/chapters/${id}`, data),
  delete:        (id)             => request('DELETE', `/api/chapters/${id}`),
}

export const readingApi = {
  saveProgress:  (data)           => request('POST', '/api/reading/progress', data),
  getProgress:   (mangaId)        => request('GET',  `/api/reading/progress/${mangaId}`),
  resetProgress: (mangaId)        => request('DELETE', `/api/reading/progress/${mangaId}`),
}

export const libraryApi = {
  getAll:    (p = {})             => request('GET', `/api/library?${new URLSearchParams(p)}`),
  add:       (mangaId, status)    => request('POST', `/api/library/${mangaId}`, { status }),
  remove:    (mangaId)            => request('DELETE', `/api/library/${mangaId}`),
}

export const subscriptionsApi = {
  getPlans:    ()                 => request('GET', '/api/subscriptions/plans', null, false),
  getActive:   ()                 => request('GET', '/api/subscriptions/active'),
  getMy:       ()                 => request('GET', '/api/subscriptions/my'),
  request:     (data)             => request('POST', '/api/subscriptions/request', data),
  // Admin
  getAll:      (p = {})           => request('GET', `/api/subscriptions?${new URLSearchParams(p)}`),
  activate:    (id, data)         => request('PATCH', `/api/subscriptions/${id}/activate`, data),
  update:      (id, data)         => request('PATCH', `/api/subscriptions/${id}`, data),
}

export const publishersApi = {
  apply:       (data)             => request('POST', '/api/publishers/apply', data),
  getMy:       ()                 => request('GET',  '/api/publishers/my'),
  // Admin
  getAll:      (p = {})           => request('GET', `/api/publishers?${new URLSearchParams(p)}`),
  review:      (id, status, notes)=> request('PATCH', `/api/publishers/${id}/review`, { status, adminNotes: notes }),
}

export const commentsApi = {
  getForManga:   (mangaId, p={})  => request('GET', `/api/comments/manga/${mangaId}?${new URLSearchParams(p)}`, null, false),
  getForChapter: (chapterId)      => request('GET', `/api/comments/chapter/${chapterId}`, null, false),
  create:        (data)           => request('POST', '/api/comments', data),
  delete:        (id)             => request('DELETE', `/api/comments/${id}`),
  hide:          (id, isHidden)   => request('PATCH', `/api/comments/${id}/hide`, { isHidden }),
}

export const checkHealth = async () => {
  try { const res = await fetch(`${API_BASE}/api/health`); return res.ok } catch { return false }
}