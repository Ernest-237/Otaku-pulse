// src/components/contact.js
import { Contact as ContactAPI } from '../api.js';
// ═══════════════════════════════════════════════════════
// OTAKU PULSE — Section Contact & Réservation
// Formulaire réservation, FAQ, réseaux sociaux
// Prêt pour connexion API backend
// ═══════════════════════════════════════════════════════

const FAQS = [
  {
    q: { fr: 'Quel délai pour réserver ?', en: 'How far in advance should I book?' },
    a: { fr: 'Nous recommandons un préavis minimum de 2 semaines. Pour les événements Zone Hokage, 3 semaines sont conseillées afin de garantir la disponibilité de tout le matériel.', en: 'We recommend a minimum notice of 2 weeks. For Hokage Zone events, 3 weeks are advised to ensure all equipment is available.' },
  },
  {
    q: { fr: 'Livrez-vous hors de Yaoundé ?', en: 'Do you deliver outside Yaoundé?' },
    a: { fr: 'Oui ! Nous intervenons à Douala, Bafoussam et dans les villes environnantes. Des frais de déplacement s\'appliquent selon la distance — contactez-nous pour un devis.', en: 'Yes! We operate in Douala, Bafoussam and surrounding cities. Travel fees apply depending on distance — contact us for a quote.' },
  },
  {
    q: { fr: 'Peut-on choisir son thème ?', en: 'Can we choose our theme?' },
    a: { fr: 'Absolument. Vous choisissez parmi nos 50+ thèmes disponibles ou nous pouvons créer un thème personnalisé sur demande (délai supplémentaire requis).', en: 'Absolutely. You can choose from our 50+ available themes, or we can create a custom theme on request (additional lead time required).' },
  },
  {
    q: { fr: 'Y a-t-il des options sans alcool ?', en: 'Are there alcohol-free options?' },
    a: { fr: 'Bien sûr ! Tous nos cocktails narratifs sont disponibles en version mocktail. Notre "Senzu Bean Shake" est d\'ailleurs 100% sans alcool par défaut.', en: 'Of course! All our narrative cocktails are available as mocktails. Our "Senzu Bean Shake" is even 100% alcohol-free by default.' },
  },
  {
    q: { fr: 'Comment se passe le paiement ?', en: 'How does payment work?' },
    a: { fr: 'Un acompte de 30% est requis à la confirmation. Le solde est dû la veille de l\'événement. Nous acceptons Mobile Money (MTN/Orange) et virement bancaire.', en: 'A 30% deposit is required at confirmation. The balance is due the day before the event. We accept Mobile Money (MTN/Orange) and bank transfer.' },
  },
];

const SOCIALS = [
  { icon: '📸', name: 'Instagram',  handle: '@otakupulse_cm',  url: 'https://instagram.com/otakupulse_cm',  color: '#e1306c' },
  { icon: '📘', name: 'Facebook',   handle: 'Otaku Pulse CM',  url: 'https://facebook.com/otakupulsecm',    color: '#1877f2' },
  { icon: '🎵', name: 'TikTok',     handle: '@otakupulse',     url: 'https://tiktok.com/@otakupulse',       color: '#ff0050' },
  { icon: '💬', name: 'WhatsApp',   handle: '+237 675712739',url: 'https://wa.me/237675712739',           color: '#25d366' },
];

