import { Auth } from './api.js';
// src/main.js — OTAKU PULSE
import './styles/main.css';
import { renderNavbar, initNavbar } from './components/navbar.js';
import { renderHero, initHero, updateHeroLang } from './components/hero.js';
import { renderServices, initServices, updateServicesLang } from './components/services.js';
import { renderBoutique, initBoutique, updateBoutiqueLang } from './components/boutique.js';
import { renderEvents, initEvents, updateEventsLang } from './components/events.js';
import { renderApropos, initApropos, updateAproposLang } from './components/apropos.js';
import { renderContact, initContact, updateContactLang } from './components/contact.js';
import { renderFooter, initFooter, updateFooterLang } from './components/footer.js';

const app = document.getElementById('app');

app.innerHTML = `
  ${renderNavbar()}
  <main>
    ${renderHero()}
    ${renderServices()}
    ${renderBoutique()}
    ${renderEvents()}
    ${renderApropos()}
    ${renderContact()}
  </main>
  ${renderFooter()}
`;

// ── Init composants ───────────────────────────────────
initNavbar();
initHero();
initServices();
initBoutique();
initEvents();
initApropos();
initContact();
initFooter();

// ── Sync langue globale ───────────────────────────────
const origSetLang = window.navSetLang;
window.navSetLang = function(lang) {
  origSetLang(lang);
  updateHeroLang(lang);
  updateServicesLang(lang);
  updateBoutiqueLang(lang);
  updateEventsLang(lang);
  updateAproposLang(lang);
  updateContactLang(lang);
  updateFooterLang(lang);
};

// ── 🎵 MUSIQUE ANIME AUTO-PLAY ───────────────────────
// Le navigateur bloque l'autoplay sans interaction utilisateur.
// On lance la musique dès le premier clic/tap de l'utilisateur.
(function initMusic() {
  // ─ Crée le player audio caché ─
  const audio = document.createElement('audio');
  audio.id     = 'bgMusic';
  audio.loop   = true;
  audio.volume = 0.25; // 25% — discret mais présent
  audio.preload = 'auto';

  // ─ Source de la musique ─
  // Place ton fichier dans public/assets/music/generique.mp3
  // (plusieurs formats pour compatibilité max)
  const source = document.createElement('source');
  source.src  = '/assets/music/hero.mp3';
  source.type = 'audio/mpeg';
  audio.appendChild(source);
  document.body.appendChild(audio);

  // ─ Bouton flottant contrôle musique ─
  const musicBtn = document.createElement('button');
  musicBtn.id = 'musicToggle';
  musicBtn.innerHTML = '🎵';
  musicBtn.title = 'Musique ON/OFF';
  musicBtn.style.cssText = `
    position: fixed; bottom: 5rem; right: 1.5rem;
    width: 44px; height: 44px;
    background: rgba(12,26,46,0.9);
    border: 1px solid rgba(34,197,94,0.4);
    border-radius: 50%;
    color: #22c55e; font-size: 1.1rem;
    cursor: pointer; z-index: 999;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3), 0 0 10px rgba(34,197,94,0.15);
    transition: all 0.3s;
    backdrop-filter: blur(8px);
    animation: musicPulse 2s ease-in-out infinite;
  `;
  document.body.appendChild(musicBtn);

  // ─ Animation CSS ─
  const style = document.createElement('style');
  style.textContent = `
    @keyframes musicPulse {
      0%,100% { box-shadow: 0 4px 15px rgba(0,0,0,0.3), 0 0 10px rgba(34,197,94,0.15); }
      50%      { box-shadow: 0 4px 15px rgba(0,0,0,0.3), 0 0 20px rgba(34,197,94,0.4); }
    }
    #musicToggle:hover { transform: scale(1.1); }
    #musicToggle.muted { border-color: rgba(220,38,38,0.4); animation: none; }
  `;
  document.head.appendChild(style);

  let isPlaying = false;
  let hasInteracted = false;

  function playMusic() {
    audio.play().then(() => {
      isPlaying = true;
      musicBtn.innerHTML = '🎵';
      musicBtn.classList.remove('muted');
    }).catch(() => {
      // Autoplay bloqué — attendre interaction
    });
  }

  function toggleMusic() {
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      musicBtn.innerHTML = '🔇';
      musicBtn.classList.add('muted');
    } else {
      playMusic();
    }
  }

  musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hasInteracted = true;
    toggleMusic();
  });

  // ─ Lancer dès la première interaction utilisateur ─
  const startOnInteract = () => {
    if (!hasInteracted) {
      hasInteracted = true;
      playMusic();
    }
    // Supprimer les listeners une fois lancé
    ['click','touchstart','keydown','scroll'].forEach(ev =>
      document.removeEventListener(ev, startOnInteract)
    );
  };

  ['click','touchstart','keydown','scroll'].forEach(ev =>
    document.addEventListener(ev, startOnInteract, { once: true, passive: true })
  );

  // ─ Mémoriser préférence utilisateur ─
  const wasMuted = localStorage.getItem('op_music_muted') === '1';
  if (wasMuted) {
    musicBtn.innerHTML = '🔇';
    musicBtn.classList.add('muted');
    hasInteracted = true; // ne pas lancer
  }

  musicBtn.addEventListener('click', () => {
    localStorage.setItem('op_music_muted', isPlaying ? '0' : '1');
  });
})();