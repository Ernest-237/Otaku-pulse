// src/components/services.js
// ═══════════════════════════════════════════════════════
// OTAKU PULSE — Section Nos Packs
// Genin / Chūnin / Zone Hokage — données du business plan
// ═══════════════════════════════════════════════════════

// ── Données des packs (source: business plan) ─────────
const PACKS = {
  fr: [
    {
      id: 'genin',
      rank: 'GENIN',
      rankIcon: '🥋',
      subtitle: "L'Essentiel Otaku",
      price: '85 000',
      currency: 'FCFA',
      tag: null,
      color: '#3b82f6',
      colorGlow: 'rgba(59,130,246,0.25)',
      target: 'Anniversaires en appartement, petits comités (5–12 pers.)',
      setup: '45 min • 1 personne',
      features: [
        { icon: '🧳', label: 'Kit Nomade', desc: '1 grande valise renforcée contenant tout le nécessaire' },
        { icon: '🎨', label: 'Décoration de Table', desc: 'Chemin thématique + confettis découpés laser (shurikens, logos)' },
        { icon: '📸', label: 'Mur de Scène (Photocall)', desc: 'Support télescopique + bâche HD 2×2m du thème choisi' },
        { icon: '🎈', label: 'Arche de Ballons', desc: 'Ballon organique 3 couleurs aux tons de l\'anime' },
        { icon: '🍹', label: 'Cocktail Signature', desc: 'Premix pré-mélangé en bouteilles scellées, service rapide' },
        { icon: '🥤', label: 'Verrerie Thématique', desc: 'Gobelets recyclables + canettes éco-responsables' },
        { icon: '🎵', label: 'Playlist Personnalisée', desc: 'Lien Spotify/YouTube envoyé 24h avant l\'événement' },
      ],
      cta: 'Réserver ce pack',
    },
    {
      id: 'chunin',
      rank: 'CHŪNIN',
      rankIcon: '⚔️',
      subtitle: "L'Immersion Intermédiaire",
      price: '200 000',
      currency: 'FCFA',
      tag: 'POPULAIRE',
      color: '#22c55e',
      colorGlow: 'rgba(34,197,94,0.3)',
      target: 'Salons spacieux, jardins, salles de fête',
      setup: '2h15 • 2 personnes',
      features: [
        { icon: '🖼️', label: 'Habillage Mural', desc: 'Couverture de 2–3 murs avec tissus tendus ou posters géants repositionnables' },
        { icon: '🗿', label: 'Accessoires 3D', desc: '2 éléments en relief : trône, rocher de combat, porte coulissante japonaise' },
        { icon: '💡', label: 'Éclairage LED', desc: '4 projecteurs connectés pour coloriser les coins selon le thème' },
        { icon: '🍸', label: 'Bar Mobile Otaku Pulse', desc: 'Comptoir pliable avec visuel magnétique interchangeable par thème' },
        { icon: '👨‍🍳', label: 'Mixologue (3h)', desc: 'Réalise les cocktails en live avec shaker chromé devant les invités' },
        { icon: '📜', label: 'Menu Narratif', desc: 'Chevalet avec description storytelling de chaque boisson' },
        { icon: '🎌', label: 'Kakemono d\'Accueil', desc: 'Signalétique entrée pour délimiter l\'espace Otaku' },
        { icon: '🎁', label: 'Goodies', desc: '10–15 stickers premium du thème offerts aux invités' },
      ],
      cta: 'Réserver ce pack',
    },
    {
      id: 'hokage',
      rank: 'HOKAGE',
      rankIcon: '👑',
      subtitle: 'Zone Hokage — Déploiement Complet',
      price: '450 000',
      currency: 'FCFA',
      tag: 'PREMIUM',
      color: '#dc2626',
      colorGlow: 'rgba(220,38,38,0.25)',
      target: 'Événements extérieurs, rassemblements, soirées privées',
      setup: '4h • 3 personnes',
      features: [
        { icon: '⛺', label: 'Tente Événementielle', desc: 'Structure dédiée lestée + étanchéité tropicale garantie' },
        { icon: '🗺️', label: 'Kakemonos Géants (2m+)', desc: 'Fonds de scène immersifs au fond de la tente' },
        { icon: '🗿', label: 'Structures 3D Full', desc: 'Rochers polystyrène, répliques d\'armes mousse, portails Torii' },
        { icon: '🎬', label: 'Vidéo Mapping', desc: 'Vidéoprojecteur avec mapping sur paroi de la tente' },
        { icon: '🔊', label: 'Sono & Éclairage Pro', desc: 'Par-led au sol + playlist musicale testée' },
        { icon: '🍸', label: 'Bar Mobile Premium', desc: 'Comptoir thématique full-setup avec mixologue narrateur' },
        { icon: '🥋', label: 'Cocktails Narratifs', desc: 'Le Rasengan, Gomu Punch, Extension du Territoire...' },
        { icon: '✅', label: 'Check Final', desc: 'Inspection zéro pli posters + sol propre avant ouverture' },
      ],
      cta: 'Réserver ce pack',
    }
  ],
  en: [
    {
      id: 'genin',
      rank: 'GENIN',
      rankIcon: '🥋',
      subtitle: 'The Otaku Essentials',
      price: '85,000',
      currency: 'FCFA',
      tag: null,
      color: '#3b82f6',
      colorGlow: 'rgba(59,130,246,0.25)',
      target: 'Apartment birthdays, small groups (5–12 people)',
      setup: '45 min • 1 person',
      features: [
        { icon: '🧳', label: 'Nomad Kit', desc: '1 reinforced suitcase with everything needed' },
        { icon: '🎨', label: 'Table Decoration', desc: 'Thematic runner + laser-cut confetti (shurikens, logos)' },
        { icon: '📸', label: 'Scene Wall (Photocall)', desc: 'Telescopic stand + HD banner 2×2m of chosen theme' },
        { icon: '🎈', label: 'Balloon Arch', desc: 'Organic 3-color balloon arch in anime tones' },
        { icon: '🍹', label: 'Signature Cocktail', desc: 'Pre-mixed in sealed bottles for fast service' },
        { icon: '🥤', label: 'Thematic Glassware', desc: 'Recyclable cups + eco-friendly cans' },
        { icon: '🎵', label: 'Custom Playlist', desc: 'Spotify/YouTube link sent 24h before the event' },
      ],
      cta: 'Book this pack',
    },
    {
      id: 'chunin',
      rank: 'CHŪNIN',
      rankIcon: '⚔️',
      subtitle: 'The Intermediate Immersion',
      price: '200,000',
      currency: 'FCFA',
      tag: 'POPULAR',
      color: '#22c55e',
      colorGlow: 'rgba(34,197,94,0.3)',
      target: 'Spacious living rooms, gardens, event halls',
      setup: '2h15 • 2 people',
      features: [
        { icon: '🖼️', label: 'Wall Dressing', desc: '2–3 walls covered with stretched fabrics or giant repositionable posters' },
        { icon: '🗿', label: '3D Accessories', desc: '2 relief elements: throne, combat rock, fake Japanese sliding door' },
        { icon: '💡', label: 'LED Lighting', desc: '4 connected projectors to colorize corners per theme' },
        { icon: '🍸', label: 'Otaku Pulse Mobile Bar', desc: 'Foldable counter with interchangeable magnetic visual per theme' },
        { icon: '👨‍🍳', label: 'Mixologist (3h)', desc: 'Live cocktail making with chrome shaker in front of guests' },
        { icon: '📜', label: 'Narrative Menu', desc: 'Easel with storytelling description of each drink' },
        { icon: '🎌', label: 'Welcome Kakemono', desc: 'Signage at the entrance to delimit the Otaku space' },
        { icon: '🎁', label: 'Goodies', desc: '10–15 premium themed stickers given to guests' },
      ],
      cta: 'Book this pack',
    },
    {
      id: 'hokage',
      rank: 'HOKAGE',
      rankIcon: '👑',
      subtitle: 'Hokage Zone — Full Deployment',
      price: '450,000',
      currency: 'FCFA',
      tag: 'PREMIUM',
      color: '#dc2626',
      colorGlow: 'rgba(220,38,38,0.25)',
      target: 'Outdoor events, gatherings, private parties',
      setup: '4h • 3 people',
      features: [
        { icon: '⛺', label: 'Event Tent', desc: 'Dedicated weighted structure + tropical waterproofing' },
        { icon: '🗺️', label: 'Giant Kakemonos (2m+)', desc: 'Immersive scene backgrounds at the back of the tent' },
        { icon: '🗿', label: 'Full 3D Structures', desc: 'Polystyrene rocks, foam weapon replicas, Torii portals' },
        { icon: '🎬', label: 'Video Mapping', desc: 'Projector with mapping on tent wall' },
        { icon: '🔊', label: 'Pro Sound & Lighting', desc: 'Ground par-led + tested music playlist' },
        { icon: '🍸', label: 'Premium Mobile Bar', desc: 'Full-setup thematic counter with narrative mixologist' },
        { icon: '🥋', label: 'Narrative Cocktails', desc: 'Le Rasengan, Gomu Punch, Territory Extension...' },
        { icon: '✅', label: 'Final Check', desc: 'Zero-crease poster inspection + clean floor before opening' },
      ],
      cta: 'Book this pack',
    }
  ]
};

