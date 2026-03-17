// src/components/events.js
// ═══════════════════════════════════════════════════════
// OTAKU PULSE — Section Événements
// Calendrier, galerie, réservation, gestion admin
// Prêt pour connexion API backend
// ═══════════════════════════════════════════════════════

// ── Données événements (sera remplacé par API) ────────
const EVENTS = [
  {
    id: 'ev001',
    status: 'upcoming',   // upcoming | ongoing | past
    featured: true,
    type: 'hokage',
    typeColor: '#dc2626',
    emoji: '👑',
    titleF: 'Soirée Otaku Pulse — Grand Lancement',
    titleE: 'Otaku Pulse Night — Grand Launch',
    descF: 'Le tout premier événement officiel Otaku Pulse à Yaoundé. Décoration Zone Hokage complète, mixologie narrative, mapping vidéo et musique anime live.',
    descE: 'The very first official Otaku Pulse event in Yaoundé. Full Hokage Zone decoration, narrative mixology, video mapping and live anime music.',
    date: '2026-06-30',
    timeF: '18h00 — 23h59',
    timeE: '6:00 PM — 11:59 PM',
    location: 'Yaoundé, Cameroun',
    venue: 'Salle Prestige — Bastos',
    capacity: 80,
    registered: 47,
    price: 0,
    priceLabel: 'Sur invitation',
    priceLabelE: 'By invitation',
    themes: ['All Anime Universe'],
    tags: ['Lancement', 'VIP', 'Gratuit'],
    tagsE: ['Launch', 'VIP', 'Free'],
    img: '🎌',
  },
  {
    id: 'ev002',
    status: 'upcoming',
    featured: false,
    type: 'chunin',
    typeColor: '#22c55e',
    emoji: '⚔️',
    titleF: 'Anniversaire Thème Naruto — Pack Chūnin',
    titleE: 'Naruto Theme Birthday — Chūnin Pack',
    descF: 'Célébrez votre anniversaire dans l\'univers Naruto. Décoration Konoha complète, cocktail "Le Rasengan" et playlist Naruto Shippuden.',
    descE: 'Celebrate your birthday in the Naruto universe. Complete Konoha decoration, "Le Rasengan" cocktail and Naruto Shippuden playlist.',
    date: '2026-07-15',
    timeF: '15h00 — 20h00',
    timeE: '3:00 PM — 8:00 PM',
    location: 'Douala, Cameroun',
    venue: 'Domicile client — Bonanjo',
    capacity: 20,
    registered: 12,
    price: 200000,
    priceLabel: '200 000 FCFA',
    priceLabelE: '200,000 FCFA',
    themes: ['Naruto'],
    tags: ['Anniversaire', 'Privé'],
    tagsE: ['Birthday', 'Private'],
    img: '🍜',
  },
  {
    id: 'ev003',
    status: 'upcoming',
    featured: false,
    type: 'genin',
    typeColor: '#3b82f6',
    emoji: '🥋',
    titleF: 'Meet-up Otaku — Soirée Visionnage JJK',
    titleE: 'Otaku Meet-up — JJK Watch Party',
    descF: 'Visionnage collectif de Jujutsu Kaisen Saison 2. Décoration Genin, cocktail "Extension du Territoire" et ambiance féerique.',
    descE: 'Collective screening of Jujutsu Kaisen Season 2. Genin decoration, "Territory Extension" cocktail and magical atmosphere.',
    date: '2026-08-05',
    timeF: '19h00 — 23h00',
    timeE: '7:00 PM — 11:00 PM',
    location: 'Yaoundé, Cameroun',
    venue: 'À confirmer',
    capacity: 15,
    registered: 8,
    price: 85000,
    priceLabel: '85 000 FCFA',
    priceLabelE: '85,000 FCFA',
    themes: ['Jujutsu Kaisen'],
    tags: ['Meet-up', 'Visionnage'],
    tagsE: ['Meet-up', 'Watch Party'],
    img: '🌌',
  },
  {
    id: 'ev004',
    status: 'past',
    featured: false,
    type: 'chunin',
    typeColor: '#22c55e',
    emoji: '⚔️',
    titleF: 'Soirée One Piece — 25 ans de l\'Animé',
    titleE: 'One Piece Night — 25th Anniversary',
    descF: 'Célébration du 25ème anniversaire de One Piece. Chūnin full decoration, Gomu Gomu Punch bar et cosplay contest.',
    descE: 'Celebration of the 25th anniversary of One Piece. Full Chūnin decoration, Gomu Gomu Punch bar and cosplay contest.',
    date: '2025-10-20',
    timeF: '17h00 — 22h00',
    timeE: '5:00 PM — 10:00 PM',
    location: 'Yaoundé, Cameroun',
    venue: 'Salle Polyvalente — Melen',
    capacity: 50,
    registered: 50,
    price: 200000,
    priceLabel: '200 000 FCFA',
    priceLabelE: '200,000 FCFA',
    themes: ['One Piece'],
    tags: ['Anniversaire', 'Complet'],
    tagsE: ['Anniversary', 'Full'],
    img: '☠️',
  },
];

