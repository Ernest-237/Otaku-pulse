// src/components/hero.js
// ═══════════════════════════════════════════════════════
// OTAKU PULSE — Hero Section Component
// Section d'accueil épique avec Deku bg, slogan, CTA
// ═══════════════════════════════════════════════════════

// ── HTML Template ─────────────────────────────────────
export function renderHero() {
  return `
  <section id="accueil" class="hero">

    <!-- ── LAYERS D'ARRIÈRE-PLAN ── -->
    <div class="hero-bg">
      <!-- Image Deku -->
      <div class="hero-deku-img"></div>
      <!-- Overlay dégradé thème Deku -->
      <div class="hero-overlay"></div>
      <!-- Lignes de vitesse manga -->
      <div class="hero-speed-lines"></div>
      <!-- Scanlines anime -->
      <div class="hero-scanlines"></div>
      <!-- Grille holographique -->
      <div class="hero-grid"></div>
    </div>

    <!-- ── PARTICULES ── -->
    <div class="hero-particles" id="heroParticles"></div>

    <!-- ── ÉNERGIE RING (quirk) ── -->
    <div class="hero-ring hero-ring-1"></div>
    <div class="hero-ring hero-ring-2"></div>
    <div class="hero-ring hero-ring-3"></div>

    <!-- ── CONTENU PRINCIPAL ── -->
    <div class="hero-content">

      <!-- Badge "Coming Soon" -->
      <div class="hero-badge" data-aos="0">
        <span class="hero-badge-dot"></span>
        <span class="hero-badge-text" data-fr="Lancement • 30 Juin 2026 • Cameroun" data-en="Launch • June 30, 2026 • Cameroon">
          Lancement • 30 Juin 2026 • Cameroun
        </span>
      </div>

      <!-- Titre principal -->
      <div class="hero-title-wrap" data-aos="1">
        <h1 class="hero-title">
          <span class="hero-title-line hero-line-1">OTAKU</span>
          <span class="hero-title-line hero-line-2">PULSE</span>
        </h1>
        <div class="hero-title-accent">
          <span class="hero-accent-bar"></span>
          <span class="hero-accent-text" 
                data-fr="VIVEZ L'EXPÉRIENCE AU-DELÀ DE L'ÉCRAN"
                data-en="LIVE THE EXPERIENCE BEYOND THE SCREEN">
            VIVEZ L'EXPÉRIENCE AU-DELÀ DE L'ÉCRAN
          </span>
          <span class="hero-accent-bar"></span>
        </div>
      </div>

      <!-- Description -->
      <p class="hero-description" data-aos="2">
        <span data-fr="Premier service événementiel" data-en="First event service">
          Premier service événementiel
        </span>
        <span class="hero-desc-highlight" data-fr=" Otaku clé en main " data-en=" Otaku all-in-one "> Otaku clé en main </span>
        <span data-fr="au Cameroun. Décoration immersive, mixologie narrative et univers manga pour vos événements."
              data-en="in Cameroon. Immersive decoration, narrative mixology and manga universe for your events.">
          au Cameroun. Décoration immersive, mixologie narrative et univers manga pour vos événements.
        </span>
      </p>

      <!-- CTA Buttons -->
      <div class="hero-ctas" data-aos="3">
        <a href="#services" class="hero-cta-primary">
          <span class="hero-cta-icon">⚡</span>
          <span data-fr="Voir nos Packs" data-en="See our Packs">Voir nos Packs</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
        <a href="#contact" class="hero-cta-secondary">
          <span data-fr="Réserver un événement" data-en="Book an event">Réserver un événement</span>
        </a>
      </div>

      <!-- Stats -->
      <div class="hero-stats" data-aos="4">
        <div class="hero-stat">
          <span class="hero-stat-num" data-target="3">0</span>
          <span class="hero-stat-unit">+</span>
          <span class="hero-stat-label" data-fr="Packs disponibles" data-en="Available Packs">Packs disponibles</span>
        </div>
        <div class="hero-stat-divider"></div>
        <div class="hero-stat">
          <span class="hero-stat-num" data-target="50">0</span>
          <span class="hero-stat-unit">+</span>
          <span class="hero-stat-label" data-fr="Thèmes manga" data-en="Manga themes">Thèmes manga</span>
        </div>
        <div class="hero-stat-divider"></div>
        <div class="hero-stat">
          <span class="hero-stat-num" data-target="100">0</span>
          <span class="hero-stat-unit">%</span>
          <span class="hero-stat-label" data-fr="Clé en main" data-en="All-inclusive">Clé en main</span>
        </div>
        <div class="hero-stat-divider"></div>
        <div class="hero-stat">
          <span class="hero-stat-num" data-target="4">0</span>
          <span class="hero-stat-unit">h</span>
          <span class="hero-stat-label" data-fr="Installation max" data-en="Max setup time">Installation max</span>
        </div>
      </div>

    </div>

    <!-- ── COUNTDOWN ── -->
    <div class="hero-countdown" data-aos="5">
      <p class="hero-countdown-label" 
         data-fr="LANCEMENT DANS" data-en="LAUNCHING IN">
        LANCEMENT DANS
      </p>
      <div class="hero-countdown-grid">
        <div class="hero-cd-unit">
          <div class="hero-cd-num" id="cdDays">00</div>
          <div class="hero-cd-label" data-fr="Jours" data-en="Days">Jours</div>
        </div>
        <div class="hero-cd-sep">:</div>
        <div class="hero-cd-unit">
          <div class="hero-cd-num" id="cdHours">00</div>
          <div class="hero-cd-label" data-fr="Heures" data-en="Hours">Heures</div>
        </div>
        <div class="hero-cd-sep">:</div>
        <div class="hero-cd-unit">
          <div class="hero-cd-num" id="cdMinutes">00</div>
          <div class="hero-cd-label" data-fr="Minutes" data-en="Mins">Minutes</div>
        </div>
        <div class="hero-cd-sep">:</div>
        <div class="hero-cd-unit">
          <div class="hero-cd-num" id="cdSeconds">00</div>
          <div class="hero-cd-label" data-fr="Secondes" data-en="Secs">Secondes</div>
        </div>
      </div>
    </div>

    <!-- ── SCROLL INDICATOR ── -->
    <div class="hero-scroll">
      <div class="hero-scroll-mouse">
        <div class="hero-scroll-dot"></div>
      </div>
      <span data-fr="Défiler" data-en="Scroll">Défiler</span>
    </div>

    <!-- ── PACKS PREVIEW (coins) ── -->
    <div class="hero-pack-preview">
      <div class="hero-pack-card" data-aos="left">
        <span class="hero-pack-rank">🥋</span>
        <span class="hero-pack-name">GENIN</span>
        <span class="hero-pack-price">85K FCFA</span>
      </div>
      <div class="hero-pack-card hero-pack-featured" data-aos="right">
        <span class="hero-pack-rank">⚔️</span>
        <span class="hero-pack-name">CHŪNIN</span>
        <span class="hero-pack-price">200K FCFA</span>
      </div>
      <div class="hero-pack-card" data-aos="right" style="animation-delay:0.15s">
        <span class="hero-pack-rank">👑</span>
        <span class="hero-pack-name">HOKAGE</span>
        <span class="hero-pack-price">450K FCFA</span>
      </div>
    </div>

    <!-- ── DÉCORATION COINS ── -->
    <div class="hero-corner hero-corner-tl"></div>
    <div class="hero-corner hero-corner-tr"></div>
    <div class="hero-corner hero-corner-bl"></div>
    <div class="hero-corner hero-corner-br"></div>

    <!-- ── TEXTE DÉCORATIF ── -->
    <div class="hero-deco-text hero-deco-left">PLUS ULTRA</div>
    <div class="hero-deco-text hero-deco-right">OTAKU PULSE</div>

  </section>
  `;
}