// ── Cocktail Menu ─────────────────────────────────────
const COCKTAILS = [
  { name: '"Le Rasengan"', universe: 'Naruto', color: '#3b82f6', emoji: '🌀',
    ingredients: 'Gin · Curaçao bleu · Tonic · Sorbet citron',
    pitch: '"Une sphère tourbillonnante d\'énergie pure. Le chakra est concentré au centre !"' },
  { name: '"Gomu Gomu Punch"', universe: 'One Piece', color: '#dc2626', emoji: '👊',
    ingredients: 'Rhum blanc · Bissap rouge · Grenadine · Piment léger',
    pitch: '"Élastique et puissant. Frappe comme Luffy à Gear 4."' },
  { name: '"Extension du Territoire"', universe: 'Jujutsu Kaisen', color: '#8b5cf6', emoji: '🌌',
    ingredients: 'Vodka · Jus de goyave · Citron vert · Fumée froide',
    pitch: '"Piégé dans mon univers. Aucune esquive possible."' },
  { name: '"Senzu Bean Shake"', universe: 'Dragon Ball Z', color: '#22c55e', emoji: '💚',
    ingredients: 'Lait de coco · Avocat · Miel · Menthe (Sans alcool)',
    pitch: '"Regagne toute ton énergie. Le secret des Saiyans."' },
];

