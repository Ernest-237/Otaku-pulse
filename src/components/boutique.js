// src/components/boutique.js
// ═══════════════════════════════════════════════════════
// OTAKU PULSE — Boutique / Shop Component
// Catalogue goodies, filtres, panier, promotions
// Prêt pour connexion API produits backend
// ═══════════════════════════════════════════════════════

// ── Catalogue produits (sera remplacé par API) ────────
export const PRODUCTS = [
  // ── POSTERS ──
  {
    id: 'p001', slug: 'poster-naruto-ramen',
    category: 'posters', tags: ['naruto','bestseller'],
    nameF: 'Poster Naruto — Ichiraku Ramen', nameE: 'Naruto Poster — Ichiraku Ramen',
    descF: 'Impression HD 50×70cm sur papier photo. Finition brillante.',
    descE: 'HD print 50×70cm on photo paper. Glossy finish.',
    price: 4500, oldPrice: 6000, currency: 'FCFA',
    emoji: '🍜', color: '#f97316',
    badge: 'PROMO', badgeColor: '#dc2626',
    stock: 12, rating: 4.8, reviews: 24,
  },
  {
    id: 'p002', slug: 'poster-jjk-territory',
    category: 'posters', tags: ['jujutsu kaisen','new'],
    nameF: 'Poster JJK — Extension du Territoire', nameE: 'JJK Poster — Unlimited Void',
    descF: 'Impression HD 50×70cm. Geto Suguru et Gojo Satoru.',
    descE: 'HD print 50×70cm. Geto Suguru and Gojo Satoru.',
    price: 5500, oldPrice: null, currency: 'FCFA',
    emoji: '🌌', color: '#8b5cf6',
    badge: 'NOUVEAU', badgeColor: '#22c55e',
    stock: 8, rating: 4.9, reviews: 11,
  },
  {
    id: 'p003', slug: 'poster-onepiece-straw-hat',
    category: 'posters', tags: ['one piece'],
    nameF: 'Poster One Piece — Équipage Chapeau de Paille', nameE: 'One Piece Poster — Straw Hat Crew',
    descF: 'Impression HD 70×100cm. Les 10 membres réunis.',
    descE: 'HD print 70×100cm. All 10 crew members.',
    price: 7500, oldPrice: null, currency: 'FCFA',
    emoji: '☠️', color: '#dc2626',
    badge: null, badgeColor: null,
    stock: 5, rating: 4.7, reviews: 18,
  },
  // ── STICKERS ──
  {
    id: 's001', slug: 'sticker-pack-naruto',
    category: 'stickers', tags: ['naruto','bestseller'],
    nameF: 'Pack Stickers Naruto — 20 pièces', nameE: 'Naruto Sticker Pack — 20pcs',
    descF: 'Stickers premium découpés au laser. Résistants à l\'eau.',
    descE: 'Premium laser-cut stickers. Water resistant.',
    price: 2500, oldPrice: 3500, currency: 'FCFA',
    emoji: '🥷', color: '#f97316',
    badge: 'PROMO', badgeColor: '#dc2626',
    stock: 30, rating: 4.6, reviews: 42,
  },
  {
    id: 's002', slug: 'sticker-pack-demon-slayer',
    category: 'stickers', tags: ['demon slayer','new'],
    nameF: 'Pack Stickers Demon Slayer — 15 pièces', nameE: 'Demon Slayer Sticker Pack — 15pcs',
    descF: 'Tanjiro, Nezuko, Inosuke et Zenitsu en stickers HD.',
    descE: 'Tanjiro, Nezuko, Inosuke and Zenitsu HD stickers.',
    price: 2000, oldPrice: null, currency: 'FCFA',
    emoji: '🗡️', color: '#3b82f6',
    badge: 'NOUVEAU', badgeColor: '#22c55e',
    stock: 20, rating: 4.8, reviews: 15,
  },
  // ── ACCESSOIRES ──
  {
    id: 'a001', slug: 'gobelet-thematique',
    category: 'accessoires', tags: ['goodies','bestseller'],
    nameF: 'Gobelet Thématique Otaku Pulse', nameE: 'Otaku Pulse Thematic Cup',
    descF: 'Gobelet réutilisable 40cl avec visuel anime. Inclus dans tous les événements.',
    descE: '40cl reusable cup with anime visuals. Included in all events.',
    price: 3000, oldPrice: null, currency: 'FCFA',
    emoji: '🥤', color: '#22c55e',
    badge: null, badgeColor: null,
    stock: 50, rating: 4.5, reviews: 8,
  },
  {
    id: 'a002', slug: 'badge-membre-otaku',
    category: 'accessoires', tags: ['goodies','new'],
    nameF: 'Badge Membre Otaku Pulse', nameE: 'Otaku Pulse Member Badge',
    descF: 'Badge métallique émaillé. Édition limitée lancement.',
    descE: 'Enamel metal badge. Limited launch edition.',
    price: 1500, oldPrice: null, currency: 'FCFA',
    emoji: '📛', color: '#22c55e',
    badge: 'ÉDITION LIMITÉE', badgeColor: '#f59e0b',
    stock: 3, rating: 5.0, reviews: 6,
  },
  {
    id: 'a003', slug: 'tote-bag-otaku',
    category: 'accessoires', tags: ['goodies'],
    nameF: 'Tote Bag Otaku Pulse', nameE: 'Otaku Pulse Tote Bag',
    descF: 'Sac en coton bio avec logo Otaku Pulse. 38×42cm.',
    descE: 'Organic cotton bag with Otaku Pulse logo. 38×42cm.',
    price: 5000, oldPrice: 6500, currency: 'FCFA',
    emoji: '👜', color: '#22c55e',
    badge: 'PROMO', badgeColor: '#dc2626',
    stock: 15, rating: 4.4, reviews: 9,
  },
  // ── KITS DÉCO ──
  {
    id: 'k001', slug: 'kit-deco-naruto',
    category: 'kits', tags: ['naruto','bestseller'],
    nameF: 'Kit Déco Mini — Univers Naruto', nameE: 'Mini Deco Kit — Naruto Universe',
    descF: 'Confettis shurikens + 5 stickers + 1 poster A3. DIY party.',
    descE: 'Shuriken confetti + 5 stickers + 1 A3 poster. DIY party.',
    price: 8500, oldPrice: 11000, currency: 'FCFA',
    emoji: '🎋', color: '#f97316',
    badge: 'PROMO', badgeColor: '#dc2626',
    stock: 7, rating: 4.7, reviews: 13,
  },
  {
    id: 'k002', slug: 'kit-deco-aot',
    category: 'kits', tags: ['attack on titan','new'],
    nameF: 'Kit Déco Mini — Attack on Titan', nameE: 'Mini Deco Kit — Attack on Titan',
    descF: 'Confettis + 5 stickers Survey Corps + 1 poster A3.',
    descE: 'Confetti + 5 Survey Corps stickers + 1 A3 poster.',
    price: 8500, oldPrice: null, currency: 'FCFA',
    emoji: '⚔️', color: '#6b7280',
    badge: 'NOUVEAU', badgeColor: '#22c55e',
    stock: 9, rating: 4.6, reviews: 7,
  },
];

