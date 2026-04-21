// src/pages/Home/sections/Services.jsx
import { Shield, Swords, Crown, Check, Star, Sparkles } from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import styles from './Services.module.css'

const PACKS = [
  {
    id: 'genin',
    Icon: Shield,
    nameF: 'GENIN',
    nameE: 'GENIN',
    price: '85 000',
    tone: 'green',
    descFr: 'Pack idéal pour petits comités (5-12 personnes). Durée 45 min. Décoration légère + 3 goodies.',
    descEn: 'Ideal pack for small groups (5-12 people). 45 min. Light decoration + 3 goodies.',
    featuresF: ['Décoration 1 mur thématique', '3 Goodies personnalisés', 'Cocktail Otaku x1', 'Photo backdrop', 'Durée 45 min'],
    featuresE: ['1 themed wall decoration', '3 personalized goodies', '1 Otaku cocktail', 'Photo backdrop', '45 min duration'],
  },
  {
    id: 'chunin',
    Icon: Swords,
    nameF: 'CHŪNIN',
    nameE: 'CHUNIN',
    price: '200 000',
    tone: 'accent',
    featured: true,
    descFr: "Pour salons, jardins et petites salles de fête. 2h15 d'immersion totale.",
    descEn: 'For living rooms, gardens, small halls. 2h15 total immersion.',
    featuresF: ['Décoration 3 murs complets', '10 Goodies premium', 'Bar mobile Otaku Pulse', 'Mixologue 2h15', 'Kakemono entrée'],
    featuresE: ['3 full decorated walls', '10 premium goodies', 'Otaku Pulse mobile bar', 'Mixologist for 2h15', 'Entrance banner'],
  },
  {
    id: 'hokage',
    Icon: Crown,
    nameF: 'HOKAGE',
    nameE: 'HOKAGE',
    price: '450 000',
    tone: 'gold',
    descFr: "L'expérience ultime. Tente complète, 80+ invités, 4h d'immersion.",
    descEn: 'The ultimate experience. Full tent, 80+ guests, 4h immersion.',
    featuresF: ['Tente thématique complète', '30 Goodies collector', 'Bar & Mixologue 4h', 'Mapping vidéo', 'DJ Anime set', 'Photo & vidéo inclus'],
    featuresE: ['Full themed tent', '30 collector goodies', 'Bar & Mixologist for 4h', 'Video mapping', 'Anime DJ set', 'Photo & video included'],
  },
]

export default function Services() {
  const { lang } = useLang()

  const goToContact = (id) => {
    sessionStorage.setItem('selected_pack', id)
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="services" className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <div className={styles.tag}>
            <Sparkles size={14} strokeWidth={2.3} />
            <span>{lang === 'fr' ? 'Nos Formules' : 'Our Packages'}</span>
          </div>

          <h2 className={styles.title}>
            {lang === 'fr' ? 'NOS ' : 'OUR '}
            <span className={styles.accent}>PACKS</span>
          </h2>

          <p className={styles.subtitle}>
            {lang === 'fr'
              ? 'Trois formules pour trois niveaux d\'immersion. Choisis ton rang.'
              : 'Three packages for three immersion levels. Choose your rank.'}
          </p>
        </div>

        <div className={styles.grid}>
          {PACKS.map((pack) => {
            const Icon = pack.Icon
            const features = lang === 'fr' ? pack.featuresF : pack.featuresE

            return (
              <article
                key={pack.id}
                className={`${styles.card} ${pack.featured ? styles.featured : ''} ${styles[`tone_${pack.tone}`]}`}
              >
                {pack.featured && (
                  <div className={styles.featBadge}>
                    <Star size={12} strokeWidth={2.5} />
                    <span>{lang === 'fr' ? 'POPULAIRE' : 'POPULAR'}</span>
                  </div>
                )}

                <div className={styles.cardTop}>
                  <div className={styles.iconWrap}>
                    <Icon size={32} strokeWidth={2} />
                  </div>

                  <h3 className={styles.packName}>{pack.nameF}</h3>

                  <div className={styles.price}>
                    {pack.price}
                    <small>FCFA</small>
                  </div>
                </div>

                <p className={styles.desc}>{lang === 'fr' ? pack.descFr : pack.descEn}</p>

                <ul className={styles.features}>
                  {features.map((f, i) => (
                    <li key={i}>
                      <span className={styles.checkIcon}>
                        <Check size={14} strokeWidth={3} />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button className={styles.cta} onClick={() => goToContact(pack.id)}>
                  {lang === 'fr' ? 'Choisir ce pack' : 'Choose this pack'}
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}