// src/components/apropos.js
// ═══════════════════════════════════════════════════════
// OTAKU PULSE — Section À Propos
// Histoire, équipe, mission, valeurs, timeline
// ═══════════════════════════════════════════════════════

const TEAM = [
  {
    id: 't1',
    emoji: '👨‍💼',
    nameF: 'Fondateur & Directeur Artistique',
    nameE: 'Founder & Artistic Director',
    roleF: 'Vision, stratégie et direction créative du projet Otaku Pulse.',
    roleE: 'Vision, strategy and creative direction of the Otaku Pulse project.',
    skills: ['Décoration événementielle','Direction artistique','Management'],
  },
  {
    id: 't2',
    emoji: '🍸',
    nameF: 'Chef Mixologue Narrateur',
    nameE: 'Head Narrative Mixologist',
    roleF: 'Crée et interprète chaque cocktail comme une technique de combat.',
    roleE: 'Creates and interprets each cocktail as a combat technique.',
    skills: ['Mixologie', 'Storytelling', 'Créativité'],
  },
  {
    id: 't3',
    emoji: '🎨',
    nameF: 'Responsable Décoration',
    nameE: 'Decoration Manager',
    roleF: 'Transforme chaque espace en univers manga immersif en un temps record.',
    roleE: 'Transforms every space into an immersive manga universe in record time.',
    skills: ['Décoration 3D', 'Logistique', 'Installation'],
  },
];

const TIMELINE = [
  {
    year: '2024',
    iconF: '💡', iconE: '💡',
    titleF: "L'Idée Naît",
    titleE: 'The Idea is Born',
    descF: "Face à l'absence d'expériences otaku immersives en Afrique centrale, l'idée d'Otaku Pulse émerge à Yaoundé.",
    descE: 'Faced with the lack of immersive otaku experiences in Central Africa, the idea of Otaku Pulse emerged in Yaoundé.',
  },
  {
    year: '2025',
    iconF: '🛠️', iconE: '🛠️',
    titleF: 'Construction du Concept',
    titleE: 'Concept Building',
    descF: "Développement du modèle 3 packs, création des cocktails narratifs et tests événementiels avec les premières communautés otaku camerounaises.",
    descE: 'Development of the 3-pack model, creation of narrative cocktails and event testing with the first Cameroonian otaku communities.',
  },
  {
    year: '2026',
    iconF: '🚀', iconE: '🚀',
    titleF: 'Lancement Officiel',
    titleE: 'Official Launch',
    descF: "Juin 2026 : ouverture officielle d'Otaku Pulse avec la Zone Hokage Grand Lancement. Objectif : référence événementielle Geek en Afrique Centrale.",
    descE: 'June 2026: official opening of Otaku Pulse with the Hokage Zone Grand Launch. Goal: to become the reference for Geek events in Central Africa.',
  },
];

const VALUES = [
  { emoji: '🎌', titleF: 'Authenticité',    titleE: 'Authenticity',    descF: "Chaque détail respecte l'univers source — aucun compromis sur la fidélité au manga.", descE: 'Every detail respects the source universe — no compromise on fidelity to the manga.' },
  { emoji: '⚡', titleF: 'Excellence',       titleE: 'Excellence',       descF: 'Montage pro, finition parfaite, zéro pli. Le Check Final est non négociable.', descE: 'Professional setup, perfect finish, zero crease. The Final Check is non-negotiable.' },
  { emoji: '🌍', titleF: 'Ancrage Local',    titleE: 'Local Roots',     descF: "Made in Cameroun. Nous célébrons la culture otaku à travers un prisme 100% africain.", descE: 'Made in Cameroon. We celebrate otaku culture through a 100% African lens.' },
  { emoji: '🤝', titleF: 'Communauté',       titleE: 'Community',        descF: "Bâtir la plus grande communauté otaku d'Afrique Centrale, événement après événement.", descE: 'Building the largest otaku community in Central Africa, event after event.' },
];

