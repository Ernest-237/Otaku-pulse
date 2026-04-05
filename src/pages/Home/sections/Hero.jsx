import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  FileText,
  MapPin,
  PlayCircle,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import { API_BASE } from '../../../api'
import styles from './Hero.module.css'

const HERO_DEFAULT = {
  taglineF: 'Goodies Anime · Livraison Cameroun',
  taglineE: 'Anime Goods · Cameroon Delivery',
  line1F: "VIVEZ L'EXPÉRIENCE",
  line1E: 'LIVE THE EXPERIENCE',
  line2F: 'AU-DELÀ DE',
  line2E: 'BEYOND THE',
  accentF: "L'ÉCRAN",
  accentE: 'THE SCREEN',
  subtitleF:
    'Premier service de goodies Otaku au Cameroun. Mangas, posters, accessoires et articles collectors livrés chez toi à Yaoundé, Douala et Bafoussam.',
  subtitleE:
    'First Otaku goods service in Cameroon. Manga, posters, accessories and collector items delivered to Yaoundé, Douala and Bafoussam.',
  bgImageUrl: '',
  bgImageData: null,
  bgImageMime: null,
}

const HERO_IMAGE = '/assets/hero/flowers.jpg'
const HERO_GIF = '/assets/hero/follow.gif'

const QUICK_TAGS = ['Naruto', 'One Piece', 'Demon Slayer', 'Posters', 'Stickers']

const SITE_PAGES = [
  {
    keywords: ['boutique', 'shop', 'produit', 'article', 'acheter', 'achat', 'goodies'],
    path: '/boutique',
    label: 'Boutique goodies',
    icon: ShoppingBag,
  },
  {
    keywords: ['événement', 'event', 'réserver', 'reservation', 'fête', 'anniversaire', 'pack'],
    path: '/reservation',
    label: 'Réserver un événement',
    icon: CalendarDays,
  },
  {
    keywords: ['fandom', 'communauté', 'community', 'quiz', 'classement'],
    path: '/fandom',
    label: 'Espace fandom',
    icon: Star,
  },
  {
    keywords: ['blog', 'actus', 'news', 'promo'],
    path: '/blog',
    label: 'Blog & actus',
    icon: FileText,
  },
  {
    keywords: ['contact', 'whatsapp', 'appeler', 'appel'],
    path: '/#footer',
    label: 'Nous contacter',
    icon: MapPin,
  },
  {
    keywords: ['membership', 'membre', 'carte', 'abonnement', 'basic', 'plus', 'elite'],
    path: '/membership',
    label: 'Carte membre',
    icon: Sparkles,
  },
  {
    keywords: ['legal', 'cgv', 'politique', 'confidentialité', 'droits'],
    path: '/legal',
    label: 'Droits & politique',
    icon: FileText,
  },
  {
    keywords: ['profil', 'compte', 'panier', 'commande', 'suivi'],
    path: '/profil',
    label: 'Mon profil',
    icon: FileText,
  },
  {
    keywords: ['naruto', 'one piece', 'demon slayer', 'jujutsu', 'dragon ball', 'bleach', 'titan', 'hero academia'],
    path: '/boutique',
    label: 'Boutique anime',
    icon: ShoppingBag,
  },
]

