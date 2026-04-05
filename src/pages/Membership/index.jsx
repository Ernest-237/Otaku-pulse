import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  CalendarClock,
  Check,
  ChevronDown,
  Crown,
  Gem,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  TicketPercent,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useLang } from '../../contexts/LangContext'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { API_BASE } from '../../api'
import Navbar from '../../components/Navbar'
import Footer from '../Home/sections/Footer'
import styles from './Membership.module.css'

const copy = {
  fr: {
    heroBadge: 'Programme annuel exclusif',
    heroTitleA: 'LA CARTE MEMBRE',
    heroTitleB: 'OTAKU PULSE',
    heroSub:
      'Rejoins la communauté des vrais fans avec un abonnement annuel, des avantages exclusifs et une identité membre au sein de l’univers Otaku Pulse au Cameroun.',
    heroBtn: 'Choisir mon rang',
    stats: [
      ['1 an', 'Validité'],
      ['3 rangs', 'Niveaux'],
      ['Membres only', 'Avantages'],
      ['Officiel', 'Statut'],
    ],
    conceptTitle: 'C’est quoi la Carte Membre Otaku Pulse ?',
    conceptText:
      'La Carte Membre Otaku Pulse est un abonnement annuel qui permet aux membres de profiter d’avantages exclusifs, de promotions réservées, et de réductions sur une sélection d’articles éligibles tout au long de l’année. Chaque carte est nominative, numérique et valable 12 mois à partir de l’activation.',
    conceptPills: ['100% numérique', 'Nominative & sécurisée', 'Valable 1 an', 'Cameroun exclusif'],
    sectionTag: 'Choisir ton rang',
    sectionTitleA: '3 NIVEAUX,',
    sectionTitleB: '1 COMMUNAUTÉ',
    sectionSub: 'Chaque rang offre des avantages croissants. Monte en grade et profite du meilleur d’Otaku Pulse.',
    annual: '/ abonnement annuel',
    requireLogin: 'Connexion requise pour s’abonner',
    legal:
      'Important : les réductions et avantages s’appliquent uniquement sur les articles éligibles et selon les offres en cours. Otaku Pulse se réserve le droit de modifier les avantages avec préavis.',
    compareTag: 'Comparatif',
    compareTitleA: 'QUI OFFRE',
    compareTitleB: 'QUOI ?',
    compareHead: 'Avantage',
    faqTag: 'Questions fréquentes',
    faqTitleA: 'ON RÉPOND À',
    faqTitleB: 'TES QUESTIONS',
    ctaTitleA: 'Prêt à rejoindre la',
    ctaTitleB: 'communauté',
    ctaSub: 'Choisis ton rang, remplis la demande, et notre équipe te contacte sous 24h pour finaliser ton abonnement.',
    ctaPrimary: 'Voir les abonnements',
    ctaSecondary: 'Mon profil',
    successTitle: 'DEMANDE ENVOYÉE !',
    successText: 'Notre équipe Otaku Pulse vous contacte sous 24-48h pour finaliser votre abonnement et activer votre Carte Membre.',
    formTitle: 'Remplis ce formulaire — notre équipe te contacte sous 24h pour finaliser',
    pseudo: 'Pseudo / Nom *',
    email: 'Email *',
    phone: 'Téléphone / WhatsApp *',
    city: 'Ville',
    message: 'Message / Précisions',
    messagePlaceholder: 'Questions, demandes spéciales...',
    note: 'Aucun paiement immédiat — notre équipe vous contacte pour finaliser.',
    submit: 'Envoyer ma demande',
    sending: 'Envoi...',
    loginFirst: 'Connecte-toi d’abord pour rejoindre le programme membre !',
    sent: '✅ Demande envoyée ! Notre équipe vous contacte sous 24h.',
    fillRequired: 'Remplis tous les champs obligatoires',
    chooseRank: 'Choisir ce rang',
    faq: [
      {
        q: 'Comment fonctionne l’abonnement annuel ?',
        a: 'La Carte Membre Otaku Pulse est valable 12 mois à partir de la date de validation. Notre équipe vous contacte après votre demande pour finaliser les détails et l’activation.',
      },
      {
        q: 'Les réductions s’appliquent-elles à toute la boutique ?',
        a: 'Non. Les réductions et avantages s’appliquent uniquement sur les articles éligibles selon les offres en cours. Une liste est disponible dans votre espace membre.',
      },
      {
        q: 'Comment puis-je changer de niveau ?',
        a: 'Vous pouvez upgrader votre abonnement à tout moment. La différence de prix est calculée au prorata. Contactez-nous via WhatsApp ou le formulaire.',
      },
      {
        q: 'La carte membre est-elle numérique ?',
        a: 'Oui. Votre carte est générée numériquement avec votre photo, pseudo, niveau et QR code de validation. Elle est accessible depuis votre profil.',
      },
      {
        q: 'Comment se passe le paiement ?',
        a: 'Après votre demande, notre équipe vous contacte pour finaliser le paiement via MTN Money, Orange Money ou virement. Aucun paiement en ligne automatique pour l’instant.',
      },
    ],
  },
  en: {
    heroBadge: 'Exclusive yearly program',
    heroTitleA: 'THE OTAKU PULSE',
    heroTitleB: 'MEMBERSHIP CARD',
    heroSub:
      'Join the real fan community with a yearly subscription, exclusive perks, and a member identity inside the Otaku Pulse universe in Cameroon.',
    heroBtn: 'Choose my rank',
    stats: [
      ['1 year', 'Validity'],
      ['3 ranks', 'Levels'],
      ['Members only', 'Benefits'],
      ['Official', 'Status'],
    ],
    conceptTitle: 'What is the Otaku Pulse Membership Card?',
    conceptText:
      'The Otaku Pulse Membership Card is a yearly subscription that gives members access to exclusive benefits, reserved promotions, and discounts on selected eligible items throughout the year. Each card is personal, digital and valid for 12 months from activation.',
    conceptPills: ['100% digital', 'Personal & secure', 'Valid for 1 year', 'Cameroon exclusive'],
    sectionTag: 'Choose your rank',
    sectionTitleA: '3 LEVELS,',
    sectionTitleB: '1 COMMUNITY',
    sectionSub: 'Each rank unlocks better perks. Level up and enjoy the best of Otaku Pulse.',
    annual: '/ yearly membership',
    requireLogin: 'Login required to subscribe',
    legal:
      'Important: discounts and benefits apply only to eligible items and active offers. Otaku Pulse may update benefits with prior notice.',
    compareTag: 'Comparison',
    compareTitleA: 'WHO GETS',
    compareTitleB: 'WHAT?',
    compareHead: 'Benefit',
    faqTag: 'FAQ',
    faqTitleA: 'WE ANSWER',
    faqTitleB: 'YOUR QUESTIONS',
    ctaTitleA: 'Ready to join the',
    ctaTitleB: 'community',
    ctaSub: 'Choose your rank, submit your request, and our team will contact you within 24 hours to finalize your membership.',
    ctaPrimary: 'View memberships',
    ctaSecondary: 'My profile',
    successTitle: 'REQUEST SENT!',
    successText: 'Our Otaku Pulse team will contact you within 24–48 hours to finalize your membership and activate your Membership Card.',
    formTitle: 'Fill in this form — our team will contact you within 24 hours to finalize everything',
    pseudo: 'Name / Username *',
    email: 'Email *',
    phone: 'Phone / WhatsApp *',
    city: 'City',
    message: 'Message / Details',
    messagePlaceholder: 'Questions, special requests...',
    note: 'No immediate payment — our team will contact you to finalize.',
    submit: 'Send my request',
    sending: 'Sending...',
    loginFirst: 'Log in first to join the membership program!',
    sent: '✅ Request sent! Our team will contact you within 24 hours.',
    fillRequired: 'Please fill all required fields',
    chooseRank: 'Choose this rank',
    faq: [
      {
        q: 'How does the yearly membership work?',
        a: 'The Otaku Pulse Membership Card is valid for 12 months from the approval date. Our team contacts you after your request to finalize details and activation.',
      },
      {
        q: 'Do discounts apply to the whole shop?',
        a: 'No. Discounts and benefits apply only to eligible items depending on the current offers. A list is available in your member area.',
      },
      {
        q: 'How can I change my level?',
        a: 'You can upgrade your membership at any time. The price difference is calculated proportionally. Contact us via WhatsApp or the form.',
      },
      {
        q: 'Is the membership card digital?',
        a: 'Yes. Your card is generated digitally with your photo, username, level and validation QR code. It is available from your profile.',
      },
      {
        q: 'How does payment work?',
        a: 'After your request, our team will contact you to finalize payment via MTN Money, Orange Money or bank transfer. There is no automatic online payment yet.',
      },
    ],
  },
}