// ── HTML Template ─────────────────────────────────────
export function renderApropos() {
  return `
  <section id="apropos" class="apropos">

    <div class="apropos-bg">
      <div class="apropos-grid"></div>
      <div class="apropos-glow"></div>
    </div>

    <div class="apropos-container">

      <!-- ── EN-TÊTE ── -->
      <div class="section-header">
        <div class="section-tag">
          <span class="section-tag-dot" style="background:#f59e0b;box-shadow:0 0 8px #f59e0b"></span>
          <span data-fr="Notre Histoire" data-en="Our Story">Notre Histoire</span>
        </div>
        <h2 class="section-title">
          <span data-fr="QUI SOMMES-" data-en="WHO ARE">QUI SOMMES-</span><br>
          <span class="title-amber" data-fr="NOUS ?" data-en="WE?">NOUS ?</span>
        </h2>
        <p class="section-subtitle"
           data-fr="Otaku Pulse est né d'une conviction : la culture anime mérite d'être vécue, pas seulement regardée."
           data-en="Otaku Pulse was born from a conviction: anime culture deserves to be lived, not just watched.">
          Otaku Pulse est né d'une conviction : la culture anime mérite d'être vécue, pas seulement regardée.
        </p>
      </div>

      <!-- ── MANIFESTO ── -->
      <div class="manifesto-block">
        <div class="manifesto-quote">
          <div class="manifesto-quote-mark">"</div>
          <p data-fr="Nous ne décorons pas des salles. Nous construisons des portails vers des univers. Chaque shuriken posé, chaque cocktail servi, chaque lumière allumée est un acte de respect envers la culture qui nous a élevés."
             data-en="We don't decorate rooms. We build portals to universes. Every shuriken placed, every cocktail served, every light turned on is an act of respect toward the culture that raised us.">
            Nous ne décorons pas des salles. Nous construisons des portails vers des univers. Chaque shuriken posé, chaque cocktail servi, chaque lumière allumée est un acte de respect envers la culture qui nous a élevés.
          </p>
          <div class="manifesto-author">— Otaku Pulse, Yaoundé 2026</div>
        </div>
        <div class="manifesto-visual">
          <div class="manifesto-kanji">夢</div>
          <div class="manifesto-kanji-label">Yume — Le Rêve</div>
        </div>
      </div>

      <!-- ── TIMELINE ── -->
      <div class="timeline-section">
        <h3 class="subsection-title"
            data-fr="NOTRE PARCOURS" data-en="OUR JOURNEY">NOTRE PARCOURS</h3>
        <div class="timeline">
          ${TIMELINE.map((t, i) => `
            <div class="timeline-item ${i % 2 === 0 ? 'left' : 'right'} reveal-timeline">
              <div class="timeline-year">${t.year}</div>
              <div class="timeline-dot"></div>
              <div class="timeline-card" data-year="${t.year}">
                <div class="timeline-icon">${t.iconF}</div>
                <div class="timeline-title" data-fr="${t.titleF}" data-en="${t.titleE}">${t.titleF}</div>
                <div class="timeline-desc" data-fr="${t.descF}" data-en="${t.descE}">${t.descF}</div>
              </div>
            </div>
          `).join('')}
          <div class="timeline-line"></div>
        </div>
      </div>

      <!-- ── VALEURS ── -->
      <div class="values-section">
        <h3 class="subsection-title"
            data-fr="NOS VALEURS" data-en="OUR VALUES">NOS VALEURS</h3>
        <div class="values-grid">
          ${VALUES.map(v => `
            <div class="value-card reveal-value">
              <div class="value-emoji">${v.emoji}</div>
              <div class="value-title" data-fr="${v.titleF}" data-en="${v.titleE}">${v.titleF}</div>
              <div class="value-desc" data-fr="${v.descF}" data-en="${v.descE}">${v.descF}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- ── ÉQUIPE ── -->
      <div class="team-section">
        <h3 class="subsection-title"
            data-fr="L'ÉQUIPE DERRIÈRE LA MAGIE" data-en="THE TEAM BEHIND THE MAGIC">
          L'ÉQUIPE DERRIÈRE LA MAGIE
        </h3>
        <div class="team-grid">
          ${TEAM.map(m => `
            <div class="team-card reveal-team">
              <div class="team-avatar">${m.emoji}</div>
              <div class="team-info">
                <div class="team-name" data-fr="${m.nameF}" data-en="${m.nameE}">${m.nameF}</div>
                <div class="team-role" data-fr="${m.roleF}" data-en="${m.roleE}">${m.roleF}</div>
                <div class="team-skills">
                  ${m.skills.map(s => `<span class="team-skill">${s}</span>`).join('')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- ── MISSION AFRIQUE ── -->
      <div class="africa-mission">
        <div class="africa-mission-inner">
          <div class="africa-map">🌍</div>
          <div class="africa-text">
            <h3 data-fr="Notre mission : l'Afrique Centrale Otaku"
                data-en="Our mission: Central Africa Otaku">
              Notre mission : l'Afrique Centrale Otaku
            </h3>
            <p data-fr="Devenir la référence événementielle Geek en Afrique Centrale d'ici 2027. Yaoundé, Douala, Bafoussam — puis au-delà des frontières du Cameroun."
               data-en="Become the reference for Geek events in Central Africa by 2027. Yaoundé, Douala, Bafoussam — then beyond Cameroon's borders.">
              Devenir la référence événementielle Geek en Afrique Centrale d'ici 2027. Yaoundé, Douala, Bafoussam — puis au-delà des frontières du Cameroun.
            </p>
            <div class="africa-cities">
              ${['Yaoundé ✅','Douala ✅','Bafoussam 🔜','Libreville 🎯','Kinshasa 🎯'].map(c =>
                `<span class="africa-city">${c}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>
  `;
}

// ── CSS ───────────────────────────────────────────────
export const aproposCSS = `

/* ══ APROPOS ══ */
.apropos {
  position: relative;
  padding: 8rem 0 6rem;
  overflow: hidden;
  border-top: 1px solid rgba(245,158,11,0.08);
}
.apropos-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.apropos-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(245,158,11,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(245,158,11,0.02) 1px, transparent 1px);
  background-size: 80px 80px;
}
.apropos-glow {
  position: absolute; top: 20%; right: -5%;
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%);
}
.apropos-container {
  position: relative; z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem;
}
.title-amber {
  background: linear-gradient(135deg, #f59e0b, #fcd34d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.subsection-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.4rem;
  letter-spacing: 4px;
  color: rgba(245,158,11,0.5);
  text-align: center;
  margin-bottom: 2.5rem;
}

/* ── MANIFESTO ── */
.manifesto-block {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 3rem;
  align-items: center;
  margin-bottom: 6rem;
  background: linear-gradient(135deg, rgba(245,158,11,0.04), rgba(12,26,46,0.8));
  border: 1px solid rgba(245,158,11,0.12);
  border-radius: 20px;
  padding: 3rem;
  position: relative;
  overflow: hidden;
}
.manifesto-block::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #f59e0b, transparent);
}
.manifesto-quote-mark {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 6rem;
  color: rgba(245,158,11,0.15);
  line-height: 0.5;
  margin-bottom: 1rem;
  user-select: none;
}
.manifesto-quote p {
  font-size: 1.1rem;
  line-height: 1.8;
  color: rgba(240,253,244,0.7);
  font-style: italic;
  margin-bottom: 1rem;
}
.manifesto-author {
  font-size: 0.8rem;
  letter-spacing: 2px;
  color: #f59e0b;
  font-weight: 700;
}
.manifesto-visual {
  text-align: center;
  flex-shrink: 0;
}
.manifesto-kanji {
  font-size: 6rem;
  color: rgba(245,158,11,0.15);
  text-shadow: 0 0 40px rgba(245,158,11,0.3);
  animation: kanjiPulse 4s ease-in-out infinite;
  line-height: 1;
}
@keyframes kanjiPulse {
  0%,100% { color: rgba(245,158,11,0.15); text-shadow: 0 0 40px rgba(245,158,11,0.2); }
  50%      { color: rgba(245,158,11,0.35); text-shadow: 0 0 60px rgba(245,158,11,0.5); }
}
.manifesto-kanji-label {
  font-size: 0.7rem;
  letter-spacing: 2px;
  color: rgba(245,158,11,0.4);
  margin-top: 8px;
  font-style: italic;
}

/* ── TIMELINE ── */
.timeline-section { margin-bottom: 6rem; }
.timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.timeline-line {
  position: absolute;
  left: 50%;
  top: 0; bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, transparent, #f59e0b 20%, #f59e0b 80%, transparent);
  transform: translateX(-50%);
}
.timeline-item {
  display: grid;
  grid-template-columns: 1fr 60px 1fr;
  gap: 0;
  align-items: center;
  margin-bottom: 2rem;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s ease;
}
.timeline-item.visible { opacity: 1; transform: translateY(0); }
.timeline-item.left  .timeline-year { text-align: right; padding-right: 20px; }
.timeline-item.right .timeline-year { text-align: left; padding-left: 20px; grid-column: 3; grid-row: 1; }
.timeline-item.left  .timeline-card { grid-column: 1; }
.timeline-item.right .timeline-card { grid-column: 3; grid-row: 1; }
.timeline-item.right .timeline-dot  { grid-column: 2; grid-row: 1; }
.timeline-item.right .timeline-year-wrap { grid-column: 1; grid-row: 1; }
.timeline-year {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2rem;
  letter-spacing: 3px;
  color: rgba(245,158,11,0.35);
  padding: 0 20px;
}
.timeline-dot {
  width: 16px; height: 16px;
  background: #f59e0b;
  border-radius: 50%;
  border: 3px solid #0c1a2e;
  box-shadow: 0 0 15px rgba(245,158,11,0.5);
  margin: 0 auto;
  position: relative; z-index: 1;
  grid-column: 2;
}
.timeline-card {
  background: linear-gradient(135deg, rgba(12,26,46,0.9), rgba(6,14,26,0.95));
  border: 1px solid rgba(245,158,11,0.12);
  border-radius: 14px;
  padding: 1.5rem;
  transition: all 0.3s;
}
.timeline-card:hover {
  border-color: rgba(245,158,11,0.3);
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
.timeline-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
.timeline-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.1rem;
  letter-spacing: 2px;
  color: #f59e0b;
  margin-bottom: 0.4rem;
}
.timeline-desc {
  font-size: 0.82rem;
  color: rgba(240,253,244,0.5);
  line-height: 1.6;
}

/* ── VALUES ── */
.values-section { margin-bottom: 6rem; }
.values-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.value-card {
  background: linear-gradient(160deg, rgba(12,26,46,0.9), rgba(6,14,26,0.95));
  border: 1px solid rgba(245,158,11,0.08);
  border-radius: 16px;
  padding: 1.8rem 1.4rem;
  text-align: center;
  transition: all 0.3s;
  opacity: 0;
  transform: translateY(20px);
}
.value-card.visible { opacity: 1; transform: translateY(0); }
.value-card:hover {
  border-color: rgba(245,158,11,0.3);
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0,0,0,0.25), 0 0 20px rgba(245,158,11,0.06);
}
.value-emoji {
  font-size: 2.5rem;
  margin-bottom: 0.8rem;
  display: block;
  transition: transform 0.3s;
}
.value-card:hover .value-emoji { transform: scale(1.15) rotate(-5deg); }
.value-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.1rem;
  letter-spacing: 2px;
  color: #f59e0b;
  margin-bottom: 0.6rem;
}
.value-desc {
  font-size: 0.78rem;
  color: rgba(240,253,244,0.45);
  line-height: 1.6;
}