// ── CSS ───────────────────────────────────────────────
export const heroCSS = `

/* ══ HERO SECTION ══ */
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 104px 2rem 6rem;
}

/* ── BACKGROUND LAYERS ── */
.hero-bg { position: absolute; inset: 0; z-index: 0; }

.hero-deku-img {
  position: absolute; inset: 0;
  background-image: url('/img/deku.jpg');
  background-size: cover;
  background-position: center 20%;
  background-repeat: no-repeat;
  filter: brightness(0.28) saturate(1.5) hue-rotate(5deg);
  transform: scale(1.05);
  animation: heroZoom 20s ease-in-out infinite alternate;
}
@keyframes heroZoom {
  from { transform: scale(1.05); }
  to   { transform: scale(1.12); }
}

.hero-overlay {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 55% 60% at 75% 35%, rgba(34,197,94,0.16) 0%, transparent 65%),
    radial-gradient(ellipse 40% 50% at 15% 75%, rgba(220,38,38,0.1) 0%, transparent 60%),
    radial-gradient(ellipse 80% 40% at 50% 100%, rgba(12,26,46,0.9) 0%, transparent 70%),
    linear-gradient(170deg, rgba(6,14,26,0.65) 0%, rgba(30,58,95,0.4) 45%, rgba(6,14,26,0.75) 100%);
}

.hero-speed-lines {
  position: absolute; inset: 0;
  opacity: 0.04;
  background: repeating-conic-gradient(
    from 0deg at 50% 50%,
    #fff 0deg 0.8deg,
    transparent 0.8deg 5deg
  );
  animation: spinLines 60s linear infinite;
}
@keyframes spinLines {
  from { transform: rotate(0deg) scale(2.5); }
  to   { transform: rotate(360deg) scale(2.5); }
}

.hero-scanlines {
  position: absolute; inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px, transparent 3px,
    rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px
  );
  pointer-events: none;
}

.hero-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(34,197,94,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34,197,94,0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 70%);
}

/* ── PARTICLES ── */
.hero-particles {
  position: absolute; inset: 0;
  z-index: 1; pointer-events: none;
}
.h-particle {
  position: absolute;
  border-radius: 50%;
  animation: hParticleFloat linear infinite;
  opacity: 0;
}
@keyframes hParticleFloat {
  0%   { transform: translateY(100vh) scale(0) rotate(0deg); opacity: 0; }
  8%   { opacity: 1; }
  92%  { opacity: 0.7; }
  100% { transform: translateY(-15vh) scale(1.5) rotate(360deg); opacity: 0; }
}

/* ── ENERGY RINGS ── */
.hero-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(34,197,94,0.1);
  pointer-events: none;
  z-index: 1;
  bottom: -30%;
  left: 50%;
  transform: translateX(-50%);
}
.hero-ring-1 {
  width: 500px; height: 500px;
  animation: ringPulse 4s ease-in-out infinite;
  box-shadow: 0 0 40px rgba(34,197,94,0.06), inset 0 0 40px rgba(34,197,94,0.03);
}
.hero-ring-2 {
  width: 750px; height: 750px;
  animation: ringPulse 4s ease-in-out 0.8s infinite;
  border-color: rgba(34,197,94,0.06);
}
.hero-ring-3 {
  width: 1000px; height: 1000px;
  animation: ringPulse 4s ease-in-out 1.6s infinite;
  border-color: rgba(34,197,94,0.03);
}
@keyframes ringPulse {
  0%,100% { transform: translateX(-50%) scale(1); opacity: 0.6; }
  50%      { transform: translateX(-50%) scale(1.04); opacity: 1; }
}

/* ── HERO CONTENT ── */
.hero-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
}

/* Badge */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(34,197,94,0.08);
  border: 1px solid rgba(34,197,94,0.3);
  border-radius: 50px;
  padding: 7px 18px;
  margin-bottom: 1.8rem;
  opacity: 0;
  animation: heroFadeDown 0.7s ease 0.2s forwards;
}
.hero-badge-dot {
  width: 8px; height: 8px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 8px #22c55e;
  animation: badgeBlink 1.5s ease-in-out infinite;
}
@keyframes badgeBlink {
  0%,100% { opacity: 1; box-shadow: 0 0 6px #22c55e; }
  50%      { opacity: 0.4; box-shadow: 0 0 2px #22c55e; }
}
.hero-badge-text {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: #86efac;
  text-transform: uppercase;
}

/* Titre */
.hero-title-wrap {
  opacity: 0;
  animation: heroFadeUp 0.8s ease 0.4s forwards;
}
.hero-title {
  display: flex;
  flex-direction: column;
  line-height: 0.85;
  margin-bottom: 1rem;
}
.hero-title-line {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(5rem, 16vw, 13rem);
  letter-spacing: 8px;
  display: block;
  background: linear-gradient(
    135deg,
    #ffffff 0%,
    #86efac 25%,
    #22c55e 55%,
    #dc2626 85%,
    #ffffff 100%
  );
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: titleGradientMove 6s ease-in-out infinite,
             titleGlow 3s ease-in-out infinite;
  filter: drop-shadow(0 0 40px rgba(34,197,94,0.4));
}
.hero-line-2 {
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 2px rgba(34,197,94,0.5);
  background: linear-gradient(135deg, #22c55e 0%, #86efac 50%, #dc2626 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
@keyframes titleGradientMove {
  0%,100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}
@keyframes titleGlow {
  0%,100% { filter: drop-shadow(0 0 25px rgba(34,197,94,0.35)); }
  50%      { filter: drop-shadow(0 0 60px rgba(34,197,94,0.7)) drop-shadow(0 0 100px rgba(220,38,38,0.2)); }
}

.hero-title-accent {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 0.5rem;
}
.hero-accent-bar {
  flex: 1;
  max-width: 80px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #22c55e);
}
.hero-accent-bar:last-child {
  background: linear-gradient(90deg, #22c55e, transparent);
}
.hero-accent-text {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 3px;
  color: rgba(134,239,172,0.6);
  white-space: nowrap;
}

/* Description */
.hero-description {
  opacity: 0;
  animation: heroFadeUp 0.8s ease 0.7s forwards;
  max-width: 560px;
  font-size: clamp(0.95rem, 2vw, 1.1rem);
  color: rgba(240,253,244,0.6);
  line-height: 1.7;
  margin-bottom: 2rem;
}
.hero-desc-highlight {
  color: #22c55e;
  font-weight: 700;
}

/* CTA Buttons */
.hero-ctas {
  opacity: 0;
  animation: heroFadeUp 0.8s ease 0.9s forwards;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 2.5rem;
}

.hero-cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #0c1a2e;
  text-decoration: none;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.15rem;
  letter-spacing: 2px;
  padding: 14px 28px;
  border-radius: 12px;
  box-shadow: 0 0 25px rgba(34,197,94,0.35), 0 4px 15px rgba(0,0,0,0.3);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}
.hero-cta-primary::before {
  content: '';
  position: absolute; top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}
.hero-cta-primary:hover::before { left: 100%; }
.hero-cta-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 35px rgba(34,197,94,0.55), 0 4px 15px rgba(0,0,0,0.3);
}
.hero-cta-icon { font-size: 1.2rem; }

.hero-cta-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: #86efac;
  text-decoration: none;
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 14px 28px;
  border-radius: 12px;
  border: 1px solid rgba(34,197,94,0.3);
  transition: all 0.3s;
}
.hero-cta-secondary:hover {
  background: rgba(34,197,94,0.08);
  border-color: #22c55e;
  color: #f0fdf4;
  transform: translateY(-3px);
}

/* Stats */
.hero-stats {
  opacity: 0;
  animation: heroFadeUp 0.8s ease 1.1s forwards;
  display: flex;
  align-items: center;
  gap: 0;
  background: rgba(12,26,46,0.6);
  border: 1px solid rgba(34,197,94,0.15);
  border-radius: 16px;
  padding: 16px 24px;
  backdrop-filter: blur(16px);
}
.hero-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px;
  gap: 2px;
}
.hero-stat-num {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2.2rem;
  color: #22c55e;
  text-shadow: 0 0 20px rgba(34,197,94,0.6);
  line-height: 1;
}
.hero-stat-unit {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.2rem;
  color: #dc2626;
  margin-left: 2px;
  line-height: 1;
  vertical-align: top;
  display: inline;
}
.hero-stat-label {
  font-size: 0.68rem;
  letter-spacing: 1.5px;
  color: rgba(134,239,172,0.5);
  text-transform: uppercase;
  white-space: nowrap;
}
.hero-stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(34,197,94,0.12);
  flex-shrink: 0;
}

/* ── COUNTDOWN ── */
.hero-countdown {
  position: absolute;
  bottom: 5rem;
  right: 3rem;
  z-index: 10;
  text-align: center;
  opacity: 0;
  animation: heroFadeRight 0.8s ease 1.3s forwards;
}
.hero-countdown-label {
  font-size: 0.65rem;
  letter-spacing: 3px;
  color: rgba(134,239,172,0.5);
  margin-bottom: 8px;
}
.hero-countdown-grid {
  display: flex;
  align-items: center;
  gap: 4px;
}
.hero-cd-unit {
  background: rgba(12,26,46,0.75);
  border: 1px solid rgba(34,197,94,0.2);
  border-radius: 10px;
  padding: 10px 12px;
  min-width: 60px;
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
}
.hero-cd-unit::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #22c55e, transparent);
  animation: shimmer 2s linear infinite;
}
@keyframes shimmer {
  from { transform: translateX(-100%); }
  to   { transform: translateX(100%); }
}
.hero-cd-num {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2rem;
  color: #22c55e;
  text-shadow: 0 0 15px rgba(34,197,94,0.7);
  line-height: 1;
}
.hero-cd-label {
  font-size: 0.6rem;
  letter-spacing: 1.5px;
  color: rgba(134,239,172,0.5);
  text-transform: uppercase;
  margin-top: 3px;
}
.hero-cd-sep {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.8rem;
  color: rgba(34,197,94,0.4);
  animation: sepBlink 1s ease-in-out infinite;
  margin-bottom: 12px;
}
@keyframes sepBlink {
  0%,100% { opacity: 1; }
  50%      { opacity: 0.2; }
}

/* ── SCROLL INDICATOR ── */
.hero-scroll {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0;
  animation: heroFadeUp 0.8s ease 1.8s forwards;
  cursor: pointer;
}
.hero-scroll-mouse {
  width: 22px; height: 36px;
  border: 2px solid rgba(34,197,94,0.3);
  border-radius: 12px;
  display: flex;
  justify-content: center;
  padding-top: 5px;
}
.hero-scroll-dot {
  width: 4px; height: 8px;
  background: #22c55e;
  border-radius: 2px;
  animation: scrollDot 2s ease-in-out infinite;
}
@keyframes scrollDot {
  0%   { transform: translateY(0); opacity: 1; }
  80%  { transform: translateY(12px); opacity: 0; }
  100% { transform: translateY(0); opacity: 0; }
}
.hero-scroll span {
  font-size: 0.65rem;
  letter-spacing: 2px;
  color: rgba(134,239,172,0.4);
  text-transform: uppercase;
}
.hero-scroll:hover .hero-scroll-mouse {
  border-color: #22c55e;
}

/* ── PACK PREVIEW CARDS ── */
.hero-pack-preview {
  position: absolute;
  left: 2.5rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hero-pack-card {
  background: rgba(12,26,46,0.7);
  border: 1px solid rgba(34,197,94,0.15);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  backdrop-filter: blur(12px);
  cursor: pointer;
  transition: all 0.3s;
  opacity: 0;
  animation: heroFadeLeft 0.6s ease forwards;
  min-width: 90px;
}
.hero-pack-card:nth-child(1) { animation-delay: 1.4s; }
.hero-pack-card:nth-child(2) { animation-delay: 1.55s; }
.hero-pack-card:nth-child(3) { animation-delay: 1.7s; }
.hero-pack-card:hover {
  border-color: #22c55e;
  background: rgba(34,197,94,0.1);
  transform: translateX(5px);
  box-shadow: 0 0 20px rgba(34,197,94,0.15);
}
.hero-pack-featured {
  border-color: rgba(34,197,94,0.35);
  background: rgba(34,197,94,0.08);
}
.hero-pack-rank { font-size: 1.4rem; }
.hero-pack-name {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.85rem;
  letter-spacing: 2px;
  color: #86efac;
}
.hero-pack-price {
  font-size: 0.7rem;
  font-weight: 700;
  color: #22c55e;
  letter-spacing: 1px;
}

/* ── CORNERS ── */
.hero-corner {
  position: absolute;
  width: 50px; height: 50px;
  z-index: 5;
  opacity: 0.3;
}
.hero-corner-tl { top: 110px; left: 20px; border-top: 2px solid #22c55e; border-left: 2px solid #22c55e; }
.hero-corner-tr { top: 110px; right: 20px; border-top: 2px solid #22c55e; border-right: 2px solid #22c55e; }
.hero-corner-bl { bottom: 20px; left: 20px; border-bottom: 2px solid #22c55e; border-left: 2px solid #22c55e; }
.hero-corner-br { bottom: 20px; right: 20px; border-bottom: 2px solid #22c55e; border-right: 2px solid #22c55e; }

/* ── TEXTE DÉCORATIF ── */
.hero-deco-text {
  position: absolute;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 0.75rem;
  letter-spacing: 4px;
  color: rgba(220,38,38,0.2);
  z-index: 5;
  pointer-events: none;
}
.hero-deco-left {
  bottom: 40%;
  left: 1.5rem;
  writing-mode: vertical-lr;
  transform: rotate(180deg);
}
.hero-deco-right {
  bottom: 40%;
  right: 1.5rem;
  writing-mode: vertical-lr;
}

/* ── ANIMATIONS ── */
@keyframes heroFadeUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes heroFadeDown {
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes heroFadeLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes heroFadeRight {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ── RESPONSIVE ── */
@media (max-width: 1024px) {
  .hero-pack-preview { display: none; }
  .hero-countdown {
    position: relative;
    bottom: auto; right: auto;
    margin-top: 2rem;
    animation: heroFadeUp 0.8s ease 1.3s forwards;
  }
  .hero { padding-bottom: 4rem; }
}

@media (max-width: 768px) {
  .hero-stats {
    gap: 0;
    padding: 12px 8px;
  }
  .hero-stat { padding: 0 10px; }
  .hero-stat-num { font-size: 1.6rem; }
  .hero-stat-label { font-size: 0.6rem; }
  .hero-countdown-grid { gap: 3px; }
  .hero-cd-unit { min-width: 50px; padding: 8px; }
  .hero-cd-num { font-size: 1.6rem; }
}

@media (max-width: 480px) {
  .hero { padding: 104px 1rem 3rem; }
  .hero-ctas { flex-direction: column; align-items: center; }
  .hero-cta-primary, .hero-cta-secondary { width: 100%; justify-content: center; }
  .hero-stats { flex-wrap: wrap; justify-content: center; }
  .hero-stat-divider:nth-child(4) { display: none; }
  .hero-accent-text { font-size: 0.6rem; letter-spacing: 1.5px; }
  .hero-deco-left, .hero-deco-right { display: none; }
}
`;

