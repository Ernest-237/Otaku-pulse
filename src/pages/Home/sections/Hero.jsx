// src/pages/Home/sections/Hero.jsx — Dynamique, cache-busting, design lumineux
import { useState, useEffect, useCallback } from 'react'
import { heroApi, API_BASE } from '../../../api'
import { useLang } from '../../../contexts/LangContext'
import styles from './Hero.module.css'

const DEFAULT_HERO = {
  taglineF:"LANCEMENT · 30 JUIN 2026 · CAMEROUN", taglineE:"LAUNCH · JUNE 30, 2026 · CAMEROON",
  line1F:"VIVEZ L'EXPÉRIENCE", line1E:"LIVE THE EXPERIENCE",
  line2F:"AU-DELÀ DE", line2E:"BEYOND THE",
  accentF:"L'ÉCRAN", accentE:"THE SCREEN",
  subtitleF:"Premier service de livraison de goodies Otaku au Cameroun. Mangas, posters, accessoires livrés chez toi.",
  subtitleE:"First Otaku goods delivery service in Cameroon. Manga, posters, accessories delivered to you.",
  primaryColor:"#22c55e", secondColor:"#86efac", glowColor:"rgba(34,197,94,0.4)",
  bgImageUrl:"/img/deku.jpg",
  ctaPrimaryF:"🛒 Commander maintenant", ctaPrimaryE:"🛒 Order now",
  ctaSecondaryF:"🎌 Voir les événements", ctaSecondaryE:"🎌 See events",
  launchDate:"2026-06-30",
  statsJson:[
    { valueFr:'50+',  valueEn:'50+',  labelFr:'Thèmes Anime',      labelEn:'Anime Themes' },
    { valueFr:'200+', valueEn:'200+', labelFr:'Clients heureux',    labelEn:'Happy clients' },
    { valueFr:'3',    valueEn:'3',    labelFr:'Villes livrées',      labelEn:'Delivery cities' },
    { valueFr:'4.9',  valueEn:'4.9',  labelFr:'Note Moyenne',        labelEn:'Avg Rating' },
  ],
}

function getCountdown(launchDate) {
  const diff = new Date(launchDate) - Date.now()
  if (diff <= 0) return { j:0, h:0, m:0, s:0 }
  const s = Math.floor(diff / 1000)
  return { j:Math.floor(s/86400), h:Math.floor((s%86400)/3600), m:Math.floor((s%3600)/60), s:s%60 }
}

export default function Hero() {
  const { lang } = useLang()
  const [hero, setHero] = useState(DEFAULT_HERO)
  const [cd,   setCd]   = useState(getCountdown('2026-06-30'))

  // Fetch sans cache — timestamp pour forcer le refresh
  const fetchHero = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/hero?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.hero) setHero(data.hero)
      }
    } catch(_) { /* fallback DEFAULT_HERO */ }
  }, [])

  useEffect(() => { fetchHero() }, [fetchHero])

  useEffect(() => {
    const id = setInterval(() => setCd(getCountdown(hero.launchDate || '2026-06-30')), 1000)
    return () => clearInterval(id)
  }, [hero.launchDate])

  const pad = n => String(n).padStart(2,'0')
  const primary = hero.primaryColor || '#22c55e'
  const second  = hero.secondColor  || '#86efac'
  const glow    = hero.glowColor    || 'rgba(34,197,94,0.4)'

  // Image de fond : base64 en priorité, sinon URL
  const bgImageSrc = hero.bgImageData
    ? `data:${hero.bgImageMime};base64,${hero.bgImageData}`
    : (hero.bgImageUrl || '/img/deku.jpg')

  const stats = Array.isArray(hero.statsJson) ? hero.statsJson : DEFAULT_HERO.statsJson

  return (
    <section id="hero" className={styles.hero} style={{ '--primary':primary, '--second':second, '--glow':glow }}>
      {/* Fond avec image */}
      <div className={styles.bg} style={{ backgroundImage:`url(${bgImageSrc})` }} />
      <div className={styles.overlay} />
      {/* Grille déco */}
      <div className={styles.grid} />
      {/* Orbes décoratifs */}
      <div className={styles.orb1} style={{ background:`radial-gradient(circle, ${primary}30, transparent)` }} />
      <div className={styles.orb2} style={{ background:`radial-gradient(circle, #3b82f640, transparent)` }} />
      {/* Particules */}
      {[...Array(6)].map((_,i) => (
        <div key={i} className={styles.particle} style={{
          left:`${12+i*14}%`, top:`${15+i*10}%`,
          animationDelay:`${i*.5}s`, background:primary,
          width: i%2===0 ? 6 : 4, height: i%2===0 ? 6 : 4,
        }} />
      ))}

      <div className={styles.content}>
        {/* Badge anime */}
        <div className={styles.badge} style={{ background:`${primary}18`, borderColor:`${primary}35`, color:second }}>
          <span className={styles.dot} style={{ background:primary, boxShadow:`0 0 8px ${primary}` }} />
          {lang==='fr' ? hero.taglineF : hero.taglineE}
        </div>

        {/* Titre principal */}
        <h1 className={styles.title}>
          <span className={styles.line1}>{lang==='fr' ? hero.line1F : hero.line1E}</span>
          <span className={styles.line2}>{lang==='fr' ? hero.line2F : hero.line2E}</span>
          <span className={styles.accent} style={{
            background:`linear-gradient(135deg, ${primary}, ${second})`,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            textShadow:'none',
          }}>
            {lang==='fr' ? hero.accentF : hero.accentE}
          </span>
        </h1>

        <p className={styles.sub}>{lang==='fr' ? hero.subtitleF : hero.subtitleE}</p>

        {/* Countdown */}
        <div className={styles.countdown}>
          {[{v:cd.j,lFr:'Jours',lEn:'Days'},{v:cd.h,lFr:'Heures',lEn:'Hrs'},{v:cd.m,lFr:'Min.',lEn:'Min.'},{v:cd.s,lFr:'Sec.',lEn:'Sec.'}].map((item,i) => (
            <div key={i} className={styles.cdItem} style={{ borderColor:`${primary}30` }}>
              <span className={styles.cdVal} style={{ color:primary }}>{pad(item.v)}</span>
              <span className={styles.cdLbl}>{lang==='fr' ? item.lFr : item.lEn}</span>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className={styles.ctas}>
          <button
            className={styles.ctaPrimary}
            style={{ background:`linear-gradient(135deg,${primary},${primary}cc)`, boxShadow:`0 4px 20px ${glow}` }}
            onClick={() => document.getElementById('boutique')?.scrollIntoView({behavior:'smooth'})}
          >
            {lang==='fr' ? hero.ctaPrimaryF : hero.ctaPrimaryE}
          </button>
          <button className={styles.ctaSecondary}
            onClick={() => document.getElementById('events')?.scrollIntoView({behavior:'smooth'})}
          >
            {lang==='fr' ? hero.ctaSecondaryF : hero.ctaSecondaryE}
          </button>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          {stats.map((s,i) => (
            <div key={i} className={styles.stat}>
              <span className={styles.statVal} style={{ color:primary }}>{lang==='fr' ? s.valueFr : s.valueEn}</span>
              <span className={styles.statLbl}>{lang==='fr' ? s.labelFr : s.labelEn}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}