// ── HTML ──────────────────────────────────────────────
export function renderContact() {
  return `
  <section id="contact" class="contact">

    <div class="contact-bg">
      <div class="contact-grid"></div>
      <div class="contact-glow-left"></div>
      <div class="contact-glow-right"></div>
    </div>

    <div class="contact-container">

      <!-- ── EN-TÊTE ── -->
      <div class="section-header">
        <div class="section-tag">
          <span class="section-tag-dot"></span>
          <span data-fr="Réservation & Contact" data-en="Booking & Contact">Réservation & Contact</span>
        </div>
        <h2 class="section-title">
          <span data-fr="RÉSERVEZ" data-en="BOOK YOUR">RÉSERVEZ</span><br>
          <span class="title-green" data-fr="VOTRE EXPÉRIENCE" data-en="EXPERIENCE">VOTRE EXPÉRIENCE</span>
        </h2>
        <p class="section-subtitle"
           data-fr="Remplissez le formulaire et nous vous répondons sous 24h avec un devis personnalisé."
           data-en="Fill out the form and we'll get back to you within 24h with a custom quote.">
          Remplissez le formulaire et nous vous répondons sous 24h avec un devis personnalisé.
        </p>
      </div>

      <!-- ── MAIN LAYOUT ── -->
      <div class="contact-layout">

        <!-- FORMULAIRE -->
        <div class="contact-form-wrap">
          <div class="form-header">
            <div class="form-header-icon">📬</div>
            <div>
              <h3 data-fr="Formulaire de réservation" data-en="Booking form">Formulaire de réservation</h3>
              <p data-fr="Tous les champs marqués * sont obligatoires." data-en="All fields marked * are required.">
                Tous les champs marqués * sont obligatoires.
              </p>
            </div>
          </div>

          <!-- Pack sélectionné -->
          <div class="selected-pack-banner" id="selectedPackBanner" style="display:none">
            <span>⚡</span>
            <span id="selectedPackLabel"></span>
            <button onclick="window.clearSelectedPack()">✕</button>
          </div>

          <div class="contact-form" id="contactForm">
            <!-- Ligne 1 : Nom + Prénom -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  <span data-fr="Nom *" data-en="Last name *">Nom *</span>
                </label>
                <input type="text" class="form-input" id="fNom" 
                       placeholder="Mbarga" required>
              </div>
              <div class="form-group">
                <label class="form-label">
                  <span data-fr="Prénom *" data-en="First name *">Prénom *</span>
                </label>
                <input type="text" class="form-input" id="fPrenom"
                       placeholder="Jean-Paul" required>
              </div>
            </div>

            <!-- Ligne 2 : Email + Téléphone -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  <span data-fr="Email *" data-en="Email *">Email *</span>
                </label>
                <input type="email" class="form-input" id="fEmail"
                       placeholder="jean@exemple.cm" required>
              </div>
              <div class="form-group">
                <label class="form-label">
                  <span data-fr="Téléphone (WhatsApp) *" data-en="Phone (WhatsApp) *">Téléphone (WhatsApp) *</span>
                </label>
                <div class="phone-input-wrap">
                  <span class="phone-flag">🇨🇲 +237</span>
                  <input type="tel" class="form-input phone-input" id="fPhone"
                         placeholder="6XX XXX XXX" required>
                </div>
              </div>
            </div>

            <!-- Pack -->
            <div class="form-group">
              <label class="form-label">
                <span data-fr="Pack souhaité *" data-en="Desired pack *">Pack souhaité *</span>
              </label>
              <div class="form-select-wrap">
                <select class="form-select" id="fPack" required>
                  <option value="" data-fr="-- Choisir un pack --" data-en="-- Choose a pack --">-- Choisir un pack --</option>
                  <option value="genin">🥋 Pack GENIN — 85 000 FCFA</option>
                  <option value="chunin">⚔️ Pack CHŪNIN — 200 000 FCFA</option>
                  <option value="hokage">👑 Zone HOKAGE — 450 000 FCFA</option>
                  <option value="custom" data-fr="✨ Devis personnalisé" data-en="✨ Custom quote">✨ Devis personnalisé</option>
                </select>
                <span class="select-arrow">▾</span>
              </div>
            </div>

            <!-- Ligne 3 : Thème + Nb personnes -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  <span data-fr="Thème anime *" data-en="Anime theme *">Thème anime *</span>
                </label>
                <div class="form-select-wrap">
                  <select class="form-select" id="fTheme" required>
                    <option value="">-- Thème --</option>
                    ${['Naruto','One Piece','Jujutsu Kaisen','Dragon Ball Z','Demon Slayer',
                       'Attack on Titan','My Hero Academia','Bleach','Hunter × Hunter',
                       'Tokyo Ghoul','Fullmetal Alchemist','Death Note','Autre / Personnalisé'].map(t =>
                       `<option value="${t}">${t}</option>`).join('')}
                  </select>
                  <span class="select-arrow">▾</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">
                  <span data-fr="Nombre de personnes *" data-en="Number of people *">Nombre de personnes *</span>
                </label>
                <input type="number" class="form-input" id="fGuests"
                       min="5" max="200" placeholder="Ex: 20" required>
              </div>
            </div>

            <!-- Ligne 4 : Date + Heure -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  <span data-fr="Date souhaitée *" data-en="Desired date *">Date souhaitée *</span>
                </label>
                <input type="date" class="form-input" id="fDate" required>
              </div>
              <div class="form-group">
                <label class="form-label">
                  <span data-fr="Heure de début" data-en="Start time">Heure de début</span>
                </label>
                <input type="time" class="form-input" id="fTime" value="18:00">
              </div>
            </div>

            <!-- Ville + Lieu -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  <span data-fr="Ville *" data-en="City *">Ville *</span>
                </label>
                <div class="form-select-wrap">
                  <select class="form-select" id="fVille" required>
                    <option value="">-- Ville --</option>
                    <option>Yaoundé</option>
                    <option>Douala</option>
                    <option>Bafoussam</option>
                    <option data-fr="Autre ville" data-en="Other city">Autre ville</option>
                  </select>
                  <span class="select-arrow">▾</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">
                  <span data-fr="Lieu / Adresse" data-en="Venue / Address">Lieu / Adresse</span>
                </label>
                <input type="text" class="form-input" id="fLieu"
                       data-placeholder-fr="Quartier, domicile, salle..."
                       data-placeholder-en="Neighborhood, home, hall..."
                       placeholder="Quartier, domicile, salle...">
              </div>
            </div>

            <!-- Message -->
            <div class="form-group">
              <label class="form-label">
                <span data-fr="Message / Demandes spéciales" data-en="Message / Special requests">
                  Message / Demandes spéciales
                </span>
              </label>
              <textarea class="form-input form-textarea" id="fMessage" rows="4"
                        data-placeholder-fr="Décrivez votre événement, vos contraintes, vos souhaits..."
                        data-placeholder-en="Describe your event, constraints, wishes..."
                        placeholder="Décrivez votre événement, vos contraintes, vos souhaits..."></textarea>
            </div>

            <!-- Comment nous avez-vous trouvé? -->
            <div class="form-group">
              <label class="form-label">
                <span data-fr="Comment nous avez-vous trouvé ?" data-en="How did you find us?">
                  Comment nous avez-vous trouvé ?
                </span>
              </label>
              <div class="source-buttons" id="sourceButtons">
                ${[
                  {val:'instagram', label:'📸 Instagram'},
                  {val:'facebook',  label:'📘 Facebook'},
                  {val:'tiktok',    label:'🎵 TikTok'},
                  {val:'bouche',    label:'🗣️ Bouche à oreille'},
                  {val:'google',    label:'🔍 Google'},
                  {val:'autre',     label:'✨ Autre'},
                ].map(s => `
                  <button type="button" class="source-btn" data-val="${s.val}"
                          onclick="window.toggleSource('${s.val}')">
                    ${s.label}
                  </button>
                `).join('')}
              </div>
              <input type="hidden" id="fSource" value="">
            </div>

            <!-- RGPD -->
            <div class="form-check">
              <input type="checkbox" id="fRgpd" class="form-checkbox">
              <label for="fRgpd" class="form-check-label">
                <span data-fr="J'accepte que mes données soient utilisées pour répondre à ma demande. *"
                      data-en="I agree that my data will be used to respond to my request. *">
                  J'accepte que mes données soient utilisées pour répondre à ma demande. *
                </span>
              </label>
            </div>

            <!-- Submit -->
            <button type="button" class="submit-btn" id="submitBtn"
                    onclick="window.submitContactForm()">
              <span class="submit-btn-text">
                <span>⚡</span>
                <span data-fr="Envoyer ma demande" data-en="Send my request">Envoyer ma demande</span>
              </span>
              <div class="submit-btn-loader" style="display:none">
                <div class="loader-spinner"></div>
              </div>
            </button>

            <!-- Confirmation -->
            <div class="form-success" id="formSuccess" style="display:none">
              <div class="success-icon">✅</div>
              <h4 data-fr="Demande envoyée !" data-en="Request sent!">Demande envoyée !</h4>
              <p data-fr="Nous vous répondons sous 24h sur WhatsApp ou email."
                 data-en="We'll get back to you within 24h via WhatsApp or email.">
                Nous vous répondons sous 24h sur WhatsApp ou email.
              </p>
            </div>
          </div>
        </div>

        <!-- INFOS CONTACT -->
        <div class="contact-info-col">

          <!-- Info cards -->
          <div class="contact-info-cards">
            <div class="contact-info-card">
              <div class="cic-icon">📍</div>
              <div>
                <div class="cic-title" data-fr="Zones d'intervention" data-en="Service areas">Zones d'intervention</div>
                <div class="cic-value">Yaoundé · Douala · Bafoussam</div>
              </div>
            </div>
            <div class="contact-info-card">
              <div class="cic-icon">⏱️</div>
              <div>
                <div class="cic-title" data-fr="Délai de réponse" data-en="Response time">Délai de réponse</div>
                <div class="cic-value" data-fr="Moins de 24h (WhatsApp prioritaire)" data-en="Less than 24h (WhatsApp priority)">
                  Moins de 24h (WhatsApp prioritaire)
                </div>
              </div>
            </div>
            <div class="contact-info-card">
              <div class="cic-icon">💰</div>
              <div>
                <div class="cic-title" data-fr="Paiement" data-en="Payment">Paiement</div>
                <div class="cic-value">MTN Money · Orange Money · Virement</div>
              </div>
            </div>
            <div class="contact-info-card">
              <div class="cic-icon">🗓️</div>
              <div>
                <div class="cic-title" data-fr="Préavis minimum" data-en="Minimum notice">Préavis minimum</div>
                <div class="cic-value" data-fr="2 semaines (3 sem. pour Hokage)" data-en="2 weeks (3 weeks for Hokage)">
                  2 semaines (3 sem. pour Hokage)
                </div>
              </div>
            </div>
          </div>

          <!-- WhatsApp CTA -->
          <a href="https://wa.me/237600000000?text=Bonjour%20Otaku%20Pulse%20!%20Je%20voudrais%20r%C3%A9server%20un%20%C3%A9v%C3%A9nement."
             target="_blank" class="whatsapp-cta" rel="noopener">
            <div class="wa-icon">💬</div>
            <div class="wa-text">
              <strong data-fr="Discutons sur WhatsApp" data-en="Let's chat on WhatsApp">Discutons sur WhatsApp</strong>
              <span data-fr="Réponse rapide garantie" data-en="Fast response guaranteed">Réponse rapide garantie</span>
            </div>
            <div class="wa-arrow">→</div>
          </a>

          <!-- Réseaux sociaux -->
          <div class="socials-wrap">
            <div class="socials-title" data-fr="Suivez-nous" data-en="Follow us">Suivez-nous</div>
            <div class="socials-grid">
              ${SOCIALS.map(s => `
                <a href="${s.url}" target="_blank" rel="noopener"
                   class="social-btn" style="--s-color:${s.color}">
                  <span class="social-icon">${s.icon}</span>
                  <div class="social-info">
                    <div class="social-name">${s.name}</div>
                    <div class="social-handle">${s.handle}</div>
                  </div>
                </a>
              `).join('')}
            </div>
          </div>

        </div>
      </div>

      <!-- ── FAQ ── -->
      <div class="faq-section">
        <h3 class="subsection-title" style="color:rgba(34,197,94,0.5)"
            data-fr="QUESTIONS FRÉQUENTES" data-en="FREQUENTLY ASKED QUESTIONS">
          QUESTIONS FRÉQUENTES
        </h3>
        <div class="faq-list" id="faqList">
          ${FAQS.map((f, i) => `
            <div class="faq-item" id="faq-${i}">
              <button class="faq-question" onclick="window.toggleFaq(${i})">
                <span data-fr="${f.q.fr}" data-en="${f.q.en}">${f.q.fr}</span>
                <span class="faq-chevron">▾</span>
              </button>
              <div class="faq-answer" id="faq-answer-${i}">
                <p data-fr="${f.a.fr}" data-en="${f.a.en}">${f.a.fr}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  </section>
  `;
}

// ── CSS ───────────────────────────────────────────────
export const contactCSS = `

/* ══ CONTACT ══ */
.contact {
  position: relative;
  padding: 8rem 0 6rem;
  overflow: hidden;
  border-top: 1px solid rgba(34,197,94,0.08);
}
.contact-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.contact-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(34,197,94,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34,197,94,0.025) 1px, transparent 1px);
  background-size: 80px 80px;
}
.contact-glow-left {
  position: absolute; top: 10%; left: -15%;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%);
}
.contact-glow-right {
  position: absolute; bottom: 10%; right: -10%;
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(220,38,38,0.04) 0%, transparent 70%);
}
.contact-container {
  position: relative; z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* ── LAYOUT ── */
.contact-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 3rem;
  margin-bottom: 5rem;
  align-items: start;
}