/* ── TEAM ── */
.team-section { margin-bottom: 5rem; }
.team-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.team-card {
  background: linear-gradient(160deg, rgba(12,26,46,0.9), rgba(6,14,26,0.95));
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1.2rem;
  transition: all 0.3s;
  opacity: 0;
  transform: translateY(20px);
}
.team-card.visible { opacity: 1; transform: translateY(0); }
.team-card:hover {
  border-color: rgba(245,158,11,0.2);
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.2);
}
.team-avatar {
  font-size: 2.8rem;
  flex-shrink: 0;
  width: 60px; height: 60px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(245,158,11,0.06);
  border: 1px solid rgba(245,158,11,0.12);
  border-radius: 14px;
}
.team-name {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1rem;
  letter-spacing: 1.5px;
  color: #f59e0b;
  margin-bottom: 0.4rem;
}
.team-role {
  font-size: 0.78rem;
  color: rgba(240,253,244,0.45);
  line-height: 1.5;
  margin-bottom: 0.8rem;
}
.team-skills { display: flex; flex-wrap: wrap; gap: 5px; }
.team-skill {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 3px 9px;
  border-radius: 20px;
  background: rgba(245,158,11,0.07);
  border: 1px solid rgba(245,158,11,0.15);
  color: rgba(245,158,11,0.6);
}