// ── Catégories ────────────────────────────────────────
const CATEGORIES = {
  fr: [
    { id: 'all',         label: 'Tout',        icon: '✨' },
    { id: 'posters',     label: 'Posters',     icon: '🖼️' },
    { id: 'stickers',    label: 'Stickers',    icon: '🏷️' },
    { id: 'accessoires', label: 'Accessoires', icon: '🎁' },
    { id: 'kits',        label: 'Kits Déco',   icon: '🎋' },
  ],
  en: [
    { id: 'all',         label: 'All',         icon: '✨' },
    { id: 'posters',     label: 'Posters',     icon: '🖼️' },
    { id: 'stickers',    label: 'Stickers',    icon: '🏷️' },
    { id: 'accessoires', label: 'Accessories', icon: '🎁' },
    { id: 'kits',        label: 'Deco Kits',   icon: '🎋' },
  ],
};

// ── État panier (partagé avec navbar) ─────────────────
export const cartState = {
  items: JSON.parse(localStorage.getItem('op_cart') || '[]'),
};

// ── HTML Template ─────────────────────────────────────
export function renderBoutique() {
  return `
  <section id="boutique" class="boutique">

    <div class="boutique-bg">
      <div class="boutique-grid"></div>
      <div class="boutique-glow"></div>
    </div>

    <div class="boutique-container">

      <!-- ── EN-TÊTE ── -->
      <div class="section-header">
        <div class="section-tag">
          <span class="section-tag-dot" style="background:#f97316;box-shadow:0 0 8px #f97316"></span>
          <span data-fr="Boutique Otaku" data-en="Otaku Shop">Boutique Otaku</span>
        </div>
        <h2 class="section-title">
          <span data-fr="GOODIES &" data-en="GOODIES &">GOODIES &</span><br>
          <span class="title-green" data-fr="DÉCO MANGA" data-en="MANGA DECO">DÉCO MANGA</span>
        </h2>
        <p class="section-subtitle"
           data-fr="Posters HD, stickers premium et kits de décoration pour prolonger l'expérience Otaku chez vous."
           data-en="HD posters, premium stickers and decoration kits to extend the Otaku experience at home.">
          Posters HD, stickers premium et kits de décoration pour prolonger l'expérience Otaku chez vous.
        </p>
      </div>

      <!-- ── PROMO BANNER ── -->
      <div class="promo-banner">
        <div class="promo-banner-inner">
          <span class="promo-icon">⚡</span>
          <div class="promo-text">
            <strong data-fr="OFFRE DE LANCEMENT" data-en="LAUNCH OFFER">OFFRE DE LANCEMENT</strong>
            <span data-fr=" — Livraison offerte dès 15 000 FCFA d'achat"
                  data-en=" — Free delivery from 15,000 FCFA purchase">
              — Livraison offerte dès 15 000 FCFA d'achat
            </span>
          </div>
          <div class="promo-countdown-mini" id="promoCd">
            <span id="promoH">--</span>h <span id="promoM">--</span>m <span id="promoS">--</span>s
          </div>
        </div>
      </div>

      <!-- ── FILTRES + SEARCH ── -->
      <div class="boutique-toolbar">
        <div class="category-filters" id="categoryFilters">
          <!-- injecté par JS -->
        </div>
        <div class="boutique-search-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" class="boutique-search" id="boutiqueSearch"
                 placeholder="Rechercher..." 
                 data-placeholder-fr="Rechercher..."
                 data-placeholder-en="Search..."
                 oninput="window.filterProducts()">
        </div>
      </div>

      <!-- ── RÉSULTATS COUNT ── -->
      <div class="results-count" id="resultsCount">
        <span id="resultsNum">10</span>
        <span data-fr=" articles" data-en=" items"> articles</span>
      </div>

      <!-- ── GRILLE PRODUITS ── -->
      <div class="products-grid" id="productsGrid">
        <!-- injecté par JS -->
      </div>

      <!-- ── MINI PANIER FLOTTANT ── -->
      <div class="mini-cart" id="miniCart" style="display:none">
        <div class="mini-cart-header">
          <span>🛒 <span data-fr="Panier" data-en="Cart">Panier</span></span>
          <span class="mini-cart-count" id="miniCartCount">0</span>
          <button class="mini-cart-close" onclick="window.closeMiniCart()">✕</button>
        </div>
        <div class="mini-cart-items" id="miniCartItems"></div>
        <div class="mini-cart-footer">
          <div class="mini-cart-total">
            <span data-fr="Total:" data-en="Total:">Total:</span>
            <strong id="miniCartTotal">0 FCFA</strong>
          </div>
          <button class="mini-cart-checkout" onclick="window.goToCheckout()">
            <span data-fr="Commander" data-en="Checkout">Commander</span> →
          </button>
        </div>
      </div>

    </div>
  </section>
  `;
}

