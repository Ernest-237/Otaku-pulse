// src/pages/Membership/index.jsx — v3 Interactive, light, palette uniforme
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth }  from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { API_BASE, eventsApi, request } from '../../api'
import { useApi } from '../../hooks/useApi'
import Navbar  from '../../components/Navbar'
import Footer  from '../Home/sections/Footer'
import TicketStub from '../../components/ui/TicketStub'
import styles  from './Membership.module.css'

// Palette unifiée — vert brand + violet, plus d'orange
const PLANS = [
  {
    id: 'basic', emoji: '⚡', name: 'Pulse Basic', tagline: "L'entrée dans la communauté",
    price: 'Sur devis', badge: 'GENIN',
    color: '#16a34a', colorLight: '#dcfce7', colorBorder: 'rgba(22,163,74,.2)',
    cta: 'Rejoindre Basic',
    features: [
      { icon: '🎯', text: 'Réductions sur articles éligibles sélectionnés' },
      { icon: '⚡', text: 'Accès prioritaire à certaines promotions' },
      { icon: '🎂', text: 'Coupon surprise anniversaire' },
      { icon: '🛒', text: 'Accès aux offres membres de base' },
      { icon: '🏅', text: 'Badge numérique Membre Otaku Pulse' },
      { icon: '📬', text: 'Newsletter exclusive membres' },
    ],
    notIncluded: ['Drops anticipés', 'Réductions événements', 'Statut VIP'],
  },
  {
    id: 'plus', emoji: '🔥', name: 'Pulse Plus', tagline: 'Pour les vrais nakamas',
    price: 'Sur devis', badge: 'CHŪNIN', popular: true,
    color: '#7c3aed', colorLight: '#ede9fe', colorBorder: 'rgba(124,58,237,.2)',
    cta: 'Passer à Plus',
    features: [
      { icon: '💎', text: 'Réductions renforcées sur articles éligibles' },
      { icon: '🚀', text: 'Accès anticipé aux drops et promotions' },
      { icon: '🎌', text: 'Réductions sur certains événements Otaku Pulse' },
      { icon: '⭐', text: 'Récompenses fidélité améliorées' },
      { icon: '🔐', text: 'Offres exclusives réservées membres Plus' },
      { icon: '📣', text: 'Priorité sur campagnes promotionnelles' },
      { icon: '🏅', text: 'Badge Pulse Plus + profil enrichi' },
    ],
    notIncluded: ['Statut VIP Elite', 'Éditions limitées exclusives'],
  },
  {
    id: 'elite', emoji: '👑', name: 'Pulse Elite', tagline: 'Le rang des légendes',
    price: 'Sur devis', badge: 'HOKAGE', elite: true,
    color: '#0d9488', colorLight: '#ccfbf1', colorBorder: 'rgba(13,148,136,.2)',
    cta: 'Devenir Elite',
    features: [
      { icon: '👑', text: 'Meilleures réductions sur tous articles éligibles' },
      { icon: '🌟', text: 'Accès VIP aux promotions et lancements exclusifs' },
      { icon: '🎭', text: 'Avantages premium sur événements sélectionnés' },
      { icon: '💰', text: 'Programme fidélité Elite renforcé' },
      { icon: '🗝️', text: 'Accès éditions limitées et collaborations' },
      { icon: '🏆', text: 'Statut Premium affiché dans la communauté' },
      { icon: '📞', text: 'Support client prioritaire dédié' },
      { icon: '🎁', text: 'Surprise Elite annuelle personnalisée' },
    ],
    notIncluded: [],
  },
]

const FAQ = [
  { q: "Comment fonctionne l'abonnement annuel ?", a: "La Carte Membre Otaku Pulse est valable 12 mois à partir de la date de validation. Notre équipe vous contacte après votre demande pour finaliser les détails et l'activation." },
  { q: "Les réductions s'appliquent-elles à toute la boutique ?", a: "Non. Les réductions et avantages s'appliquent uniquement sur les articles éligibles selon les offres en cours. Une liste est disponible dans votre espace membre." },
  { q: "Comment puis-je changer de niveau ?", a: "Vous pouvez upgrader votre abonnement à tout moment. La différence de prix est calculée au prorata. Contactez-nous via WhatsApp ou le formulaire." },
  { q: "La carte membre est-elle numérique ?", a: "Oui ! Votre carte est générée numériquement avec votre pseudo, niveau et QR code de validation. Elle est accessible depuis votre profil." },
  { q: "Comment se passe le paiement ?", a: "Après votre demande, notre équipe vous contacte pour finaliser le paiement via MTN Money, Orange Money ou virement. Aucun paiement en ligne automatique pour l'instant." },
]

