// src/pages/Home/sections/Services.jsx
import { useLang } from '../../../contexts/LangContext'
import styles from './Services.module.css'

const PACKS = [
  {
    id:'genin', emoji:'🥋', nameF:'GENIN', nameE:'GENIN',
    price:'85 000', color:'#22c55e',
    descFr:'Pack idéal pour petits comités (5-12 personnes). Durée 45 min. Décoration légère + 3 goodies.',
    descEn:'Ideal pack for small groups (5-12 people). 45 min. Light decoration + 3 goodies.',
    features: ['Décoration 1 mur thématique','3 Goodies personnalisés','Cocktail Otaku x1','Photo backdrop','Durée 45 min'],
  },
  {
    id:'chunin', emoji:'⚔️', nameF:'CHŪNIN', nameE:'CHUNIN',
    price:'200 000', color:'#3b82f6',
    descFr:'Pour salons, jardins et petites salles de fête. 2h15 d\'immersion totale.',
    descEn:'For living rooms, gardens, small halls. 2h15 total immersion.',
    features: ['Décoration 3 murs complets','10 Goodies premium','Bar mobile Otaku Pulse','Mixologue 2h15','Kakemono entrée'],
    featured: true,
  },
  {
    id:'hokage', emoji:'👑', nameF:'HOKAGE', nameE:'HOKAGE',
    price:'450 000', color:'#f97316',
    descFr:'L\'expérience ultime. Tente complète, 80+ invités, 4h d\'immersion.',
    descEn:'The ultimate experience. Full tent, 80+ guests, 4h immersion.',
    features: ['Tente thématique complète','30 Goodies collector','Bar & Mixologue 4h','Mapping vidéo','DJ Anime set','Photo & vidéo inclus'],
  },
]

export default function Services() {
  const { lang } = useLang()
  return (
    <section id="services" className={styles.section}>
      <div className="container">
        <h2 className="section-title">
          NOS <span style={{ background:'linear-gradient(135deg,#22c55e,#86efac)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>PACKS</span>
        </h2>
        <div className={styles.grid}>
          {PACKS.map(p => (
            <div key={p.id} className={`${styles.card} ${p.featured ? styles.featured : ''}`}>
              {p.featured && <div className={styles.featBadge}>⭐ {lang==='fr' ? 'POPULAIRE' : 'POPULAR'}</div>}
              <div className={styles.cardTop} style={{ borderColor:`${p.color}33` }}>
                <span style={{ fontSize:'2.5rem' }}>{p.emoji}</span>
                <h3 className={styles.packName} style={{ color:p.color }}>{p.nameF}</h3>
                <div className={styles.price}>{p.price} <small>FCFA</small></div>
              </div>
              <p className={styles.desc}>{lang==='fr' ? p.descFr : p.descEn}</p>
              <ul className={styles.features}>
                {p.features.map((f,i) => <li key={i}><span style={{color:p.color}}>✓</span> {f}</li>)}
              </ul>
              <button
                className={styles.cta}
                style={{ background:`linear-gradient(135deg,${p.color},${p.color}cc)` }}
                onClick={() => {
                  sessionStorage.setItem('selected_pack', p.id)
                  document.getElementById('contact')?.scrollIntoView({behavior:'smooth'})
                }}
              >
                {lang==='fr' ? 'Choisir ce pack' : 'Choose this pack'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}