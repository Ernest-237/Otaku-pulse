// src/pages/Home/sections/Hero.jsx — Sans countdown, responsive parfait
import { useEffect, useState } from 'react'
import { useLang } from '../../../contexts/LangContext'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../../../api'
import styles from './Hero.module.css'

const DEFAULT = {
  taglineF: "🎌 GOODIES ANIME · LIVRAISON CAMEROUN",
  taglineE: "🎌 ANIME GOODS · CAMEROON DELIVERY",
  line1F: "VIVEZ L'EXPÉRIENCE",  line1E: "LIVE THE EXPERIENCE",
  line2F: "AU-DELÀ DE",          line2E: "BEYOND THE",
  accentF: "L'ÉCRAN",            accentE: "THE SCREEN",
  subtitleF: "Premier service de livraison de goodies Otaku au Cameroun. Mangas, posters, accessoires livrés chez toi.",
  subtitleE: "First Otaku goods delivery service in Cameroon. Manga, posters, accessories delivered to you.",
  primaryColor: "#22c55e", secondColor: "#86efac", glowColor: "rgba(34,197,94,0.4)",
  bgImageUrl: "", bgImageData: null, bgImageMime: null,
  ctaPrimaryF:   "⚡ Préparer mon événement", ctaPrimaryE:   "⚡ Book my event",
  ctaSecondaryF: "🛒 Aller à la boutique",   ctaSecondaryE: "🛒 Go to shop",
  statsJson: [
    { valueFr:'50+',  valueEn:'50+',  labelFr:'Thèmes Anime',    labelEn:'Anime Themes'  },
    { valueFr:'200+', valueEn:'200+', labelFr:'Clients heureux',  labelEn:'Happy clients' },
    { valueFr:'3',    valueEn:'3',    labelFr:'Villes livrées',   labelEn:'Cities'        },
    { valueFr:'4.9',  valueEn:'4.9',  labelFr:'Note Moyenne',     labelEn:'Avg Rating'    },
  ],
}

export default function Hero() {
  const { lang } = useLang()
  const navigate  = useNavigate()
  const [hero, setHero] = useState(DEFAULT)

  useEffect(() => {
    fetch(`${API_BASE}/api/hero?_=${Date.now()}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.hero) setHero({ ...DEFAULT, ...d.hero }) })
      .catch(() => {})
  }, [])

  const h       = hero
  const primary = h.primaryColor || '#22c55e'
  const second  = h.secondColor  || '#86efac'
  const glow    = h.glowColor    || 'rgba(34,197,94,0.4)'
  const stats   = Array.isArray(h.statsJson) ? h.statsJson : DEFAULT.statsJson

  // Image de fond : base64 > URL externe > dégradé CSS
  let bgImg = ''
  if (h.bgImageData && h.bgImageMime) {
    bgImg = `data:${h.bgImageMime};base64,${h.bgImageData}`
  } else if (h.bgImageUrl && h.bgImageUrl.trim() !== '') {
    bgImg = h.bgImageUrl.trim()
  }

  return (
    <section id="hero" className={styles.hero}
      style={{ '--primary': primary, '--second': second, '--glow': glow }}>

      {bgImg
        ? <div className={styles.bg} style={{ backgroundImage: `url(${bgImg})` }} />
        : <div className={styles.bgGradient} />
      }
      <div className={styles.overlay} />
      <div className={styles.grid} />

      <div className={styles.orb1} style={{ background: `radial-gradient(circle,${primary}30,transparent)` }} />
      <div className={styles.orb2} style={{ background: `radial-gradient(circle,#3b82f635,transparent)` }} />

      {/* Particules décoratives */}
      {[...Array(4)].map((_,i) => (
        <div key={i} className={styles.particle} style={{
          left: `${8+i*22}%`, top: `${20+i*14}%`,
          animationDelay: `${i*.7}s`, background: primary,
        }} />
      ))}

      <div className={styles.content}>
        {/* Badge */}
        <div className={styles.badge}
          style={{ background: `${primary}15`, borderColor: `${primary}35`, color: second }}>
          <span className={styles.dot} style={{ background: primary }} />
          {lang === 'fr' ? h.taglineF : h.taglineE}
        </div>

        {/* Titre principal */}
        <h1 className={styles.title}>
          <span className={styles.line1}>{lang === 'fr' ? h.line1F : h.line1E}</span>
          <span className={styles.line2}>{lang === 'fr' ? h.line2F : h.line2E}</span>
          <span className={styles.accent} style={{
            background: `linear-gradient(135deg, ${primary}, ${second})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {lang === 'fr' ? h.accentF : h.accentE}
          </span>
        </h1>

        <p className={styles.sub}>{lang === 'fr' ? h.subtitleF : h.subtitleE}</p>

        {/* CTAs — textes fixes pour éviter le flash au chargement */}
        <div className={styles.ctas}>
          <button className={styles.ctaPrimary}
            style={{ background: `linear-gradient(135deg,${primary},${primary}cc)`, boxShadow: `0 4px 20px ${glow}` }}
            onClick={() => navigate('/reservation')}>
            {lang === 'fr' ? "⚡ Préparer mon événement" : "⚡ Book my event"}
          </button>
          <button className={styles.ctaSecondary}
            onClick={() => navigate('/boutique')}>
            {lang === 'fr' ? "🛒 Aller à la boutique" : "🛒 Go to shop"}
          </button>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          {stats.map((s,i) => (
            <div key={i} className={styles.stat}>
              <span className={styles.statVal} style={{ color: primary }}>
                {lang === 'fr' ? s.valueFr : s.valueEn}
              </span>
              <span className={styles.statLbl}>
                {lang === 'fr' ? s.labelFr : s.labelEn}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}