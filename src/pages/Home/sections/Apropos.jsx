// src/pages/Home/sections/Apropos.jsx
import { useLang } from '../../../contexts/LangContext'

const TIMELINE = [
  { year:'2024', icon:'💡', fr:'Naissance de l\'idée', en:'Birth of the idea', descFr:'Premier événement test à Yaoundé avec 30 invités.' },
  { year:'2025', icon:'🚀', fr:'Lancement officiel',   en:'Official launch',   descFr:'3 événements organisés, 200+ clients satisfaits.' },
  { year:'2026', icon:'🌍', fr:'Expansion Cameroun',   en:'Cameroon expansion',descFr:'3 villes, partenariats, plateforme digitale.' },
]

export default function Apropos() {
  const { lang } = useLang()
  return (
    <section id="apropos" style={{ padding:'6rem 0', background:'linear-gradient(180deg,#060e1a,#091525)' }}>
      <div className="container">
        <h2 className="section-title">
          À <span style={{ background:'linear-gradient(135deg,#22c55e,#86efac)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>PROPOS</span>
        </h2>
        <p style={{ textAlign:'center', color:'rgba(240,253,244,.6)', maxWidth:600, margin:'0 auto 3rem', fontSize:'1rem', lineHeight:1.8 }}>
          {lang==='fr'
            ? 'Otaku Pulse est né d\'une passion pour l\'univers manga/anime et d\'un rêve : offrir aux fans camerounais une expérience immersive inoubliable lors de leurs événements.'
            : 'Otaku Pulse was born from a passion for manga/anime and a dream: to give Cameroonian fans an unforgettable immersive experience at their events.'}
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:24 }}>
          {TIMELINE.map(t => (
            <div key={t.year} style={{ background:'rgba(12,26,46,.9)', border:'1px solid rgba(34,197,94,.12)', borderRadius:16, padding:'1.5rem', textAlign:'center' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'.5rem' }}>{t.icon}</div>
              <div style={{ fontFamily:'var(--font-title)', fontSize:'2rem', letterSpacing:'3px', color:'#22c55e' }}>{t.year}</div>
              <div style={{ fontFamily:'var(--font-title)', fontSize:'1.1rem', letterSpacing:'2px', marginBottom:'.5rem' }}>{lang==='fr' ? t.fr : t.en}</div>
              <p style={{ fontSize:'.82rem', color:'rgba(240,253,244,.5)', lineHeight:1.6 }}>{t.descFr}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}