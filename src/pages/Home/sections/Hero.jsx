// src/pages/Home/sections/Hero.jsx
import { useState, useEffect } from 'react'
import { useLang } from '../../../contexts/LangContext'
import { API_BASE } from '../../../api'
import styles from './Hero.module.css'

const DEFAULT = {
  taglineF:"LANCEMENT · 30 JUIN 2026 · CAMEROUN", taglineE:"LAUNCH · JUNE 30, 2026 · CAMEROON",
  line1F:"VIVEZ L'EXPÉRIENCE", line1E:"LIVE THE EXPERIENCE",
  line2F:"AU-DELÀ DE", line2E:"BEYOND THE",
  accentF:"L'ÉCRAN", accentE:"THE SCREEN",
  subtitleF:"Premier service de livraison de goodies Otaku au Cameroun.",
  subtitleE:"First Otaku goods delivery service in Cameroon.",
  primaryColor:"#22c55e", secondColor:"#86efac", glowColor:"rgba(34,197,94,0.4)",
  bgImageUrl:"", bgImageData:null, bgImageMime:null,
  ctaPrimaryF:"🛒 Commander maintenant", ctaPrimaryE:"🛒 Order now",
  ctaSecondaryF:"🎌 Voir la boutique", ctaSecondaryE:"🎌 See shop",
  launchDate:"2026-06-30",
  statsJson:[
    { valueFr:'50+',  valueEn:'50+',  labelFr:'Thèmes Anime',    labelEn:'Anime Themes'  },
    { valueFr:'200+', valueEn:'200+', labelFr:'Clients heureux',  labelEn:'Happy clients' },
    { valueFr:'3',    valueEn:'3',    labelFr:'Villes',            labelEn:'Cities'        },
    { valueFr:'4.9',  valueEn:'4.9',  labelFr:'Note Moyenne',     labelEn:'Avg Rating'    },
  ],
}

function getCountdown(date) {
  const diff = new Date(date) - Date.now()
  if (diff <= 0) return { j:0, h:0, m:0, s:0 }
  const s = Math.floor(diff/1000)
  return { j:Math.floor(s/86400), h:Math.floor((s%86400)/3600), m:Math.floor((s%3600)/60), s:s%60 }
}

export default function Hero() {
  const { lang } = useLang()
  const [hero, setHero] = useState(DEFAULT)
  const [cd,   setCd]   = useState(getCountdown(DEFAULT.launchDate))

  useEffect(() => {
    // ✅ Pas de headers custom (bloque CORS) — timestamp suffit pour casser le cache
    fetch(`${API_BASE}/api/hero?_=${Date.now()}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.hero) setHero({ ...DEFAULT, ...d.hero }) })
      .catch(() => {/* garde DEFAULT */})
  }, [])

  useEffect(() => {
    const id = setInterval(() => setCd(getCountdown(hero.launchDate || DEFAULT.launchDate)), 1000)
    return () => clearInterval(id)
  }, [hero.launchDate])

  const h       = hero
  const primary = h.primaryColor || '#22c55e'
  const second  = h.secondColor  || '#86efac'
  const glow    = h.glowColor    || 'rgba(34,197,94,0.4)'
  const stats   = Array.isArray(h.statsJson) ? h.statsJson : DEFAULT.statsJson
  const pad     = n => String(n).padStart(2,'0')

  // ✅ FIX : image de fond — base64 prioritaire, puis toute URL valide
  let bgImg = ''
  if (h.bgImageData && h.bgImageMime) {
    // Image uploadée depuis admin (base64)
    bgImg = `data:${h.bgImageMime};base64,${h.bgImageData}`
  } else if (h.bgImageUrl && h.bgImageUrl.trim() !== '') {
    // ✅ Toute URL valide (Pinterest, Imgur, etc.) — SANS condition deku.jpg
    bgImg = h.bgImageUrl.trim()
  }

  return (
    <section
      id="hero"
      className={styles.hero}
      style={{ '--primary':primary, '--second':second, '--glow':glow }}
    >
      {/* Fond : image OU dégradé animé */}
      {bgImg
        ? <div className={styles.bg} style={{ backgroundImage:`url(${bgImg})` }} />
        : <div className={styles.bgGradient} />
      }
      <div className={styles.overlay} />
      <div className={styles.grid} />

      {/* Orbes colorées avec couleurs dynamiques */}
      <div className={styles.orb1} style={{ background:`radial-gradient(circle,${primary}35,transparent)` }} />
      <div className={styles.orb2} style={{ background:`radial-gradient(circle,#3b82f640,transparent)` }} />

      {/* Particules */}
      {[...Array(5)].map((_,i) => (
        <div key={i} className={styles.particle} style={{
          left:`${10+i*18}%`, top:`${15+i*12}%`,
          animationDelay:`${i*.6}s`, background:primary,
        }} />
      ))}

      <div className={styles.content}>
        {/* Badge */}
        <div className={styles.badge} style={{
          background:`${primary}18`, borderColor:`${primary}40`, color:second
        }}>
          <span className={styles.dot} style={{ background:primary }} />
          {lang==='fr' ? h.taglineF : h.taglineE}
        </div>

        {/* Titre */}
        <h1 className={styles.title}>
          <span className={styles.line1}>{lang==='fr' ? h.line1F : h.line1E}</span>
          <span className={styles.line2}>{lang==='fr' ? h.line2F : h.line2E}</span>
          <span className={styles.accent} style={{
            background:`linear-gradient(135deg,${primary},${second})`,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>
            {lang==='fr' ? h.accentF : h.accentE}
          </span>
        </h1>

        <p className={styles.sub}>{lang==='fr' ? h.subtitleF : h.subtitleE}</p>

        {/* Countdown */}
        <div className={styles.countdown}>
          {[
            {v:cd.j, fr:'Jours',  en:'Days'},
            {v:cd.h, fr:'Heures', en:'Hrs' },
            {v:cd.m, fr:'Min.',   en:'Min.' },
            {v:cd.s, fr:'Sec.',   en:'Sec.' },
          ].map((x,i) => (
            <div key={i} className={styles.cdItem} style={{ borderColor:`${primary}35` }}>
              <span className={styles.cdVal} style={{ color:primary }}>{pad(x.v)}</span>
              <span className={styles.cdLbl}>{lang==='fr' ? x.fr : x.en}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={styles.ctas}>
          <button
            className={styles.ctaPrimary}
            style={{ background:`linear-gradient(135deg,${primary},${primary}cc)`, boxShadow:`0 4px 20px ${glow}` }}
            onClick={() => document.getElementById('boutique')?.scrollIntoView({behavior:'smooth'})}
          >
            {lang==='fr' ? h.ctaPrimaryF : h.ctaPrimaryE}
          </button>
          <button
            className={styles.ctaSecondary}
            onClick={() => document.getElementById('boutique')?.scrollIntoView({behavior:'smooth'})}
          >
            {lang==='fr' ? h.ctaSecondaryF : h.ctaSecondaryE}
          </button>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          {stats.map((s,i) => (
            <div key={i} className={styles.stat}>
              <span className={styles.statVal} style={{ color:primary }}>
                {lang==='fr' ? s.valueFr : s.valueEn}
              </span>
              <span className={styles.statLbl}>
                {lang==='fr' ? s.labelFr : s.labelEn}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}