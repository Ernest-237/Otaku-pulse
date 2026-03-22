// src/pages/Home/sections/Footer.jsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../../../contexts/LangContext'
import { useToast } from '../../../contexts/ToastContext'
import { newsletterApi } from '../../../api'
import styles from './Footer.module.css'

export default function Footer() {
  const { lang } = useLang()
  const toast    = useToast()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)

  const subscribe = async (e) => {
    e.preventDefault()
    if (!email.includes('@')) return
    setLoading(true)
    try {
      await newsletterApi.subscribe(email, lang)
      setEmail('')
      toast.success(lang==='fr' ? '✅ Abonnement confirmé !' : '✅ Subscribed!')
    } catch(err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>

          {/* Brand */}
          <div>
            <div className={styles.brand}>
              <span className={styles.bolt}>⚡</span>
              <div>
                <div className={styles.brandName}>OTAKU PULSE</div>
                <div className={styles.brandSub}>VIVEZ L'EXPÉRIENCE</div>
              </div>
            </div>
            <p className={styles.brandDesc}>
              {lang==='fr'
                ? 'Premier service événementiel clé en main spécialisé dans l\'immersion Otaku au Cameroun.'
                : 'First all-inclusive Otaku event service in Cameroon.'}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className={styles.colTitle}>{lang==='fr' ? 'Navigation' : 'Navigation'}</h4>
            <div className={styles.links}>
              {['/', '/blog', '/profil'].map((h, i) => (
                <Link key={i} to={h} className={styles.link}>
                  {[lang==='fr'?'Accueil':'Home', 'Blog', lang==='fr'?'Mon Profil':'My Profile'][i]}
                </Link>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className={styles.colTitle}>{lang==='fr' ? 'Newsletter' : 'Newsletter'}</h4>
            <p className={styles.nlDesc}>{lang==='fr' ? 'Promos et actus en avant-première.' : 'Promos and news first.'}</p>
            <form onSubmit={subscribe} className={styles.nlForm}>
              <input
                type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="ton@email.com" className={styles.nlInput}
              />
              <button type="submit" className={styles.nlBtn} disabled={loading}>
                {loading ? '...' : '⚡'}
              </button>
            </form>
          </div>
        </div>

        <div className={styles.bottom}>
          <span>© 2026 Otaku Pulse — Yaoundé, Cameroun 🇨🇲</span>
          <span style={{ color:'rgba(240,253,244,.3)', fontSize:'.75rem' }}>v1.0.0 · Built with ⚡ React</span>
        </div>
      </div>
    </footer>
  )
}