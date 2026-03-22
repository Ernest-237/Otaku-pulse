// src/pages/Home/sections/Contact.jsx
import { useState, useEffect } from 'react'
import { useLang }   from '../../../contexts/LangContext'
import { useToast }  from '../../../contexts/ToastContext'
import { useMutation } from '../../../hooks/useApi'
import { contactApi } from '../../../api'
import styles from './Contact.module.css'

const PACKS  = ['genin','chunin','hokage','custom']
const THEMES = ['Naruto','One Piece','Jujutsu Kaisen','Dragon Ball Z','Demon Slayer','Attack on Titan','My Hero Academia','Bleach','Hunter × Hunter','Tokyo Ghoul','Death Note','Fullmetal Alchemist','Black Clover','Fairy Tail','Sword Art Online','Autre']
const CITIES = ['Yaoundé','Douala','Bafoussam','Autre']

export default function Contact() {
  const { lang } = useLang()
  const toast    = useToast()
  const { mutate: sendContact, loading } = useMutation(contactApi.send)

  const [form, setForm] = useState({
    nom:'', prenom:'', email:'', phone:'+237 ', pack:'genin', theme:'Naruto',
    guests:10, date:'', time:'19:00', ville:'Yaoundé', lieu:'', message:'', source:'site', lang:'fr', rgpd:false,
  })
  const [success, setSuccess] = useState(false)

  // Pré-remplir depuis sessionStorage
  useEffect(() => {
    const savedPack = sessionStorage.getItem('selected_pack')
    if (savedPack) { setForm(f => ({ ...f, pack: savedPack })); sessionStorage.removeItem('selected_pack') }
  }, [])

  const minDate = (() => {
    const d = new Date(); d.setDate(d.getDate()+14)
    return d.toISOString().split('T')[0]
  })()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.rgpd) { toast.error(lang==='fr' ? 'Accepte la politique de confidentialité' : 'Accept privacy policy'); return }
    const { error } = await sendContact({ ...form, lang })
    if (error) { toast.error(error); return }
    setSuccess(true)
    toast.success('✅ ' + (lang==='fr' ? 'Demande envoyée ! On vous contacte bientôt.' : 'Request sent! We\'ll contact you soon.'))
  }

  if (success) return (
    <section id="contact" className={styles.section}>
      <div className="container" style={{ textAlign:'center', padding:'4rem 0' }}>
        <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>✅</div>
        <h2 style={{ fontFamily:'var(--font-title)', fontSize:'2rem', letterSpacing:'3px', color:'#22c55e', marginBottom:'1rem' }}>
          {lang==='fr' ? 'DEMANDE ENVOYÉE !' : 'REQUEST SENT!'}
        </h2>
        <p style={{ color:'var(--muted)', maxWidth:500, margin:'0 auto 2rem', lineHeight:1.7 }}>
          {lang==='fr'
            ? 'Merci ! Notre équipe va vous contacter dans les plus brefs délais pour finaliser votre réservation.'
            : 'Thank you! Our team will contact you shortly to finalize your booking.'}
        </p>
        <button className={styles.submitBtn} onClick={() => setSuccess(false)}>
          {lang==='fr' ? '← Nouvelle demande' : '← New request'}
        </button>
      </div>
    </section>
  )

  return (
    <section id="contact" className={styles.section}>
      <div className="container">
        <h2 className="section-title">
          <span style={{ background:'linear-gradient(135deg,#22c55e,#86efac)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            {lang==='fr' ? 'RÉSERVATION' : 'BOOKING'}
          </span>
        </h2>
        <div className={styles.layout}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <Inp label={lang==='fr'?'Prénom *':'First Name *'}  value={form.prenom} onChange={v=>set('prenom',v)} required />
              <Inp label={lang==='fr'?'Nom *':'Last Name *'}       value={form.nom}    onChange={v=>set('nom',v)}    required />
              <Inp label="Email *"    type="email" value={form.email}  onChange={v=>set('email',v)} required />
              <Inp label={lang==='fr'?'Téléphone *':'Phone *'} value={form.phone} onChange={v=>set('phone',v)} required />
            </div>
            <div className={styles.formGrid}>
              <Sel label="Pack *" value={form.pack} onChange={v=>set('pack',v)} options={PACKS.map(p=>({v:p, l:p.toUpperCase()}))} />
              <Sel label={lang==='fr'?'Thème *':'Theme *'} value={form.theme} onChange={v=>set('theme',v)} options={THEMES.map(t=>({v:t,l:t}))} />
              <Inp label={lang==='fr'?'Nombre de personnes *':'Guests *'} type="number" min={1} max={200} value={form.guests} onChange={v=>set('guests',+v)} required />
              <Inp label={lang==='fr'?'Date *':'Date *'} type="date" min={minDate} value={form.date} onChange={v=>set('date',v)} required />
              <Inp label={lang==='fr'?'Heure':'Time'} type="time" value={form.time} onChange={v=>set('time',v)} />
              <Sel label={lang==='fr'?'Ville *':'City *'} value={form.ville} onChange={v=>set('ville',v)} options={CITIES.map(c=>({v:c,l:c}))} />
            </div>
            <Inp label={lang==='fr'?'Adresse du lieu':'Venue address'} value={form.lieu} onChange={v=>set('lieu',v)} />
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>{lang==='fr'?'Message (optionnel)':'Message (optional)'}</label>
              <textarea className={styles.textarea} rows={3} value={form.message} onChange={e=>set('message',e.target.value)} placeholder={lang==='fr'?'Précisions, questions...':'Details, questions...'} />
            </div>
            <label className={styles.checkLabel}>
              <input type="checkbox" checked={form.rgpd} onChange={e=>set('rgpd',e.target.checked)} required />
              <span>{lang==='fr'?'J\'accepte la politique de confidentialité *':'I accept the privacy policy *'}</span>
            </label>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? '⏳...' : `⚡ ${lang==='fr'?'Envoyer ma demande':'Send request'}`}
            </button>
          </form>

          {/* Info sidebar */}
          <div className={styles.sidebar}>
            <div className={styles.infoCard}>
              <h3 className={styles.infoTitle}>📞 {lang==='fr'?'Nous contacter':'Contact us'}</h3>
              <a href="https://wa.me/237600000000" target="_blank" rel="noreferrer" className={styles.waBtn}>
                💬 WhatsApp
              </a>
            </div>
            <div className={styles.infoCard}>
              <h3 className={styles.infoTitle}>⚡ {lang==='fr'?'Notre promesse':'Our promise'}</h3>
              <ul style={{ listStyle:'none', padding:0, display:'flex', flexDirection:'column', gap:8 }}>
                {(lang==='fr'
                  ? ['Réponse en moins de 2h','Devis gratuit sous 24h','Annulation flexible','50+ thèmes disponibles']
                  : ['Reply in under 2h','Free quote within 24h','Flexible cancellation','50+ themes available']
                ).map((i,idx) => (
                  <li key={idx} style={{ fontSize:'.85rem', color:'rgba(240,253,244,.65)', display:'flex', gap:8 }}>
                    <span style={{color:'#22c55e'}}>✓</span>{i}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Inp({ label, type='text', value, onChange, required, min, max, placeholder }) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, letterSpacing:'1px', color:'var(--muted)', marginBottom:5, textTransform:'uppercase' }}>{label}</label>
      <input
        type={type} required={required} min={min} max={max} placeholder={placeholder}
        value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:'100%', padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none', transition:'border-color .2s' }}
        onFocus={e=>e.target.style.borderColor='#22c55e'}
        onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}
      />
    </div>
  )
}
function Sel({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, letterSpacing:'1px', color:'var(--muted)', marginBottom:5, textTransform:'uppercase' }}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:'100%', padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none' }}>
        {options.map(o=><option key={o.v} value={o.v} style={{background:'#0c1a2e'}}>{o.l}</option>)}
      </select>
    </div>
  )
}