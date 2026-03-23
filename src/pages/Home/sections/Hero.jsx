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
  ctaSecondaryF:"🎌 Voir la boutique",    ctaSecondaryE:"🎌 See shop",
  launchDate:"2026-06-30",
  statsJson:[
    { valueFr:'50+',  valueEn:'50+',  labelFr:'Thèmes Anime',   labelEn:'Anime Themes'  },
    { valueFr:'200+', valueEn:'200+', labelFr:'Clients heureux', labelEn:'Happy clients' },
    { valueFr:'3',    valueEn:'3',    labelFr:'Villes',           labelEn:'Cities'        },
    { valueFr:'4.9',  valueEn:'4.9',  labelFr:'Note Moyenne',    labelEn:'Avg Rating'    },
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
  // ⚠️ hero commence à null — on affiche seulement quand les données API arrivent
  const [hero,    setHero]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [cd,      setCd]      = useState(getCountdown(DEFAULT.launchDate))

  useEffect(() => {
    // Fetch direct sans useApi pour contrôle total
    const url = `${API_BASE}/api/hero?_=${Date.now()}`
    fetch(url, { cache: 'no-store', headers: { 'Pragma': 'no-cache' } })
      .then(r => r.json())
      .then(d => {
        console.log('[Hero] API response:', d?.hero?.animeName, d?.hero?.primaryColor)
        setHero(d?.hero || DEFAULT)
      })
      .catch(() => setHero(DEFAULT))
      .finally(() => setLoading(false))
  }, []) // une seule fois au mount

  // Countdown mis à jour chaque seconde
  const launchDate = hero?.launchDate || DEFAULT.launchDate
  useEffect(() => {
    const id = setInterval(() => setCd(getCountdown(launchDate)), 1000)
    return () => clearInterval(id)
  }, [launchDate])

  // Pendant le chargement : squelette minimal
  if (loading || !hero) return (
    <section id="hero" className={styles.hero} style={{ '--primary':'#22c55e','--second':'#86efac','--glow':'rgba(34,197,94,0.4)' }}>
      <div className={styles.bg} />
      <div className={styles.overlay} />
      <div className={styles.content} style={{ opacity:.3 }}>
        <div className={styles.badge}><span className={styles.dot} /> Chargement...</div>
      </div>
    </section>
  )

  const h = hero
  const primary = h.primaryColor || '#22c55e'
  const second  = h.secondColor  || '#86efac'
  const glow    = h.glowColor    || 'rgba(34,197,94,0.4)'
  const stats   = Array.isArray(h.statsJson) ? h.statsJson : DEFAULT.statsJson

  // Image de fond : base64 > URL API > URL directe > vide (CSS dark par défaut)
  let bgImg = ''
  if (h.bgImageData && h.bgImageMime) {
    bgImg = `data:${h.bgImageMime};base64,${h.bgImageData}`
  } else if (h.bgImageUrl && h.bgImageUrl !== '/img/deku.jpg') {
    bgImg = h.bgImageUrl
  }
  // Si bgImg est vide → fond CSS dégradé animé (pas de deku.jpg par défaut)

  const pad = n => String(n).padStart(2,'0')

  return (
    <section id="hero" className={styles.hero}
      style={{ '--primary':primary, '--second':second, '--glow':glow }}>

      {bgImg && <div className={styles.bg} style={{ backgroundImage:`url(${bgImg})` }} />}
      {!bgImg && <div className={styles.bgGradient} />}
      <div className={styles.overlay} />
      <div className={styles.grid} />
      <div className={styles.orb1} style={{ background:`radial-gradient(circle,${primary}35,transparent)` }} />
      <div className={styles.orb2} style={{ background:`radial-gradient(circle,#3b82f640,transparent)` }} />
      {[...Array(5)].map((_,i) => (
        <div key={i} className={styles.particle} style={{ left:`${10+i*18}%`, top:`${15+i*12}%`, animationDelay:`${i*.6}s`, background:primary }} />
      ))}

      <div className={styles.content}>
        <div className={styles.badge} style={{ background:`${primary}18`, borderColor:`${primary}35`, color:second }}>
          <span className={styles.dot} style={{ background:primary }} />
          {lang==='fr' ? h.taglineF : h.taglineE}
        </div>

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

        <div className={styles.countdown}>
          {[{v:cd.j,fr:'Jours',en:'Days'},{v:cd.h,fr:'Heures',en:'Hrs'},{v:cd.m,fr:'Min.',en:'Min.'},{v:cd.s,fr:'Sec.',en:'Sec.'}].map((x,i)=>(
            <div key={i} className={styles.cdItem} style={{ borderColor:`${primary}35` }}>
              <span className={styles.cdVal} style={{ color:primary }}>{pad(x.v)}</span>
              <span className={styles.cdLbl}>{lang==='fr'?x.fr:x.en}</span>
            </div>
          ))}
        </div>

        <div className={styles.ctas}>
          <button className={styles.ctaPrimary}
            style={{ background:`linear-gradient(135deg,${primary},${primary}cc)`, boxShadow:`0 4px 20px ${glow}` }}
            onClick={()=>document.getElementById('boutique')?.scrollIntoView({behavior:'smooth'})}>
            {lang==='fr' ? h.ctaPrimaryF : h.ctaPrimaryE}
          </button>
          <button className={styles.ctaSecondary}
            onClick={()=>document.getElementById('boutique')?.scrollIntoView({behavior:'smooth'})}>
            {lang==='fr' ? h.ctaSecondaryF : h.ctaSecondaryE}
          </button>
        </div>

        <div className={styles.stats}>
          {stats.map((s,i)=>(
            <div key={i} className={styles.stat}>
              <span className={styles.statVal} style={{ color:primary }}>{lang==='fr'?s.valueFr:s.valueEn}</span>
              <span className={styles.statLbl}>{lang==='fr'?s.labelFr:s.labelEn}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}