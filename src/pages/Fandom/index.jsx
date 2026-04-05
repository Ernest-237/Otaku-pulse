import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  Flame,
  MessageCircle,
  Palette,
  Sparkles,
  Target,
  Trophy,
  Users,
  Zap,
  Package,
} from 'lucide-react'
import { useLang } from '../../contexts/LangContext'
import { useToast } from '../../contexts/ToastContext'
import { newsletterApi } from '../../api'
import Navbar from '../../components/Navbar'
import styles from './Fandom.module.css'

const I18N = {
  fr: {
    badge: 'BIENTÔT DISPONIBLE',
    title: 'FANDOM OTAKU',
    subtitle: 'Un espace dédié aux fans otaku du Cameroun. Communauté, quiz, classements, discussions et bien plus encore.',
    launchIn: 'LANCEMENT DANS',
    days: 'Jours',
    hours: 'Heures',
    mins: 'Min',
    secs: 'Sec',
    notifyText: 'Sois le premier à être notifié du lancement !',
    placeholder: 'ton@email.com',
    notifyBtn: 'Me notifier',
    notifySuccess: 'Parfait ! Tu seras notifié dès le lancement du Fandom.',
    back: "Retour à l'accueil",
    invalidEmail: 'Adresse email invalide.',
    subscribeOk: 'Inscription enregistrée.',
    char1: 'Satoru Gojo',
    char1s: 'Jujutsu Kaisen',
    char2: 'Yuta Okkotsu',
    char2s: 'Jujutsu Kaisen 0',
    char3: 'Naruto Uzumaki',
    char3s: 'Naruto Shippuden',
    feature1: 'Classements',
    feature1d: 'Ranke tes univers préférés',
    feature2: 'Discussions',
    feature2d: 'Partage théories et avis',
    feature3: 'Quiz Otaku',
    feature3d: 'Teste ta culture anime',
    feature4: 'Fan Art',
    feature4d: 'Expose tes créations',
    feature5: 'Deals exclusifs',
    feature5d: 'Promos réservées aux membres',
    feature6: 'Communauté',
    feature6d: 'Retrouve les otakus du Cameroun',
  },
  en: {
    badge: 'COMING SOON',
    title: 'OTAKU FANDOM',
    subtitle: 'A dedicated space for otaku fans in Cameroon. Community, quizzes, rankings, discussions and much more.',
    launchIn: 'LAUNCHING IN',
    days: 'Days',
    hours: 'Hours',
    mins: 'Min',
    secs: 'Sec',
    notifyText: 'Be the first to get notified when it launches!',
    placeholder: 'your@email.com',
    notifyBtn: 'Notify me',
    notifySuccess: 'Perfect! You will be notified as soon as Fandom launches.',
    back: 'Back to home',
    invalidEmail: 'Invalid email address.',
    subscribeOk: 'Subscription saved.',
    char1: 'Satoru Gojo',
    char1s: 'Jujutsu Kaisen',
    char2: 'Yuta Okkotsu',
    char2s: 'Jujutsu Kaisen 0',
    char3: 'Naruto Uzumaki',
    char3s: 'Naruto Shippuden',
    feature1: 'Rankings',
    feature1d: 'Rank your favorite universes',
    feature2: 'Discussions',
    feature2d: 'Share theories and opinions',
    feature3: 'Otaku Quiz',
    feature3d: 'Test your anime knowledge',
    feature4: 'Fan Art',
    feature4d: 'Show your creations',
    feature5: 'Exclusive deals',
    feature5d: 'Member-only promos',
    feature6: 'Community',
    feature6d: 'Meet otakus in Cameroon',
  },
}