/* ── FORM WRAP ── */
.contact-form-wrap {
  background: linear-gradient(160deg, rgba(12,26,46,0.95), rgba(6,14,26,0.98));
  border: 1px solid rgba(34,197,94,0.12);
  border-radius: 20px;
  padding: 2.5rem;
  position: relative;
  overflow: hidden;
}
.contact-form-wrap::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #22c55e, transparent);
}
.form-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.form-header-icon { font-size: 2rem; }
.form-header h3 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.3rem;
  letter-spacing: 2px;
  color: #f0fdf4;
  margin-bottom: 0.2rem;
}
.form-header p { font-size: 0.78rem; color: rgba(240,253,244,0.35); }

/* Selected pack banner */
.selected-pack-banner {
  background: rgba(34,197,94,0.08);
  border: 1px solid rgba(34,197,94,0.2);
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #86efac;
}
.selected-pack-banner button {
  background: none; border: none;
  color: rgba(240,253,244,0.3);
  cursor: pointer; margin-left: auto; font-size: 0.9rem;
  transition: color 0.2s;
}
.selected-pack-banner button:hover { color: #dc2626; }

/* Form elements */
.contact-form { display: flex; flex-direction: column; gap: 1.2rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 1px;
  color: rgba(240,253,244,0.5);
  text-transform: uppercase;
}
.form-input {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 11px 14px;
  color: #f0fdf4;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  transition: all 0.25s;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus {
  outline: none;
  border-color: #22c55e;
  background: rgba(34,197,94,0.04);
  box-shadow: 0 0 0 3px rgba(34,197,94,0.08);
}
.form-input.error { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220,38,38,0.1); }
.form-input::placeholder { color: rgba(240,253,244,0.2); }
.form-input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
.form-input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
.form-textarea { resize: vertical; min-height: 100px; line-height: 1.5; }