// ── Carte membre façon billet ──────────────────────────
function MemberCard({ user, myMembership, isActive }) {
  const planData = PLANS.find(p => p.id === (myMembership?.plan || 'elite'))
  const cardColor = planData?.color || '#7c3aed'

  const expiryStr = myMembership?.expiresAt
    ? new Date(myMembership.expiresAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })
    : '—'

  return (
    <TicketStub
      color={cardColor}
      icon="🎴"
      statusLabel={isActive ? 'ACTIF' : 'EN ATTENTE'}
      statusActive={isActive}
      title={(user?.pseudo || 'Ton pseudo').toUpperCase()}
      subtitle={`Carte ${(planData?.name || 'Otaku Pulse')}`}
      meta={[
        { label: 'Niveau', value: (myMembership?.plan || 'elite').toUpperCase() },
        { label: 'Expire', value: expiryStr },
      ]}
      code={isActive ? (myMembership?.cardId || 'OP-XXXXX') : 'EN ATTENTE'}
    />
  )
}

// ── Page principale ───────────────────────────────────
export default function MembershipPage() {
  const { user } = useAuth()
  const toast    = useToast()
  const navigate = useNavigate()

  const { data: mData } = useApi(
    () => user ? request('GET', '/api/membership/my') : Promise.resolve({ membership: null }),
    [user?.id], true
  )
  const myMembership = mData?.membership || null
  const isActive = myMembership?.status === 'active'

  const [selectedPlan, setSelectedPlan] = useState(null)
  const [formOpen,  setFormOpen]  = useState(false)
  const [sending,   setSending]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [form, setForm] = useState({
    nom: '', email: '', phone: '', plan: '', ville: 'Yaoundé',
  })
  const s = (k,v) => setForm(f => ({ ...f, [k]:v }))

  const openForm = (plan) => {
    if (!user) { toast.info("Connecte-toi d'abord !"); return }
    setSelectedPlan(plan)
    setForm({ nom: user.pseudo||'', email: user.email||'', phone: user.phone||'', plan: plan.id, ville:'Yaoundé' })
    setFormOpen(true)
  }

  const submit = async () => {
    if (!form.nom || !form.email || !form.phone) { toast.error('Remplis tous les champs'); return }
    setSending(true)
    try {
      await request('POST', '/api/membership/request', { ...form, userId: user?.id })
      setDone(true); setFormOpen(false)
      toast.success('✅ Demande envoyée ! Notre équipe vous contacte sous 24h.')
    } catch(err) { toast.error(err.message) }
    finally { setSending(false) }
  }

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section className={styles.hero}>
        <div className={styles.heroPattern} />
        <div className={styles.heroOrb1} />
        <div className={styles.heroOrb2} />

        <div className="container">
          <div className={styles.heroInner}>
            {/* Texte gauche */}
            <div className={styles.heroLeft}>
              <div className={styles.heroBadge}>
                <span className={styles.heroDot} />
                🎌 PROGRAMME EXCLUSIF ANNUEL
              </div>
              <h1 className={styles.heroTitle}>
                LA <span className={styles.heroAccent}>CARTE MEMBRE</span>
                <br />OTAKU PULSE
              </h1>
              <p className={styles.heroSub}>
                Rejoins la communauté des vrais fans. Un abonnement annuel,
                des avantages exclusifs, et une identité membre officielle.
              </p>
              <div className={styles.heroStats}>
                {[
                  ['🎌', '1 an', 'Validité'],
                  ['💎', '3', 'Rangs'],
                  ['⚡', '100%', 'Numérique'],
                  ['🇨🇲', '3', 'Villes'],
                ].map(([e,v,l],i) => (
                  <div key={i} className={styles.heroStat}>
                    <span className={styles.heroStatEmoji}>{e}</span>
                    <span className={styles.heroStatVal}>{v}</span>
                    <span className={styles.heroStatLbl}>{l}</span>
                  </div>
                ))}
              </div>
              <a href="#plans" className={styles.heroBtn}>
                Choisir mon rang <span>↓</span>
              </a>
            </div>

            {/* Carte droite — billet */}
            <div className={styles.heroRight}>
              <MemberCard user={user} myMembership={myMembership} isActive={isActive} />
            </div>
          </div>
        </div>
      </section>

      {/* ══ CARTE ACTIVE (membres) ════════════════════════ */}
      {isActive && myMembership && (
        <section className={styles.activeSection}>
          <div className="container">
            <div className={styles.activeBadge}>✅ CARTE MEMBRE ACTIVE</div>
            <h2 className={styles.activeTitle}>🎴 Ta Carte Membre</h2>
            <div className={styles.activeGrid}>
              {/* Infos */}
              <div className={styles.activeInfos}>
                {[
                  ['Plan',     (myMembership.plan||'').toUpperCase(), 'var(--purple)'],
                  ['ID Carte', myMembership.cardId || 'PENDING',      'var(--green)'],
                  ['Expire le', myMembership.expiresAt
                    ? new Date(myMembership.expiresAt).toLocaleDateString('fr-FR')
                    : '—', 'var(--text-strong)'],
                ].map(([label,val,color]) => (
                  <div key={label} className={styles.activeInfoCard}>
                    <div className={styles.activeInfoLabel}>{label}</div>
                    <div className={styles.activeInfoVal} style={{ color }}>{val}</div>
                  </div>
                ))}
              </div>
              {/* Barre temps */}
              {myMembership.expiresAt && (() => {
                const days = Math.max(0, Math.ceil((new Date(myMembership.expiresAt)-new Date())/(1000*60*60*24)))
                const pct  = Math.max(0, Math.min(100,(days/365)*100))
                return (
                  <div className={styles.activeProgress}>
                    <div className={styles.activeProgressTop}>
                      <span>Validité restante</span>
                      <span style={{ color: days<30?'var(--red)':'var(--green)', fontWeight:800 }}>{days} jours</span>
                    </div>
                    <div className={styles.activeProgressBar}>
                      <div className={styles.activeProgressFill} style={{ width:`${pct}%` }} />
                    </div>
                    {days<30 && <p className={styles.activeWarn}>⚠️ Carte bientôt expirée — contactez-nous pour renouveler</p>}
                  </div>
                )
              })()}
              {/* Avantages */}
              <div className={styles.activeFeatures}>
                <div className={styles.activeFeaturesTitle}>✨ Tes avantages actifs</div>
                <div className={styles.activeFeaturesGrid}>
                  {(PLANS.find(p=>p.id===myMembership.plan)?.features||[]).map((f,i) => (
                    <div key={i} className={styles.activeFeatureItem}>
                      <span>{f.icon}</span><span>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══ ÉVÉNEMENTS À VENIR / BILLETTERIE ═══════════════ */}
      <UpcomingEventsSection user={user} toast={toast} />

      {/* ══ CONCEPT ═══════════════════════════════════════ */}
      <section className={styles.concept}>
        <div className="container">
          <div className={styles.conceptInner}>
            <span className={styles.conceptIcon}>🎴</span>
            <div className={styles.conceptBody}>
              <h2 className={styles.conceptTitle}>C'est quoi la Carte Membre Otaku Pulse ?</h2>
              <p className={styles.conceptText}>
                Un abonnement annuel nominatif, 100% numérique, qui te donne accès à des avantages
                exclusifs sur nos articles et événements. Chaque carte est valable 12 mois à partir de l'activation.
              </p>
              <div className={styles.conceptPills}>
                {['✅ 100% numérique','🔒 Nominative','📅 Valable 1 an','🎌 Cameroun'].map((p,i) => (
                  <span key={i} className={styles.pill}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PLANS ═════════════════════════════════════════ */}
      <section id="plans" className={styles.plans}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}>⚡ CHOISIR TON RANG</div>
            <h2 className={styles.sectionTitle}>
              3 NIVEAUX, <span style={{ color:'var(--green)' }}>1 COMMUNAUTÉ</span>
            </h2>
            <p className={styles.sectionSub}>
              Monte en grade et profite du meilleur d'Otaku Pulse.
            </p>
          </div>

          <div className={styles.plansGrid}>
            {PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onSelect={openForm} user={user} />
            ))}
          </div>

          <div className={styles.legalNote}>
            <span>ℹ️</span>
            <p><strong>Important :</strong> Les avantages s'appliquent uniquement sur les articles éligibles selon les offres en cours.</p>
          </div>
        </div>
      </section>

      {/* ══ COMPARATIF ════════════════════════════════════ */}
      <section className={styles.compare}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}>📊 COMPARATIF</div>
            <h2 className={styles.sectionTitle}>QUI OFFRE <span style={{ color:'var(--green)' }}>QUOI ?</span></h2>
          </div>
          <div className={styles.compareTable}>
            <div className={styles.compareHead}>
              <div className={styles.compareHeadCell} />
              {PLANS.map(p => (
                <div key={p.id} className={styles.compareHeadCell} style={{ color:p.color }}>
                  {p.emoji} {p.badge}
                </div>
              ))}
            </div>
            {[
              ['Réductions articles éligibles', '✓', '✓✓', '✓✓✓'],
              ['Accès prioritaire promos',      '✓', '✓',  '✓'],
              ['Accès anticipé (early access)', '✗', '✓',  '✓'],
              ['Réductions événements',         '✗', '✓',  '✓'],
              ['Offres membres exclusives',     '✗', '✓',  '✓'],
              ['Accès éditions limitées',       '✗', '✗',  '✓'],
              ['Statut VIP communauté',         '✗', '✗',  '✓'],
              ['Support client prioritaire',    '✗', '✗',  '✓'],
              ['Cadeau Elite annuel',           '✗', '✗',  '✓'],
            ].map(([feat,b,p,e],i) => (
              <div key={i} className={`${styles.compareRow} ${i%2===0?styles.compareRowAlt:''}`}>
                <div className={styles.compareCell}>{feat}</div>
                {[{v:b,p:PLANS[0]},{v:p,p:PLANS[1]},{v:e,p:PLANS[2]}].map(({v,p:pl},j) => (
                  <div key={j} className={styles.compareCell}
                    style={{ color:v==='✗'?'var(--border)':pl.color, fontWeight:700, fontSize:'1rem' }}>
                    {v}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════ */}
      <section className={styles.faq}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}>❓ FAQ</div>
            <h2 className={styles.sectionTitle}>ON RÉPOND À <span style={{ color:'var(--green)' }}>TES QUESTIONS</span></h2>
          </div>
          <div className={styles.faqList}>
            {FAQ.map((item,i) => <FaqItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ════════════════════════════════════ */}
      {!done ? (
        <section className={styles.ctaSection}>
          <div className="container">
            <div className={styles.ctaInner}>
              <h2 className={styles.ctaTitle}>
                Prêt à rejoindre la <span style={{ color:'var(--green)' }}>communauté</span> ?
              </h2>
              <p className={styles.ctaSub}>
                Choisis ton rang, remplis la demande, notre équipe te contacte sous 24h.
              </p>
              <div className={styles.ctaBtns}>
                <a href="#plans" className={styles.ctaBtnPrimary}>⚡ Voir les abonnements</a>
                {user && <Link to="/profil" className={styles.ctaBtnSecondary}>Mon profil →</Link>}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className={styles.ctaSection}>
          <div className="container">
            <div className={styles.successBox}>
              <div className={styles.successEmoji}>🎌</div>
              <h2 className={styles.successTitle}>DEMANDE ENVOYÉE !</h2>
              <p className={styles.successText}>Notre équipe vous contacte sous <strong>24-48h</strong>.</p>
              <Link to="/profil" className={styles.ctaBtnPrimary}>Mon profil →</Link>
            </div>
          </div>
        </section>
      )}

      {/* ══ MODAL FORMULAIRE ══════════════════════════════ */}
      {formOpen && selectedPlan && (
        <div className={styles.modalOverlay} onClick={() => setFormOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setFormOpen(false)}>✕</button>
            <div className={styles.modalHeader}>
              <span style={{ fontSize:'2rem' }}>{selectedPlan.emoji}</span>
              <h3 className={styles.modalTitle} style={{ color: selectedPlan.color }}>{selectedPlan.name}</h3>
              <p className={styles.modalSub}>Notre équipe te contacte sous 24h pour finaliser</p>
            </div>

            {[
              ['nom',   'Pseudo / Nom *',          'text',  'Ton pseudo Otaku'],
              ['email', 'Email *',                 'email', 'ton@email.com'],
              ['phone', 'Téléphone / WhatsApp *',  'tel',   '+237 6XX XXX XXX'],
            ].map(([key,label,type,ph]) => (
              <div key={key} className={styles.formGroup}>
                <label className={styles.formLabel}>{label}</label>
                <input type={type} className={styles.input}
                  value={form[key]} onChange={e => s(key, e.target.value)}
                  placeholder={ph} />
              </div>
            ))}

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Ville</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {['Yaoundé','Douala','Bafoussam','Autre'].map(c => (
                  <button key={c} type="button"
                    className={`${styles.cityBtn} ${form.ville===c?styles.cityActive:''}`}
                    style={form.ville===c ? { borderColor:selectedPlan.color, color:selectedPlan.color, background:selectedPlan.colorLight } : {}}
                    onClick={() => s('ville',c)}>{c}</button>
                ))}
              </div>
            </div>

            <div className={styles.modalNote}>
              ℹ️ Aucun paiement immédiat — notre équipe vous contacte sous 24h
            </div>

            <button className={styles.submitBtn}
              style={{ background:`linear-gradient(135deg, ${selectedPlan.color}, ${selectedPlan.color}cc)` }}
              onClick={submit} disabled={sending}>
              {sending ? '⏳ Envoi...' : `⚡ Envoyer ma demande ${selectedPlan.name}`}
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

// ── Plan Card avec hover effect ──────────────────────
function PlanCard({ plan, onSelect, user }) {
  return (
    <div className={`${styles.planCard} ${plan.popular?styles.planPopular:''} ${plan.elite?styles.planElite:''}`}
      style={{ '--pc': plan.color, '--pcl': plan.colorLight, '--pcb': plan.colorBorder }}>
      {plan.popular && <div className={styles.popularBadge} style={{ background:plan.color }}>⭐ PLUS POPULAIRE</div>}
      {plan.elite   && <div className={styles.eliteBadge}   style={{ background:plan.color }}>👑 PREMIUM</div>}

      <div className={styles.planHeader}>
        <div className={styles.planEmoji}>{plan.emoji}</div>
        <div className={styles.planRankBadge}
          style={{ color:plan.color, borderColor:plan.colorBorder, background:plan.colorLight }}>
          {plan.badge}
        </div>
        <h3 className={styles.planName} style={{ color:plan.color }}>{plan.name}</h3>
        <p className={styles.planTagline}>{plan.tagline}</p>
        <div className={styles.planPrice}>
          <span className={styles.planPriceVal}>{plan.price}</span>
          <span className={styles.planPriceSub}>/ abonnement annuel</span>
        </div>
      </div>

      <div className={styles.planFeatures}>
        {plan.features.map((f,i) => (
          <div key={i} className={styles.planFeature}>
            <span style={{ color:plan.color, fontWeight:900 }}>✓</span>
            <span>{f.icon}</span>
            <span className={styles.featureText}>{f.text}</span>
          </div>
        ))}
        {plan.notIncluded.map((f,i) => (
          <div key={i} className={`${styles.planFeature} ${styles.planFeatureNo}`}>
            <span style={{ color:'var(--border)' }}>✗</span>
            <span className={styles.featureText}>{f}</span>
          </div>
        ))}
      </div>

      <button className={styles.planCta}
        style={{ background:`linear-gradient(135deg,${plan.color},${plan.color}cc)` }}
        onClick={() => onSelect(plan)}>
        {plan.cta}
      </button>
      {!user && <p className={styles.planCtaNote}>Connexion requise</p>}
    </div>
  )
}

// ── Événements à venir + billetterie (RSVP) ──────────
function UpcomingEventsSection({ user, toast }) {
  const { data, loading } = useApi(() => eventsApi.getAll({ status:'upcoming', limit:6 }), [], true)
  const { data: mineData, execute: refetchMine } = useApi(
    () => user ? eventsApi.getMine() : Promise.resolve({ registrations: [] }),
    [user?.id], true
  )
  const [busyId, setBusyId] = useState(null)

  const events = data?.events || []
  const myRegs = mineData?.registrations || []
  const regByEvent = {}
  myRegs.forEach(r => { regByEvent[r.eventId] = r })

  const register = async (eventId) => {
    if (!user) { toast.info("Connecte-toi d'abord !"); return }
    setBusyId(eventId)
    try {
      const r = await eventsApi.register(eventId)
      toast.success(r.message)
      refetchMine()
    } catch(err) { toast.error(err.message) }
    finally { setBusyId(null) }
  }

  const cancelReg = async (registrationId) => {
    setBusyId(registrationId)
    try { await eventsApi.cancel(registrationId); toast.success('Inscription annulée'); refetchMine() }
    catch(err) { toast.error(err.message) }
    finally { setBusyId(null) }
  }

  if (loading || events.length === 0) return null

  return (
    <section className={styles.eventsSection}>
      <div className="container">
        {myRegs.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTag}>🎟️ MES BILLETS</div>
              <h2 className={styles.sectionTitle}>TES <span style={{ color:'var(--green)' }}>INSCRIPTIONS</span></h2>
            </div>
            <div className={styles.ticketsGrid}>
              {myRegs.map(reg => (
                <TicketStub
                  key={reg.id}
                  color={reg.status === 'waitlist' ? '#f59e0b' : '#22c55e'}
                  icon="🎟️"
                  statusLabel={reg.status === 'waitlist' ? "LISTE D'ATTENTE" : 'CONFIRMÉ'}
                  statusActive={reg.status !== 'waitlist'}
                  title={reg.event?.titleF || 'Événement'}
                  subtitle={reg.event?.date ? new Date(reg.event.date).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : ''}
                  meta={[
                    { label: 'Lieu', value: reg.event?.venue || reg.event?.city || '—' },
                    { label: 'Invités', value: reg.guests || 1 },
                  ]}
                  code={reg.ticketCode || reg.id.slice(0, 8).toUpperCase()}
                  footer={
                    <button className={`${styles.eventCardBtn} ${styles.eventCardBtnGhost}`}
                      style={{ padding: '6px 14px', fontSize: '.78rem' }}
                      disabled={busyId === reg.id} onClick={() => cancelReg(reg.id)}>
                      Annuler
                    </button>
                  }
                />
              ))}
            </div>
          </div>
        )}

        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>🎌 BILLETTERIE</div>
          <h2 className={styles.sectionTitle}>ÉVÉNEMENTS <span style={{ color:'var(--green)' }}>À VENIR</span></h2>
          <p className={styles.sectionSub}>Réserve ta place — inscription gratuite, paiement sur place.</p>
        </div>

        <div className={styles.eventsGrid}>
          {events.map(e => {
            const reg = regByEvent[e.id]
            const isFull = e.registered >= e.capacity
            return (
              <div key={e.id} className={styles.eventCard}>
                <div className={styles.eventCardTop}>
                  <span className={styles.eventEmoji}>{e.img || '🎌'}</span>
                  {!e.isFree && e.price > 0 && (
                    <span className={styles.eventTicketBadge} style={{ background:'var(--green-pale)', color:'var(--green)' }}>
                      {e.price} FCFA
                    </span>
                  )}
                </div>
                <h3 className={styles.eventCardTitle}>{e.titleF}</h3>
                <div className={styles.eventCardMeta}>
                  <span>📅 {new Date(e.date).toLocaleDateString('fr-FR', { day:'numeric', month:'long' })}{e.timeStart ? ` · ${e.timeStart}` : ''}</span>
                  <span>📍 {e.venue || e.city}</span>
                  <span>{e.registered}/{e.capacity} inscrits</span>
                </div>

                {reg ? (
                  <button className={`${styles.eventCardBtn} ${styles.eventCardBtnGhost}`}
                    disabled={busyId===reg.id} onClick={() => cancelReg(reg.id)}>
                    {reg.status==='waitlist' ? "🕒 Sur liste d'attente — annuler" : '✅ Inscrit — annuler'}
                  </button>
                ) : (
                  <button className={styles.eventCardBtn} disabled={busyId===e.id} onClick={() => register(e.id)}>
                    {busyId===e.id ? '⏳...' : isFull ? "Rejoindre la liste d'attente" : 'Réserver ma place'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`${styles.faqItem} ${open?styles.faqOpen:''}`}>
      <button className={styles.faqQ} onClick={() => setOpen(o=>!o)}>
        <span>{q}</span>
        <span className={styles.faqArrow}>{open?'▲':'▼'}</span>
      </button>
      {open && <div className={styles.faqA}>{a}</div>}
    </div>
  )
}