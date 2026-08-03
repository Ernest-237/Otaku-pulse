// src/pages/Poles/index.jsx — Hub "Nos Pôles" (inspiré d'otakukamer.com/#poles)
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, ShoppingBag, BookOpen, Gamepad2, Newspaper, ArrowRight } from 'lucide-react'
import { useLang } from '../../contexts/LangContext'
import Navbar from '../../components/Navbar'
import Footer from '../Home/sections/Footer'
import styles from './Poles.module.css'

const POLES = [
  {
    icon: Ticket, path: '/membership', color: '#22c55e',
    titleF: 'Billetterie & Carte Membre', titleE: 'Ticketing & Membership',
    descF: 'Réserve ta place aux événements et débloque des avantages exclusifs avec la carte membre annuelle.',
    descE: 'Book your spot at events and unlock exclusive perks with the annual membership card.',
  },
  {
    icon: ShoppingBag, path: '/boutique', color: '#3b82f6',
    titleF: 'Boutique', titleE: 'Shop',
    descF: 'Goodies, posters, mangas et accessoires collectors livrés partout au Cameroun.',
    descE: 'Goodies, posters, manga and collector accessories delivered across Cameroon.',
  },
  {
    icon: BookOpen, path: '/manga', color: '#7c3aed',
    titleF: 'Manga', titleE: 'Manga',
    descF: 'Lis en ligne, suis le planning des sorties et soutiens les créateurs locaux.',
    descE: 'Read online, follow the release schedule and support local creators.',
  },
  {
    icon: Gamepad2, path: '/fandom', color: '#ec4899',
    titleF: 'Fandom', titleE: 'Fandom',
    descF: 'Cosplay, quizz otaku et classements — l\'espace communauté d\'Otaku Pulse.',
    descE: 'Cosplay, otaku quizzes and leaderboards — the Otaku Pulse community space.',
  },
  {
    icon: Newspaper, path: '/blog', color: '#f97316',
    titleF: 'Blog & Actus', titleE: 'Blog & News',
    descF: 'Annonces, promos et actualités de la culture otaku au Cameroun.',
    descE: 'Announcements, promos and otaku culture news in Cameroon.',
  },
]

export default function PolesPage() {
  const { lang } = useLang()
  const navigate = useNavigate()

  useEffect(() => { document.title = '🎫 Nos Pôles — Otaku Pulse' }, [])

  return (
    <div className={styles.page}>
      <Navbar />

      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className="container">
          <span className={styles.badge}>🎫 {lang === 'fr' ? 'NOS PÔLES' : 'OUR POLES'}</span>
          <h1 className={styles.title}>
            {lang === 'fr' ? 'TOUT OTAKU PULSE' : 'ALL OF OTAKU PULSE'}
            <br /><span className={styles.accent}>{lang === 'fr' ? 'EN UN SEUL ENDROIT' : 'IN ONE PLACE'}</span>
          </h1>
          <p className={styles.sub}>
            {lang === 'fr'
              ? 'Billetterie, boutique, manga, communauté, actus — chaque pôle rassemble un pan de la culture otaku au Cameroun.'
              : 'Ticketing, shop, manga, community, news — each pole brings together a piece of otaku culture in Cameroon.'}
          </p>
        </div>
      </section>

      <div className="container">
        <div className={styles.grid}>
          {POLES.map((p, i) => {
            const Icon = p.icon
            return (
              <button key={i} className={styles.card} style={{ '--pc': p.color }} onClick={() => navigate(p.path)}>
                <div className={styles.cardIcon}><Icon size={26} strokeWidth={2.1} /></div>
                <h3 className={styles.cardTitle}>{lang === 'fr' ? p.titleF : p.titleE}</h3>
                <p className={styles.cardDesc}>{lang === 'fr' ? p.descF : p.descE}</p>
                <span className={styles.cardCta}>
                  {lang === 'fr' ? 'Découvrir' : 'Discover'} <ArrowRight size={14} strokeWidth={2.3} />
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <Footer />
    </div>
  )
}