// ── Stats globales ────────────────────────────────────
const EVENT_STATS = [
  { numF: '4+',  numE: '4+',  labelF: 'Événements organisés',  labelE: 'Events organized' },
  { numF: '150+',numE: '150+',labelF: 'Participants comblés',   labelE: 'Happy attendees' },
  { numF: '3',   numE: '3',   labelF: 'Villes couvertes',       labelE: 'Cities covered' },
  { numF: '100%',numE: '100%',labelF: 'Satisfaction client',    labelE: 'Client satisfaction' },
];

// ── HTML Template ─────────────────────────────────────
export function renderEvents() {
  return `
  <section id="events" class="events">

    <div class="events-bg">
      <div class="events-grid"></div>
      <div class="events-glow-top"></div>
      <div class="events-glow-bottom"></div>
    </div>

    <div class="events-container">

      <!-- ── EN-TÊTE ── -->
      <div class="section-header">
        <div class="section-tag">
          <span class="section-tag-dot" style="background:#8b5cf6;box-shadow:0 0 8px #8b5cf6"></span>
          <span data-fr="Agenda Otaku" data-en="Otaku Agenda">Agenda Otaku</span>
        </div>
        <h2 class="section-title">
          <span data-fr="ÉVÉNEMENTS &" data-en="EVENTS &">ÉVÉNEMENTS &</span><br>
          <span class="title-purple"
                data-fr="EXPÉRIENCES LIVE" data-en="LIVE EXPERIENCES">
            EXPÉRIENCES LIVE
          </span>
        </h2>
        <p class="section-subtitle"
           data-fr="Découvrez nos prochains événements et revivez les moments forts de la communauté Otaku Pulse."
           data-en="Discover our upcoming events and relive the highlights of the Otaku Pulse community.">
          Découvrez nos prochains événements et revivez les moments forts de la communauté Otaku Pulse.
        </p>
      </div>

      <!-- ── STATS ── -->
      <div class="events-stats" id="eventsStats">
        ${EVENT_STATS.map(s => `
          <div class="event-stat-card">
            <div class="event-stat-num" data-fr="${s.numF}" data-en="${s.numE}">${s.numF}</div>
            <div class="event-stat-label" data-fr="${s.labelF}" data-en="${s.labelE}">${s.labelF}</div>
          </div>
        `).join('')}
      </div>

      <!-- ── FEATURED EVENT ── -->
      <div class="featured-event-wrap" id="featuredEvent">
        <!-- injecté par JS -->
      </div>

      <!-- ── FILTRES ── -->
      <div class="events-filters" id="eventsFilters">
        <button class="ev-filter-btn active" data-filter="all"
                onclick="window.filterEvents('all')">
          <span>🗓️</span>
          <span data-fr="Tous" data-en="All">Tous</span>
        </button>
        <button class="ev-filter-btn" data-filter="upcoming"
                onclick="window.filterEvents('upcoming')">
          <span>⚡</span>
          <span data-fr="À venir" data-en="Upcoming">À venir</span>
        </button>
        <button class="ev-filter-btn" data-filter="past"
                onclick="window.filterEvents('past')">
          <span>📜</span>
          <span data-fr="Passés" data-en="Past">Passés</span>
        </button>
      </div>

      <!-- ── EVENTS GRID ── -->
      <div class="events-grid-cards" id="eventsGrid">
        <!-- injecté par JS -->
      </div>

      <!-- ── CTA ORGANISER ── -->
      <div class="events-organize-cta">
        <div class="organize-cta-content">
          <div class="organize-emoji">🎌</div>
          <div class="organize-text">
            <h3 data-fr="Organisez votre propre événement Otaku"
                data-en="Organize your own Otaku event">
              Organisez votre propre événement Otaku
            </h3>
            <p data-fr="Anniversaire, meet-up ou soirée privée — on s&apos;occupe de tout. Préavis de 2 semaines requis."
               data-en="Birthday, meet-up or private party — we handle everything. 2-week notice required.">
              Anniversaire, meet-up ou soirée privée — on s'occupe de tout. Préavis de 2 semaines requis.
            </p>
          </div>
          <div class="organize-actions">
            <a href="#contact" class="hero-cta-primary">
              <span>📅</span>
              <span data-fr="Demander un devis" data-en="Request a quote">Demander un devis</span>
            </a>
            <a href="#services" class="hero-cta-secondary">
              <span data-fr="Voir les packs" data-en="See packs">Voir les packs</span>
            </a>
          </div>
        </div>
      </div>

    </div>

    <!-- ── MODAL DÉTAIL ÉVÉNEMENT ── -->
    <div class="event-modal-overlay" id="eventModalOverlay"
         onclick="window.closeEventModal(event)">
      <div class="event-modal" id="eventModal">
        <button class="modal-close" onclick="window.closeEventModal()">✕</button>
        <div id="eventModalContent"></div>
      </div>
    </div>

  </section>
  `;
}

