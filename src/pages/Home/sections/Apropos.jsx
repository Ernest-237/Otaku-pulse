// src/pages/Home/sections/Apropos.jsx
import { useLang } from '../../../contexts/LangContext'
import styles from './Apropos.module.css'

const STORY = [
  { year:'2024', iconFr:'💡', iconEn:'💡', textFr:"L'idée naît : créer une boutique de goodies Otaku pour les fans camerounais.", textEn:"The idea is born: create an Otaku goods store for Cameroonian fans." },
  { year:'2025', iconFr:'🛒', iconEn:'🛒', textFr:"Lancement de la boutique en ligne avec posters, mangas et accessoires.", textEn:"Launch of the online store with posters, manga and accessories." },
  { year:'2026', iconFr:'🚀', iconEn:'🚀', textFr:"Expansion : Yaoundé, Douala, Bafoussam — livraison dans tout le Cameroun !", textEn:"Expansion: Yaoundé, Douala, Bafoussam — delivery across Cameroon!" },
]

export default function Apropos() {
  const { lang } = useLang()
  return (
    <section id="apropos" className={styles.section}>
      <div className="container">
        <div className={styles.inner}>
          {/* Gauche */}
          <div className={styles.left}>
            <div className={styles.tag}>✨ {lang==='fr' ? 'Notre Histoire' : 'Our Story'}</div>
            <h2 className={styles.title}>
              {lang==='fr' ? 'À PROPOS D\'' : 'ABOUT '}
              <span className={styles.accent}>OTAKU PULSE</span>
            </h2>
            <p className={styles.desc}>
              {lang==='fr'
                ? "Otaku Pulse est la première boutique de goodies anime au Cameroun. Nous livrons posters, mangas, accessoires et produits collectors directement chez les fans otaku, où qu'ils soient dans le pays."
                : "Otaku Pulse is the first anime goods store in Cameroon. We deliver posters, manga, accessories and collectibles directly to otaku fans, wherever they are in the country."}
            </p>
            <div className={styles.values}>
              {[
                { emoji:'🎌', fr:'Passion Otaku',   en:'Otaku Passion'  },
                { emoji:'🚚', fr:'Livraison rapide', en:'Fast Delivery'  },
                { emoji:'💎', fr:'Qualité premium',  en:'Premium Quality'},
                { emoji:'🤝', fr:'Partenaires locaux',en:'Local Partners'},
              ].map((v,i) => (
                <div key={i} className={styles.value}>
                  <span className={styles.valueIcon}>{v.emoji}</span>
                  <span className={styles.valueText}>{lang==='fr' ? v.fr : v.en}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Droite — Timeline */}
          <div className={styles.right}>
            <div className={styles.timeline}>
              {STORY.map((s,i) => (
                <div key={i} className={styles.timelineItem}>
                  <div className={styles.timelineYear}>{s.year}</div>
                  <div className={styles.timelineDot}>{s.iconFr}</div>
                  <div className={styles.timelineText}>{lang==='fr' ? s.textFr : s.textEn}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}