// ── HTML Template ─────────────────────────────────────
export function renderServices() {
  return `
  <section id="services" class="services">

    <!-- Bg déco -->
    <div class="services-bg">
      <div class="services-grid"></div>
      <div class="services-glow-left"></div>
      <div class="services-glow-right"></div>
    </div>

    <div class="services-container">

      <!-- ── EN-TÊTE ── -->
      <div class="section-header">
        <div class="section-tag">
          <span class="section-tag-dot"></span>
          <span data-fr="Nos Offres" data-en="Our Offers">Nos Offres</span>
        </div>
        <h2 class="section-title services-title">
          <span data-fr="CHOISISSEZ" data-en="CHOOSE YOUR">CHOISISSEZ</span><br>
          <span class="title-green" data-fr="VOTRE RANG" data-en="RANK">VOTRE RANG</span>
        </h2>
        <p class="section-subtitle" 
           data-fr="Trois niveaux d'immersion pour transformer n'importe quel lieu en univers manga. Du petit anniversaire au grand rassemblement."
           data-en="Three immersion levels to transform any venue into a manga universe. From small birthdays to large gatherings.">
          Trois niveaux d'immersion pour transformer n'importe quel lieu en univers manga. Du petit anniversaire au grand rassemblement.
        </p>
      </div>

      <!-- ── PACK CARDS ── -->
      <div class="packs-grid" id="packsGrid">
        <!-- injecté par JS -->
      </div>

      <!-- ── THÈMES MANGA ── -->
      <div class="themes-section">
        <h3 class="themes-title" 
            data-fr="Thèmes disponibles" data-en="Available themes">
          Thèmes disponibles
        </h3>
        <div class="themes-grid">
          ${['Naruto','One Piece','Jujutsu Kaisen','Dragon Ball Z','Demon Slayer','Attack on Titan',
             'My Hero Academia','Bleach','Hunter × Hunter','Tokyo Ghoul','Fullmetal Alchemist',
             'Death Note','Sword Art Online','Black Clover','Fairy Tail','+ Personnalisé'].map(t => `
            <div class="theme-chip">${t}</div>
          `).join('')}
        </div>
      </div>

      <!-- ── MENU COCKTAILS ── -->
      <div class="cocktails-section">
        <div class="section-header" style="margin-bottom:2rem">
          <div class="section-tag">
            <span class="section-tag-dot" style="background:#dc2626;box-shadow:0 0 8px #dc2626"></span>
            <span data-fr="Mixologie Narrative" data-en="Narrative Mixology">Mixologie Narrative</span>
          </div>
          <h3 class="section-title" style="font-size:clamp(1.8rem,4vw,3rem)">
            <span data-fr="LE MIXOLOGUE NE SERT PAS UN VERRE," data-en="THE MIXOLOGIST DOESN'T SERVE A DRINK,">
              LE MIXOLOGUE NE SERT PAS UN VERRE,
            </span><br>
            <span class="title-green" 
                  data-fr="IL RACONTE UNE TECHNIQUE DE COMBAT"
                  data-en="HE TELLS A COMBAT TECHNIQUE">
              IL RACONTE UNE TECHNIQUE DE COMBAT
            </span>
          </h3>
        </div>
        <div class="cocktails-grid">
          ${COCKTAILS.map(c => `
            <div class="cocktail-card" style="--c-color:${c.color}">
              <div class="cocktail-emoji">${c.emoji}</div>
              <div class="cocktail-universe">${c.universe}</div>
              <div class="cocktail-name">${c.name}</div>
              <div class="cocktail-ingredients">${c.ingredients}</div>
              <div class="cocktail-pitch">${c.pitch}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- ── CTA RÉSERVATION ── -->
      <div class="services-cta-wrap">
        <div class="services-cta-box">
          <div class="cta-box-deco">⚡</div>
          <h3 data-fr="Pas sûr de votre choix ?" data-en="Not sure which pack?">
            Pas sûr de votre choix ?
          </h3>
          <p data-fr="Contactez-nous pour un devis personnalisé selon votre événement et votre budget."
             data-en="Contact us for a custom quote based on your event and budget.">
            Contactez-nous pour un devis personnalisé selon votre événement et votre budget.
          </p>
          <a href="#contact" class="hero-cta-primary" style="display:inline-flex;margin-top:0">
            <span>📬</span>
            <span data-fr="Demander un devis" data-en="Request a quote">Demander un devis</span>
          </a>
        </div>
      </div>

    </div>
  </section>
  `;
}

// ── CSS ───────────────────────────────────────────────
export const servicesCSS = `

/* ══ SERVICES SECTION ══ */
.services {
  position: relative;
  padding: 8rem 0 6rem;
  overflow: hidden;
}

.services-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.services-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(34,197,94,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34,197,94,0.03) 1px, transparent 1px);
  background-size: 80px 80px;
}
.services-glow-left {
  position: absolute;
  top: 20%; left: -10%;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
  border-radius: 50%;
}
.services-glow-right {
  position: absolute;
  bottom: 10%; right: -10%;
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(220,38,38,0.06) 0%, transparent 70%);
  border-radius: 50%;
}