// ── CSS ───────────────────────────────────────────────
export const eventsCSS = `

/* ══ EVENTS SECTION ══ */
.events {
  position: relative;
  padding: 8rem 0 6rem;
  overflow: hidden;
  border-top: 1px solid rgba(139,92,246,0.1);
}
.events-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.events-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(139,92,246,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139,92,246,0.025) 1px, transparent 1px);
  background-size: 80px 80px;
}
.events-glow-top {
  position: absolute; top: -10%; left: 30%;
  width: 600px; height: 400px;
  background: radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 70%);
}
.events-glow-bottom {
  position: absolute; bottom: 0; right: 10%;
  width: 500px; height: 400px;
  background: radial-gradient(ellipse, rgba(34,197,94,0.05) 0%, transparent 70%);
}
.events-container {
  position: relative; z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}
.title-purple {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── STATS ── */
.events-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 4rem;
}
.event-stat-card {
  background: linear-gradient(135deg, rgba(139,92,246,0.06), rgba(12,26,46,0.8));
  border: 1px solid rgba(139,92,246,0.15);
  border-radius: 14px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s;
}
.event-stat-card:hover {
  border-color: rgba(139,92,246,0.4);
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
.event-stat-num {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2.5rem;
  letter-spacing: 2px;
  color: #a78bfa;
  text-shadow: 0 0 20px rgba(139,92,246,0.5);
  line-height: 1;
}
.event-stat-label {
  font-size: 0.72rem;
  letter-spacing: 1.5px;
  color: rgba(240,253,244,0.4);
  text-transform: uppercase;
  margin-top: 6px;
}

/* ── FEATURED EVENT ── */
.featured-event {
  background: linear-gradient(135deg, rgba(220,38,38,0.06), rgba(12,26,46,0.95));
  border: 1px solid rgba(220,38,38,0.2);
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 3rem;
  display: grid;
  grid-template-columns: 1fr 380px;
  position: relative;
}
.featured-event::before {
  content: 'FEATURED';
  position: absolute;
  top: 20px; right: -30px;
  background: #dc2626;
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.8rem;
  letter-spacing: 2px;
  padding: 4px 40px;
  transform: rotate(45deg);
}
.featured-event-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8rem;
  padding: 3rem;
  background: linear-gradient(135deg, rgba(220,38,38,0.08), rgba(139,92,246,0.05));
  position: relative;
  overflow: hidden;
}
.featured-event-visual::after {
  content: '';
  position: absolute; inset: 0;
  background: repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.01) 0deg 1deg, transparent 1deg 5deg);
  animation: spinLines 40s linear infinite;
}
.featured-event-body { padding: 2rem; }
.featured-event-type {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--ev-color, #dc2626);
  background: rgba(220,38,38,0.1);
  border: 1px solid rgba(220,38,38,0.2);
  border-radius: 20px;
  padding: 4px 12px;
  margin-bottom: 1rem;
}
.featured-event-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  letter-spacing: 3px;
  color: #f0fdf4;
  line-height: 1.1;
  margin-bottom: 0.8rem;
}
.featured-event-desc {
  font-size: 0.88rem;
  color: rgba(240,253,244,0.55);
  line-height: 1.7;
  margin-bottom: 1.5rem;
}
.featured-event-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 1.5rem;
}
.ev-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  color: rgba(240,253,244,0.6);
}
.ev-meta-icon { font-size: 1rem; flex-shrink: 0; }
.ev-meta-strong { font-weight: 700; color: #f0fdf4; }
.featured-event-progress {
  margin-bottom: 1.5rem;
}
.ev-progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: rgba(240,253,244,0.4);
  margin-bottom: 6px;
}
.ev-progress-bar {
  height: 6px;
  background: rgba(255,255,255,0.06);
  border-radius: 3px;
  overflow: hidden;
}
.ev-progress-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #22c55e, #86efac);
  transition: width 1s ease;
  box-shadow: 0 0 8px rgba(34,197,94,0.4);
}
.featured-event-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* ── FILTERS ── */
.events-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}
.ev-filter-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(12,26,46,0.8);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 50px;
  padding: 9px 20px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: 1px;
  color: rgba(240,253,244,0.5);
  cursor: pointer;
  transition: all 0.25s;
}
.ev-filter-btn:hover {
  border-color: rgba(139,92,246,0.3);
  color: #f0fdf4;
}
.ev-filter-btn.active {
  background: rgba(139,92,246,0.12);
  border-color: #8b5cf6;
  color: #a78bfa;
  box-shadow: 0 0 12px rgba(139,92,246,0.15);
}

/* ── EVENTS GRID ── */
.events-grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
  margin-bottom: 4rem;
}

/* ── EVENT CARD ── */
.event-card {
  background: linear-gradient(160deg, rgba(12,26,46,0.95), rgba(6,14,26,0.98));
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.34,1.2,0.64,1);
  cursor: pointer;
  opacity: 0;
  transform: translateY(30px);
}
.event-card:hover {
  transform: translateY(-6px);
  border-color: var(--ev-card-color, rgba(139,92,246,0.3));
  box-shadow: 0 20px 50px rgba(0,0,0,0.3),
              0 0 25px rgba(139,92,246,0.15);
}
.event-card.past { opacity: 0.6; filter: grayscale(30%); }
.event-card.past:hover { opacity: 0.85; filter: grayscale(0%); }

/* Card header */
.ec-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 0;
}
.ec-type-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--ev-card-color, #8b5cf6);
  text-transform: uppercase;
}
.ec-status {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 3px 10px;
  border-radius: 20px;
}
.ec-status.upcoming {
  background: rgba(34,197,94,0.1);
  color: #22c55e;
  border: 1px solid rgba(34,197,94,0.25);
}
.ec-status.past {
  background: rgba(255,255,255,0.05);
  color: rgba(240,253,244,0.4);
  border: 1px solid rgba(255,255,255,0.08);
}

/* Card visual */
.ec-visual {
  text-align: center;
  padding: 2rem 1rem 1rem;
  font-size: 3.5rem;
  position: relative;
}
.ec-visual::after {
  content: '';
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 40px;
  background: linear-gradient(to bottom, transparent, rgba(6,14,26,0.5));
}

/* Card body */
.ec-body { padding: 0 1.2rem 1rem; }
.ec-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.3rem;
  letter-spacing: 2px;
  color: #f0fdf4;
  line-height: 1.2;
  margin-bottom: 0.5rem;
}
.ec-desc {
  font-size: 0.8rem;
  color: rgba(240,253,244,0.45);
  line-height: 1.6;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ec-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 1rem;
}
.ec-meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: rgba(240,253,244,0.5);
}
.ec-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.ec-tag {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 3px 9px;
  border-radius: 20px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(240,253,244,0.5);
}

/* Capacity bar */
.ec-capacity {
  margin-bottom: 1rem;
}
.ec-cap-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: rgba(240,253,244,0.35);
  margin-bottom: 5px;
}
.ec-cap-bar {
  height: 4px;
  background: rgba(255,255,255,0.05);
  border-radius: 3px;
  overflow: hidden;
}
.ec-cap-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 1s ease;
}

/* Card footer */
.ec-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 1.2rem 1.2rem;
  border-top: 1px solid rgba(255,255,255,0.04);
}
.ec-price {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.3rem;
  letter-spacing: 1px;
  color: #f0fdf4;
}
.ec-price-free { color: #22c55e; }
.ec-btn {
  background: linear-gradient(135deg, var(--ev-card-color, #8b5cf6), #5b21b6);
  border: none;
  border-radius: 10px;
  padding: 9px 18px;
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.95rem;
  letter-spacing: 1.5px;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 0 15px rgba(139,92,246,0.3);
}
.ec-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(139,92,246,0.45);
}
.ec-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

/* ── ORGANIZE CTA ── */
.events-organize-cta {
  background: linear-gradient(135deg, rgba(139,92,246,0.06), rgba(34,197,94,0.04), rgba(12,26,46,0.9));
  border: 1px solid rgba(139,92,246,0.15);
  border-radius: 20px;
  padding: 2.5rem;
  position: relative;
  overflow: hidden;
}
.events-organize-cta::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 30% 50%, rgba(139,92,246,0.06) 0%, transparent 60%);
  animation: ctaGlow 5s ease-in-out infinite;
}
.organize-cta-content {
  display: flex;
  align-items: center;
  gap: 2rem;
  position: relative;
  flex-wrap: wrap;
}
.organize-emoji {
  font-size: 3.5rem;
  flex-shrink: 0;
  animation: organizeFloat 3s ease-in-out infinite;
}
@keyframes organizeFloat {
  0%,100% { transform: translateY(0) rotate(-5deg); }
  50%      { transform: translateY(-8px) rotate(5deg); }
}
.organize-text { flex: 1; min-width: 200px; }
.organize-text h3 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(1.2rem, 2.5vw, 1.8rem);
  letter-spacing: 3px;
  color: #f0fdf4;
  margin-bottom: 0.5rem;
}
.organize-text p {
  font-size: 0.88rem;
  color: rgba(240,253,244,0.5);
  line-height: 1.6;
}
.organize-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* ── EVENT MODAL ── */
.event-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(12px);
  z-index: 2000;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.event-modal-overlay.open { display: flex; }
.event-modal {
  background: linear-gradient(160deg, #0d1f35, #0a1628);
  border: 1px solid rgba(139,92,246,0.25);
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
  box-shadow: 0 30px 80px rgba(0,0,0,0.6);
}
.event-modal-body { padding: 2rem; }
.em-visual {
  font-size: 5rem;
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(139,92,246,0.06), rgba(12,26,46,0.5));
  border-radius: 12px;
  margin-bottom: 1.5rem;
}
.em-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.8rem;
  letter-spacing: 3px;
  color: #f0fdf4;
  margin-bottom: 0.8rem;
}
.em-desc {
  font-size: 0.9rem;
  color: rgba(240,253,244,0.6);
  line-height: 1.7;
  margin-bottom: 1.5rem;
}
.em-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 1.5rem;
}
.em-info-item {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
  padding: 12px;
}
.em-info-label {
  font-size: 0.68rem;
  letter-spacing: 1.5px;
  color: rgba(240,253,244,0.35);
  text-transform: uppercase;
  margin-bottom: 4px;
}
.em-info-value {
  font-size: 0.9rem;
  font-weight: 700;
  color: #f0fdf4;
}
.em-themes {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.em-theme-chip {
  background: rgba(139,92,246,0.1);
  border: 1px solid rgba(139,92,246,0.25);
  border-radius: 20px;
  padding: 5px 14px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #a78bfa;
}
.em-register-btn {
  width: 100%;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border: none;
  border-radius: 12px;
  padding: 14px;
  color: #fff;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.2rem;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 0 20px rgba(139,92,246,0.3);
}
.em-register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(139,92,246,0.5);
}

/* ── RESPONSIVE ── */
@media (max-width: 1024px) {
  .events-stats { grid-template-columns: repeat(2, 1fr); }
  .featured-event { grid-template-columns: 1fr; }
  .featured-event::before { display: none; }
  .featured-event-visual { padding: 2rem; font-size: 5rem; }
}
@media (max-width: 768px) {
  .events-grid-cards { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto 3rem; }
  .organize-cta-content { flex-direction: column; text-align: center; }
  .organize-actions { justify-content: center; }
  .em-info-grid { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .events-stats { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .events { padding: 5rem 0 3rem; }
}
`;

