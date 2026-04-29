// src/pages/Manga/index.jsx — Placeholder catalogue (Étape 1)
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Sparkles, Crown, Clock, Users, ArrowRight, Pen } from 'lucide-react'
import { useLang } from '../../contexts/LangContext'
import { useAuth } from '../../contexts/AuthContext'
import { mangaApi } from '../../api'
import Navbar from '../../components/Navbar'
import Footer from '../Home/sections/Footer'
import { useApi } from '../../hooks/useApi'
import styles from './Manga.module.css'

const copy = {
  fr: {
    title: 'Otaku Pulse Manga',
    badge: 'BIENTÔT DISPONIBLE',
    h1part1: 'PLONGE DANS',
    h1part2: 'L\'UNIVERS',
    h1accent: 'MANGA',
    sub: "La première plateforme de lecture manga camerounaise. Découvre, lis et soutiens les créateurs locaux et internationaux. Lecture illimitée à partir de 200 FCFA.",
    cta: 'Voir les abonnements',
    becomePub: 'Devenir éditeur',
    feat1Title: 'Catalogue immersif',
    feat1Desc: 'Des centaines de mangas en français et anglais, du shōnen aux webtoons.',
    feat2Title: 'Lecture fluide',
    feat2Desc: 'Mode vertical webtoon, reprise automatique, optimisé mobile et desktop.',
    feat3Title: 'Soutiens les éditeurs',
    feat3Desc: 'Abonnement à partir de 200 FCFA — directement vers les créateurs locaux.',
    plansTitle: 'Plans pensés pour le Cameroun',
    soonStats: 'Mangas en attente',
    bottomTitle: 'Tu es créateur de manga ?',
    bottomSub: 'Rejoins notre programme éditeur et publie tes œuvres sur la première plateforme manga du Cameroun.',
    bottomCta: 'Postuler maintenant',
    workInProgress: 'Plateforme en construction',
    workSub: 'Le catalogue ouvre très bientôt. Restes connecté !',
  },
  en: {
    title: 'Otaku Pulse Manga',
    badge: 'COMING SOON',
    h1part1: 'DIVE INTO',
    h1part2: 'THE MANGA',
    h1accent: 'UNIVERSE',
    sub: "Cameroon's first manga reading platform. Discover, read and support local and international creators. Unlimited reading from 200 FCFA.",
    cta: 'View plans',
    becomePub: 'Become publisher',
    feat1Title: 'Immersive catalog',
    feat1Desc: 'Hundreds of manga in French and English, from shōnen to webtoons.',
    feat2Title: 'Smooth reading',
    feat2Desc: 'Vertical webtoon mode, auto-resume, mobile and desktop optimized.',
    feat3Title: 'Support publishers',
    feat3Desc: 'Subscription from 200 FCFA — direct support to local creators.',
    plansTitle: 'Plans designed for Cameroon',
    soonStats: 'Manga pending',
    bottomTitle: 'Are you a manga creator?',
    bottomSub: 'Join our publisher program and release your work on Cameroon\'s first manga platform.',
    bottomCta: 'Apply now',
    workInProgress: 'Platform under construction',
    workSub: 'The catalog opens very soon. Stay tuned!',
  },
}

const PLANS = [
  { id: 'daily',   labelF: 'Day Pass',    labelE: 'Day Pass',    duration: '24h',     price: 200,   accent: false },
  { id: 'weekly',  labelF: 'Hebdo',       labelE: 'Weekly',      duration: '7 jours', price: 500,   accent: false },
  { id: 'monthly', labelF: 'Mensuel',     labelE: 'Monthly',     duration: '30 jours',price: 1500,  accent: true  },
  { id: 'yearly',  labelF: 'Annuel',      labelE: 'Yearly',      duration: '365 jours',price: 10000,accent: false },
]

export default function MangaPage() {
  const { lang } = useLang()
  const t = copy[lang]
  const { user } = useAuth()

  useEffect(() => { document.title = `📚 ${t.title} — Otaku Pulse` }, [t.title])

  const { data } = useApi(() => mangaApi.getAll({ limit: 1 }), [], true)
  const totalPending = data?.total ?? 0

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroGrid} />
        <div className="container">
          <div className={styles.heroInner}>
            <span className={styles.badge}>
              <Sparkles size={12} /> {t.badge}
            </span>
            <h1 className={styles.h1}>
              <span>{t.h1part1}</span>
              <span>{t.h1part2}</span>
              <span className={styles.h1accent}>{t.h1accent}</span>
            </h1>
            <p className={styles.sub}>{t.sub}</p>
            <div className={styles.heroCtas}>
              <a href="#plans" className={styles.btnPrimary}>
                <Crown size={16} /> {t.cta}
              </a>
              <Link to="/manga" className={styles.btnGhost}>
                <Pen size={16} /> {t.becomePub}
              </Link>
            </div>

            {/* Stats / Status bar */}
            <div className={styles.statusBar}>
              <div className={styles.statusDot} />
              <div className={styles.statusText}>
                <strong>{t.workInProgress}</strong>
                <span>{t.workSub}</span>
              </div>
              <div className={styles.statusCount}>
                <span className={styles.countNum}>{totalPending}</span>
                <span className={styles.countLbl}>{t.soonStats}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.featuresGrid}>
            <div className={styles.feature}>
              <div className={styles.featIcon}><BookOpen size={26} /></div>
              <h3 className={styles.featTitle}>{t.feat1Title}</h3>
              <p className={styles.featDesc}>{t.feat1Desc}</p>
            </div>
            <div className={`${styles.feature} ${styles.featureHighlight}`}>
              <div className={styles.featIcon}><Sparkles size={26} /></div>
              <h3 className={styles.featTitle}>{t.feat2Title}</h3>
              <p className={styles.featDesc}>{t.feat2Desc}</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featIcon}><Users size={26} /></div>
              <h3 className={styles.featTitle}>{t.feat3Title}</h3>
              <p className={styles.featDesc}>{t.feat3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANS PREVIEW ── */}
      <section id="plans" className={styles.plansSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>{t.plansTitle}</h2>
          <div className={styles.plansGrid}>
            {PLANS.map(p => (
              <div key={p.id} className={`${styles.planCard} ${p.accent ? styles.planAccent : ''}`}>
                {p.accent && <div className={styles.planRibbon}>POPULAIRE</div>}
                <div className={styles.planLabel}>{lang === 'fr' ? p.labelF : p.labelE}</div>
                <div className={styles.planDuration}>{p.duration}</div>
                <div className={styles.planPriceWrap}>
                  <span className={styles.planPrice}>{p.price.toLocaleString()}</span>
                  <span className={styles.planCurrency}>FCFA</span>
                </div>
                <div className={styles.planSoon}>
                  <Clock size={12} /> {lang === 'fr' ? 'Ouverture imminente' : 'Coming soon'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA — Devenir éditeur ── */}
      <section className={styles.bottomCta}>
        <div className="container">
          <div className={styles.bottomCard}>
            <div className={styles.bottomLeft}>
              <span className={styles.bottomBadge}><Pen size={11} /> ÉDITEURS</span>
              <h2 className={styles.bottomTitle}>{t.bottomTitle}</h2>
              <p className={styles.bottomSub}>{t.bottomSub}</p>
            </div>
            <div className={styles.bottomRight}>
              <a href="https://wa.me/237675712739?text=Je%20souhaite%20devenir%20%C3%A9diteur%20manga%20sur%20Otaku%20Pulse"
                target="_blank" rel="noreferrer"
                className={styles.btnPrimary}>
                {t.bottomCta} <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}