// ── JavaScript Logic ──────────────────────────────────
export function initHero() {
  // Injecter le CSS
  const style = document.createElement('style');
  style.textContent = heroCSS;
  document.head.appendChild(style);

  // Lancer toutes les fonctions
  spawnParticles();
  startCountdown();
  animateStats();
  initScrollIndicator();
}

// ── Particules ────────────────────────────────────────
function spawnParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;

  const configs = [
    { color: '#22c55e', shadow: '#22c55e', prob: 0.65 },
    { color: '#dc2626', shadow: '#dc2626', prob: 0.20 },
    { color: '#86efac', shadow: '#22c55e', prob: 0.15 },
  ];

  for (let i = 0; i < 45; i++) {
    const p = document.createElement('div');
    p.className = 'h-particle';

    // Choisir couleur
    const rand = Math.random();
    const cfg = rand < 0.65 ? configs[0] : rand < 0.85 ? configs[1] : configs[2];

    const size = 2 + Math.random() * 4;
    const dur = 8 + Math.random() * 16;
    const delay = Math.random() * 12;
    const left = Math.random() * 100;

    p.style.cssText = `
      left: ${left}vw;
      width: ${size}px;
      height: ${size}px;
      background: ${cfg.color};
      box-shadow: 0 0 ${size * 2}px ${cfg.shadow};
      animation-duration: ${dur}s;
      animation-delay: ${delay}s;
    `;
    container.appendChild(p);
  }
}