// ── State ─────────────────────────────────────────────
let currentFilter = 'all';
let currentEvLang = 'fr';

// ── Init ──────────────────────────────────────────────
export function initEvents(lang = 'fr') {
  currentEvLang = lang;

  const style = document.createElement('style');
  style.textContent = eventsCSS;
  document.head.appendChild(style);

  renderFeaturedEvent();
  renderEventCards();
  observeEventCards();
}

// ── Featured Event ────────────────────────────────────
function renderFeaturedEvent() {
  const wrap = document.getElementById('featuredEvent');
  if (!wrap) return;

  const ev = EVENTS.find(e => e.featured);
  if (!ev) { wrap.style.display = 'none'; return; }

  const pct = Math.round((ev.registered / ev.capacity) * 100);
  const title  = currentEvLang === 'fr' ? ev.titleF  : ev.titleE;
  const desc   = currentEvLang === 'fr' ? ev.descF   : ev.descE;
  const time   = currentEvLang === 'fr' ? ev.timeF   : ev.timeE;
  const price  = currentEvLang === 'fr' ? ev.priceLabel : ev.priceLabelE;
  const capLabel = currentEvLang === 'fr'
    ? `${ev.registered}/${ev.capacity} inscrits`
    : `${ev.registered}/${ev.capacity} registered`;
  const registerLabel = currentEvLang === 'fr' ? 'S\'inscrire' : 'Register';
  const detailsLabel  = currentEvLang === 'fr' ? 'Voir les détails' : 'See details';

  wrap.innerHTML = `
    <div class="featured-event" style="--ev-color:${ev.typeColor}">
      <div class="featured-event-visual">${ev.img}</div>
      <div class="featured-event-body">
        <div class="featured-event-type" style="color:${ev.typeColor};background:${ev.typeColor}18;border-color:${ev.typeColor}30">
          ${ev.emoji} PACK ${ev.type.toUpperCase()}
        </div>
        <h3 class="featured-event-title">${title}</h3>
        <p class="featured-event-desc">${desc}</p>
        <div class="featured-event-meta">
          <div class="ev-meta-row">
            <span class="ev-meta-icon">📅</span>
            <span>${formatDate(ev.date, currentEvLang)} — <strong class="ev-meta-strong">${time}</strong></span>
          </div>
          <div class="ev-meta-row">
            <span class="ev-meta-icon">📍</span>
            <span><strong class="ev-meta-strong">${ev.venue}</strong> · ${ev.location}</span>
          </div>
          <div class="ev-meta-row">
            <span class="ev-meta-icon">💰</span>
            <span style="color:#22c55e;font-weight:700">${price}</span>
          </div>
        </div>
        <div class="featured-event-progress">
          <div class="ev-progress-label">
            <span>${capLabel}</span>
            <span>${pct}%</span>
          </div>
          <div class="ev-progress-bar">
            <div class="ev-progress-fill" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="featured-event-actions">
          <button class="hero-cta-primary" onclick="window.openEventModal('${ev.id}')"
                  style="background:linear-gradient(135deg,${ev.typeColor},#5b21b6);
                         box-shadow:0 0 20px ${ev.typeColor}40">
            <span>📅</span> ${registerLabel}
          </button>
          <button class="hero-cta-secondary" onclick="window.openEventModal('${ev.id}')">
            ${detailsLabel} →
          </button>
        </div>
      </div>
    </div>`;
}

