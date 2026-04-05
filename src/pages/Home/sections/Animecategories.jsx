import {
  Anchor,
  ArrowRight,
  BookOpen,
  Flame,
  Gamepad2,
  Gift,
  Images,
  Palette,
  ScrollText,
  Shield,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import styles from './AnimeCategories.module.css'

const ANIMES = [
  { name: 'Naruto', icon: Flame },
  { name: 'Demon Slayer', icon: Shield },
  { name: 'One Piece', icon: Anchor },
  { name: 'Jujutsu Kaisen', icon: Sparkles },
  { name: 'Dragon Ball Z', icon: Zap },
  { name: 'Attack on Titan', icon: Shield },
  { name: 'Bleach', icon: Star },
  { name: 'My Hero Academia', icon: Sparkles },
]

const PROMO_BANNERS = [
  {
    titleFr: 'COLLECTION GOODIES',
    titleEn: 'GOODS COLLECTION',
    value: '10-50%',
    icon: Gift,
  },
  {
    titleFr: 'POSTERS & ART',
    titleEn: 'POSTERS & ART',
    value: '20%',
    icon: Images,
  },
]

const DECORATIVE_ICONS = [ScrollText, BookOpen, Palette, Gamepad2]

export default function AnimeCategories() {
  const { lang } = useLang()

  return (
    <section id="services" className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <div className={styles.tag}>
            <Sparkles size={14} strokeWidth={2.2} />
            <span>{lang === 'fr' ? 'Univers Anime' : 'Anime Universe'}</span>
          </div>

          <h2 className={styles.title}>
            {lang === 'fr' ? 'EXPLORE NOS ' : 'EXPLORE OUR '}
            <span className={styles.accent}>{lang === 'fr' ? 'UNIVERS' : 'UNIVERSES'}</span>
          </h2>

          <p className={styles.subtitle}>
            {lang === 'fr'
              ? 'Goodies, posters et accessoires classés par univers anime'
              : 'Goods, posters and accessories sorted by anime universe'}
          </p>
        </div>

        <div className={styles.mainGrid}>
          <div className={styles.heroBanner}>
            <div className={styles.heroBannerInner}>
              <div className={styles.heroBannerIcon}>
                <Gift size={34} strokeWidth={2} />
              </div>

              <div className={styles.heroBannerTag}>
                {lang === 'fr' ? 'COLLECTION ANIME' : 'ANIME COLLECTION'}
              </div>

              <h3 className={styles.heroBannerTitle}>
                {lang === 'fr' ? 'Goodies & Figurines' : 'Goods & Figures'}
              </h3>

              <div className={styles.heroBannerDiscount}>
                <span className={styles.pct}>10-50</span>
                <span className={styles.pctOff}>% OFF</span>
              </div>

              <button
                className={styles.exploreBtn}
                onClick={() => document.getElementById('boutique')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <span>{lang === 'fr' ? 'EXPLORER' : 'EXPLORE'}</span>
                <ArrowRight size={16} strokeWidth={2.4} />
              </button>
            </div>

            {DECORATIVE_ICONS.map((Icon, i) => (
              <div key={i} className={styles.floatingBadge} style={{ top: `${14 + i * 18}%`, right: `${8 + (i % 2) * 12}%` }}>
                <Icon size={18} strokeWidth={2.2} />
              </div>
            ))}
          </div>

          <div className={styles.promoCols}>
            {PROMO_BANNERS.map((b, i) => {
              const Icon = b.icon
              return (
                <div key={i} className={styles.promoBanner}>
                  <div>
                    <div className={styles.promoTag}>{lang === 'fr' ? b.titleFr : b.titleEn}</div>
                    <div className={styles.promoPct}>
                      <span className={styles.pctBig}>{b.value.replace('%', '')}</span>
                      <span className={styles.pctSmall}>% OFF</span>
                    </div>
                  </div>

                  <div className={styles.promoIconWrap}>
                    <Icon size={28} strokeWidth={2} />
                  </div>

                  <button
                    className={styles.promoBtn}
                    onClick={() => document.getElementById('boutique')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <span>{lang === 'fr' ? 'EXPLORER' : 'EXPLORE'}</span>
                    <ArrowRight size={14} strokeWidth={2.4} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.animesBar}>
          {ANIMES.map((a, i) => {
            const Icon = a.icon
            return (
              <button
                key={i}
                className={styles.animeChip}
                onClick={() => document.getElementById('boutique')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <span className={styles.animeIcon}>
                  <Icon size={16} strokeWidth={2.3} />
                </span>
                <span className={styles.animeName}>{a.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