.services-container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* ── SECTION HEADER ── */
.section-header {
  text-align: center;
  margin-bottom: 4rem;
}
.section-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(34,197,94,0.08);
  border: 1px solid rgba(34,197,94,0.25);
  border-radius: 50px;
  padding: 6px 16px;
  margin-bottom: 1.2rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: #86efac;
  text-transform: uppercase;
}
.section-tag-dot {
  width: 7px; height: 7px;
  background: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 8px #22c55e;
  animation: tagBlink 2s ease-in-out infinite;
}
@keyframes tagBlink {
  0%,100% { opacity: 1; }
  50%      { opacity: 0.3; }
}
.services-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(2.8rem, 7vw, 6rem);
  letter-spacing: 5px;
  line-height: 1;
  color: #f0fdf4;
  margin-bottom: 1rem;
}
.title-green {
  background: linear-gradient(135deg, #22c55e, #86efac);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.section-subtitle {
  max-width: 600px;
  margin: 0 auto;
  color: rgba(240,253,244,0.5);
  font-size: 1rem;
  line-height: 1.7;
}

/* ── PACKS GRID ── */
.packs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 5rem;
  align-items: start;
}

/* ── PACK CARD ── */
.pack-card {
  position: relative;
  background: linear-gradient(160deg, rgba(12,26,46,0.9) 0%, rgba(6,14,26,0.95) 100%);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px;
  padding: 0;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.34,1.2,0.64,1);
  cursor: default;
}
.pack-card:hover {
  transform: translateY(-8px);
  border-color: var(--pack-color, #22c55e);
  box-shadow:
    0 25px 60px rgba(0,0,0,0.4),
    0 0 40px var(--pack-glow, rgba(34,197,94,0.15));
}
.pack-card.featured {
  border-color: rgba(34,197,94,0.3);
  box-shadow: 0 0 40px rgba(34,197,94,0.1);
  transform: translateY(-4px);
}
.pack-card.featured:hover {
  transform: translateY(-12px);
}

/* Card top bar */
.pack-card-bar {
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--pack-color, #22c55e), transparent);
}

/* Card header */
.pack-card-header {
  padding: 1.8rem 1.8rem 1.2rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  position: relative;
}
.pack-tag {
  position: absolute;
  top: 1.2rem; right: 1.2rem;
  background: var(--pack-color, #22c55e);
  color: #0c1a2e;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  padding: 4px 10px;
  border-radius: 20px;
}
.pack-rank-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0.8rem;
}
.pack-rank-icon {
  width: 50px; height: 50px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem;
  transition: all 0.3s;
}
.pack-card:hover .pack-rank-icon {
  background: rgba(var(--pack-color-rgb, '34,197,94'),0.1);
  border-color: var(--pack-color, #22c55e);
  box-shadow: 0 0 16px var(--pack-glow, rgba(34,197,94,0.3));
}
.pack-rank-info {}
.pack-rank {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.6rem;
  letter-spacing: 3px;
  color: var(--pack-color, #22c55e);
  line-height: 1;
}
.pack-subtitle {
  font-size: 0.75rem;
  color: rgba(240,253,244,0.4);
  letter-spacing: 1px;
}
.pack-price-wrap {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.pack-price {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2.5rem;
  letter-spacing: 2px;
  color: #f0fdf4;
  line-height: 1;
}
.pack-currency {
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(240,253,244,0.4);
  letter-spacing: 1px;
}
.pack-meta {
  margin-top: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pack-meta-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.78rem;
  color: rgba(240,253,244,0.45);
}
.pack-meta-icon { font-size: 0.9rem; }

/* Features */
.pack-features {
  padding: 1.4rem 1.8rem;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pack-feature {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}
.pack-feature:hover { background: rgba(255,255,255,0.03); }
.pack-feature-icon {
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 1px;
}
.pack-feature-text {}
.pack-feature-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #f0fdf4;
  line-height: 1.2;
}
.pack-feature-desc {
  font-size: 0.75rem;
  color: rgba(240,253,244,0.4);
  line-height: 1.4;
  margin-top: 2px;
}

/* CTA */
.pack-cta-wrap {
  padding: 1.2rem 1.8rem 1.8rem;
}
.pack-cta {
  display: block;
  width: 100%;
  padding: 13px;
  border-radius: 12px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.1rem;
  letter-spacing: 2px;
  text-align: center;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s;
  border: none;
}
.pack-cta-outline {
  background: transparent;
  border: 1px solid var(--pack-color, #22c55e);
  color: var(--pack-color, #22c55e);
}
.pack-cta-outline:hover {
  background: var(--pack-color, #22c55e);
  color: #0c1a2e;
  box-shadow: 0 0 25px var(--pack-glow, rgba(34,197,94,0.3));
}
.pack-cta-filled {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #0c1a2e;
  box-shadow: 0 0 20px rgba(34,197,94,0.3);
}
.pack-cta-filled:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(34,197,94,0.5);
}
.pack-cta-red {
  background: transparent;
  border: 1px solid #dc2626;
  color: #dc2626;
}
.pack-cta-red:hover {
  background: #dc2626;
  color: #fff;
  box-shadow: 0 0 25px rgba(220,38,38,0.35);
}

/* ── THEMES ── */
.themes-section {
  text-align: center;
  margin-bottom: 5rem;
}
.themes-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.5rem;
  letter-spacing: 3px;
  color: rgba(134,239,172,0.5);
  margin-bottom: 1.5rem;
  text-transform: uppercase;
}
.themes-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}
.theme-chip {
  background: rgba(12,26,46,0.8);
  border: 1px solid rgba(34,197,94,0.15);
  border-radius: 50px;
  padding: 7px 16px;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: rgba(240,253,244,0.55);
  transition: all 0.25s;
  cursor: default;
}
.theme-chip:hover {
  border-color: #22c55e;
  color: #22c55e;
  background: rgba(34,197,94,0.08);
  transform: translateY(-2px);
}
.theme-chip:last-child {
  border-style: dashed;
  color: rgba(34,197,94,0.5);
}

/* ── COCKTAILS ── */
.cocktails-section { margin-bottom: 5rem; }
.cocktails-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.cocktail-card {
  background: linear-gradient(160deg, rgba(12,26,46,0.9), rgba(6,14,26,0.95));
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  padding: 1.5rem 1.2rem;
  text-align: center;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}
.cocktail-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--c-color), transparent);
}
.cocktail-card:hover {
  border-color: var(--c-color);
  transform: translateY(-5px);
  box-shadow: 0 15px 40px rgba(0,0,0,0.3), 0 0 20px color-mix(in srgb, var(--c-color) 20%, transparent);
}
.cocktail-emoji { font-size: 2.5rem; margin-bottom: 0.5rem; }
.cocktail-universe {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--c-color);
  text-transform: uppercase;
  margin-bottom: 0.4rem;
}
.cocktail-name {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.1rem;
  letter-spacing: 2px;
  color: #f0fdf4;
  margin-bottom: 0.6rem;
  line-height: 1.2;
}
.cocktail-ingredients {
  font-size: 0.73rem;
  color: rgba(240,253,244,0.4);
  line-height: 1.5;
  margin-bottom: 0.8rem;
  font-style: italic;
}
.cocktail-pitch {
  font-size: 0.78rem;
  color: rgba(240,253,244,0.6);
  line-height: 1.5;
  font-style: italic;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding-top: 0.7rem;
}