// ── Event Cards ───────────────────────────────────────
function renderEventCards() {
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;

  const filtered = EVENTS.filter(e => {
    if (e.featured) return false;
    if (currentFilter === 'all') return true;
    return e.status === currentFilter;
  });

  grid.innerHTML = filtered.map(ev => {
    const title = currentEvLang === 'fr' ? ev.titleF : ev.titleE;
    const desc  = currentEvLang === 'fr' ? ev.descF  : ev.descE;
    const time  = currentEvLang === 'fr' ? ev.timeF  : ev.timeE;
    const price = currentEvLang === 'fr' ? ev.priceLabel : ev.priceLabelE;
    const tags  = currentEvLang === 'fr' ? ev.tags : ev.tagsE;
    const pct   = Math.round((ev.registered / ev.capacity) * 100);
    const isFull = pct >= 100;
    const statusLabel = ev.status === 'upcoming'
      ? (currentEvLang === 'fr' ? 'À venir' : 'Upcoming')
      : (currentEvLang === 'fr' ? 'Passé'   : 'Past');
    const btnLabel = isFull
      ? (currentEvLang === 'fr' ? 'Complet' : 'Full')
      : ev.status === 'past'
        ? (currentEvLang === 'fr' ? 'Voir' : 'View')
        : (currentEvLang === 'fr' ? 'S\'inscrire' : 'Register');

    const capFillColor = pct >= 90 ? '#dc2626' : pct >= 70 ? '#f97316' : '#22c55e';

    return `
    <div class="event-card ${ev.status}"
         style="--ev-card-color:${ev.typeColor}"
         onclick="window.openEventModal('${ev.id}')">
      <div class="ec-header">
        <div class="ec-type-badge" style="color:${ev.typeColor}">
          ${ev.emoji} ${ev.type.toUpperCase()}
        </div>
        <div class="ec-status ${ev.status}">${statusLabel}</div>
      </div>
      <div class="ec-visual">${ev.img}</div>
      <div class="ec-body">
        <div class="ec-title">${title}</div>
        <div class="ec-desc">${desc}</div>
        <div class="ec-meta">
          <div class="ec-meta-item">
            <span>📅</span>
            <span>${formatDate(ev.date, currentEvLang)} · ${time}</span>
          </div>
          <div class="ec-meta-item">
            <span>📍</span>
            <span>${ev.venue}, ${ev.location}</span>
          </div>
        </div>
        <div class="ec-tags">
          ${tags.map(t => `<span class="ec-tag">${t}</span>`).join('')}
        </div>
        <div class="ec-capacity">
          <div class="ec-cap-label">
            <span>${currentEvLang === 'fr' ? 'Capacité' : 'Capacity'}</span>
            <span>${ev.registered}/${ev.capacity}</span>
          </div>
          <div class="ec-cap-bar">
            <div class="ec-cap-fill" style="width:${pct}%;background:${capFillColor}"></div>
          </div>
        </div>
      </div>
      <div class="ec-footer" onclick="event.stopPropagation()">
        <div class="ec-price ${ev.price === 0 ? 'ec-price-free' : ''}">${price}</div>
        <button class="ec-btn"
                ${isFull || ev.status === 'past' && ev.status !== 'past' ? 'disabled' : ''}
                onclick="window.openEventModal('${ev.id}')">
          ${btnLabel}
        </button>
      </div>
    </div>`;
  }).join('');

  // Animate in
  setTimeout(() => {
    document.querySelectorAll('.event-card').forEach((c, i) => {
      setTimeout(() => {
        c.style.opacity = '1';
        c.style.transform = 'translateY(0)';
        c.style.transition = 'all 0.5s cubic-bezier(0.34,1.2,0.64,1)';
      }, i * 80);
    });
  }, 50);
}

