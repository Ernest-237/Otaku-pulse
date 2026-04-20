// src/pages/Membership/index.jsx — v3 Interactive, light, palette uniforme
import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth }  from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { API_BASE } from '../../api'
import { useApi } from '../../hooks/useApi'
import Navbar  from '../../components/Navbar'
import Footer  from '../Home/sections/Footer'
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

// ── Carte interactive 3D ──────────────────────────────
function MemberCard({ user, myMembership, isActive }) {
  const cardRef  = useRef(null)
  const glareRef = useRef(null)
  const rafRef   = useRef(null)

  const planData = PLANS.find(p => p.id === (myMembership?.plan || 'elite'))
  const cardColor = planData?.color || '#7c3aed'

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const rect   = cardRef.current.getBoundingClientRect()
      const cx     = rect.left + rect.width  / 2
      const cy     = rect.top  + rect.height / 2
      const dx     = (e.clientX - cx) / (rect.width  / 2) // -1 à 1
      const dy     = (e.clientY - cy) / (rect.height / 2)
      const rotX   = -dy * 16
      const rotY   =  dx * 16
      const shine  = `${50 + dx * 30}% ${50 + dy * 30}%`

      cardRef.current.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.04,1.04,1)`
      if (glareRef.current) {
        glareRef.current.style.background = `radial-gradient(circle at ${shine}, rgba(255,255,255,0.35) 0%, transparent 65%)`
        glareRef.current.style.opacity = '1'
      }
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)'
    }
    if (glareRef.current) glareRef.current.style.opacity = '0'
  }, [])

  const expiryStr = myMembership?.expiresAt
    ? `${String(new Date(myMembership.expiresAt).getMonth()+1).padStart(2,'0')}/${new Date(myMembership.expiresAt).getFullYear()}`
    : '12/2025'

  return (
    <div className={styles.cardWrap} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <div ref={cardRef} className={styles.card3d}>
        {/* Reflet lumineux */}
        <div ref={glareRef} className={styles.cardGlare} />

        {/* Fond holographique */}
        <div className={styles.cardHolo} style={{ background: `linear-gradient(135deg, ${cardColor}33, ${cardColor}11, transparent)` }} />

        {/* Contenu carte */}
        <div className={styles.cardContent}>
          <div className={styles.cardTop}>
            <div className={styles.cardBrand}>
              <span className={styles.cardBolt}>⚡</span>
              <span className={styles.cardBrandName}>OTAKU PULSE</span>
            </div>
            <div className={styles.cardStatus} style={{ color: isActive ? '#4ade80' : '#94a3b8' }}>
              <span className={styles.cardStatusDot} style={{ background: isActive ? '#4ade80' : '#94a3b8', boxShadow: isActive ? '0 0 8px #4ade80' : 'none' }} />
              {isActive ? 'ACTIF' : 'EN ATTENTE'}
            </div>
          </div>

          {/* Chip */}
          <div className={styles.cardChip}>
            <div className={styles.chipInner} />
          </div>

          <div className={styles.cardName}>{(user?.pseudo || 'TON PSEUDO').toUpperCase()}</div>

          <div className={styles.cardMeta}>
            <div>
              <div className={styles.cardMetaLabel}>NIVEAU</div>
              <div className={styles.cardMetaVal} style={{ color: cardColor }}>
                {(myMembership?.plan || 'ELITE').toUpperCase()}
              </div>
            </div>
            <div>
              <div className={styles.cardMetaLabel}>EXPIRE</div>
              <div className={styles.cardMetaVal}>{expiryStr}</div>
            </div>
            <div>
              <div className={styles.cardMetaLabel}>ID</div>
              <div className={styles.cardMetaVal} style={{ fontSize:'.65rem', letterSpacing:1 }}>
                {isActive ? (myMembership?.cardId || 'OP-XXXXX') : 'PENDING'}
              </div>
            </div>
          </div>
        </div>

        {/* Déco cercles */}
        <div className={styles.cardCircle1} style={{ background: cardColor }} />
        <div className={styles.cardCircle2} style={{ background: cardColor }} />
      </div>
      {/* Ombre dynamique */}
      <div className={styles.cardShadow} style={{ background: `radial-gradient(ellipse, ${cardColor}40, transparent)` }} />
    </div>
  )
}

// ── Page principale ───────────────────────────────────
export default function MembershipPage() {
  const { user } = useAuth()
  const toast    = useToast()
  const navigate = useNavigate()

  const { data: mData } = useApi(
    () => user ? fetch(`${API_BASE}/api/membership/my`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('op_token')}` }
    }).then(r => r.json()) : Promise.resolve({ membership: null }),
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
      const res = await fetch(`${API_BASE}/api/membership/request`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('op_token')}` },
        body: JSON.stringify({ ...form, userId: user?.id }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur serveur')
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

            {/* Carte droite — interactive 3D */}
            <div className={styles.heroRight}>
              <MemberCard user={user} myMembership={myMembership} isActive={isActive} />
              <p className={styles.cardHint}>↕ Survole la carte</p>
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