// ── CSS ───────────────────────────────────────────────
export const boutiqueCSS = `

/* ══ BOUTIQUE ══ */
.boutique {
  position: relative;
  padding: 8rem 0 6rem;
  overflow: hidden;
  border-top: 1px solid rgba(34,197,94,0.08);
}
.boutique-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.boutique-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(249,115,22,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(249,115,22,0.02) 1px, transparent 1px);
  background-size: 80px 80px;
}
.boutique-glow {
  position: absolute;
  top: 30%; left: 50%;
  transform: translateX(-50%);
  width: 800px; height: 400px;
  background: radial-gradient(ellipse, rgba(34,197,94,0.04) 0%, transparent 70%);
}
.boutique-container {
  position: relative; z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* ── PROMO BANNER ── */
.promo-banner {
  background: linear-gradient(135deg, rgba(220,38,38,0.1), rgba(34,197,94,0.08));
  border: 1px solid rgba(220,38,38,0.25);
  border-radius: 14px;
  margin-bottom: 2.5rem;
  overflow: hidden;
  position: relative;
}
.promo-banner::before {
  content: '';
  position: absolute; top: 0; left: -100%;
  width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
  animation: promoBanner 3s ease-in-out infinite;
}
@keyframes promoBanner { to { left: 140%; } }
.promo-banner-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  flex-wrap: wrap;
}
.promo-icon { font-size: 1.3rem; animation: promo-bounce 1s ease-in-out infinite alternate; }
@keyframes promo-bounce { from { transform: scale(1); } to { transform: scale(1.2); } }
.promo-text {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(240,253,244,0.8);
}
.promo-text strong { color: #dc2626; letter-spacing: 1px; }
.promo-countdown-mini {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.1rem;
  letter-spacing: 2px;
  color: #22c55e;
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.2);
  border-radius: 8px;
  padding: 4px 12px;
}

/* ── TOOLBAR ── */
.boutique-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.category-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.cat-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(12,26,46,0.8);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 50px;
  padding: 8px 16px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(240,253,244,0.5);
  cursor: pointer;
  transition: all 0.25s;
  white-space: nowrap;
}
.cat-btn:hover {
  border-color: rgba(34,197,94,0.3);
  color: #f0fdf4;
}
.cat-btn.active {
  background: rgba(34,197,94,0.12);
  border-color: #22c55e;
  color: #22c55e;
  box-shadow: 0 0 12px rgba(34,197,94,0.15);
}
.boutique-search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(12,26,46,0.8);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 50px;
  padding: 8px 16px;
  transition: border-color 0.25s;
}
.boutique-search-wrap:focus-within {
  border-color: rgba(34,197,94,0.4);
}
.search-icon { font-size: 0.9rem; opacity: 0.5; }
.boutique-search {
  background: none;
  border: none;
  outline: none;
  color: #f0fdf4;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  width: 180px;
}
.boutique-search::placeholder { color: rgba(240,253,244,0.3); }

/* ── RESULTS COUNT ── */
.results-count {
  font-size: 0.8rem;
  color: rgba(240,253,244,0.35);
  letter-spacing: 1px;
  margin-bottom: 1.5rem;
}
.results-count span:first-child { color: #22c55e; font-weight: 700; }

/* ── PRODUCTS GRID ── */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 3rem;
}

/* ── PRODUCT CARD ── */
.product-card {
  background: linear-gradient(160deg, rgba(12,26,46,0.95) 0%, rgba(6,14,26,0.98) 100%);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.34,1.2,0.64,1);
  position: relative;
  display: flex;
  flex-direction: column;
}
.product-card:hover {
  transform: translateY(-6px);
  border-color: rgba(34,197,94,0.25);
  box-shadow: 0 20px 50px rgba(0,0,0,0.35), 0 0 25px rgba(34,197,94,0.08);
}

/* Product image area */
.product-img {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(12,26,46,0.6), rgba(30,58,95,0.4));
}
.product-img::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, transparent 60%, rgba(6,14,26,0.8));
}
.product-emoji {
  position: relative; z-index: 1;
  transition: transform 0.3s;
  filter: drop-shadow(0 0 20px var(--p-color, #22c55e));
}
.product-card:hover .product-emoji { transform: scale(1.15) rotate(-5deg); }

/* Badge */
.product-badge {
  position: absolute;
  top: 10px; left: 10px;
  z-index: 2;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 4px 10px;
  border-radius: 20px;
  background: var(--badge-bg, #dc2626);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

/* Stock indicator */
.product-stock {
  position: absolute;
  top: 10px; right: 10px;
  z-index: 2;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  background: rgba(0,0,0,0.6);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(240,253,244,0.5);
}
.product-stock.low { color: #f97316; border-color: rgba(249,115,22,0.3); }
.product-stock.critical { color: #dc2626; border-color: rgba(220,38,38,0.4); animation: stockPulse 1.5s ease-in-out infinite; }
@keyframes stockPulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }

/* Product info */
.product-info {
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.product-category {
  font-size: 0.68rem;
  letter-spacing: 2px;
  color: var(--p-color, #22c55e);
  text-transform: uppercase;
  font-weight: 700;
}
.product-name {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: #f0fdf4;
  line-height: 1.3;
}
.product-desc {
  font-size: 0.75rem;
  color: rgba(240,253,244,0.4);
  line-height: 1.5;
  flex: 1;
}

/* Rating */
.product-rating {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}
.stars { font-size: 0.75rem; color: #f59e0b; }
.rating-num { font-size: 0.75rem; font-weight: 700; color: rgba(240,253,244,0.6); }
.rating-count { font-size: 0.7rem; color: rgba(240,253,244,0.3); }

/* Price */
.product-price-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}
.product-price {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.4rem;
  letter-spacing: 1px;
  color: #f0fdf4;
}
.product-old-price {
  font-size: 0.8rem;
  color: rgba(240,253,244,0.3);
  text-decoration: line-through;
}
.product-discount {
  font-size: 0.7rem;
  font-weight: 700;
  background: rgba(220,38,38,0.15);
  color: #dc2626;
  border: 1px solid rgba(220,38,38,0.25);
  border-radius: 4px;
  padding: 2px 6px;
}

/* Add to cart btn */
.product-actions {
  padding: 0 1rem 1rem;
  display: flex;
  gap: 8px;
}
.btn-add-cart {
  flex: 1;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none;
  border-radius: 10px;
  padding: 10px;
  color: #0c1a2e;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.95rem;
  letter-spacing: 1.5px;
  cursor: pointer;
  transition: all 0.25s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 0 15px rgba(34,197,94,0.2);
}
.btn-add-cart:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 20px rgba(34,197,94,0.4);
}
.btn-add-cart:active { transform: scale(0.97); }
.btn-add-cart.added {
  background: linear-gradient(135deg, #16a34a, #15803d);
}
.btn-wishlist {
  width: 40px; height: 40px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.25s;
  color: rgba(240,253,244,0.4);
}
.btn-wishlist:hover {
  background: rgba(220,38,38,0.1);
  border-color: rgba(220,38,38,0.3);
  color: #dc2626;
}
.btn-wishlist.active { color: #dc2626; background: rgba(220,38,38,0.1); border-color: rgba(220,38,38,0.3); }

/* No results */
.no-results {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem;
  color: rgba(240,253,244,0.3);
}
.no-results-emoji { font-size: 3rem; margin-bottom: 1rem; }
.no-results h3 { font-family: 'Bebas Neue', sans-serif; font-size: 1.5rem; letter-spacing: 3px; }

/* ── MINI CART ── */
.mini-cart {
  position: fixed;
  bottom: 2rem; right: 2rem;
  width: 320px;
  background: #0d1f35;
  border: 1px solid rgba(34,197,94,0.25);
  border-radius: 16px;
  z-index: 500;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  animation: cartSlideIn 0.3s ease;
  overflow: hidden;
}
@keyframes cartSlideIn {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.mini-cart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  font-size: 0.9rem;
  font-weight: 700;
  color: #f0fdf4;
}
.mini-cart-count {
  background: #22c55e;
  color: #0c1a2e;
  border-radius: 50%;
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}
.mini-cart-close {
  background: none; border: none;
  color: rgba(240,253,244,0.4);
  cursor: pointer; font-size: 0.9rem;
  transition: color 0.2s;
}
.mini-cart-close:hover { color: #dc2626; }
.mini-cart-items {
  max-height: 220px;
  overflow-y: auto;
  padding: 8px;
}
.mini-cart-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}
.mini-cart-item:hover { background: rgba(255,255,255,0.03); }
.mci-emoji { font-size: 1.5rem; }
.mci-info { flex: 1; }
.mci-name { font-size: 0.82rem; font-weight: 600; color: #f0fdf4; }
.mci-price { font-size: 0.75rem; color: #22c55e; font-weight: 700; }
.mci-qty {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.8rem;
}
.mci-qty button {
  width: 22px; height: 22px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  color: #f0fdf4;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.mci-qty button:hover { background: rgba(34,197,94,0.15); border-color: #22c55e; }
.mini-cart-footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.mini-cart-total { font-size: 0.85rem; color: rgba(240,253,244,0.5); }
.mini-cart-total strong { color: #22c55e; font-size: 1rem; }
.mini-cart-checkout {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none;
  border-radius: 8px;
  padding: 9px 16px;
  color: #0c1a2e;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.95rem;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 0 12px rgba(34,197,94,0.3);
}
.mini-cart-checkout:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(34,197,94,0.45);
}

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .boutique-toolbar { flex-direction: column; align-items: stretch; }
  .boutique-search { width: 100%; }
  .boutique-search-wrap { border-radius: 10px; }
  .mini-cart { width: calc(100vw - 2rem); right: 1rem; bottom: 1rem; }
}
@media (max-width: 480px) {
  .products-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .boutique { padding: 5rem 0 3rem; }
}
`;

