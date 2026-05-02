// src/pages/Manga/plans/index.jsx — Souscription abonnements manga
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Crown, Check, X, Sparkles, Calendar, MessageCircle,
  Zap, Star, Lock, ArrowRight, Loader2,
} from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi, useMutation } from '../../../hooks/useApi'
import { subscriptionsApi } from '../../../api'
import { useToast } from '../../../contexts/ToastContext'
import Navbar from '../../../components/Navbar'
import Footer from '../../Home/sections/Footer'
import Modal from '../../../components/ui/Modal'
import { PageLoader } from '../../../components/ui/Spinner'
import styles from './Plans.module.css'

const PLAN_CONFIG = {
  daily: {
    color: '#06b6d4',
    icon: '⚡',
    badge: 'PASS JOURNALIER',
    durationLabel: { fr: '24 heures', en: '24 hours' },
    titleF: 'Day Pass',
    titleE: 'Day Pass',
    features: {
      fr: ['Lecture illimitée 24h','Tous les mangas premium','Sans publicité','Idéal pour tester'],
      en: ['Unlimited reading 24h','All premium manga','No ads','Perfect to test'],
    },
  },
  weekly: {
    color: '#22c55e',
    icon: '🔥',
    badge: 'POPULAIRE',
    durationLabel: { fr: '7 jours', en: '7 days' },
    titleF: 'Hebdomadaire',
    titleE: 'Weekly',
    features: {
      fr: ['Lecture illimitée 7j','Tous les mangas premium','Sans publicité','Téléchargement hors-ligne'],
      en: ['Unlimited reading 7d','All premium manga','No ads','Offline download'],
    },
  },
  monthly: {
    color: '#a78bfa',
    icon: '👑',
    badge: 'MEILLEUR CHOIX',
    featured: true,
    durationLabel: { fr: '30 jours', en: '30 days' },
    titleF: 'Mensuel',
    titleE: 'Monthly',
    features: {
      fr: ['Lecture illimitée 30j','Tous les mangas premium','Sans publicité','Téléchargement hors-ligne','Accès aux sorties anticipées','Badge membre exclusif'],
      en: ['Unlimited reading 30d','All premium manga','No ads','Offline download','Early access','Exclusive member badge'],
    },
  },
  yearly: {
    color: '#eab308',
    icon: '⭐',
    badge: 'MEILLEURE VALEUR',
    durationLabel: { fr: '365 jours', en: '365 days' },
    titleF: 'Annuel',
    titleE: 'Yearly',
    savings: { fr: '−45%', en: '−45%' },
    features: {
      fr: ['Lecture illimitée 365j','Tous les mangas premium','Sans publicité','Téléchargement hors-ligne','Accès aux sorties anticipées','Badge membre exclusif','Goodies surprises','Support prioritaire'],
      en: ['Unlimited reading 365d','All premium manga','No ads','Offline download','Early access','Exclusive member badge','Surprise goodies','Priority support'],
    },
  },
}

