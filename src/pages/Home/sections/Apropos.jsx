// src/pages/Home/sections/Apropos.jsx
import { useLang } from '../../../contexts/LangContext'
import styles from './Apropos.module.css'

const STORY = [
  {
    year: '💡', iconFr: '💡', iconEn: '💡',
    labelFr: "L'origine", labelEn: 'The origin',
    textFr: "Otaku Pulse naît en février 2026, d'un constat simple : il existe peu ou pas de plateforme dédiée aux services événementiels otaku au Cameroun, pour les petits comme les grands événements.",
    textEn: "Otaku Pulse was born in February 2026, from a simple observation: there was little to no platform dedicated to otaku event services in Cameroon, for small and large events alike.",
  },
  {
    year: '🚀', iconFr: '🚀', iconEn: '🚀',
    labelFr: "Aujourd'hui", labelEn: 'Today',
    textFr: "Au fil de son développement, la plateforme est devenue un vrai pôle : rassembler, partager, réserver, vendre et communiquer autour des événements de culture nippone et otaku — tout en un seul endroit.",
    textEn: "As it grew, the platform became a real hub: bringing together, sharing, booking, selling and communicating around Japanese pop culture and otaku events — all in one place.",
  },
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
                ? "Otaku Pulse est le rendez-vous de la culture otaku au Cameroun : événements anime, manga, gaming, cosplay, figurines, goodies et expériences uniques pour tous les passionnés. Découvrez, participez et partagez votre passion avec la communauté otaku."
                : "Otaku Pulse is Cameroon’s first otaku culture hub, dedicated to anime, manga, gaming and Japanese pop culture events. We create unique experiences through anime events, community activities, collectibles, figurines, manga, gaming and exclusive otaku products for fans across Cameroon."}
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
                  <div className={styles.timelineYear}>{lang==='fr' ? s.labelFr : s.labelEn}</div>
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