// ── State local ───────────────────────────────────────
let currentCategory = 'all';
let currentSearch = '';
let currentLang = 'fr';
let wishlist = JSON.parse(localStorage.getItem('op_wishlist') || '[]');

// ── Init ──────────────────────────────────────────────
export function initBoutique(lang = 'fr') {
  currentLang = lang;

  const style = document.createElement('style');
  style.textContent = boutiqueCSS;
  document.head.appendChild(style);

  renderCategoryFilters(lang);
  renderProductGrid();
  startPromoCountdown();
  syncCartBadge();
}

// ── Render Category Filters ───────────────────────────
function renderCategoryFilters(lang = 'fr') {
  const wrap = document.getElementById('categoryFilters');
  if (!wrap) return;
  const cats = CATEGORIES[lang] || CATEGORIES.fr;
  wrap.innerHTML = cats.map(c => `
    <button class="cat-btn ${c.id === currentCategory ? 'active' : ''}"
            onclick="window.setCategory('${c.id}')">
      ${c.icon} ${c.label}
    </button>
  `).join('');
}

// ── Render Product Grid ───────────────────────────────
function renderProductGrid() {
  const grid = document.getElementById('productsGrid');
  const countEl = document.getElementById('resultsNum');
  if (!grid) return;

  let filtered = PRODUCTS.filter(p => {
    const matchCat = currentCategory === 'all' || p.category === currentCategory;
    const name = currentLang === 'fr' ? p.nameF : p.nameE;
    const matchSearch = !currentSearch || name.toLowerCase().includes(currentSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  if (countEl) countEl.textContent = filtered.length;

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="no-results">
        <div class="no-results-emoji">🔍</div>
        <h3>${currentLang === 'fr' ? 'AUCUN RÉSULTAT' : 'NO RESULTS'}</h3>
        <p style="margin-top:.5rem;font-size:.85rem">
          ${currentLang === 'fr' ? 'Essayez un autre terme ou catégorie.' : 'Try another term or category.'}
        </p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const name = currentLang === 'fr' ? p.nameF : p.nameE;
    const desc = currentLang === 'fr' ? p.descF : p.descE;
    const inCart = cartState.items.some(i => i.id === p.id);
    const inWish = wishlist.includes(p.id);
    const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : null;
    const stars = '★'.repeat(Math.floor(p.rating)) + (p.rating % 1 >= 0.5 ? '½' : '');
    const stockClass = p.stock <= 3 ? 'critical' : p.stock <= 8 ? 'low' : '';
    const stockLabel = currentLang === 'fr'
      ? (p.stock <= 3 ? `⚠ ${p.stock} restants` : p.stock <= 8 ? `${p.stock} en stock` : 'En stock')
      : (p.stock <= 3 ? `⚠ ${p.stock} left` : p.stock <= 8 ? `${p.stock} in stock` : 'In stock');
    const addLabel = currentLang === 'fr' ? (inCart ? '✓ Ajouté' : '+ Panier') : (inCart ? '✓ Added' : '+ Cart');

    return `
    <div class="product-card reveal-product" style="--p-color:${p.color}; opacity:0; transform:translateY(30px); transition:all 0.5s ease">
      <div class="product-img">
        ${p.badge ? `<div class="product-badge" style="--badge-bg:${p.badgeColor}">${p.badge}</div>` : ''}
        <div class="product-stock ${stockClass}">${stockLabel}</div>
        <div class="product-emoji">${p.emoji}</div>
      </div>
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${name}</div>
        <div class="product-desc">${desc}</div>
        <div class="product-rating">
          <span class="stars">${stars}</span>
          <span class="rating-num">${p.rating}</span>
          <span class="rating-count">(${p.reviews})</span>
        </div>
        <div class="product-price-row">
          <span class="product-price">${p.price.toLocaleString()} ${p.currency}</span>
          ${p.oldPrice ? `<span class="product-old-price">${p.oldPrice.toLocaleString()}</span>` : ''}
          ${discount ? `<span class="product-discount">-${discount}%</span>` : ''}
        </div>
      </div>
      <div class="product-actions">
        <button class="btn-add-cart ${inCart ? 'added' : ''}"
                id="cart-btn-${p.id}"
                onclick="window.addToCart('${p.id}')">
          🛒 ${addLabel}
        </button>
        <button class="btn-wishlist ${inWish ? 'active' : ''}"
                id="wish-btn-${p.id}"
                onclick="window.toggleWishlist('${p.id}')">
          ${inWish ? '❤️' : '🤍'}
        </button>
      </div>
    </div>`;
  }).join('');

  // Reveal animation
  setTimeout(() => {
    document.querySelectorAll('.reveal-product').forEach((el, i) => {
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * 60);
    });
  }, 50);
}

