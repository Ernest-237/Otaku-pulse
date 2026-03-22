// src/pages/Home/sections/Hero.jsx
import { useState, useEffect } from 'react'
import { useLang }  from '../../../contexts/LangContext'
import styles       from './Hero.module.css'

const LAUNCH = new Date('2026-06-30T00:00:00')

function getCountdown() {
  const diff = LAUNCH - Date.now()
  if (diff <= 0) return { j:0, h:0, m:0, s:0 }
  const s = Math.floor(diff/1000)
  return {
    j: Math.floor(s/86400),
    h: Math.floor((s%86400)/3600),
    m: Math.floor((s%3600)/60),
    s: s%60,
  }
}

const STATS = [
  { value:'50+',  labelFr:'Thèmes Anime',   labelEn:'Anime Themes'   },
  { value:'100+', labelFr:'Événements',      labelEn:'Events'         },
  { value:'3',    labelFr:'Villes',          labelEn:'Cities'         },
  { value:'4.9',  labelFr:'Note Moyenne',    labelEn:'Average Rating' },
]

const PACKS = [
  { name:'GENIN',   price:'85 000',  color:'#22c55e', emoji:'🥋', descFr:'5-12 personnes',    descEn:'5-12 people'    },
  { name:'CHŪNIN',  price:'200 000', color:'#3b82f6', emoji:'⚔️', descFr:'Jardins & Salons',  descEn:'Gardens & Halls'},
  { name:'HOKAGE',  price:'450 000', color:'#f97316', emoji:'👑', descFr:'Événement complet',  descEn:'Full event'     },
]

export default function Hero() {
  const { lang } = useLang()
  const [cd, setCd] = useState(getCountdown())

  useEffect(() => {
    const id = setInterval(() => setCd(getCountdown()), 1000)
    return () => clearInterval(id)
  }, [])

  const pad = (n) => String(n).padStart(2,'0')

  return (
    <section id="hero" className={styles.hero}>
      {/* Background */}
      <div className={styles.bg} style={{ backgroundImage:'url(/img/deku.jpg)' }} />
      <div className={styles.overlay} />
      <div className={styles.grid} />

      {/* Particles */}
      {[...Array(8)].map((_,i) => (
        <div key={i} className={styles.particle} style={{
          left:`${10+i*12}%`, top:`${20+i*7}%`,
          animationDelay:`${i*.4}s`,
        }} />
      ))}

      <div className={styles.content}>
        {/* Badge lancement */}
        <div className={styles.badge}>
          <span className={styles.dot} />
          {lang==='fr' ? 'LANCEMENT · 30 JUIN 2026 · CAMEROUN' : 'LAUNCH · JUNE 30, 2026 · CAMEROON'}
        </div>

        {/* Titre */}
        <h1 className={styles.title}>
          <span className={styles.titleLine1}>
            {lang==='fr' ? 'VIVEZ L\'EXPÉRIENCE' : 'LIVE THE EXPERIENCE'}
          </span>
          <span className={styles.titleLine2}>
            {lang==='fr' ? 'AU-DELÀ DE' : 'BEYOND THE'}
          </span>
          <span className={styles.titleGreen}>L'ÉCRAN</span>
        </h1>

        <p className={styles.sub}>
          {lang==='fr'
            ? 'Premier service événementiel clé en main spécialisé dans l\'immersion Otaku au Cameroun. Décoration manga, mixologie narrative, 50+ thèmes.'
            : 'First all-inclusive Otaku event service in Cameroon. Manga decoration, narrative mixology, 50+ themes.'}
        </p>

        {/* Countdown */}
        <div className={styles.countdown}>
          {[
            { v:cd.j, lFr:'Jours',    lEn:'Days'    },
            { v:cd.h, lFr:'Heures',   lEn:'Hours'   },
            { v:cd.m, lFr:'Minutes',  lEn:'Minutes' },
            { v:cd.s, lFr:'Secondes', lEn:'Seconds' },
          ].map((item, i) => (
            <div key={i} className={styles.cdItem}>
              <span className={styles.cdVal}>{pad(item.v)}</span>
              <span className={styles.cdLbl}>{lang==='fr' ? item.lFr : item.lEn}</span>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className={styles.ctas}>
          <button className={styles.ctaPrimary} onClick={() => document.getElementById('contact')?.scrollIntoView({behavior:'smooth'})}>
            {lang==='fr' ? '⚡ Réserver mon événement' : '⚡ Book my event'}
          </button>
          <button className={styles.ctaSecondary} onClick={() => document.getElementById('services')?.scrollIntoView({behavior:'smooth'})}>
            {lang==='fr' ? '🎌 Voir les packs' : '🎌 See packs'}
          </button>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          {STATS.map((s, i) => (
            <div key={i} className={styles.stat}>
              <span className={styles.statVal}>{s.value}</span>
              <span className={styles.statLbl}>{lang==='fr' ? s.labelFr : s.labelEn}</span>
            </div>
          ))}
        </div>

        {/* Pack preview */}
        <div className={styles.packs}>
          {PACKS.map((p) => (
            <div key={p.name} className={styles.pack} style={{ borderColor:`${p.color}33` }}>
              <span className={styles.packEmoji}>{p.emoji}</span>
              <span className={styles.packName} style={{ color:p.color }}>{p.name}</span>
              <span className={styles.packDesc}>{lang==='fr' ? p.descFr : p.descEn}</span>
              <span className={styles.packPrice}>{p.price} <small>FCFA</small></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}