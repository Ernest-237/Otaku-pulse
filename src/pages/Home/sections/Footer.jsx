import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Camera,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  MessagesSquare,
  Phone,
  Play,
  Send,
  Zap,
} from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import { useToast } from '../../../contexts/ToastContext'
import { newsletterApi } from '../../../api'
import styles from './Footer.module.css'

const SOCIALS = [
  { name: 'Facebook', href: 'https://facebook.com/otakupulse', icon: <MessagesSquare size={18} strokeWidth={2.1} /> },
  { name: 'Instagram', href: 'https://instagram.com/otakupulse', icon: <Camera size={18} strokeWidth={2.1} /> },
  { name: 'TikTok', href: 'https://tiktok.com/@otakupulse', icon: <Play size={18} strokeWidth={2.1} /> },
  { name: 'WhatsApp', href: 'https://wa.me/+237675712739', icon: <MessageCircle size={18} strokeWidth={2.1} /> },
]

export default function Footer() {
  const { lang } = useLang()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const subscribe = async () => {
    if (!email || !email.includes('@')) {
      toast.error(lang === 'fr' ? 'Email invalide' : 'Invalid email')
      return
    }

    setLoading(true)
    try {
      await newsletterApi.subscribe(email, lang)
      setEmail('')
      toast.success(lang === 'fr' ? 'Inscription newsletter validée' : 'Newsletter subscription confirmed')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.topSection}>
        <div className="container">
          <div className={styles.grid}>
            <div className={styles.brand}>
              <div className={styles.logo}>
                <span className={styles.logoBolt}>
                  <Zap size={18} strokeWidth={2.3} />
                </span>
                <div>
                  <div className={styles.logoName}>OTAKU PULSE</div>
                  <div className={styles.logoSub}>VIVEZ L&apos;EXPÉRIENCE</div>
                </div>
              </div>

              <p className={styles.brandDesc}>
                {lang === 'fr'
                  ? 'Premier service de goodies Otaku au Cameroun. Livraison à Yaoundé, Douala.'
                  : 'First Otaku goods service in Cameroon. Delivery in Yaoundé, Douala.'}
              </p>

              <div className={styles.socials}>
                {SOCIALS.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.socialBtn}
                    aria-label={s.name}
                    title={s.name}
                  >
                    <span className={styles.socialIcon}>{s.icon}</span>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className={styles.colTitle}>{lang === 'fr' ? 'Navigation' : 'Navigation'}</h4>
              <ul className={styles.linkList}>
                <li><Link to="/">{lang === 'fr' ? 'Accueil' : 'Home'}</Link></li>
                <li><Link to="/boutique">{lang === 'fr' ? 'Boutique' : 'Shop'}</Link></li>
                <li><Link to="/reservation">{lang === 'fr' ? 'Réserver un événement' : 'Book an event'}</Link></li>
                <li><Link to="/blog">{lang === 'fr' ? 'Blog & Actus' : 'Blog & News'}</Link></li>
                <li><Link to="/profil">{lang === 'fr' ? 'Mon compte' : 'My Account'}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className={styles.colTitle}>{lang === 'fr' ? 'Contact' : 'Contact'}</h4>
              <ul className={styles.contactList}>
                <li><Mail size={16} strokeWidth={2.1} /> contact@otaku-pulse.com</li>
                <li><Phone size={16} strokeWidth={2.1} /> +237675712739</li>
                <li><MessageCircle size={16} strokeWidth={2.1} /> WhatsApp disponible</li>
                <li><MapPin size={16} strokeWidth={2.1} /> Yaoundé · Douala</li>
                <li><Clock3 size={16} strokeWidth={2.1} /> Lun–Sam : 8h–20h</li>
              </ul>
            </div>

            <div>
              <h4 className={styles.colTitle}>Newsletter</h4>
              <p className={styles.newsletterDesc}>
                {lang === 'fr'
                  ? 'Reçois nos promos et actus Otaku en avant-première.'
                  : 'Get our Otaku promos and news first.'}
              </p>

              <div className={styles.newsletterForm}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={lang === 'fr' ? 'ton@email.com' : 'your@email.com'}
                  className={styles.newsletterInput}
                  onKeyDown={(e) => e.key === 'Enter' && subscribe()}
                />
                <button onClick={subscribe} disabled={loading} className={styles.newsletterBtn} type="button">
                  <Send size={16} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className="container">
          <div className={styles.bottomInner}>
            <span className={styles.copyright}>
              © {new Date().getFullYear()} Otaku Pulse — {lang === 'fr' ? 'Tous droits réservés' : 'All rights reserved'}
            </span>

            <div className={styles.legalLinks}>
              <Link to="/legal">{lang === 'fr' ? 'Droits & Politique' : 'Rights & Policy'}</Link>
              <span>·</span>
              <Link to="/legal#privacy">{lang === 'fr' ? 'Confidentialité' : 'Privacy'}</Link>
              <span>·</span>
              <Link to="/legal#cgv">{lang === 'fr' ? 'CGV' : 'Terms'}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