const copy = {
  fr: {
    badge: '👑 ABONNEMENT PREMIUM',
    title: 'Choisis ton',
    titleAccent: 'Abonnement',
    subtitle: 'Lecture illimitée de tous les mangas premium. Soutiens directement les créateurs locaux.',
    activeBadge: 'ABONNEMENT ACTIF',
    activePlan: 'Tu es actuellement abonné',
    activeUntil: 'Jusqu\'au',
    needLoginTitle: 'Connecte-toi pour t\'abonner',
    needLoginSub: 'Crée ton compte ou connecte-toi pour souscrire à un abonnement.',
    login: 'Se connecter',
    selectPlan: 'Choisir',
    perDay: '/ jour',
    perWeek: '/ semaine',
    perMonth: '/ mois',
    perYear: '/ an',
    fcfa: 'FCFA',
    why: 'Pourquoi s\'abonner ?',
    whySub: 'Otaku Pulse est la première plateforme manga camerounaise qui rémunère directement les créateurs locaux.',
    benefit1Title: 'Lecture illimitée',
    benefit1Sub: 'Accède à tous les mangas premium sans restriction',
    benefit2Title: 'Soutiens les créateurs',
    benefit2Sub: 'Une grande partie de ton abonnement va directement aux auteurs',
    benefit3Title: 'Sans publicité',
    benefit3Sub: 'Profite d\'une expérience de lecture immersive sans pub',
    benefit4Title: 'Sorties anticipées',
    benefit4Sub: 'Accède aux nouveaux chapitres avant tout le monde',
    paymentTitle: '💸 Modes de paiement',
    paymentSub: 'Paiement 100% local et sécurisé via Mobile Money',
    faqTitle: 'Questions fréquentes',
    faq: [
      { q: 'Comment se passe l\'activation ?', a: 'Tu choisis ton plan, on te contacte sur WhatsApp pour valider le paiement Mobile Money, puis ton abonnement est activé en moins d\'une heure.' },
      { q: 'Puis-je annuler à tout moment ?', a: 'Oui, ton abonnement est sans engagement. Tu peux contacter notre support pour annuler quand tu veux.' },
      { q: 'Comment fonctionne le partage avec les auteurs ?', a: 'Une part importante de chaque abonnement est reversée aux créateurs en fonction du temps de lecture sur leurs œuvres.' },
      { q: 'Que se passe-t-il à l\'expiration ?', a: 'Tu peux toujours lire les chapitres gratuits, mais les chapitres premium seront verrouillés jusqu\'à renouvellement.' },
    ],
    requestTitle: 'Demande d\'abonnement',
    requestPlan: 'Plan choisi',
    requestPrice: 'Montant',
    requestWhatsapp: 'Numéro WhatsApp',
    requestWhatsappPlaceholder: '+237 6XX XX XX XX',
    requestNote: 'Notre équipe te contactera sur WhatsApp dans l\'heure pour valider ton paiement (MTN Money / Orange Money). Ton abonnement sera activé immédiatement après réception.',
    requestSubmit: '✅ Envoyer ma demande',
    requestPending: '⏳ Tu as déjà une demande en attente. Patiente, on te contacte bientôt !',
    requestSuccess: '🎉 Demande envoyée ! Notre équipe te contacte sur WhatsApp.',
  },
  en: {
    badge: '👑 PREMIUM SUBSCRIPTION',
    title: 'Choose your',
    titleAccent: 'Plan',
    subtitle: 'Unlimited reading of all premium manga. Directly support local creators.',
    activeBadge: 'ACTIVE SUBSCRIPTION',
    activePlan: 'You\'re currently subscribed',
    activeUntil: 'Until',
    needLoginTitle: 'Log in to subscribe',
    needLoginSub: 'Create your account or log in to subscribe to a plan.',
    login: 'Log in',
    selectPlan: 'Choose',
    perDay: '/ day',
    perWeek: '/ week',
    perMonth: '/ month',
    perYear: '/ year',
    fcfa: 'FCFA',
    why: 'Why subscribe?',
    whySub: 'Otaku Pulse is the first Cameroonian manga platform that directly pays local creators.',
    benefit1Title: 'Unlimited reading',
    benefit1Sub: 'Access all premium manga without restrictions',
    benefit2Title: 'Support creators',
    benefit2Sub: 'A large portion of your subscription goes directly to authors',
    benefit3Title: 'Ad-free',
    benefit3Sub: 'Enjoy an immersive reading experience without ads',
    benefit4Title: 'Early access',
    benefit4Sub: 'Read new chapters before everyone else',
    paymentTitle: '💸 Payment methods',
    paymentSub: '100% local and secure payment via Mobile Money',
    faqTitle: 'Frequently asked questions',
    faq: [
      { q: 'How does activation work?', a: 'Choose your plan, we contact you on WhatsApp to validate Mobile Money payment, then your subscription is activated within an hour.' },
      { q: 'Can I cancel anytime?', a: 'Yes, your subscription has no commitment. You can contact support to cancel whenever you want.' },
      { q: 'How does revenue sharing work?', a: 'A significant portion of each subscription is paid to creators based on reading time on their works.' },
      { q: 'What happens when it expires?', a: 'You can still read free chapters, but premium chapters will be locked until renewal.' },
    ],
    requestTitle: 'Subscription request',
    requestPlan: 'Selected plan',
    requestPrice: 'Amount',
    requestWhatsapp: 'WhatsApp number',
    requestWhatsappPlaceholder: '+237 6XX XX XX XX',
    requestNote: 'Our team will contact you on WhatsApp within the hour to validate your payment (MTN Money / Orange Money). Your subscription will be activated immediately after receipt.',
    requestSubmit: '✅ Send my request',
    requestPending: '⏳ You already have a pending request. Wait, we\'ll contact you soon!',
    requestSuccess: '🎉 Request sent! Our team will contact you on WhatsApp.',
  },
}