/* ── CTA BOX ── */
.services-cta-wrap {
  display: flex;
  justify-content: center;
}
.services-cta-box {
  background: linear-gradient(135deg, rgba(34,197,94,0.06), rgba(12,26,46,0.8));
  border: 1px solid rgba(34,197,94,0.2);
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  max-width: 600px;
  width: 100%;
  position: relative;
  overflow: hidden;
}
.services-cta-box::before {
  content: '';
  position: absolute;
  top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(circle at center, rgba(34,197,94,0.05) 0%, transparent 60%);
  animation: ctaGlow 4s ease-in-out infinite;
}
@keyframes ctaGlow {
  0%,100% { transform: scale(1); opacity: 0.5; }
  50%      { transform: scale(1.1); opacity: 1; }
}
.cta-box-deco {
  font-size: 2.5rem;
  margin-bottom: 0.8rem;
  animation: ctaDeco 2s ease-in-out infinite;
}
@keyframes ctaDeco {
  0%,100% { transform: scale(1) rotate(-5deg); }
  50%      { transform: scale(1.1) rotate(5deg); }
}
.services-cta-box h3 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.8rem;
  letter-spacing: 3px;
  color: #f0fdf4;
  margin-bottom: 0.7rem;
  position: relative;
}
.services-cta-box p {
  color: rgba(240,253,244,0.5);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  position: relative;
}

