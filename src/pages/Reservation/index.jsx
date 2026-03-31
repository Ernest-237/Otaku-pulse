// src/pages/Reservation/index.jsx — Formulaire réservation événement
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang }  from '../../contexts/LangContext'
import { useToast } from '../../contexts/ToastContext'
import Navbar from '../../components/Navbar'
import QUARTIERS from '../../data/quartiers'
import styles from './Reservation.module.css'

const PACKS = [
  {
    id: 'genin', emoji: '🥋', nameF: 'Pack GENIN', nameE: 'GENIN Pack',
    priceF: '85 000 FCFA', priceE: '85,000 FCFA',
    descF: 'Idéal pour petits événements (5-12 pers). Décoration légère, 3 goodies, 45 min.',
    descE: 'Ideal for small events (5-12 guests). Light decoration, 3 goodies, 45 min.',
    color: '#22c55e',
    features: ['Décoration 1 mur thématique', '3 Goodies personnalisés', 'Cocktail Otaku x1', 'Photo backdrop', 'Durée 45 min'],
  },
  {
    id: 'chunin', emoji: '⚔️', nameF: 'Pack CHŪNIN', nameE: 'CHŪNIN Pack',
    priceF: '200 000 FCFA', priceE: '200,000 FCFA',
    descF: "Pour salons, jardins et petites salles de fête. 2h15 d'immersion totale.",
    descE: 'For living rooms, gardens and small event halls. 2h15 of total immersion.',
    color: '#3b82f6',
    popular: true,
    features: ['Décoration 3 murs complets', '10 Goodies premium', 'Bar mobile Otaku Pulse', 'Mixologue 2h15', 'Kakemono entrée'],
  },
  {
    id: 'hokage', emoji: '👑', nameF: 'Pack HOKAGE', nameE: 'HOKAGE Pack',
    priceF: '450 000 FCFA', priceE: '450,000 FCFA',
    descF: "L'expérience ultime. Tente complète, 80+ invités, 4h d'immersion.",
    descE: 'The ultimate experience. Full tent, 80+ guests, 4h of immersion.',
    color: '#f97316',
    features: ['Tente thématique complète', '30 Goodies collector', 'Bar & Mixologue 4h', 'Mapping vidéo', 'DJ Anime set', 'Photo & vidéo inclus'],
  },
]

const THEMES = [
  'Naruto / Boruto', 'One Piece', 'Dragon Ball Z', 'Jujutsu Kaisen', 'Demon Slayer',
  'Attack on Titan', 'Bleach', 'My Hero Academia', 'Fairy Tail', 'Sword Art Online',
  'Death Note', 'Hunter x Hunter', 'Tokyo Revengers', 'Vinland Saga', 'Autre (préciser)',
]