/* Phone */
.phone-input-wrap { display: flex; align-items: center; gap: 0; }
.phone-flag {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-right: none;
  border-radius: 10px 0 0 10px;
  padding: 11px 12px;
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(240,253,244,0.5);
  white-space: nowrap;
  flex-shrink: 0;
}
.phone-input { border-radius: 0 10px 10px 0 !important; }

/* Select */
.form-select-wrap { position: relative; }
.form-select {
  appearance: none;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 11px 36px 11px 14px;
  color: #f0fdf4;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  width: 100%;
  cursor: pointer;
  transition: all 0.25s;
}
.form-select:focus {
  outline: none;
  border-color: #22c55e;
  background: rgba(34,197,94,0.04);
}
.form-select option { background: #0c1a2e; }
.select-arrow {
  position: absolute; right: 12px; top: 50%;
  transform: translateY(-50%);
  color: rgba(240,253,244,0.3);
  pointer-events: none;
  font-size: 0.8rem;
}

/* Source buttons */
.source-buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.source-btn {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 50px;
  padding: 7px 14px;
  color: rgba(240,253,244,0.5);
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.source-btn:hover { border-color: rgba(34,197,94,0.3); color: #f0fdf4; }
.source-btn.active {
  background: rgba(34,197,94,0.12);
  border-color: #22c55e;
  color: #22c55e;
}

/* Checkbox */
.form-check { display: flex; align-items: flex-start; gap: 10px; }
.form-checkbox {
  width: 18px; height: 18px;
  accent-color: #22c55e;
  flex-shrink: 0;
  margin-top: 2px;
  cursor: pointer;
}
.form-check-label { font-size: 0.8rem; color: rgba(240,253,244,0.4); line-height: 1.5; cursor: pointer; }

/* Submit */
.submit-btn {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none;
  border-radius: 12px;
  padding: 15px;
  width: 100%;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 0 25px rgba(34,197,94,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  margin-top: 0.5rem;
}
.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(34,197,94,0.5);
}
.submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.submit-btn-text {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.2rem;
  letter-spacing: 2px;
  color: #0c1a2e;
}
.loader-spinner {
  width: 22px; height: 22px;
  border: 3px solid rgba(12,26,46,0.3);
  border-top-color: #0c1a2e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Form success */
.form-success {
  text-align: center;
  padding: 2rem;
  animation: successIn 0.5s ease;
}
@keyframes successIn {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}
.success-icon { font-size: 3rem; margin-bottom: 0.8rem; }
.form-success h4 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.5rem;
  letter-spacing: 3px;
  color: #22c55e;
  margin-bottom: 0.5rem;
}
.form-success p { font-size: 0.9rem; color: rgba(240,253,244,0.5); }

/* ── INFO COL ── */
.contact-info-cards { display: flex; flex-direction: column; gap: 12px; margin-bottom: 1.5rem; }
.contact-info-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(12,26,46,0.8);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  padding: 14px;
  transition: all 0.25s;
}
.contact-info-card:hover {
  border-color: rgba(34,197,94,0.2);
  transform: translateX(4px);
}
.cic-icon { font-size: 1.4rem; flex-shrink: 0; }
.cic-title {
  font-size: 0.7rem;
  letter-spacing: 1.5px;
  color: rgba(240,253,244,0.35);
  text-transform: uppercase;
  margin-bottom: 3px;
}
.cic-value { font-size: 0.88rem; font-weight: 600; color: #f0fdf4; }

/* WhatsApp */
.whatsapp-cta {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, rgba(37,211,102,0.1), rgba(12,26,46,0.9));
  border: 1px solid rgba(37,211,102,0.25);
  border-radius: 14px;
  padding: 16px;
  text-decoration: none;
  transition: all 0.3s;
  margin-bottom: 1.5rem;
}
.whatsapp-cta:hover {
  border-color: #25d366;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(37,211,102,0.15);
}
.wa-icon { font-size: 2rem; }
.wa-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.wa-text strong { font-size: 0.95rem; font-weight: 700; color: #f0fdf4; }
.wa-text span   { font-size: 0.75rem; color: #25d366; }
.wa-arrow { font-size: 1.2rem; color: #25d366; transition: transform 0.3s; }
.whatsapp-cta:hover .wa-arrow { transform: translateX(4px); }

/* Socials */
.socials-wrap {}
.socials-title {
  font-size: 0.72rem;
  letter-spacing: 2px;
  color: rgba(240,253,244,0.3);
  text-transform: uppercase;
  margin-bottom: 10px;
}
.socials-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.social-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(12,26,46,0.8);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
  padding: 10px 12px;
  text-decoration: none;
  transition: all 0.25s;
}
.social-btn:hover {
  border-color: var(--s-color);
  background: rgba(var(--s-color), 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px color-mix(in srgb, var(--s-color) 20%, transparent);
}
.social-icon { font-size: 1.2rem; }
.social-name  { font-size: 0.8rem; font-weight: 700; color: #f0fdf4; }
.social-handle{ font-size: 0.68rem; color: rgba(240,253,244,0.3); }

/* ── FAQ ── */
.faq-section { max-width: 800px; margin: 0 auto; }
.faq-list { display: flex; flex-direction: column; gap: 8px; }
.faq-item {
  background: rgba(12,26,46,0.8);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.25s;
}
.faq-item.open { border-color: rgba(34,197,94,0.2); }
.faq-question {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: none;
  border: none;
  color: #f0fdf4;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition: color 0.2s;
  gap: 1rem;
}
.faq-question:hover { color: #22c55e; }
.faq-chevron {
  flex-shrink: 0;
  transition: transform 0.3s;
  color: rgba(240,253,244,0.3);
  font-size: 0.9rem;
}
.faq-item.open .faq-chevron { transform: rotate(180deg); color: #22c55e; }
.faq-answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s ease;
}
.faq-item.open .faq-answer { max-height: 200px; }
.faq-answer p {
  padding: 0 20px 16px;
  font-size: 0.88rem;
  color: rgba(240,253,244,0.5);
  line-height: 1.7;
}

/* ── RESPONSIVE ── */
@media (max-width: 1024px) {
  .contact-layout { grid-template-columns: 1fr; max-width: 600px; margin: 0 auto 4rem; }
}
@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
  .socials-grid { grid-template-columns: 1fr; }
  .contact { padding: 5rem 0 3rem; }
  .contact-form-wrap { padding: 1.5rem; }
}
`;

// ── State & Init ──────────────────────────────────────
let contactLang = 'fr';
let selectedSource = '';
let formSubmitted = false;

export function initContact(lang = 'fr') {
  contactLang = lang;

  const style = document.createElement('style');
  style.textContent = contactCSS;
  document.head.appendChild(style);

  // Pré-remplir depuis sessionStorage (pack / event sélectionné)
  prefillFromSession();

  // Date min = aujourd'hui + 14 jours
  const minDate = document.getElementById('fDate');
  if (minDate) {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    minDate.min = d.toISOString().split('T')[0];
  }
}

function prefillFromSession() {
  const pack = sessionStorage.getItem('selected_pack');
  const event = sessionStorage.getItem('register_event');

  if (pack) {
    const p = JSON.parse(pack);
    const banner = document.getElementById('selectedPackBanner');
    const label  = document.getElementById('selectedPackLabel');
    const select = document.getElementById('fPack');
    if (banner) banner.style.display = 'flex';
    if (label)  label.textContent = `Pack ${p.rank} sélectionné — ${p.price} FCFA`;
    if (select) select.value = p.id;
  }

  if (event) {
    const e = JSON.parse(event);
    const msg = document.getElementById('fMessage');
    if (msg) msg.value = `Inscription à l'événement : ${e.title}`;
  }
}

window.clearSelectedPack = function() {
  sessionStorage.removeItem('selected_pack');
  const banner = document.getElementById('selectedPackBanner');
  if (banner) banner.style.display = 'none';
  const select = document.getElementById('fPack');
  if (select) select.value = '';
};

window.toggleSource = function(val) {
  selectedSource = selectedSource === val ? '' : val;
  document.querySelectorAll('.source-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.val === selectedSource);
  });
  const hidden = document.getElementById('fSource');
  if (hidden) hidden.value = selectedSource;
};

window.toggleFaq = function(i) {
  const item = document.getElementById(`faq-${i}`);
  if (!item) return;
  item.classList.toggle('open');
};

// ── Submit ────────────────────────────────────────────
window.submitContactForm = async function() {
  if (formSubmitted) return;

  const fields = {
    nom:     document.getElementById('fNom'),
    prenom:  document.getElementById('fPrenom'),
    email:   document.getElementById('fEmail'),
    phone:   document.getElementById('fPhone'),
    pack:    document.getElementById('fPack'),
    theme:   document.getElementById('fTheme'),
    guests:  document.getElementById('fGuests'),
    date:    document.getElementById('fDate'),
    ville:   document.getElementById('fVille'),
    rgpd:    document.getElementById('fRgpd'),
  };

  // Validation
  let valid = true;
  Object.entries(fields).forEach(([key, el]) => {
    if (!el) return;
    const isEmpty = el.type === 'checkbox' ? !el.checked : !el.value.trim();
    el.classList.toggle('error', isEmpty);
    if (isEmpty) valid = false;
  });

  if (!valid) {
    showContactToast(
      contactLang === 'fr' ? '⚠️ Veuillez remplir tous les champs obligatoires.' : '⚠️ Please fill in all required fields.',
      'error'
    );
    return;
  }

  // Collect data
  const payload = {
    nom:     fields.nom.value,
    prenom:  fields.prenom.value,
    email:   fields.email.value,
    phone:   '+237' + fields.phone.value,
    pack:    fields.pack.value,
    theme:   fields.theme.value,
    guests:  fields.guests.value,
    date:    fields.date.value,
    time:    document.getElementById('fTime')?.value,
    ville:   fields.ville.value,
    lieu:    document.getElementById('fLieu')?.value,
    message: document.getElementById('fMessage')?.value,
    source:  selectedSource,
    lang:    contactLang,
    pack_selected: sessionStorage.getItem('selected_pack'),
  };

  // Show loader
  const btn = document.getElementById('submitBtn');
  if (btn) {
    btn.disabled = true;
    btn.querySelector('.submit-btn-text').style.display = 'none';
    btn.querySelector('.submit-btn-loader').style.display = 'flex';
  }

  try {
    // Appel API réel
    await ContactAPI.send(payload);

    // Succès
    formSubmitted = true;
    sessionStorage.removeItem('selected_pack');
    sessionStorage.removeItem('register_event');

    const form = document.getElementById('contactForm');
    const success = document.getElementById('formSuccess');
    if (form && success) {
      form.style.display = 'none';
      success.style.display = 'block';
    }

    showContactToast(
      contactLang === 'fr' ? '✅ Demande envoyée ! Réponse sous 24h.' : '✅ Request sent! Response within 24h.',
      'success'
    );

    console.log('📬 Form payload:', payload);
    // 🔌 Envoyer aussi sur WhatsApp / email via backend

  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.querySelector('.submit-btn-text').style.display = 'flex';
      btn.querySelector('.submit-btn-loader').style.display = 'none';
    }
    showContactToast(
      contactLang === 'fr' ? '❌ Erreur. Contactez-nous sur WhatsApp.' : '❌ Error. Contact us on WhatsApp.',
      'error'
    );
  }
};

function showContactToast(msg, type = 'success') {
  const colors = { success: '#22c55e', error: '#dc2626', info: '#3b82f6' };
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);
    background:#0d1f35;border:1px solid ${colors[type]};border-radius:12px;
    padding:.8rem 1.4rem;color:#f0fdf4;font-family:'Rajdhani',sans-serif;
    font-size:.9rem;font-weight:600;z-index:9999;white-space:nowrap;
    box-shadow:0 10px 30px rgba(0,0,0,.4);animation:toastIn .3s ease`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

export function updateContactLang(lang) {
  contactLang = lang;
  document.querySelectorAll('#contact [data-fr]').forEach(el => {
    el.textContent = lang === 'fr' ? el.dataset.fr : el.dataset.en;
  });
  document.querySelectorAll('#contact [data-placeholder-fr]').forEach(el => {
    el.placeholder = lang === 'fr' ? el.dataset.placeholderFr : el.dataset.placeholderEn;
  });
}