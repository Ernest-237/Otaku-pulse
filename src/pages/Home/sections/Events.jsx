// src/pages/Home/sections/Events.jsx
import { useState } from 'react'
import { useAuth }  from '../../../contexts/AuthContext'
import { useLang }  from '../../../contexts/LangContext'
import { useToast } from '../../../contexts/ToastContext'
import { useApi, useMutation } from '../../../hooks/useApi'
import { eventsApi } from '../../../api'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
import styles from './Events.module.css'

const FILTERS = [
  { key:'all',      fr:'Tous',       en:'All'      },
  { key:'upcoming', fr:'À venir',    en:'Upcoming' },
  { key:'past',     fr:'Passés',     en:'Past'     },
]

export default function Events() {
  const { user }  = useAuth()
  const { lang }  = useLang()
  const toast     = useToast()

  const [filter,      setFilter]      = useState('all')
  const [selectedEvt, setSelectedEvt] = useState(null)
  const [guests,      setGuests]      = useState(1)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data, loading, error } = useApi(
    () => eventsApi.getAll({ limit: 20 }), [], true
  )
  const { mutate: doRegister, loading: registering } = useMutation(
    (eventId, guests) => eventsApi.register(eventId, guests)
  )

  const events = data?.events || []
  const filtered = events.filter(e => {
    if (filter === 'all')      return true
    if (filter === 'upcoming') return ['upcoming','ongoing'].includes(e.status)
    if (filter === 'past')     return e.status === 'past'
    return true
  })

  const featured = filtered.find(e => e.featured) || filtered[0]

  const openDetail = (evt) => { setSelectedEvt(evt); setGuests(1) }

  const handleRegister = async () => {
    if (!user) { toast.error(lang==='fr' ? 'Connecte-toi pour t\'inscrire' : 'Login to register'); return }
    const { error } = await doRegister(selectedEvt.id, guests)
    if (error) { toast.error(error); return }
    toast.success(lang==='fr' ? '✅ Inscription confirmée !' : '✅ Registration confirmed!')
    setConfirmOpen(false)
    setSelectedEvt(null)
  }

  return (
    <section id="events" className={styles.section}>
      <div className="container">
        <h2 className="section-title">
          <span style={{ background:'linear-gradient(135deg,#22c55e,#86efac)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            {lang==='fr' ? 'ÉVÉNEMENTS' : 'EVENTS'}
          </span>
        </h2>

        {/* Filters */}
        <div className={styles.filters}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`${styles.filterBtn} ${filter===f.key ? styles.active : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {lang==='fr' ? f.fr : f.en}
            </button>
          ))}
        </div>

        {loading && <PageLoader />}
        {error   && <EmptyState icon="⚠️" title="Erreur de chargement" message={error} />}

        {!loading && !error && (
          filtered.length === 0
            ? <EmptyState icon="🎌" title={lang==='fr' ? 'Aucun événement' : 'No events'} />
            : (
              <div className={styles.grid}>
                {filtered.map(evt => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    lang={lang}
                    featured={evt.id === featured?.id}
                    onClick={() => openDetail(evt)}
                  />
                ))}
              </div>
            )
        )}
      </div>

      {/* Detail modal */}
      {selectedEvt && (
        <Modal
          isOpen={!!selectedEvt}
          onClose={() => setSelectedEvt(null)}
          title={`${selectedEvt.img} ${lang==='fr' ? selectedEvt.titleF : (selectedEvt.titleE || selectedEvt.titleF)}`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setSelectedEvt(null)}>
                {lang==='fr' ? 'Fermer' : 'Close'}
              </Button>
              {selectedEvt.registered < selectedEvt.capacity && (
                <Button variant="primary" onClick={() => setConfirmOpen(true)}>
                  ⚡ {lang==='fr' ? 'S\'inscrire' : 'Register'}
                </Button>
              )}
            </>
          }
        >
          <EventDetail event={selectedEvt} lang={lang} guests={guests} setGuests={setGuests} />
        </Modal>
      )}

      {/* Confirm modal */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="✅ Confirmer l'inscription"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Annuler</Button>
            <Button variant="primary" loading={registering} onClick={handleRegister}>
              {lang==='fr' ? 'Confirmer' : 'Confirm'}
            </Button>
          </>
        }
      >
        <div style={{ textAlign:'center', padding:'1rem 0' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>🎌</div>
          <p style={{ color:'var(--muted)', lineHeight:1.7 }}>
            {lang==='fr'
              ? `Tu t'inscris à ${selectedEvt?.titleF} avec ${guests} personne${guests>1?'s':''}.`
              : `You're registering for ${selectedEvt?.titleF} with ${guests} person${guests>1?'s':''}.`}
          </p>
        </div>
      </Modal>
    </section>
  )
}