export default function ReservationPage() {
  const { lang } = useLang()
  const toast    = useToast()
  const [step,    setStep]    = useState(1) // 1=Pack 2=Détails 3=Confirm
  const [sending, setSending] = useState(false)
  const [done,    setDone]    = useState(false)
  const [form, setForm] = useState({
    pack: '', nom: '', prenom: '', email: '', phone: '', whatsapp: '',
    theme: '', guests: '', date: '', time: '', ville: 'Yaoundé',
    quartier: '', lieu: '', message: '',
  })
  const s = (k,v) => setForm(f => ({ ...f, [k]:v }))

  const handleSubmit = async () => {
    // Validation basique
    if (!form.nom || !form.prenom || !form.email || !form.phone) {
      toast.error('Veuillez remplir tous les champs obligatoires'); return
    }
    if (!form.date) { toast.error('Veuillez choisir une date'); return }
    setSending(true)
    try {
      // Appel API — backend à connecter
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api-pulse-v9vy.onrender.com'}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'reservation-form', lang }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur serveur')
      }
      setDone(true)
    } catch(err) {
      toast.error(err.message || 'Une erreur est survenue')
    } finally { setSending(false) }
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <div className={styles.headerSection}>
        <div className="container">
          <div className={styles.breadcrumb}>
            <Link to="/">Accueil</Link> <span>›</span> <span>Réservation</span>
          </div>
          <h1 className={styles.pageTitle}>
            🎌 <span className={styles.accent}>RÉSERVER</span> UN ÉVÉNEMENT
          </h1>
          <p className={styles.pageSubtitle}>
            {lang==='fr'
              ? 'Crée ton événement Otaku sur mesure au Cameroun'
              : 'Create your custom Otaku event in Cameroon'}
          </p>
        </div>
      </div>

      <div className="container">
        {/* Stepper */}
        {!done && (
          <div className={styles.stepper}>
            {['Choix du pack', 'Vos informations', 'Confirmation'].map((label,i) => (
              <div key={i} className={`${styles.step} ${step>i+1?styles.stepDone:''} ${step===i+1?styles.stepActive:''}`}>
                <div className={styles.stepCircle}>{step>i+1 ? '✓' : i+1}</div>
                <span className={styles.stepLabel}>{label}</span>
                {i < 2 && <div className={`${styles.stepLine} ${step>i+1?styles.stepLineDone:''}`} />}
              </div>
            ))}
          </div>
        )}

        {/* STEP 1 — Choix du pack */}
        {step === 1 && !done && (
          <div>
            <h2 className={styles.sectionTitle}>Choisissez votre pack</h2>
            <div className={styles.packsGrid}>
              {PACKS.map(pack => (
                <div key={pack.id}
                  className={`${styles.packCard} ${form.pack===pack.id?styles.packSelected:''}`}
                  style={{ '--pcolor': pack.color }}
                  onClick={() => s('pack', pack.id)}>
                  {pack.popular && <div className={styles.popularBadge}>⭐ POPULAIRE</div>}
                  <div className={styles.packEmoji}>{pack.emoji}</div>
                  <h3 className={styles.packName} style={{ color: pack.color }}>
                    {lang==='fr' ? pack.nameF : pack.nameE}
                  </h3>
                  <div className={styles.packPrice} style={{ color: pack.color }}>
                    {lang==='fr' ? pack.priceF : pack.priceE}
                  </div>
                  <p className={styles.packDesc}>{lang==='fr' ? pack.descF : pack.descE}</p>
                  <ul className={styles.packFeatures}>
                    {pack.features.map((f,i) => <li key={i}><span>✓</span>{f}</li>)}
                  </ul>
                  <div className={`${styles.selectBtn} ${form.pack===pack.id?styles.selectBtnActive:''}`}
                    style={{ borderColor: pack.color, background: form.pack===pack.id?pack.color:'none', color: form.pack===pack.id?'#071220':pack.color }}>
                    {form.pack===pack.id ? '✓ Sélectionné' : 'Choisir ce pack'}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign:'center', marginTop:'2rem' }}>
              <button className={styles.nextBtn} disabled={!form.pack}
                onClick={() => setStep(2)}>
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Informations */}
        {step === 2 && !done && (
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Vos informations</h2>
            <div className={styles.formGrid}>
              <div className={styles.formCol}>
                <h3 className={styles.formGroupTitle}>👤 Identité</h3>
                <FInput label="Prénom *"  value={form.prenom}   onChange={v=>s('prenom',v)} />
                <FInput label="Nom *"     value={form.nom}      onChange={v=>s('nom',v)} />
                <FInput label="Email *"   type="email" value={form.email} onChange={v=>s('email',v)} />
                <FInput label="Téléphone *" value={form.phone}  onChange={v=>s('phone',v)} placeholder="+237 6XX XXX XXX" />
                <FInput label="WhatsApp"  value={form.whatsapp} onChange={v=>s('whatsapp',v)} placeholder="+237 6XX XXX XXX" />
              </div>
              <div className={styles.formCol}>
                <h3 className={styles.formGroupTitle}>🎌 L'événement</h3>
                <div className={styles.fGroup}>
                  <label className={styles.fLabel}>Thème Anime *</label>
                  <select className={styles.fInput} value={form.theme} onChange={e=>s('theme',e.target.value)}>
                    <option value="">-- Choisir un thème --</option>
                    {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <FInput label="Nombre d'invités *" type="number" value={form.guests} onChange={v=>s('guests',v)} placeholder="Ex: 15" />
                <FInput label="Date souhaitée *" type="date" value={form.date} onChange={v=>s('date',v)} />
                <FInput label="Heure de début" type="time" value={form.time} onChange={v=>s('time',v)} />
              </div>
              <div className={styles.formCol}>
                <h3 className={styles.formGroupTitle}>📍 Lieu</h3>
                <div className={styles.fGroup}>
                  <label className={styles.fLabel}>Ville *</label>
                  <div className={styles.cityBtns}>
                    {['Yaoundé','Douala','Bafoussam','Autre'].map(c => (
                      <button key={c} type="button"
                        className={`${styles.cityBtn} ${form.ville===c?styles.cityActive:''}`}
                        onClick={() => s('ville',c)}>{c}</button>
                    ))}
                  </div>
                </div>
                <div className={styles.fGroup}>
                  <label className={styles.fLabel}>Quartier</label>
                  <select className={styles.fInput} value={form.quartier} onChange={e=>s('quartier',e.target.value)}>
                    <option value="">-- Choisir --</option>
                    {(QUARTIERS[form.ville]||[]).map(q => <option key={q} value={q}>{q}</option>)}
                    <option value="">Autre (préciser ci-dessous)</option>
                  </select>
                </div>
                <div className={styles.fGroup}>
                  <label className={styles.fLabel}>Adresse / Lieu précis</label>
                  <textarea className={`${styles.fInput} ${styles.textarea}`} rows={2}
                    value={form.lieu} onChange={e=>s('lieu',e.target.value)}
                    placeholder="Ex: Villa blanche, après le carrefour..." />
                </div>
              </div>
              <div className={styles.formCol}>
                <h3 className={styles.formGroupTitle}>💬 Message</h3>
                <div className={styles.fGroup}>
                  <label className={styles.fLabel}>Détails supplémentaires</label>
                  <textarea className={`${styles.fInput} ${styles.textarea}`} rows={5}
                    value={form.message} onChange={e=>s('message',e.target.value)}
                    placeholder="Décris ton événement, tes attentes, des demandes spéciales..." />
                </div>
              </div>
            </div>

            <div className={styles.navBtns}>
              <button className={styles.backBtn} onClick={() => setStep(1)}>← Retour</button>
              <button className={styles.nextBtn} onClick={() => setStep(3)}>Vérifier →</button>
            </div>
          </div>
        )}

        {/* STEP 3 — Confirmation */}
        {step === 3 && !done && (
          <div className={styles.confirmSection}>
            <h2 className={styles.sectionTitle}>Vérification & Envoi</h2>
            {(() => {
              const pack = PACKS.find(p => p.id === form.pack)
              return (
                <div className={styles.confirmCard}>
                  <div className={styles.confirmBlock}>
                    <div className={styles.confirmTitle}>🎁 Pack choisi</div>
                    <div className={styles.confirmValue} style={{ color: pack?.color }}>
                      {pack?.emoji} {lang==='fr' ? pack?.nameF : pack?.nameE} — {lang==='fr' ? pack?.priceF : pack?.priceE}
                    </div>
                  </div>
                  {[
                    ['👤 Client',    `${form.prenom} ${form.nom}`],
                    ['📧 Email',     form.email],
                    ['📱 Téléphone', form.phone],
                    ['💬 WhatsApp',  form.whatsapp || form.phone],
                    ['🎌 Thème',     form.theme],
                    ['👥 Invités',   form.guests],
                    ['📅 Date',      new Date(form.date).toLocaleDateString('fr-FR',{dateStyle:'long'})],
                    ['⏰ Heure',     form.time || 'Non précisée'],
                    ['📍 Lieu',      `${form.quartier ? form.quartier+', ' : ''}${form.ville}`],
                  ].map(([l,v]) => (
                    <div key={l} className={styles.confirmRow}>
                      <span className={styles.confirmLbl}>{l}</span>
                      <span className={styles.confirmVal}>{v}</span>
                    </div>
                  ))}
                  {form.message && (
                    <div className={styles.confirmBlock}>
                      <div className={styles.confirmTitle}>💬 Message</div>
                      <div className={styles.confirmValue} style={{ color:'var(--muted)', fontSize:'.85rem' }}>{form.message}</div>
                    </div>
                  )}
                </div>
              )
            })()}
            <div className={styles.confirmNote}>
              <span>ℹ️</span>
              Notre équipe vous contacte sous <strong>24-48h</strong> pour confirmer et établir un devis.
            </div>
            <div className={styles.navBtns}>
              <button className={styles.backBtn} onClick={() => setStep(2)}>← Modifier</button>
              <button className={styles.submitBtn} onClick={handleSubmit} disabled={sending}>
                {sending ? '⏳ Envoi en cours...' : '⚡ Envoyer ma réservation'}
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {done && (
          <div className={styles.successSection}>
            <div className={styles.successIcon}>🎌</div>
            <h2 className={styles.successTitle}>RÉSERVATION ENVOYÉE !</h2>
            <p className={styles.successText}>
              Merci <strong>{form.prenom}</strong> ! Notre équipe Otaku Pulse vous contacte sous <strong style={{ color:'var(--green)' }}>24-48h</strong> pour confirmer votre événement et établir le devis définitif.
            </p>
            <div className={styles.successInfo}>
              <div>📧 Email de confirmation envoyé à <strong>{form.email}</strong></div>
              <div>📱 Nous vous appellerons au <strong>{form.phone}</strong></div>
            </div>
            <Link to="/" className={styles.homeBtn}>← Retour à l'accueil</Link>
          </div>
        )}
      </div>
    </div>
  )
}

function FInput({ label, type='text', value, onChange, placeholder }) {
  return (
    <div className={styles.fGroup}>
      <label className={styles.fLabel}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className={styles.fInput} />
    </div>
  )
}