// ── Observer ──────────────────────────────────────────
function observeEventCards() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  setTimeout(() => {
    document.querySelectorAll('.event-stat-card').forEach(c => observer.observe(c));
  }, 100);
}

// ── Helper: Register button HTML (évite les backticks imbriqués) ──
function buildRegisterBtn(eventId, isFull, lang) {
  const disabledAttr = isFull ? 'disabled style="opacity:.4;cursor:not-allowed"' : '';
  const label = isFull
    ? (lang === 'fr' ? 'COMPLET \u2014 LISTE D\'ATTENTE' : 'FULL \u2014 WAITLIST')
    : (lang === 'fr' ? '\uD83D\uDCC5 S\'INSCRIRE \u00C0 CET \u00C9V\u00C9NEMENT' : '\uD83D\uDCC5 REGISTER FOR THIS EVENT');
  return '<button class="em-register-btn" ' + disabledAttr + ' onclick="window.registerEvent(\'' + eventId + '\')">' + label + '</button>';
}

// ── Modal Détail ──────────────────────────────────────
window.openEventModal = function(id) {
  const ev = EVENTS.find(e => e.id === id);
  if (!ev) return;

  const title = currentEvLang === 'fr' ? ev.titleF : ev.titleE;
  const desc  = currentEvLang === 'fr' ? ev.descF  : ev.descE;
  const time  = currentEvLang === 'fr' ? ev.timeF  : ev.timeE;
  const price = currentEvLang === 'fr' ? ev.priceLabel : ev.priceLabelE;
  const pct   = Math.round((ev.registered / ev.capacity) * 100);
  const isFull = pct >= 100;

  const content = document.getElementById('eventModalContent');
  if (content) content.innerHTML = `
    <div class="event-modal-body">
      <div class="em-visual">${ev.img}</div>
      <div class="ec-type-badge" style="color:${ev.typeColor};margin-bottom:.8rem;display:inline-flex">
        ${ev.emoji} PACK ${ev.type.toUpperCase()}
      </div>
      <div class="em-title">${title}</div>
      <div class="em-desc">${desc}</div>
      <div class="em-info-grid">
        <div class="em-info-item">
          <div class="em-info-label">📅 ${currentEvLang === 'fr' ? 'Date' : 'Date'}</div>
          <div class="em-info-value">${formatDate(ev.date, currentEvLang)}</div>
        </div>
        <div class="em-info-item">
          <div class="em-info-label">⏰ ${currentEvLang === 'fr' ? 'Horaire' : 'Time'}</div>
          <div class="em-info-value">${time}</div>
        </div>
        <div class="em-info-item">
          <div class="em-info-label">📍 ${currentEvLang === 'fr' ? 'Lieu' : 'Venue'}</div>
          <div class="em-info-value">${ev.venue}</div>
        </div>
        <div class="em-info-item">
          <div class="em-info-label">💰 ${currentEvLang === 'fr' ? 'Tarif' : 'Price'}</div>
          <div class="em-info-value" style="color:#22c55e">${price}</div>
        </div>
        <div class="em-info-item">
          <div class="em-info-label">👥 ${currentEvLang === 'fr' ? 'Inscrits' : 'Registered'}</div>
          <div class="em-info-value">${ev.registered} / ${ev.capacity}</div>
        </div>
        <div class="em-info-item">
          <div class="em-info-label">🗺️ ${currentEvLang === 'fr' ? 'Ville' : 'City'}</div>
          <div class="em-info-value">${ev.location}</div>
        </div>
      </div>
      <div class="em-themes">
        ${ev.themes.map(t => `<span class="em-theme-chip">🎌 ${t}</span>`).join('')}
      </div>
      ${ev.status === 'upcoming' ? buildRegisterBtn(ev.id, isFull, currentEvLang) : ''}
    </div>`;

  document.getElementById('eventModalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeEventModal = function(e) {
  if (!e || e.target.id === 'eventModalOverlay' || e.target.classList.contains('modal-close')) {
    document.getElementById('eventModalOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }
};

window.registerEvent = function(id) {
  const ev = EVENTS.find(e => e.id === id);
  if (!ev) return;
  // 🔌 À connecter : await fetch('/api/events/register', { body: { eventId: id } })
  sessionStorage.setItem('register_event', JSON.stringify({ id, title: ev.titleF }));
  window.closeEventModal();
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
};

// ── Filter ────────────────────────────────────────────
window.filterEvents = function(filter) {
  currentFilter = filter;
  document.querySelectorAll('.ev-filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter === filter);
  });
  renderEventCards();
};

// ── Helpers ───────────────────────────────────────────
function formatDate(dateStr, lang = 'fr') {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ── Update langue ─────────────────────────────────────
export function updateEventsLang(lang) {
  currentEvLang = lang;
  document.querySelectorAll('#events [data-fr]').forEach(el => {
    el.textContent = lang === 'fr' ? el.dataset.fr : el.dataset.en;
  });
  renderFeaturedEvent();
  renderEventCards();
}