export default function FandomPage() {
  const { lang } = useLang()
  const toast = useToast()
  const T = I18N[lang]

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [typed, setTyped] = useState('')
  const fullText = T.title

  useEffect(() => {
    let i = 0
    setTyped('')

    const id = setInterval(() => {
      setTyped(fullText.slice(0, i + 1))
      i += 1
      if (i >= fullText.length) clearInterval(id)
    }, 100)

    return () => clearInterval(id)
  }, [fullText])

  const [cd, setCd] = useState({ j: 0, h: 0, m: 0, s: 0 })

  useEffect(() => {
    const target = new Date('2026-09-01T00:00:00')

    const update = () => {
      const diff = target - Date.now()
      if (diff <= 0) return
      const total = Math.floor(diff / 1000)

      setCd({
        j: Math.floor(total / 86400),
        h: Math.floor((total % 86400) / 3600),
        m: Math.floor((total % 3600) / 60),
        s: total % 60,
      })
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  const handleNotify = async (e) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      toast.error(T.invalidEmail)
      return
    }

    try {
      await newsletterApi.subscribe(email, lang)
      setSent(true)
      toast.success(T.subscribeOk)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const pad = (n) => String(n).padStart(2, '0')

  const features = [
    { icon: Trophy, title: T.feature1, desc: T.feature1d },
    { icon: MessageCircle, title: T.feature2, desc: T.feature2d },
    { icon: Target, title: T.feature3, desc: T.feature3d },
    { icon: Palette, title: T.feature4, desc: T.feature4d },
    { icon: Package, title: T.feature5, desc: T.feature5d },
    { icon: Users, title: T.feature6, desc: T.feature6d },
  ]

  const characters = [
    { icon: Zap, name: T.char1, series: T.char1s },
    { icon: Sparkles, name: T.char2, series: T.char2s },
    { icon: Flame, name: T.char3, series: T.char3s },
  ]

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.bg}>
        <div className={styles.bgOverlay} />
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className={styles.floatParticle}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
              width: `${3 + Math.random() * 5}px`,
              height: `${3 + Math.random() * 5}px`,
              opacity: 0.2 + Math.random() * 0.3,
            }}
          />
        ))}
      </div>

      <main className={styles.content}>
        <div className={styles.badge}>
          <Bell size={14} />
          <span>{T.badge}</span>
        </div>

        <h1 className={styles.title}>
          <span className={styles.titleAccent}>{typed}</span>
          <span className={styles.cursor}>|</span>
        </h1>

        <p className={styles.subtitle}>{T.subtitle}</p>

        <div className={styles.characters}>
          {characters.map((char, i) => {
            const Icon = char.icon
            return (
              <div key={char.name} className={styles.charCard} style={{ animationDelay: `${i * 0.25}s` }}>
                <div className={styles.charIconWrap}>
                  <Icon size={28} className={styles.charIcon} />
                </div>
                <div className={styles.charName}>{char.name}</div>
                <div className={styles.charSeries}>{char.series}</div>
              </div>
            )
          })}
        </div>

        <div className={styles.countdown}>
          <div className={styles.cdLabel}>{T.launchIn}</div>
          <div className={styles.cdRow}>
            {[
              { v: cd.j, l: T.days },
              { v: cd.h, l: T.hours },
              { v: cd.m, l: T.mins },
              { v: cd.s, l: T.secs },
            ].map((item) => (
              <div key={item.l} className={styles.cdItem}>
                <span className={styles.cdVal}>{pad(item.v)}</span>
                <span className={styles.cdLbl}>{item.l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.features}>
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className={styles.featureCard} style={{ animationDelay: `${i * 0.08}s` }}>
                <span className={styles.featureIconWrap}>
                  <Icon size={20} className={styles.featureIcon} />
                </span>
                <div className={styles.featureTitle}>{feature.title}</div>
                <div className={styles.featureDesc}>{feature.desc}</div>
              </div>
            )
          })}
        </div>

        {!sent ? (
          <div className={styles.notifyBox}>
            <p className={styles.notifyText}>
              <Bell size={16} />
              <span>{T.notifyText}</span>
            </p>

            <form className={styles.notifyForm} onSubmit={handleNotify}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={T.placeholder}
                className={styles.notifyInput}
                required
              />
              <button type="submit" className={styles.notifyBtn}>
                <Bell size={16} />
                <span>{T.notifyBtn}</span>
              </button>
            </form>
          </div>
        ) : (
          <div className={styles.notifySuccess}>{T.notifySuccess}</div>
        )}

        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>{T.back}</span>
        </Link>
      </main>
    </div>
  )
}
