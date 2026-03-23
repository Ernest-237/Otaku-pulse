// src/pages/Home/sections/AnimeCategories.jsx
// Section style Otakutique : logos anime + promo banners
import { useLang } from '../../../contexts/LangContext'
import styles from './AnimeCategories.module.css'

const ANIMES = [
  { name:'Naruto',        color:'#f97316', bg:'#1a0a00', emoji:'🍥',
    logo: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80"><text x="10" y="60" font-size="55" font-family="Impact,Arial Black" fill="%23f97316" font-weight="900">NARUTO</text></svg>'
  },
  { name:'Demon Slayer',  color:'#ef4444', bg:'#1a0000', emoji:'🗡️',
    logo: null },
  { name:'One Piece',     color:'#fcd34d', bg:'#0a0800', emoji:'⚓',
    logo: null },
  { name:'Jujutsu Kaisen',color:'#8b5cf6', bg:'#0a001a', emoji:'💀',
    logo: null },
  { name:'Dragon Ball Z', color:'#f59e0b', bg:'#120800', emoji:'🐉',
    logo: null },
  { name:'Attack on Titan',color:'#64748b', bg:'#08080a', emoji:'⚔️',
    logo: null },
  { name:'Bleach',        color:'#06b6d4', bg:'#000a0f', emoji:'⚡',
    logo: null },
  { name:'My Hero Academia',color:'#10b981',bg:'#000f0a', emoji:'💪',
    logo: null },
]

const PROMO_BANNERS = [
  { titleFr:'COLLECTION GOODIES',  titleEn:'GOODS COLLECTION',  pctFr:'10-50', pctEn:'10-50', emoji:'🎁', color:'#22c55e', bg:'linear-gradient(135deg,rgba(34,197,94,.12),rgba(34,197,94,.04))' },
  { titleFr:'POSTERS & ART',        titleEn:'POSTERS & ART',      pctFr:'20',    pctEn:'20',    emoji:'🖼️', color:'#f59e0b', bg:'linear-gradient(135deg,rgba(245,158,11,.12),rgba(245,158,11,.04))' },
]

export default function AnimeCategories() {
  const { lang } = useLang()

  return (
    <section id="services" className={styles.section}>
      <div className="container">

        {/* Titre */}
        <div className={styles.header}>
          <div className={styles.tag}>🎌 {lang==='fr' ? 'Univers Anime' : 'Anime Universe'}</div>
          <h2 className={styles.title}>
            {lang==='fr' ? 'EXPLORE NOS ' : 'EXPLORE OUR '}
            <span className={styles.accent}>{lang==='fr' ? 'UNIVERS' : 'UNIVERSES'}</span>
          </h2>
          <p className={styles.subtitle}>
            {lang==='fr' ? 'Goodies, posters et accessoires par univers anime' : 'Goods, posters and accessories by anime universe'}
          </p>
        </div>

        {/* Promo banners + logos grid */}
        <div className={styles.mainGrid}>
          {/* Colonne gauche — image hero produit */}
          <div className={styles.heroBanner}>
            <div className={styles.heroBannerInner}>
              <div className={styles.heroBannerEmoji}>🎌</div>
              <div className={styles.heroBannerTag}>{lang==='fr' ? 'COLLECTION ANIME' : 'ANIME COLLECTION'}</div>
              <h3 className={styles.heroBannerTitle}>
                {lang==='fr' ? 'Goodies & Figurines' : 'Goods & Figures'}
              </h3>
              <div className={styles.heroBannerDiscount}>
                <span className={styles.pct}>10-50</span>
                <span className={styles.pctOff}>% OFF</span>
              </div>
              <button className={styles.exploreBtn}
                onClick={()=>document.getElementById('boutique')?.scrollIntoView({behavior:'smooth'})}>
                {lang==='fr' ? 'EXPLORER' : 'EXPLORE'}
              </button>
            </div>
            {/* Emojis flottants décoratifs */}
            {['🍥','⚓','💀','🗡️','🐉'].map((e,i)=>(
              <div key={i} className={styles.floatingEmoji} style={{
                top:`${15+i*16}%`, right:`${8+i%2*12}%`,
                animationDelay:`${i*.4}s`, fontSize:`${1.5+i*.3}rem`,
              }}>{e}</div>
            ))}
          </div>

          {/* Colonne droite — promo cards verticales */}
          <div className={styles.promoCols}>
            {PROMO_BANNERS.map((b,i)=>(
              <div key={i} className={styles.promoBanner} style={{ background:b.bg }}>
                <div>
                  <div className={styles.promoTag} style={{ color:b.color }}>{lang==='fr'?b.titleFr:b.titleEn}</div>
                  <div className={styles.promoPct} style={{ color:b.color }}>
                    <span className={styles.pctBig}>{lang==='fr'?b.pctFr:b.pctEn}</span>
                    <span className={styles.pctSmall}>% OFF</span>
                  </div>
                </div>
                <div className={styles.promoEmojiWrap}>
                  <span className={styles.promoEmoji}>{b.emoji}</span>
                </div>
                <button className={styles.promoBtn} style={{ borderColor:`${b.color}50`, color:b.color }}
                  onClick={()=>document.getElementById('boutique')?.scrollIntoView({behavior:'smooth'})}>
                  {lang==='fr' ? 'EXPLORER' : 'EXPLORE'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Logos anime scrollables */}
        <div className={styles.animesBar}>
          {ANIMES.map((a,i)=>(
            <button key={i} className={styles.animeChip}
              style={{ borderColor:`${a.color}40`, background:`${a.color}08` }}
              onClick={()=>document.getElementById('boutique')?.scrollIntoView({behavior:'smooth'})}>
              <span className={styles.animeEmoji}>{a.emoji}</span>
              <span className={styles.animeName} style={{ color:a.color }}>{a.name}</span>
            </button>
          ))}
        </div>

      </div>
    </section>
  )
}