const planData = {
  fr: [
    {
      id: 'basic',
      icon: Zap,
      name: 'Pulse Basic',
      tagline: 'L’entrée dans la communauté',
      price: 'Sur devis',
      color: '#22c55e',
      badge: 'GENIN',
      cta: 'Rejoindre Basic',
      features: [
        'Réductions sur articles éligibles sélectionnés',
        'Accès prioritaire à certaines promotions',
        'Coupon surprise anniversaire',
        'Offres membres de base',
        'Badge numérique Otaku Pulse',
        'Newsletter exclusive membres',
      ],
      notIncluded: ['Drops anticipés', 'Réductions événements', 'Statut VIP'],
    },
    {
      id: 'plus',
      icon: Gem,
      name: 'Pulse Plus',
      tagline: 'Pour les vrais nakamas',
      price: 'Sur devis',
      color: '#2563eb',
      badge: 'CHŪNIN',
      popular: true,
      cta: 'Passer à Plus',
      features: [
        'Réductions renforcées sur articles éligibles',
        'Accès anticipé aux drops et promotions',
        'Réductions sur certains événements Otaku Pulse',
        'Récompenses fidélité améliorées',
        'Offres exclusives membres Plus',
        'Priorité sur campagnes promotionnelles',
        'Badge Plus + profil enrichi',
      ],
      notIncluded: ['Statut VIP Elite', 'Éditions limitées exclusives'],
    },
    {
      id: 'elite',
      icon: Crown,
      name: 'Pulse Elite',
      tagline: 'Le rang des légendes',
      price: 'Sur devis',
      color: '#d97706',
      badge: 'HOKAGE',
      elite: true,
      cta: 'Devenir Elite',
      features: [
        'Meilleures réductions sur tous articles éligibles',
        'Accès VIP aux promotions et lancements exclusifs',
        'Avantages premium sur événements sélectionnés',
        'Programme fidélité Elite renforcé',
        'Accès éditions limitées et collaborations',
        'Statut Premium affiché dans la communauté',
        'Support client prioritaire dédié',
        'Surprise Elite annuelle personnalisée',
      ],
      notIncluded: [],
    },
  ],
  en: [
    {
      id: 'basic',
      icon: Zap,
      name: 'Pulse Basic',
      tagline: 'Your entry into the community',
      price: 'Quote based',
      color: '#22c55e',
      badge: 'GENIN',
      cta: 'Join Basic',
      features: [
        'Discounts on selected eligible items',
        'Priority access to some promotions',
        'Birthday surprise coupon',
        'Basic member offers',
        'Digital Otaku Pulse badge',
        'Members-only newsletter',
      ],
      notIncluded: ['Early drops', 'Event discounts', 'VIP status'],
    },
    {
      id: 'plus',
      icon: Gem,
      name: 'Pulse Plus',
      tagline: 'For true nakamas',
      price: 'Quote based',
      color: '#2563eb',
      badge: 'CHŪNIN',
      popular: true,
      cta: 'Upgrade to Plus',
      features: [
        'Stronger discounts on eligible items',
        'Early access to drops and promos',
        'Discounts on selected Otaku Pulse events',
        'Improved loyalty rewards',
        'Exclusive Plus member offers',
        'Priority on promotional campaigns',
        'Plus badge + richer profile',
      ],
      notIncluded: ['Elite VIP status', 'Exclusive limited editions'],
    },
    {
      id: 'elite',
      icon: Crown,
      name: 'Pulse Elite',
      tagline: 'The rank of legends',
      price: 'Quote based',
      color: '#d97706',
      badge: 'HOKAGE',
      elite: true,
      cta: 'Become Elite',
      features: [
        'Best discounts on all eligible items',
        'VIP access to exclusive launches and promos',
        'Premium benefits on selected events',
        'Enhanced Elite loyalty rewards',
        'Access to limited editions and collabs',
        'Premium status inside the community',
        'Dedicated priority support',
        'Personalized yearly Elite surprise',
      ],
      notIncluded: [],
    },
  ],
}

