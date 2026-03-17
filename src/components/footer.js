// src/components/footer.js
// ═══════════════════════════════════════════════════════
// OTAKU PULSE — Footer
// Nav, légal, newsletter, crédits, easter egg
// ═══════════════════════════════════════════════════════

const FOOTER_LINKS = {
  fr: [
    {
      titleF: 'Navigation', titleE: 'Navigation',
      links: [
        { label: 'Accueil',      href: '#hero' },
        { label: 'Nos Packs',    href: '#services' },
        { label: 'Boutique',     href: '#boutique' },
        { label: 'Événements',   href: '#events' },
        { label: 'À Propos',     href: '#apropos' },
        { label: 'Contact',      href: '#contact' },
      ],
    },
    {
      titleF: 'Nos Packs', titleE: 'Our Packs',
      links: [
        { label: '🥋 Pack GENIN — 85 000 FCFA',    href: '#services' },
        { label: '⚔️ Pack CHŪNIN — 200 000 FCFA',  href: '#services' },
        { label: '👑 Zone HOKAGE — 450 000 FCFA',  href: '#services' },
        { label: '✨ Devis personnalisé',           href: '#contact' },
      ],
    },
    {
      titleF: 'Légal & Info', titleE: 'Legal & Info',
      links: [
        { label: 'Mentions légales',         href: '#' },
        { label: 'Politique de confidentialité', href: '#' },
        { label: 'CGV',                      href: '#' },
        { label: 'FAQ',                      href: '#contact' },
      ],
    },
  ],
};

const CONTACT_INFO = [
  { icon: '📍', label: 'Yaoundé, Cameroun' },
  { icon: '💬', label: 'WhatsApp : +237 6XX XXX XXX' },
  { icon: '📧', label: 'contact@otaku-pulse.com' },
  { icon: '⏰', label: 'Réponse sous 24h' },
];

