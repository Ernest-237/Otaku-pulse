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

// Init
initNavbar();
initHero();
initServices();
initBoutique();
initEvents();
initApropos();
initContact();
initFooter();

// Sync langue globale
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