const compareRows = {
  fr: [
    ['Réductions sur articles éligibles', '✓', '✓✓', '✓✓✓'],
    ['Accès prioritaire aux promos', '✓', '✓', '✓'],
    ['Accès anticipé (early access)', '✗', '✓', '✓'],
    ['Réductions événements', '✗', '✓', '✓'],
    ['Offres membres exclusives', '✗', '✓', '✓'],
    ['Accès éditions limitées', '✗', '✗', '✓'],
    ['Statut VIP communauté', '✗', '✗', '✓'],
    ['Support client prioritaire', '✗', '✗', '✓'],
    ['Cadeau Elite annuel', '✗', '✗', '✓'],
  ],
  en: [
    ['Discounts on eligible items', '✓', '✓✓', '✓✓✓'],
    ['Priority access to promos', '✓', '✓', '✓'],
    ['Early access', '✗', '✓', '✓'],
    ['Event discounts', '✗', '✓', '✓'],
    ['Exclusive member offers', '✗', '✓', '✓'],
    ['Limited editions access', '✗', '✗', '✓'],
    ['Community VIP status', '✗', '✗', '✓'],
    ['Priority customer support', '✗', '✗', '✓'],
    ['Annual Elite gift', '✗', '✗', '✓'],
  ],
}

export default function MembershipPage() {
  const { lang } = useLang()
  const { user } = useAuth()
  const toast = useToast()
  const t = copy[lang]
  const plans = planData[lang]

  const [selectedPlan, setSelectedPlan] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    nom: user?.pseudo || '',
    email: user?.email || '',
    phone: user?.phone || '',
    plan: '',
    message: '',
    ville: 'Yaoundé',
  })

  const memberCardId = useMemo(() => `OP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, [])
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const openForm = (plan) => {
    if (!user) {
      toast.info(t.loginFirst)
      return
    }
    setSelectedPlan(plan)
    setField('plan', plan.id)
    setFormOpen(true)
  }

  const submit = async () => {
    if (!form.nom || !form.email || !form.phone) {
      toast.error(t.fillRequired)
      return
    }
    setSending(true)
    try {
      const response = await fetch(`${API_BASE}/api/membership/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('op_token')}`,
        },
        body: JSON.stringify({ ...form, userId: user?.id }),
      })
      if (!response.ok) throw new Error((await response.json()).error || 'Server error')
      setDone(true)
      setFormOpen(false)
      toast.success(t.sent)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <section className={styles.hero}>
        <div className={styles.heroGrid} />
        <div className={styles.heroOrb1} />
        <div className={styles.heroOrb2} />
        <div className="container">
          <div className={styles.heroLayout}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <BadgeCheck size={14} />
                {t.heroBadge}
              </div>
              <h1 className={styles.heroTitle}>
                {t.heroTitleA} <span>{t.heroTitleB}</span>
              </h1>
              <p className={styles.heroSub}>{t.heroSub}</p>

              <div className={styles.heroStats}>
                {t.stats.map(([value, label], index) => (
                  <div key={index} className={styles.heroStat}>
                    <span className={styles.heroStatVal}>{value}</span>
                    <span className={styles.heroStatLbl}>{label}</span>
                  </div>
                ))}
              </div>

              <a href="#plans" className={styles.heroBtn}>
                <Zap size={16} />
                {t.heroBtn}
              </a>
            </div>

            <div className={styles.heroCard}>
              <div className={styles.hCardInner}>
                <div className={styles.hCardTop}>
                  <div className={styles.hCardLogo}>OTAKU PULSE</div>
                  <div className={styles.hCardStatus}>● ACTIVE</div>
                </div>
                <div className={styles.hCardName}>{user?.pseudo || 'Your username'}</div>
                <div className={styles.hCardRow}>
                  <div>
                    <div className={styles.hCardLabel}>LEVEL</div>
                    <div className={styles.hCardVal}>PULSE ELITE</div>
                  </div>
                  <div>
                    <div className={styles.hCardLabel}>EXPIRE</div>
                    <div className={styles.hCardVal}>03/2027</div>
                  </div>
                </div>
                <div className={styles.hCardQR}>
                  <div className={styles.hCardQRInner}>
                    {Array.from({ length: 16 }).map((_, index) => (
                      <div key={index} className={styles.hCardQRCell} style={{ opacity: index % 2 === 0 ? 1 : .08 }} />
                    ))}
                  </div>
                </div>
                <div className={styles.hCardId}>ID#{memberCardId}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.concept}>
        <div className="container">
          <div className={styles.conceptInner}>
            <div className={styles.conceptIcon}><ShieldCheck size={26} /></div>
            <div>
              <h2 className={styles.conceptTitle}>{t.conceptTitle}</h2>
              <p className={styles.conceptText}>{t.conceptText}</p>
              <div className={styles.conceptPills}>
                {t.conceptPills.map((pill) => (
                  <span key={pill} className={styles.pill}>{pill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="plans" className={styles.plans}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}><Star size={14} />{t.sectionTag}</div>
            <h2 className={styles.sectionTitle}>{t.sectionTitleA} <span>{t.sectionTitleB}</span></h2>
            <p className={styles.sectionSub}>{t.sectionSub}</p>
          </div>

          <div className={styles.plansGrid}>
            {plans.map((plan) => {
              const PlanIcon = plan.icon
              return (
                <article
                  key={plan.id}
                  className={`${styles.planCard} ${plan.popular ? styles.planPopular : ''} ${plan.elite ? styles.planElite : ''}`}
                  style={{ '--plan-color': plan.color }}
                >
                  {plan.popular && <div className={styles.ribbon}>POPULAR</div>}
                  {plan.elite && <div className={`${styles.ribbon} ${styles.ribbonElite}`}>PREMIUM</div>}

                  <div className={styles.planHeader}>
                    <div className={styles.planIcon} style={{ color: plan.color }}>
                      <PlanIcon size={28} />
                    </div>
                    <div className={styles.planBadge} style={{ color: plan.color }}>{plan.badge}</div>
                    <h3 className={styles.planName}>{plan.name}</h3>
                    <p className={styles.planTagline}>{plan.tagline}</p>
                    <div className={styles.planPrice}>{plan.price}</div>
                    <div className={styles.planPriceSub}>{t.annual}</div>
                  </div>

                  <div className={styles.planFeatures}>
                    {plan.features.map((feature) => (
                      <div key={feature} className={styles.planFeature}>
                        <Check size={15} style={{ color: plan.color }} />
                        <span>{feature}</span>
                      </div>
                    ))}
                    {plan.notIncluded.map((feature) => (
                      <div key={feature} className={`${styles.planFeature} ${styles.planFeatureMuted}`}>
                        <X size={15} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button className={styles.planCta} style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}CC)` }} onClick={() => openForm(plan)}>
                    {t.chooseRank}
                  </button>
                  {!user && <p className={styles.planNote}>{t.requireLogin}</p>}
                </article>
              )
            })}
          </div>

          <div className={styles.legalNote}>
            <TicketPercent size={18} />
            <p>{t.legal}</p>
          </div>
        </div>
      </section>

      <section className={styles.compare}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}><Users size={14} />{t.compareTag}</div>
            <h2 className={styles.sectionTitle}>{t.compareTitleA} <span>{t.compareTitleB}</span></h2>
          </div>

          <div className={styles.compareTable}>
            <div className={styles.compareHead}>
              <div className={styles.compareHeadCell}>{t.compareHead}</div>
              {plans.map((plan) => (
                <div key={plan.id} className={styles.compareHeadCell} style={{ color: plan.color }}>{plan.name}</div>
              ))}
            </div>
            {compareRows[lang].map(([label, basic, plus, elite], index) => (
              <div key={label} className={`${styles.compareRow} ${index % 2 === 0 ? styles.compareAlt : ''}`}>
                <div className={styles.compareCell}>{label}</div>
                {[basic, plus, elite].map((value, valueIndex) => (
                  <div key={valueIndex} className={styles.compareCell} style={{ color: value === '✗' ? 'var(--text-light)' : plans[valueIndex].color }}>
                    {value}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.faq}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag}><MessageCircle size={14} />{t.faqTag}</div>
            <h2 className={styles.sectionTitle}>{t.faqTitleA} <span>{t.faqTitleB}</span></h2>
          </div>

          <div className={styles.faqList}>
            {t.faq.map((item) => <FaqItem key={item.q} item={item} />)}
          </div>
        </div>
      </section>

      {!done ? (
        <section className={styles.ctaSection}>
          <div className="container">
            <div className={styles.ctaInner}>
              <h2 className={styles.ctaTitle}>{t.ctaTitleA} <span>{t.ctaTitleB}</span></h2>
              <p className={styles.ctaSub}>{t.ctaSub}</p>
              <div className={styles.ctaBtns}>
                <a href="#plans" className={styles.ctaPrimary}>{t.ctaPrimary}</a>
                {user && <Link to="/profil" className={styles.ctaSecondary}>{t.ctaSecondary}</Link>}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className={styles.ctaSection}>
          <div className="container">
            <div className={styles.successBox}>
              <BadgeCheck size={42} className={styles.successIcon} />
              <h2 className={styles.successTitle}>{t.successTitle}</h2>
              <p className={styles.successText}>{t.successText}</p>
              <Link to="/profil" className={styles.ctaPrimary}>{t.ctaSecondary}</Link>
            </div>
          </div>
        </section>
      )}

      {formOpen && selectedPlan && (
        <div className={styles.modalOverlay} onClick={() => setFormOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setFormOpen(false)}><X size={16} /></button>
            <div className={styles.modalHeader}>
              <div className={styles.modalPlanIcon} style={{ color: selectedPlan.color }}>
                <selectedPlan.icon size={30} />
              </div>
              <h3 className={styles.modalTitle}>{selectedPlan.name}</h3>
              <p className={styles.modalSub}>{t.formTitle}</p>
            </div>

            <div className={styles.formGroup}><label>{t.pseudo}</label><input value={form.nom} onChange={(e) => setField('nom', e.target.value)} className={styles.input} /></div>
            <div className={styles.formGroup}><label>{t.email}</label><input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} className={styles.input} /></div>
            <div className={styles.formGroup}><label>{t.phone}</label><input value={form.phone} onChange={(e) => setField('phone', e.target.value)} className={styles.input} /></div>
            <div className={styles.formGroup}>
              <label>{t.city}</label>
              <div className={styles.cityRow}>
                {['Yaoundé', 'Douala', 'Bafoussam', 'Autre'].map((city) => (
                  <button key={city} type="button" className={`${styles.cityBtn} ${form.ville === city ? styles.cityActive : ''}`} onClick={() => setField('ville', city)}>{city}</button>
                ))}
              </div>
            </div>
            <div className={styles.formGroup}><label>{t.message}</label><textarea value={form.message} onChange={(e) => setField('message', e.target.value)} rows={4} className={styles.input} placeholder={t.messagePlaceholder} /></div>
            <div className={styles.modalNote}>{t.note}</div>
            <button className={styles.submitBtn} style={{ background: `linear-gradient(135deg, ${selectedPlan.color}, ${selectedPlan.color}CC)` }} onClick={submit} disabled={sending}>
              {sending ? t.sending : `${t.submit} ${selectedPlan.name}`}
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

function FaqItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`${styles.faqItem} ${open ? styles.faqOpen : ''}`}>
      <button className={styles.faqQ} onClick={() => setOpen((prev) => !prev)}>
        <span>{item.q}</span>
        <ChevronDown size={16} className={open ? styles.faqRotated : ''} />
      </button>
      {open && <div className={styles.faqA}>{item.a}</div>}
    </div>
  )
}
