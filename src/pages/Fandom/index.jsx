// src/pages/Fandom/index.jsx — Coming Soon animé
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import styles from './Fandom.module.css'

export default function FandomPage() {
  const [email, setEmail]   = useState('')
  const [sent,  setSent]    = useState(false)
  const [typed, setTyped]   = useState('')
  const fullText = 'FANDOM OTAKU'

  // Effet typewriter
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      setTyped(fullText.slice(0, i+1))
      i++
      if (i >= fullText.length) clearInterval(id)
    }, 120)
    return () => clearInterval(id)
  }, [])

  // Countdown fictif vers une date future
  const [cd, setCd] = useState({ j:0, h:0, m:0, s:0 })
  useEffect(() => {
    const target = new Date('2026-09-01T00:00:00')
    const update = () => {
      const diff = target - Date.now()
      if (diff <= 0) return
      const s = Math.floor(diff/1000)
      setCd({ j:Math.floor(s/86400), h:Math.floor((s%86400)/3600), m:Math.floor((s%3600)/60), s:s%60 })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  const pad = n => String(n).padStart(2,'0')

  const handleNotify = async e => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    // TODO: connecter à l'API newsletter
    setSent(true)
  }

  return (
    <div className={styles.page}>
      <Navbar />

      {/* Fond animé */}
      <div className={styles.bg}>
        <div className={styles.bgOverlay} />
        {/* Particules flottantes */}
        {[...Array(20)].map((_,i) => (
          <div key={i} className={styles.floatParticle} style={{
            left: `${Math.random()*100}%`,
            top:  `${Math.random()*100}%`,
            animationDelay: `${Math.random()*5}s`,
            animationDuration: `${4+Math.random()*4}s`,
            width:  `${3+Math.random()*5}px`,
            height: `${3+Math.random()*5}px`,
            opacity: 0.2+Math.random()*0.4,
          }} />
        ))}
      </div>

      <div className={styles.content}>
        {/* Badge */}
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          🎌 BIENTÔT DISPONIBLE
        </div>

        {/* Titre typewriter */}
        <h1 className={styles.title}>
          <span className={styles.titleAccent}>{typed}</span>
          <span className={styles.cursor}>|</span>
        </h1>

        <p className={styles.subtitle}>
          Un espace dédié aux fans otaku du Cameroun.<br/>
          Communauté, quiz, classements, discussions et bien plus encore.
        </p>

        {/* Personnages */}
        <div className={styles.characters}>
          <div className={styles.charCard} style={{ animationDelay:'0s' }}>
            <div className={styles.charEmoji}>⚡</div>
            <div className={styles.charName}>Satoru Gojo</div>
            <div className={styles.charSeries}>Jujutsu Kaisen</div>
            <div className={styles.charGlow} style={{ background:'radial-gradient(circle,rgba(99,102,241,.4),transparent)' }} />
          </div>
          <div className={styles.charCard} style={{ animationDelay:'.3s' }}>
            <div className={styles.charEmoji}>🌸</div>
            <div className={styles.charName}>Yuta Okkotsu</div>
            <div className={styles.charSeries}>Jujutsu Kaisen 0</div>
            <div className={styles.charGlow} style={{ background:'radial-gradient(circle,rgba(139,92,246,.4),transparent)' }} />
          </div>
          <div className={styles.charCard} style={{ animationDelay:'.6s' }}>
            <div className={styles.charEmoji}>🦊</div>
            <div className={styles.charName}>Naruto Uzumaki</div>
            <div className={styles.charSeries}>Naruto Shippuden</div>
            <div className={styles.charGlow} style={{ background:'radial-gradient(circle,rgba(249,115,22,.4),transparent)' }} />
          </div>
        </div>

        {/* Countdown */}
        <div className={styles.countdown}>
          <div className={styles.cdLabel}>LANCEMENT DANS</div>
          <div className={styles.cdRow}>
            {[{v:cd.j,l:'Jours'},{v:cd.h,l:'Heures'},{v:cd.m,l:'Min'},{v:cd.s,l:'Sec'}].map((x,i) => (
              <div key={i} className={styles.cdItem}>
                <span className={styles.cdVal}>{pad(x.v)}</span>
                <span className={styles.cdLbl}>{x.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features à venir */}
        <div className={styles.features}>
          {[
            { emoji:'🏆', title:'Classements', desc:'Ranke ton anime préféré' },
            { emoji:'💬', title:'Discussions', desc:'Partage tes théories' },
            { emoji:'🎯', title:'Quiz Otaku',  desc:'Teste tes connaissances' },
            { emoji:'🎨', title:'Fan Art',     desc:'Partage tes créations' },
            { emoji:'📦', title:'Deals Exclusifs', desc:'Promos membres' },
            { emoji:'🤝', title:'Communauté',  desc:'Rejoins les otakus CM' },
          ].map((f,i) => (
            <div key={i} className={styles.featureCard} style={{ animationDelay:`${i*.1}s` }}>
              <span className={styles.featureEmoji}>{f.emoji}</span>
              <div className={styles.featureTitle}>{f.title}</div>
              <div className={styles.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Notification form */}
        {!sent ? (
          <div className={styles.notifyBox}>
            <p className={styles.notifyText}>
              🔔 Sois le premier à être notifié du lancement !
            </p>
            <form className={styles.notifyForm} onSubmit={handleNotify}>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ton@email.com" className={styles.notifyInput} required
              />
              <button type="submit" className={styles.notifyBtn}>
                ⚡ Me notifier
              </button>
            </form>
          </div>
        ) : (
          <div className={styles.notifySuccess}>
            ✅ Parfait ! Tu seras notifié dès le lancement du Fandom 🎌
          </div>
        )}

        {/* Back link */}
        <Link to="/" className={styles.backLink}>← Retour à l'accueil</Link>
      </div>
    </div>
  )
}