// ── Promo Countdown (24h renouvelable) ────────────────
function startPromoCountdown() {
  let end = localStorage.getItem('op_promo_end');
  if (!end || Date.now() > parseInt(end)) {
    end = Date.now() + 24 * 3600 * 1000;
    localStorage.setItem('op_promo_end', end);
  }

  function tick() {
    const diff = parseInt(end) - Date.now();
    if (diff <= 0) return;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const pad = n => String(n).padStart(2, '0');
    const hEl = document.getElementById('promoH');
    const mEl = document.getElementById('promoM');
    const sEl = document.getElementById('promoS');
    if (hEl) hEl.textContent = pad(h);
    if (mEl) mEl.textContent = pad(m);
    if (sEl) sEl.textContent = pad(s);
  }
  tick();
  setInterval(tick, 1000);
}

// ── Cart Logic ────────────────────────────────────────
function syncCartBadge() {
  const total = cartState.items.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = total;
  // Importer updateCartBadge si dispo
  if (window.updateCartBadge) window.updateCartBadge(total);
}

function saveCart() {
  localStorage.setItem('op_cart', JSON.stringify(cartState.items));
  syncCartBadge();
}

window.addToCart = function(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = cartState.items.find(i => i.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    cartState.items.push({
      id: product.id,
      name: currentLang === 'fr' ? product.nameF : product.nameE,
      price: product.price,
      currency: product.currency,
      emoji: product.emoji,
      qty: 1,
    });
  }

  saveCart();

  // Feedback visuel
  const btn = document.getElementById(`cart-btn-${productId}`);
  if (btn) {
    btn.classList.add('added');
    btn.textContent = `🛒 ${currentLang === 'fr' ? '✓ Ajouté' : '✓ Added'}`;
  }

  // Ouvrir mini panier
  openMiniCart();
  renderMiniCart();

  // 🔌 À connecter : await fetch('/api/cart/add', { body: { productId, qty: 1 } })
};