// ── Countdown ─────────────────────────────────────────
function startCountdown() {
  const launch = new Date('Jun 30, 2026 00:00:00').getTime();
  const pad = n => String(Math.max(0, n)).padStart(2, '0');

  function tick() {
    const dist = launch - Date.now();
    if (dist < 0) {
      document.getElementById('cdDays').textContent = '00';
      document.getElementById('cdHours').textContent = '00';
      document.getElementById('cdMinutes').textContent = '00';
      document.getElementById('cdSeconds').textContent = '00';
      return;
    }
    document.getElementById('cdDays').textContent    = pad(Math.floor(dist / 86400000));
    document.getElementById('cdHours').textContent   = pad(Math.floor((dist % 86400000) / 3600000));
    document.getElementById('cdMinutes').textContent = pad(Math.floor((dist % 3600000) / 60000));
    document.getElementById('cdSeconds').textContent = pad(Math.floor((dist % 60000) / 1000));
  }
  tick();
  setInterval(tick, 1000);
}

// ── Stats Counter Animation ───────────────────────────
function animateStats() {
  const nums = document.querySelectorAll('.hero-stat-num');
  if (!nums.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      const duration = 1800;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  nums.forEach(n => observer.observe(n));
}

// ── Scroll Indicator Click ────────────────────────────
function initScrollIndicator() {
  const scrollBtn = document.querySelector('.hero-scroll');
  scrollBtn?.addEventListener('click', () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  });
}

// ── Sync langue avec navbar ───────────────────────────
export function updateHeroLang(lang) {
  document.querySelectorAll('#accueil [data-fr]').forEach(el => {
    el.textContent = lang === 'fr' ? el.dataset.fr : el.dataset.en;
  });
}