// ── HTML ──────────────────────────────────────────────
export function renderFooter() {
  return `
  <footer class="footer" id="footer">

    <div class="footer-bg">
      <div class="footer-grid-bg"></div>
      <div class="footer-glow"></div>
    </div>

    <!-- ── NEWSLETTER BAND ── -->
    <div class="footer-newsletter">
      <div class="footer-newsletter-inner">
        <div class="newsletter-text">
          <div class="newsletter-icon">⚡</div>
          <div>
            <h3 data-fr="Rejoins la communauté Otaku Pulse"
                data-en="Join the Otaku Pulse community">
              Rejoins la communauté Otaku Pulse
            </h3>
            <p data-fr="Reçois en avant-première nos événements, promos et nouveautés manga."
               data-en="Get first access to our events, promos and manga news.">
              Reçois en avant-première nos événements, promos et nouveautés manga.
            </p>
          </div>
        </div>
        <div class="newsletter-form" id="newsletterForm">
          <input type="email" class="newsletter-input" id="newsletterEmail"
                 data-placeholder-fr="ton@email.com"
                 data-placeholder-en="your@email.com"
                 placeholder="ton@email.com">
          <button class="newsletter-btn" onclick="window.subscribeNewsletter()">
            <span data-fr="S'abonner" data-en="Subscribe">S'abonner</span>
            <span>→</span>
          </button>
        </div>
        <div class="newsletter-success" id="newsletterSuccess" style="display:none">
          <span>✅</span>
          <span data-fr="Bienvenue dans la communauté !" data-en="Welcome to the community!">
            Bienvenue dans la communauté !
          </span>
        </div>
      </div>
    </div>

    <!-- ── MAIN FOOTER ── -->
    <div class="footer-main">

      <!-- Logo + Tagline -->
      <div class="footer-brand">
        <div class="footer-logo">
          <span class="footer-logo-bolt">⚡</span>
          <span class="footer-logo-text">OTAKU PULSE</span>
        </div>
        <p class="footer-tagline"
           data-fr='"Vivez l\'expérience au-delà de l\'écran"'
           data-en='"Live the experience beyond the screen"'>
          "Vivez l'expérience au-delà de l'écran"
        </p>
        <p class="footer-desc"
           data-fr="Service événementiel clé en main spécialisé dans l'immersion Otaku au Cameroun. Décoration manga, mixologie narrative et expériences inoubliables."
           data-en="Turnkey event service specialized in Otaku immersion in Cameroon. Manga decoration, narrative mixology and unforgettable experiences.">
          Service événementiel clé en main spécialisé dans l'immersion Otaku au Cameroun.
        </p>

        <!-- Contact rapide -->
        <div class="footer-contact-quick">
          ${CONTACT_INFO.map(c => `
            <div class="footer-contact-item">
              <span>${c.icon}</span>
              <span>${c.label}</span>
            </div>
          `).join('')}
        </div>

        <!-- Réseaux sociaux -->
        <div class="footer-socials">
          <a href="https://instagram.com/otakupulse_cm" target="_blank" rel="noopener" class="footer-social" title="Instagram">📸</a>
          <a href="https://facebook.com/otakupulsecm"  target="_blank" rel="noopener" class="footer-social" title="Facebook">📘</a>
          <a href="https://tiktok.com/@otakupulse"     target="_blank" rel="noopener" class="footer-social" title="TikTok">🎵</a>
          <a href="https://wa.me/237600000000"         target="_blank" rel="noopener" class="footer-social" title="WhatsApp">💬</a>
        </div>
      </div>

      <!-- Liens -->
      <div class="footer-links-grid">
        ${FOOTER_LINKS.fr.map(col => `
          <div class="footer-col">
            <div class="footer-col-title" data-fr="${col.titleF}" data-en="${col.titleE}">${col.titleF}</div>
            <ul class="footer-col-links">
              ${col.links.map(l => `
                <li><a href="${l.href}" class="footer-link">${l.label}</a></li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>

    </div>

    <!-- ── BOTTOM BAR ── -->
    <div class="footer-bottom">
      <div class="footer-bottom-inner">

        <div class="footer-copy">
          <span>© 2026 Otaku Pulse</span>
          <span class="footer-copy-sep">·</span>
          <span data-fr="Tous droits réservés" data-en="All rights reserved">Tous droits réservés</span>
          <span class="footer-copy-sep">·</span>
          <span>🇨🇲 Made in Cameroun</span>
        </div>

        <div class="footer-badges">
          <span class="footer-badge">⚡ OTAKU PULSE v1.0</span>
          <span class="footer-badge footer-badge-green">🚀 Lancement Juin 2026</span>
        </div>

        <!-- Easter egg -->
        <button class="footer-easter" id="footerEaster"
                onclick="window.triggerEasterEgg()"
                title="Click me...">
          🌀
        </button>

      </div>
    </div>

    <!-- Scroll to top -->
    <button class="scroll-top" id="scrollTopBtn" onclick="window.scrollTo({top:0,behavior:'smooth'})"
            title="Retour en haut" style="display:none">
      ▲
    </button>

    <!-- Easter egg modal -->
    <div class="easter-overlay" id="easterOverlay" onclick="window.closeEaster()" style="display:none">
      <div class="easter-modal" onclick="event.stopPropagation()">
        <div class="easter-content" id="easterContent"></div>
        <button class="easter-close" onclick="window.closeEaster()">✕ Fermer</button>
      </div>
    </div>

  </footer>
  `;
}

// ── CSS ───────────────────────────────────────────────
export const footerCSS = `

/* ══ FOOTER ══ */
.footer {
  position: relative;
  overflow: hidden;
  border-top: 1px solid rgba(34,197,94,0.1);
}
.footer-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.footer-grid-bg {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(34,197,94,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34,197,94,0.015) 1px, transparent 1px);
  background-size: 60px 60px;
}
.footer-glow {
  position: absolute; bottom: 0; left: 50%;
  transform: translateX(-50%);
  width: 800px; height: 300px;
  background: radial-gradient(ellipse, rgba(34,197,94,0.04) 0%, transparent 70%);
}

/* ── NEWSLETTER ── */
.footer-newsletter {
  position: relative; z-index: 1;
  background: linear-gradient(135deg, rgba(34,197,94,0.07), rgba(12,26,46,0.9));
  border-bottom: 1px solid rgba(34,197,94,0.12);
  padding: 3rem 2rem;
}
.footer-newsletter-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}
.newsletter-text {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 260px;
}
.newsletter-icon {
  font-size: 2.5rem;
  animation: newsletterPulse 2s ease-in-out infinite alternate;
  flex-shrink: 0;
}
@keyframes newsletterPulse { from { transform: scale(1); } to { transform: scale(1.15); } }
.newsletter-text h3 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.3rem;
  letter-spacing: 2px;
  color: #f0fdf4;
  margin-bottom: 3px;
}
.newsletter-text p { font-size: 0.82rem; color: rgba(240,253,244,0.45); }

.newsletter-form {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.newsletter-input {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(34,197,94,0.2);
  border-radius: 50px;
  padding: 11px 20px;
  color: #f0fdf4;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  width: 220px;
  transition: all 0.25s;
  outline: none;
}
.newsletter-input:focus {
  border-color: #22c55e;
  background: rgba(34,197,94,0.06);
  box-shadow: 0 0 0 3px rgba(34,197,94,0.1);
}
.newsletter-input::placeholder { color: rgba(240,253,244,0.25); }
.newsletter-btn {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none;
  border-radius: 50px;
  padding: 11px 24px;
  color: #0c1a2e;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1rem;
  letter-spacing: 1.5px;
  cursor: pointer;
  transition: all 0.25s;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 0 15px rgba(34,197,94,0.25);
  white-space: nowrap;
}
.newsletter-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(34,197,94,0.4);
}
.newsletter-success {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #22c55e;
  animation: successIn 0.4s ease;
}

/* ── MAIN FOOTER ── */
.footer-main {
  position: relative; z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: 4rem 2rem;
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 4rem;
}

/* ── BRAND ── */
.footer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1rem;
}
.footer-logo-bolt {
  font-size: 1.8rem;
  filter: drop-shadow(0 0 10px rgba(34,197,94,0.6));
  animation: boltGlow 2.5s ease-in-out infinite alternate;
}
@keyframes boltGlow {
  from { filter: drop-shadow(0 0 6px rgba(34,197,94,0.4)); }
  to   { filter: drop-shadow(0 0 18px rgba(34,197,94,0.9)); }
}
.footer-logo-text {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.6rem;
  letter-spacing: 4px;
  background: linear-gradient(135deg, #22c55e, #86efac);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.footer-tagline {
  font-size: 0.85rem;
  font-style: italic;
  color: rgba(134,239,172,0.6);
  margin-bottom: 0.8rem;
  letter-spacing: 0.5px;
}
.footer-desc {
  font-size: 0.82rem;
  color: rgba(240,253,244,0.4);
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

/* Contact rapide */
.footer-contact-quick {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 1.5rem;
}
.footer-contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: rgba(240,253,244,0.45);
  transition: color 0.2s;
}
.footer-contact-item:hover { color: rgba(240,253,244,0.7); }

/* Socials */
.footer-socials {
  display: flex;
  gap: 10px;
}
.footer-social {
  width: 40px; height: 40px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem;
  text-decoration: none;
  transition: all 0.25s;
}
.footer-social:hover {
  background: rgba(34,197,94,0.1);
  border-color: rgba(34,197,94,0.3);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

/* ── LINKS GRID ── */
.footer-links-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}
.footer-col-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1rem;
  letter-spacing: 3px;
  color: #22c55e;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(34,197,94,0.15);
}
.footer-col-links {
  list-style: none;
  padding: 0; margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.footer-link {
  font-size: 0.83rem;
  color: rgba(240,253,244,0.4);
  text-decoration: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.footer-link::before {
  content: '›';
  color: rgba(34,197,94,0.3);
  font-size: 1rem;
  transition: all 0.2s;
}
.footer-link:hover {
  color: #22c55e;
  padding-left: 4px;
}
.footer-link:hover::before { color: #22c55e; }

/* ── BOTTOM BAR ── */
.footer-bottom {
  position: relative; z-index: 1;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding: 1.5rem 2rem;
}
.footer-bottom-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.footer-copy {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.78rem;
  color: rgba(240,253,244,0.3);
  flex-wrap: wrap;
}
.footer-copy-sep { color: rgba(34,197,94,0.3); }
.footer-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.footer-badge {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(240,253,244,0.35);
}
.footer-badge-green {
  background: rgba(34,197,94,0.07);
  border-color: rgba(34,197,94,0.2);
  color: rgba(34,197,94,0.6);
}

/* Easter egg button */
.footer-easter {
  background: none;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 50%;
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
  opacity: 0.3;
}
.footer-easter:hover {
  opacity: 1;
  border-color: rgba(34,197,94,0.4);
  transform: rotate(360deg);
  box-shadow: 0 0 15px rgba(34,197,94,0.2);
}

/* ── SCROLL TOP ── */
.scroll-top {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  width: 44px; height: 44px;
  background: rgba(12,26,46,0.9);
  border: 1px solid rgba(34,197,94,0.3);
  border-radius: 12px;
  color: #22c55e;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 400;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 5px 20px rgba(0,0,0,0.3);
  animation: fadeIn 0.3s ease;
}
.scroll-top:hover {
  background: rgba(34,197,94,0.15);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(34,197,94,0.2);
}
@keyframes fadeIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }

/* ── EASTER EGG ── */
.easter-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(16px);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: fadeIn 0.3s ease;
}
.easter-modal {
  background: linear-gradient(160deg, #0d1f35, #0a1628);
  border: 1px solid rgba(34,197,94,0.3);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(34,197,94,0.1);
  animation: modalIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
}
.easter-content {
  margin-bottom: 1.5rem;
}
.easter-close {
  background: rgba(34,197,94,0.1);
  border: 1px solid rgba(34,197,94,0.2);
  border-radius: 10px;
  padding: 10px 24px;
  color: #22c55e;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1rem;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.25s;
}
.easter-close:hover {
  background: rgba(34,197,94,0.2);
  transform: translateY(-2px);
}

/* ── RESPONSIVE ── */
@media (max-width: 1024px) {
  .footer-main { grid-template-columns: 1fr; gap: 2.5rem; }
  .footer-links-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .footer-newsletter-inner { flex-direction: column; align-items: flex-start; }
  .newsletter-form { width: 100%; }
  .newsletter-input { flex: 1; min-width: 0; }
  .footer-links-grid { grid-template-columns: 1fr 1fr; }
  .footer-bottom-inner { flex-direction: column; align-items: flex-start; gap: 0.8rem; }
}
@media (max-width: 480px) {
  .footer-links-grid { grid-template-columns: 1fr; }
  .footer-newsletter { padding: 2rem 1.5rem; }
  .footer-main { padding: 2.5rem 1.5rem; }
  .footer-bottom { padding: 1.5rem; }
  .newsletter-form { flex-direction: column; }
  .newsletter-input { width: 100%; }
  .newsletter-btn { width: 100%; justify-content: center; }
}
`;

// ── Easter egg quotes ─────────────────────────────────
const EASTER_QUOTES = [
  { char: '🌀', anime: 'Naruto',         quote: 'Dattebayo ! Si tu lis ceci, tu mérites un Rasengan offert.', tip: 'Utilise le code DATTEBAYO au checkout 🍜' },
  { char: '☠️', anime: 'One Piece',      quote: "Je serai le Roi des Événements ! Et toi tu seras dans ma crew.", tip: 'Code NAKAMA pour -10% sur le Pack Chūnin 🏴‍☠️' },
  { char: '🌌', anime: 'Jujutsu Kaisen', quote: "Extension du Territoire : zone où chaque événement est parfait.", tip: 'Code DOMAINE pour un cocktail bonus 🍸' },
  { char: '💥', anime: 'Dragon Ball Z',  quote: 'Son niveau de puissance est de... PLUS DE 9000 FCFA économisés !', tip: 'Code KAKAROT pour la livraison gratuite 📦' },
];

// ── Init ──────────────────────────────────────────────
let footerLang = 'fr';

export function initFooter(lang = 'fr') {
  footerLang = lang;

  const style = document.createElement('style');
  style.textContent = footerCSS;
  document.head.appendChild(style);

  // Scroll top visibility
  window.addEventListener('scroll', () => {
    const btn = document.getElementById('scrollTopBtn');
    if (btn) btn.style.display = window.scrollY > 600 ? 'flex' : 'none';
  });
}

// ── Newsletter ────────────────────────────────────────
window.subscribeNewsletter = function() {
  const input = document.getElementById('newsletterEmail');
  if (!input || !input.value.includes('@')) {
    input?.classList.add('error');
    input?.addEventListener('input', () => input.classList.remove('error'), { once: true });
    return;
  }

  // 🔌 À connecter : await fetch('/api/newsletter/subscribe', { body: { email: input.value } })
  console.log('Newsletter signup:', input.value);

  const form = document.getElementById('newsletterForm');
  const success = document.getElementById('newsletterSuccess');
  if (form && success) {
    form.style.display = 'none';
    success.style.display = 'flex';
  }
};

// ── Easter Egg ────────────────────────────────────────
let easterIdx = 0;
window.triggerEasterEgg = function() {
  const quote = EASTER_QUOTES[easterIdx % EASTER_QUOTES.length];
  easterIdx++;

  const content = document.getElementById('easterContent');
  if (content) {
    content.innerHTML = `
      <div style="font-size:4rem;margin-bottom:1rem;animation:modalIn .4s ease">${quote.char}</div>
      <div style="font-size:.7rem;letter-spacing:2px;color:#22c55e;margin-bottom:.8rem;text-transform:uppercase">${quote.anime}</div>
      <p style="font-size:1.05rem;color:rgba(240,253,244,.75);line-height:1.7;font-style:italic;margin-bottom:1.2rem">
        "${quote.quote}"
      </p>
      <div style="background:rgba(34,197,94,.07);border:1px solid rgba(34,197,94,.2);border-radius:12px;padding:1rem;font-size:.85rem;color:#86efac">
        🎁 ${quote.tip}
      </div>
    `;
  }

  const overlay = document.getElementById('easterOverlay');
  if (overlay) overlay.style.display = 'flex';

  // Spin the trigger button
  const btn = document.getElementById('footerEaster');
  if (btn) {
    btn.style.animation = 'none';
    btn.offsetHeight; // reflow
    btn.style.animation = '';
  }
};

window.closeEaster = function() {
  const overlay = document.getElementById('easterOverlay');
  if (overlay) overlay.style.display = 'none';
};

// ── Lang update ───────────────────────────────────────
export function updateFooterLang(lang) {
  footerLang = lang;
  document.querySelectorAll('#footer [data-fr]').forEach(el => {
    el.textContent = lang === 'fr' ? el.dataset.fr : el.dataset.en;
  });
  const input = document.getElementById('newsletterEmail');
  if (input) input.placeholder = lang === 'fr' ? 'ton@email.com' : 'your@email.com';
}