window.toggleWishlist = function(productId) {
  const idx = wishlist.indexOf(productId);
  if (idx > -1) {
    wishlist.splice(idx, 1);
  } else {
    wishlist.push(productId);
  }
  localStorage.setItem('op_wishlist', JSON.stringify(wishlist));

  const btn = document.getElementById(`wish-btn-${productId}`);
  if (btn) {
    btn.classList.toggle('active', wishlist.includes(productId));
    btn.textContent = wishlist.includes(productId) ? '❤️' : '🤍';
  }
  // 🔌 À connecter : await fetch('/api/wishlist/toggle', { body: { productId } })
};

function openMiniCart() {
  const cart = document.getElementById('miniCart');
  if (cart) cart.style.display = 'block';
}
window.closeMiniCart = function() {
  const cart = document.getElementById('miniCart');
  if (cart) cart.style.display = 'none';
};

function renderMiniCart() {
  const wrap = document.getElementById('miniCartItems');
  const total = document.getElementById('miniCartTotal');
  const count = document.getElementById('miniCartCount');
  if (!wrap) return;

  const totalQty = cartState.items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cartState.items.reduce((s, i) => s + i.price * i.qty, 0);

  if (count) count.textContent = totalQty;
  if (total) total.textContent = `${totalPrice.toLocaleString()} FCFA`;

  if (!cartState.items.length) {
    wrap.innerHTML = `<p style="text-align:center;padding:1rem;color:rgba(240,253,244,0.3);font-size:.85rem">
      ${currentLang === 'fr' ? 'Panier vide' : 'Empty cart'} 🛒</p>`;
    return;
  }

  wrap.innerHTML = cartState.items.map(item => `
    <div class="mini-cart-item">
      <span class="mci-emoji">${item.emoji}</span>
      <div class="mci-info">
        <div class="mci-name">${item.name}</div>
        <div class="mci-price">${(item.price * item.qty).toLocaleString()} ${item.currency}</div>
      </div>
      <div class="mci-qty">
        <button onclick="window.updateCartQty('${item.id}', -1)">−</button>
        <span>${item.qty}</span>
        <button onclick="window.updateCartQty('${item.id}', 1)">+</button>
      </div>
    </div>
  `).join('');
}