export default function PlansPage() {
  const { lang } = useLang()
  const t = copy[lang]
  const { user, isLoggedIn, activeSubscription, refreshSubscription } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [selectedPlan, setSelectedPlan] = useState(null)

  useEffect(() => { document.title = `👑 Abonnements — Otaku Pulse` }, [])

  const { data: plansData, loading: plansLoading } = useApi(
    () => subscriptionsApi.getPlans(),
    [],
    true
  )
  const plans = plansData?.plans || {}

  // User's pending request si existe
  const { data: mySubsData, refresh: refreshMySubs } = useApi(
    () => isLoggedIn ? subscriptionsApi.getMy() : Promise.resolve({ subscriptions: [] }),
    [isLoggedIn],
    isLoggedIn
  )
  const myPendingSub = mySubsData?.subscriptions?.find(s => s.status === 'pending')

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className="container">
          <div className={styles.heroInner}>
            <span className={styles.heroBadge}>{t.badge}</span>
            <h1 className={styles.heroTitle}>
              {t.title} <span className={styles.heroAccent}>{t.titleAccent}</span>
            </h1>
            <p className={styles.heroSub}>{t.subtitle}</p>

            {/* Bandeau abonnement actif */}
            {isLoggedIn && activeSubscription && activeSubscription.status === 'active' && (
              <div className={styles.activeBanner}>
                <Crown size={18} fill="currentColor" />
                <div className={styles.activeBannerText}>
                  <strong>{t.activePlan} <span style={{ color:'var(--green-700)' }}>{PLAN_CONFIG[activeSubscription.planType]?.titleF || activeSubscription.planType}</span></strong>
                  <span>{t.activeUntil} {new Date(activeSubscription.expiresAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { dateStyle:'long' })}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── PLANS GRID ── */}
      <section className={styles.plansSection}>
        <div className="container">
          {plansLoading ? <PageLoader /> : (
            <div className={styles.plansGrid}>
              {Object.entries(PLAN_CONFIG).map(([planKey, conf]) => {
                const planData = plans[planKey]
                if (!planData) return null

                const isActive = activeSubscription?.planType === planKey && activeSubscription?.status === 'active'
                const period = planKey === 'daily' ? t.perDay
                  : planKey === 'weekly' ? t.perWeek
                  : planKey === 'monthly' ? t.perMonth
                  : t.perYear

                return (
                  <div
                    key={planKey}
                    className={`${styles.planCard} ${conf.featured ? styles.planFeatured : ''}`}
                    style={{ '--plan-color': conf.color }}
                  >
                    {conf.badge && (
                      <span className={styles.planBadge}>
                        {conf.featured && <Sparkles size={11} />}
                        {conf.badge}
                      </span>
                    )}

                    <div className={styles.planIcon} style={{ background: `${conf.color}22`, color: conf.color }}>
                      {conf.icon}
                    </div>

                    <h3 className={styles.planTitle}>{lang === 'fr' ? conf.titleF : conf.titleE}</h3>
                    <p className={styles.planDuration}>
                      <Calendar size={12} /> {conf.durationLabel[lang]}
                    </p>

                    <div className={styles.planPrice}>
                      <span className={styles.priceAmount}>{planData.amount?.toLocaleString()}</span>
                      <span className={styles.priceCurrency}>{t.fcfa}</span>
                      <span className={styles.pricePeriod}>{period}</span>
                    </div>

                    {conf.savings && (
                      <span className={styles.planSavings}>{conf.savings[lang]}</span>
                    )}

                    <ul className={styles.planFeatures}>
                      {conf.features[lang].map((f, i) => (
                        <li key={i}>
                          <Check size={14} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {isActive ? (
                      <div className={styles.planActiveBtn}>
                        <Check size={16} /> {t.activeBadge}
                      </div>
                    ) : !isLoggedIn ? (
                      <Link
                        to="/"
                        className={styles.planBtn}
                        onClick={() => sessionStorage.setItem('openLogin', '1')}
                      >
                        🔐 {t.login}
                      </Link>
                    ) : myPendingSub ? (
                      <button className={styles.planBtnPending} disabled>
                        <Loader2 size={14} className={styles.spinIcon} /> En attente
                      </button>
                    ) : (
                      <button
                        className={styles.planBtn}
                        onClick={() => setSelectedPlan({ key: planKey, ...planData, conf })}
                      >
                        {t.selectPlan} <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className={styles.benefitsSection}>
        <div className="container">
          <div className={styles.benefitsHead}>
            <h2 className={styles.benefitsTitle}>{t.why}</h2>
            <p className={styles.benefitsSub}>{t.whySub}</p>
          </div>
          <div className={styles.benefitsGrid}>
            {[
              { icon: <Zap size={22} />,    title: t.benefit1Title, sub: t.benefit1Sub, color: '#22c55e' },
              { icon: <Star size={22} />,   title: t.benefit2Title, sub: t.benefit2Sub, color: '#a78bfa' },
              { icon: <Lock size={22} />,   title: t.benefit3Title, sub: t.benefit3Sub, color: '#06b6d4' },
              { icon: <Sparkles size={22} />, title: t.benefit4Title, sub: t.benefit4Sub, color: '#eab308' },
            ].map((b, i) => (
              <div key={i} className={styles.benefitCard}>
                <div className={styles.benefitIcon} style={{ background: `${b.color}18`, color: b.color }}>
                  {b.icon}
                </div>
                <h3 className={styles.benefitCardTitle}>{b.title}</h3>
                <p className={styles.benefitCardSub}>{b.sub}</p>
              </div>
            ))}
          </div>

          {/* Payment methods */}
          <div className={styles.paymentBox}>
            <h3 className={styles.paymentTitle}>{t.paymentTitle}</h3>
            <p className={styles.paymentSub}>{t.paymentSub}</p>
            <div className={styles.paymentMethods}>
              <div className={styles.paymentMethod}>
                <span className={styles.paymentLogo}>📱</span>
                <span>MTN Mobile Money</span>
              </div>
              <div className={styles.paymentMethod}>
                <span className={styles.paymentLogo}>🟠</span>
                <span>Orange Money</span>
              </div>
              <div className={styles.paymentMethod}>
                <span className={styles.paymentLogo}>💬</span>
                <span>Validation WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.faqSection}>
        <div className="container">
          <h2 className={styles.faqTitle}>{t.faqTitle}</h2>
          <div className={styles.faqList}>
            {t.faq.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Modal demande abo */}
      {selectedPlan && (
        <SubscribeModal
          plan={selectedPlan}
          user={user}
          t={t}
          lang={lang}
          onClose={() => setSelectedPlan(null)}
          onSuccess={() => {
            refreshMySubs()
            refreshSubscription?.()
            toast.success(t.requestSuccess)
            setSelectedPlan(null)
          }}
        />
      )}

      <Footer />
    </div>
  )
}

/* ══ SUBSCRIBE MODAL ══════════════════════════════════ */
function SubscribeModal({ plan, user, t, lang, onClose, onSuccess }) {
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || user?.phone || '')
  const toast = useToast()

  const { mutate, loading } = useMutation((data) => subscriptionsApi.request(data))

  const handleSubmit = async () => {
    if (!whatsapp.trim() || whatsapp.trim().length < 8) {
      return toast.error('Numéro WhatsApp invalide')
    }
    const { error } = await mutate({
      planType: plan.key,
      whatsappNumber: whatsapp.trim(),
      paymentMethod: 'manual',
    })
    if (error) toast.error(error)
    else onSuccess()
  }

  return (
    <Modal isOpen onClose={onClose} title={`${plan.conf.icon} ${t.requestTitle}`}
      footer={
        <>
          <button onClick={onClose} className={styles.modalBtnGhost}>Annuler</button>
          <button onClick={handleSubmit} disabled={loading} className={styles.modalBtnPrimary}>
            {loading ? <Loader2 size={14} className={styles.spinIcon} /> : null}
            {t.requestSubmit}
          </button>
        </>
      }>
      <div className={styles.modalSummary}>
        <div className={styles.modalSummaryRow}>
          <span>{t.requestPlan}</span>
          <strong style={{ color: plan.conf.color }}>
            {lang === 'fr' ? plan.conf.titleF : plan.conf.titleE} ({plan.conf.durationLabel[lang]})
          </strong>
        </div>
        <div className={styles.modalSummaryRow}>
          <span>{t.requestPrice}</span>
          <strong style={{ fontSize:'1.2rem', color:'var(--green-700)' }}>
            {plan.amount?.toLocaleString()} FCFA
          </strong>
        </div>
      </div>

      <div className={styles.modalField}>
        <label>{t.requestWhatsapp} *</label>
        <input
          type="tel"
          value={whatsapp}
          onChange={e => setWhatsapp(e.target.value)}
          placeholder={t.requestWhatsappPlaceholder}
          className={styles.modalInput}
        />
      </div>

      <div className={styles.modalNote}>
        <MessageCircle size={16} />
        <p>{t.requestNote}</p>
      </div>
    </Modal>
  )
}

/* ══ FAQ ITEM ═════════════════════════════════════════ */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`${styles.faqItem} ${open ? styles.faqItemOpen : ''}`}>
      <button className={styles.faqQ} onClick={() => setOpen(o => !o)}>
        <span>{q}</span>
        <span className={styles.faqIcon}>{open ? '−' : '+'}</span>
      </button>
      {open && <div className={styles.faqA}>{a}</div>}
    </div>
  )
}