import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, MapPin, PlayCircle, ShoppingBag, Sparkles } from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import { API_BASE } from '../../../api'
import AnimeCarousel from '../../../components/AnimeCarousel'
import styles from './Hero.module.css'

const HERO_DEFAULT = {
  taglineF: "Tente l'expérience Otaku",
  taglineE: 'Try the Otaku experience',
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

export default function Hero() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const [hero, setHero] = useState(HERO_DEFAULT)

  useEffect(() => {
    fetch(`${API_BASE}/api/hero?_=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.hero) setHero((prev) => ({ ...HERO_DEFAULT, ...d.hero }))
      })
      .catch(() => {})
  }, [])

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

          <AnimeCarousel
            variant="light"
            label={lang === 'fr' ? 'Animés du moment' : 'Right now'}
            fallback={
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
            }
          />
        </div>
      </div>
    </section>
  )
}