function EventCard({ event, lang, featured, onClick }) {
  const pct = Math.round((event.registered / event.capacity) * 100)
  return (
    <div className={`${styles.card} ${featured ? styles.featuredCard : ''}`} onClick={onClick}>
      <div className={styles.cardTop}>
        <span className={styles.cardEmoji}>{event.img}</span>
        <div className={styles.cardMeta}>
          <span className={`${styles.typeBadge}`} style={{ background:`${event.typeColor || '#22c55e'}22`, color: event.typeColor || '#22c55e', border:`1px solid ${event.typeColor || '#22c55e'}44` }}>
            {event.type.toUpperCase()}
          </span>
          {featured && <span className={styles.featBadge}>⭐ {lang==='fr' ? 'À la une' : 'Featured'}</span>}
        </div>
      </div>
      <div className={styles.cardTitle}>{lang==='fr' ? event.titleF : (event.titleE || event.titleF)}</div>
      <div className={styles.cardInfo}>
        <span>📅 {new Date(event.date).toLocaleDateString(lang==='fr'?'fr-FR':'en-US', { day:'numeric', month:'long', year:'numeric' })}</span>
        <span>📍 {event.venue || event.location || event.city}</span>
      </div>
      <div className={styles.progressWrap}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width:`${pct}%`, background: pct>=90?'#dc2626':'#22c55e' }} />
        </div>
        <span className={styles.progressLbl}>{event.registered}/{event.capacity} {lang==='fr' ? 'inscrits' : 'registered'}</span>
      </div>
      <div className={styles.cardFooter}>
        <span className={styles.price}>
          {event.isFree
            ? (lang==='fr' ? '🎁 Gratuit' : '🎁 Free')
            : `${event.price?.toLocaleString()} FCFA`}
        </span>
        {event.registered >= event.capacity
          ? <span className={styles.fullBadge}>🚫 {lang==='fr' ? 'Complet' : 'Full'}</span>
          : <span className={styles.registerBtn}>S'inscrire →</span>
        }
      </div>
    </div>
  )
}

function EventDetail({ event, lang, guests, setGuests }) {
  return (
    <div>
      <div className={styles.detailGrid}>
        <div className={styles.detailItem}><span className={styles.detailLbl}>📅 Date</span><strong>{new Date(event.date).toLocaleDateString(lang==='fr'?'fr-FR':'en-US',{dateStyle:'long'})}</strong></div>
        <div className={styles.detailItem}><span className={styles.detailLbl}>🕐 Heure</span><strong>{event.timeStart||'—'} {event.timeEnd?`→ ${event.timeEnd}`:''}</strong></div>
        <div className={styles.detailItem}><span className={styles.detailLbl}>📍 Lieu</span><strong>{event.venue||event.location||'—'}</strong></div>
        <div className={styles.detailItem}><span className={styles.detailLbl}>🏙️ Ville</span><strong>{event.city}</strong></div>
        <div className={styles.detailItem}><span className={styles.detailLbl}>👥 Places</span><strong>{event.registered}/{event.capacity}</strong></div>
        <div className={styles.detailItem}><span className={styles.detailLbl}>💰 Prix</span><strong>{event.isFree ? 'Gratuit' : `${event.price?.toLocaleString()} FCFA`}</strong></div>
      </div>
      {event.descF && <p style={{ color:'var(--muted)', fontSize:'.88rem', lineHeight:1.7, margin:'1rem 0' }}>{lang==='fr' ? event.descF : (event.descE||event.descF)}</p>}
      {event.registered < event.capacity && (
        <div style={{ marginTop:'1rem' }}>
          <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, letterSpacing:'1px', color:'var(--muted)', marginBottom:5 }}>
            {lang==='fr' ? 'NOMBRE DE PERSONNES' : 'NUMBER OF GUESTS'}
          </label>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', width:36, height:36, borderRadius:8, cursor:'pointer', fontSize:'1.2rem' }} onClick={() => setGuests(g => Math.max(1,g-1))}>−</button>
            <span style={{ fontFamily:'var(--font-title)', fontSize:'1.5rem', minWidth:30, textAlign:'center' }}>{guests}</span>
            <button style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', width:36, height:36, borderRadius:8, cursor:'pointer', fontSize:'1.2rem' }} onClick={() => setGuests(g => Math.min(event.capacity-event.registered, g+1))}>+</button>
          </div>
        </div>
      )}
    </div>
  )
}