/* ── AFRICA MISSION ── */
.africa-mission {
  background: linear-gradient(135deg, rgba(34,197,94,0.06), rgba(245,158,11,0.04), rgba(12,26,46,0.9));
  border: 1px solid rgba(34,197,94,0.15);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
}
.africa-mission::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, #22c55e, #f59e0b, #dc2626);
}
.africa-mission-inner {
  display: flex;
  align-items: center;
  gap: 3rem;
  padding: 2.5rem;
  flex-wrap: wrap;
}
.africa-map {
  font-size: 5rem;
  flex-shrink: 0;
  animation: africaPulse 3s ease-in-out infinite;
}
@keyframes africaPulse {
  0%,100% { transform: scale(1); }
  50%      { transform: scale(1.06); }
}
.africa-text { flex: 1; min-width: 200px; }
.africa-text h3 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.6rem;
  letter-spacing: 3px;
  color: #f0fdf4;
  margin-bottom: 0.6rem;
}
.africa-text p {
  font-size: 0.9rem;
  color: rgba(240,253,244,0.55);
  line-height: 1.7;
  margin-bottom: 1rem;
}
.africa-cities { display: flex; gap: 8px; flex-wrap: wrap; }
.africa-city {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 20px;
  background: rgba(34,197,94,0.07);
  border: 1px solid rgba(34,197,94,0.15);
  color: rgba(240,253,244,0.6);
}

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  .values-grid { grid-template-columns: repeat(2, 1fr); }
  .team-grid { grid-template-columns: 1fr; max-width: 450px; margin: 0 auto; }
  .manifesto-block { grid-template-columns: 1fr; }
  .manifesto-visual { display: none; }

  /* TIMELINE MOBILE — ligne gauche, dot + card en colonne unique */
  .timeline { padding-left: 16px; }
  .timeline-line { left: 20px; transform: none; }
  .timeline-item {
    display: grid;
    grid-template-columns: 40px 1fr;
    grid-template-rows: auto;
    gap: 0 12px;
    align-items: flex-start;
    margin-bottom: 2.5rem;
  }
  .timeline-item.left  .timeline-year,
  .timeline-item.right .timeline-year { display: none; }
  .timeline-item.left  .timeline-dot,
  .timeline-item.right .timeline-dot  { grid-column: 1; grid-row: 1; margin: 4px auto 0; }
  .timeline-item.left  .timeline-card,
  .timeline-item.right .timeline-card { grid-column: 2; grid-row: 1; }
  .timeline-card { padding: 1.2rem; }
  .timeline-card::before {
    content: attr(data-year);
    display: inline-block;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 0.85rem;
    letter-spacing: 2px;
    color: #f59e0b;
    background: rgba(245,158,11,0.08);
    border: 1px solid rgba(245,158,11,0.2);
    border-radius: 20px;
    padding: 2px 10px;
    margin-bottom: 0.6rem;
  }
}
@media (max-width: 600px) {
  .values-grid { grid-template-columns: 1fr 1fr; }
  .apropos { padding: 5rem 0 3rem; }
  .africa-mission-inner { flex-direction: column; text-align: center; }
  .africa-cities { justify-content: center; }
  .timeline-desc { font-size: 0.8rem; }
}
`;

// ── Init ──────────────────────────────────────────────
export function initApropos(lang = 'fr') {
  const style = document.createElement('style');
  style.textContent = aproposCSS;
  document.head.appendChild(style);
  observeApropos();
}

function observeApropos() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  setTimeout(() => {
    document.querySelectorAll('.reveal-timeline, .reveal-value, .reveal-team').forEach(el => obs.observe(el));
  }, 100);
}

export function updateAproposLang(lang) {
  document.querySelectorAll('#apropos [data-fr]').forEach(el => {
    el.textContent = lang === 'fr' ? el.dataset.fr : el.dataset.en;
  });
}