export default function Hero() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const [hero, setHero] = useState(HERO_DEFAULT)
  const [search, setSearch] = useState('')
  const [focused, setFocused] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const searchRef = useRef(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/hero?_=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.hero) setHero((prev) => ({ ...HERO_DEFAULT, ...d.hero }))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!search.trim() || search.length < 2) {
      setSuggestions([])
      return
    }

    const q = search.toLowerCase()
    const matches = SITE_PAGES.filter((p) =>
      p.keywords.some((k) => k.includes(q) || q.includes(k))
    )

    setSuggestions(matches.slice(0, 4))
  }, [search])

  const handleSearch = (e) => {
    e?.preventDefault()
    const q = search.trim()
    if (!q) return

    const pageMatch = SITE_PAGES.find((p) =>
      p.keywords.some((k) => k.includes(q.toLowerCase()) || q.toLowerCase().includes(k))
    )

    if (pageMatch && !q.match(/^[a-z]{2,}$/)) {
      navigate(pageMatch.path === '/boutique' ? `/boutique?q=${encodeURIComponent(q)}` : pageMatch.path)
    } else {
      navigate(`/boutique?q=${encodeURIComponent(q)}`)
    }

    setSuggestions([])
  }

  const h = hero
  const stats = [
    { val: '50+', fr: 'Thèmes anime', en: 'Anime themes' },
    { val: '200+', fr: 'Clients heureux', en: 'Happy clients' },
    { val: '3', fr: 'Villes livrées', en: 'Cities covered' },
    { val: '4.9', fr: 'Note clients', en: 'Customer rating' },
  ]

  const bgImg = h.bgImageData && h.bgImageMime
    ? `data:${h.bgImageMime};base64,${h.bgImageData}`
    : h.bgImageUrl?.trim() || null

  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.bgDecor} />

      <div className={`container ${styles.heroInner}`}>
        <div className={styles.left}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            <Sparkles size={14} strokeWidth={2.2} />
            <span>{lang === 'fr' ? h.taglineF : h.taglineE}</span>
          </div>

          <h1 className={styles.title}>
            <span className={styles.titleLine1}>{lang === 'fr' ? h.line1F : h.line1E}</span>
            <span className={styles.titleLine2}>{lang === 'fr' ? h.line2F : h.line2E}</span>
            <span className={styles.titleAccent}>{lang === 'fr' ? h.accentF : h.accentE}</span>
          </h1>

          <p className={styles.subtitle}>{lang === 'fr' ? h.subtitleF : h.subtitleE}</p>

          <div className={styles.searchWrap}>
            <form className={`${styles.searchBar} ${focused ? styles.searchFocused : ''}`} onSubmit={handleSearch}>
              <span className={styles.searchIcon}>
                <Search size={18} strokeWidth={2.3} />
              </span>

              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => {
                  setFocused(false)
                  setSuggestions([])
                }, 150)}
                placeholder={lang === 'fr' ? 'Rechercher goodies, pages, animes...' : 'Search goods, pages, anime...'}
                className={styles.searchInput}
                autoComplete="off"
              />

              <button type="submit" className={styles.searchBtn}>
                <Search size={16} strokeWidth={2.3} />
                <span>{lang === 'fr' ? 'Chercher' : 'Search'}</span>
              </button>
            </form>

            {suggestions.length > 0 && focused && (
              <div className={styles.suggestions}>
                {suggestions.map((s, i) => {
                  const Icon = s.icon
                  return (
                    <button
                      key={i}
                      type="button"
                      className={styles.suggestionItem}
                      onMouseDown={() => {
                        navigate(s.path.includes('/boutique') && search ? `/boutique?q=${encodeURIComponent(search)}` : s.path)
                        setSuggestions([])
                      }}
                    >
                      <span className={styles.suggestionIcon}>
                        <Icon size={16} strokeWidth={2.2} />
                      </span>
                      <span className={styles.suggestionLabel}>{s.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className={styles.searchTags}>
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                className={styles.searchTag}
                onClick={() => {
                  setSearch(tag)
                  navigate(`/boutique?q=${encodeURIComponent(tag)}`)
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className={styles.ctas}>
            <button className={styles.ctaPrimary} onClick={() => navigate('/reservation')}>
              <CalendarDays size={18} strokeWidth={2.2} />
              <span>{lang === 'fr' ? 'Préparer mon événement' : 'Book my event'}</span>
            </button>

            <button className={styles.ctaSecondary} onClick={() => navigate('/boutique')}>
              <ShoppingBag size={18} strokeWidth={2.2} />
              <span>{lang === 'fr' ? 'Aller à la boutique' : 'Go to shop'}</span>
            </button>
          </div>

          <div className={styles.stats}>
            {stats.map((s, i) => (
              <div key={i} className={styles.stat}>
                <span className={styles.statVal}>{s.val}</span>
                <span className={styles.statLbl}>{lang === 'fr' ? s.fr : s.en}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.mainImgFrame}>
            {bgImg ? (
              <img
                src={bgImg}
                alt="Otaku Pulse"
                className={styles.mainImg}
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            ) : (
              <img
                src={HERO_IMAGE}
                alt="Otaku Pulse"
                className={styles.mainImg}
                onError={(e) => {
                  e.target.parentElement.classList.add(styles.imgFallback)
                }}
              />
            )}

            <div className={styles.imgOverlay} />

            <div className={styles.imgBadge}>
              <MapPin size={14} strokeWidth={2.3} />
              <span>Cameroun</span>
            </div>
          </div>

          <div className={styles.gifFrame}>
            <div className={styles.gifLabel}>
              <span className={styles.gifDot} />
              <span>{lang === 'fr' ? 'Saison en cours' : 'Current season'}</span>
            </div>

            <div className={styles.gifContent}>
              <img
                src={HERO_GIF}
                alt="Saison Otaku Pulse"
                className={styles.gifImg}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />

              <div className={styles.gifFallbackContent} style={{ display: 'none' }}>
                <PlayCircle size={36} strokeWidth={2.1} />
                <span className={styles.gifFallbackText}>
                  {lang === 'fr' ? 'Ajoute ton GIF saisonnier ici' : 'Add your seasonal GIF here'}
                </span>
                <code>/assets/hero/seasonal.gif</code>
              </div>
            </div>
          </div>

          <div className={styles.deco1}><Sparkles size={18} strokeWidth={2.2} /></div>
          <div className={styles.deco2}><Zap size={18} strokeWidth={2.2} /></div>
          <div className={styles.deco3}><Star size={16} strokeWidth={2.2} /></div>
        </div>
      </div>
    </section>
  )
}