window.updateCartQty = function(id, delta) {
  const item = cartState.items.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cartState.items.splice(cartState.items.indexOf(item), 1);
  saveCart();
  renderMiniCart();
};

window.goToCheckout = function() {
  // 🔌 À connecter au module de paiement (Step paiement)
  window.closeMiniCart();
  showBoutiqueToast(currentLang === 'fr' ? 'Module paiement bientôt disponible ⚡' : 'Payment module coming soon ⚡', 'info');
};

// ── Filtres ───────────────────────────────────────────
window.setCategory = function(cat) {
  currentCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.toggle('active', b.onclick?.toString().includes(`'${cat}'`));
  });
  renderProductGrid();
};

window.filterProducts = function() {
  const input = document.getElementById('boutiqueSearch');
  currentSearch = input?.value || '';
  renderProductGrid();
};

// ── Toast boutique ────────────────────────────────────
function showBoutiqueToast(msg, type = 'success') {
  const colors = { success: '#22c55e', error: '#dc2626', info: '#3b82f6' };
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);
    background:#0d1f35;border:1px solid ${colors[type]};border-radius:12px;
    padding:.8rem 1.4rem;color:#f0fdf4;font-family:'Rajdhani',sans-serif;
    font-size:.9rem;font-weight:600;z-index:9999;white-space:nowrap;
    box-shadow:0 10px 30px rgba(0,0,0,.4);animation:toastIn .3s ease`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ── Update langue ─────────────────────────────────────
export function updateBoutiqueLang(lang) {
  currentLang = lang;
  document.querySelectorAll('#boutique [data-fr]').forEach(el => {
    el.textContent = lang === 'fr' ? el.dataset.fr : el.dataset.en;
  });
  const searchInput = document.getElementById('boutiqueSearch');
  if (searchInput) searchInput.placeholder = lang === 'fr' ? 'Rechercher...' : 'Search...';
  renderCategoryFilters(lang);
  renderProductGrid();
  renderMiniCart();
}