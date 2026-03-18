// src/api.js
// ═══════════════════════════════════════════════════════
// OTAKU PULSE — Couche API centrale
// Tous les appels vers le backend Render passent ici
// ═══════════════════════════════════════════════════════

// 🔧 Change cette URL par ton vrai URL Render
export const API_BASE = 'https://api-pulse-v9vy.onrender.com';

// ── Helpers ───────────────────────────────────────────
function getToken() {
  return localStorage.getItem('op_token');
}

function getHeaders(withAuth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ── Requête générique avec refresh token auto ─────────
async function request(method, path, body = null, auth = true) {
  const opts = {
    method,
    headers: getHeaders(auth),
  };
  if (body) opts.body = JSON.stringify(body);

  let res = await fetch(`${API_BASE}${path}`, opts);

  // Token expiré → tenter refresh
  if (res.status === 401 && auth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      opts.headers = getHeaders(true);
      res = await fetch(`${API_BASE}${path}`, opts);
    } else {
      // Refresh échoué → déconnexion
      Auth.logout();
      return null;
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(err.error || `Erreur ${res.status}`);
  }

  return res.json();
}

async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem('op_refresh');
    if (!refreshToken) return false;
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('op_token', data.accessToken);
    localStorage.setItem('op_refresh', data.refreshToken);
    return true;
  } catch { return false; }
}

// ═══════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════
export const Auth = {
  async login(email, password) {
    const data = await request('POST', '/api/auth/login', { email, password }, false);
    if (data) {
      localStorage.setItem('op_token',   data.accessToken);
      localStorage.setItem('op_refresh', data.refreshToken);
      localStorage.setItem('op_user',    JSON.stringify(data.user));
    }
    return data;
  },

  async register(pseudo, email, password) {
    const data = await request('POST', '/api/auth/register', { pseudo, email, password }, false);
    if (data) {
      localStorage.setItem('op_token',   data.accessToken);
      localStorage.setItem('op_refresh', data.refreshToken);
      localStorage.setItem('op_user',    JSON.stringify(data.user));
    }
    return data;
  },

  async logout() {
    try { await request('POST', '/api/auth/logout'); } catch {}
    localStorage.removeItem('op_token');
    localStorage.removeItem('op_refresh');
    localStorage.removeItem('op_user');
  },

  async me() {
    return request('GET', '/api/auth/me');
  },

  async forgotPassword(email) {
    return request('POST', '/api/auth/forgot-password', { email }, false);
  },

  getUser() {
    try { return JSON.parse(localStorage.getItem('op_user')); } catch { return null; }
  },

  isLoggedIn() { return !!getToken(); },
  isAdmin()    { return ['admin','superadmin'].includes(this.getUser()?.role); },
};

// ═══════════════════════════════════════════════════════
// PRODUITS
// ═══════════════════════════════════════════════════════
export const Products = {
  async getAll({ category = 'all', search = '', page = 1 } = {}) {
    const params = new URLSearchParams({ page });
    if (category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    return request('GET', `/api/products?${params}`, null, false);
  },

  async getBySlug(slug) {
    return request('GET', `/api/products/${slug}`, null, false);
  },
};

// ═══════════════════════════════════════════════════════
// COMMANDES
// ═══════════════════════════════════════════════════════
export const Orders = {
  async create(payload) { return request('POST', '/api/orders', payload); },
  async getMy()         { return request('GET',  '/api/orders/my'); },
  async getById(id)     { return request('GET',  `/api/orders/${id}`); },
};

// ═══════════════════════════════════════════════════════
// ÉVÉNEMENTS
// ═══════════════════════════════════════════════════════
export const Events = {
  async getAll(params = {}) {
    const q = new URLSearchParams(params);
    return request('GET', `/api/events?${q}`, null, false);
  },
  async getById(id)              { return request('GET',  `/api/events/${id}`, null, false); },
  async register(eventId, guests){ return request('POST', '/api/events/register', { eventId, guests }); },
};

// ═══════════════════════════════════════════════════════
// CONTACT / RÉSERVATIONS
// ═══════════════════════════════════════════════════════
export const Contact = {
  async send(payload) { return request('POST', '/api/contact', payload, false); },
};

// ═══════════════════════════════════════════════════════
// NEWSLETTER
// ═══════════════════════════════════════════════════════
export const Newsletter = {
  async subscribe(email, lang = 'fr') {
    return request('POST', '/api/newsletter/subscribe', { email, lang }, false);
  },
};

// ═══════════════════════════════════════════════════════
// PAIEMENT
// ═══════════════════════════════════════════════════════
export const Payment = {
  async initiate(orderId, method) {
    return request('POST', '/api/payment/initiate', { orderId, method });
  },
  async confirm(orderId, reference) {
    return request('POST', '/api/payment/confirm', { orderId, reference });
  },
};

// ═══════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════
export const Admin = {
  async getDashboard()            { return request('GET', '/api/admin/dashboard'); },
  async getUsers(params = {})     { return request('GET', `/api/admin/users?${new URLSearchParams(params)}`); },
  async updateUser(id, data)      { return request('PATCH', `/api/admin/users/${id}`, data); },
  async getOrders(params = {})    { return request('GET', `/api/admin/orders?${new URLSearchParams(params)}`); },
  async updateOrderStatus(id, status, note) {
    return request('PATCH', `/api/orders/${id}/status`, { status, note });
  },
  async getContacts(params = {})  { return request('GET', `/api/admin/contacts?${new URLSearchParams(params)}`); },
  async updateContact(id, status, adminNotes) {
    return request('PATCH', `/api/contact/${id}/status`, { status, adminNotes });
  },
  async getProducts(params = {})  { return request('GET', `/api/products?${new URLSearchParams(params)}`); },
  async createProduct(data)       { return request('POST', '/api/products', data); },
  async updateProduct(id, data)   { return request('PATCH', `/api/products/${id}`, data); },
  async deleteProduct(id)         { return request('DELETE', `/api/products/${id}`); },
  async getEvents(params = {})    { return request('GET', `/api/events?${new URLSearchParams(params)}`); },
  async createEvent(data)         { return request('POST', '/api/events', data); },
  async updateEvent(id, data)     { return request('PATCH', `/api/events/${id}`, data); },
};

// ═══════════════════════════════════════════════════════
// UTILS — Health check
// ═══════════════════════════════════════════════════════
export async function checkApiHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.ok;
  } catch { return false; }
}