/* ── RESPONSIVE ── */
@media (max-width: 1024px) {
  .packs-grid { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto 4rem; }
  .pack-card.featured { transform: none; }
  .cocktails-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .cocktails-grid { grid-template-columns: 1fr; max-width: 360px; margin: 0 auto; }
  .services { padding: 5rem 0 4rem; }
}
`;

// ── JavaScript Logic ──────────────────────────────────
export function initServices(lang = 'fr') {
  // CSS
  const style = document.createElement('style');
  style.textContent = servicesCSS;
  document.head.appendChild(style);

  // Render packs
  renderPackCards(lang);

  // Intersection Observer pour animations
  observeCards();
}

// ── Render pack cards dynamiquement ──────────────────
function renderPackCards(lang = 'fr') {
  const grid = document.getElementById('packsGrid');
  if (!grid) return;

  const packs = PACKS[lang] || PACKS.fr;
  grid.innerHTML = packs.map((pack, i) => {
    const isFeatured = pack.tag === 'POPULAIRE' || pack.tag === 'POPULAR';
    const ctaClass = isFeatured ? 'pack-cta-filled'
                   : pack.id === 'hokage' ? 'pack-cta-red' : 'pack-cta-outline';

    return `
    <div class="pack-card ${isFeatured ? 'featured' : ''} reveal-card"
         style="--pack-color:${pack.color}; --pack-glow:${pack.colorGlow};
                opacity:0; transform:translateY(40px);
                transition: all 0.6s cubic-bezier(0.34,1.2,0.64,1) ${i * 0.15}s">

      <div class="pack-card-bar"></div>

      <div class="pack-card-header">
        ${pack.tag ? `<div class="pack-tag">${pack.tag}</div>` : ''}
        <div class="pack-rank-wrap">
          <div class="pack-rank-icon">${pack.rankIcon}</div>
          <div class="pack-rank-info">
            <div class="pack-rank">${pack.rank}</div>
            <div class="pack-subtitle">${pack.subtitle}</div>
          </div>
        </div>
        <div class="pack-price-wrap">
          <span class="pack-price">${pack.price}</span>
          <span class="pack-currency">${pack.currency}</span>
        </div>
        <div class="pack-meta">
          <div class="pack-meta-item">
            <span class="pack-meta-icon">🎯</span>
            <span>${pack.target}</span>
          </div>
          <div class="pack-meta-item">
            <span class="pack-meta-icon">⏱️</span>
            <span>${pack.setup}</span>
          </div>
        </div>
      </div>

      <div class="pack-features">
        ${pack.features.map(f => `
          <div class="pack-feature">
            <span class="pack-feature-icon">${f.icon}</span>
            <div class="pack-feature-text">
              <div class="pack-feature-label">${f.label}</div>
              <div class="pack-feature-desc">${f.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="pack-cta-wrap">
        <a href="#contact" class="pack-cta ${ctaClass}"
           onclick="window.selectPack('${pack.id}', '${pack.rank}', '${pack.price}')">
          ${pack.cta}
        </a>
      </div>
    </div>
    `;
  }).join('');
}

// ── Intersection Observer (reveal on scroll) ──────────
function observeCards() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  setTimeout(() => {
    document.querySelectorAll('.reveal-card').forEach(card => observer.observe(card));
  }, 100);
}

// ── Sélection d'un pack (prépare la réservation) ──────
window.selectPack = function(id, rank, price) {
  // 🔌 Sera connecté au formulaire de contact / panier
  console.log(`Pack sélectionné: ${rank} — ${price} FCFA`);
  // Stocker le pack sélectionné pour pré-remplir le formulaire de contact
  sessionStorage.setItem('selected_pack', JSON.stringify({ id, rank, price }));
  // Scroll vers contact
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
};

// ── Mise à jour langue ────────────────────────────────
export function updateServicesLang(lang) {
  // Mise à jour textes data-fr/en
  document.querySelectorAll('#services [data-fr]').forEach(el => {
    el.textContent = lang === 'fr' ? el.dataset.fr : el.dataset.en;
  });
  // Re-render les cards dans la bonne langue
  renderPackCards(lang);
  observeCards();
}