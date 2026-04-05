import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Crown,
  Mail,
  MapPin,
  MessageSquare,
  PartyPopper,
  Phone,
  Shield,
  Sparkles,
  Swords,
  User,
  Users,
} from 'lucide-react'
import { useLang } from '../../contexts/LangContext'
import { useToast } from '../../contexts/ToastContext'
import Navbar from '../../components/Navbar'
import QUARTIERS from '../../data/quartiers'
import styles from './Reservation.module.css'

const PACKS = [
  {
    id: 'genin',
    icon: 'shield',
    nameF: 'Pack GENIN',
    nameE: 'GENIN Pack',
    priceF: '85 000 FCFA',
    priceE: '85,000 FCFA',
    descF: 'Idéal pour petits événements (5 à 12 personnes). Décoration légère et ambiance soignée.',
    descE: 'Ideal for small events (5 to 12 guests). Light decoration and a clean immersive setup.',
    color: '#22c55e',
    featuresF: ['Décoration 1 mur thématique', '3 goodies personnalisés', 'Cocktail Otaku x1', 'Photo backdrop', 'Durée 45 min'],
    featuresE: ['1 themed wall decoration', '3 personalized goodies', '1 Otaku cocktail', 'Photo backdrop', '45 min duration'],
  },
  {
    id: 'chunin',
    icon: 'swords',
    nameF: 'Pack CHŪNIN',
    nameE: 'CHŪNIN Pack',
    priceF: '200 000 FCFA',
    priceE: '200,000 FCFA',
    descF: 'Pensé pour salons, jardins et petites salles de fête avec une immersion plus complète.',
    descE: 'Built for living rooms, gardens and small event halls with a fuller immersive setup.',
    color: '#0ea5e9',
    popular: true,
    featuresF: ['Décoration 3 murs complets', '10 goodies premium', 'Bar mobile Otaku Pulse', 'Mixologue 2h15', 'Kakemono entrée'],
    featuresE: ['3 full decorated walls', '10 premium goodies', 'Otaku Pulse mobile bar', 'Mixologist for 2h15', 'Entrance banner'],
  },
  {
    id: 'hokage',
    icon: 'crown',
    nameF: 'Pack HOKAGE',
    nameE: 'HOKAGE Pack',
    priceF: '450 000 FCFA',
    priceE: '450,000 FCFA',
    descF: "L'expérience ultime pour les grands événements avec décor premium et immersion totale.",
    descE: 'The ultimate package for large events with premium decoration and full immersion.',
    color: '#f97316',
    featuresF: ['Tente thématique complète', '30 goodies collector', 'Bar & mixologue 4h', 'Mapping vidéo', 'DJ Anime set', 'Photo & vidéo inclus'],
    featuresE: ['Full themed tent', '30 collector goodies', 'Bar & mixologist for 4h', 'Video mapping', 'Anime DJ set', 'Photo & video included'],
  },
]

const THEMES = [
  'Naruto / Boruto',
  'One Piece',
  'Dragon Ball Z',
  'Jujutsu Kaisen',
  'Demon Slayer',
  'Attack on Titan',
  'Bleach',
  'My Hero Academia',
  'Fairy Tail',
  'Sword Art Online',
  'Death Note',
  'Hunter x Hunter',
  'Tokyo Revengers',
  'Vinland Saga',
  'Autre / Other',
]

const I18N = {
  fr: {
    home: 'Accueil',
    reservation: 'Réservation',
    titleLead: 'RÉSERVER',
    titleTail: 'UN ÉVÉNEMENT',
    subtitle: 'Crée ton événement Otaku sur mesure au Cameroun.',
    step1: 'Choix du pack',
    step2: 'Vos informations',
    step3: 'Confirmation',
    choosePack: 'Choisissez votre pack',
    selected: 'Sélectionné',
    chooseThisPack: 'Choisir ce pack',
    continue: 'Continuer',
    yourInfo: 'Vos informations',
    identity: 'Identité',
    event: "L'événement",
    location: 'Lieu',
    message: 'Message',
    firstName: 'Prénom *',
    lastName: 'Nom *',
    email: 'Email *',
    phone: 'Téléphone *',
    whatsapp: 'WhatsApp',
    animeTheme: 'Thème Anime *',
    selectTheme: 'Choisir un thème',
    guests: "Nombre d'invités *",
    wantedDate: 'Date souhaitée *',
    startTime: 'Heure de début',
    city: 'Ville *',
    district: 'Quartier',
    selectDistrict: 'Choisir',
    precisePlace: 'Adresse / Lieu précis',
    precisePlaceholder: 'Ex: villa blanche, après le carrefour...',
    details: 'Détails supplémentaires',
    detailsPlaceholder: 'Décris ton événement, tes attentes et tes demandes spéciales...',
    back: 'Retour',
    review: 'Vérifier',
    reviewSend: 'Vérification & Envoi',
    selectedPack: 'Pack choisi',
    client: 'Client',
    selectedDate: 'Date',
    place: 'Lieu',
    notSpecified: 'Non précisée',
    edit: 'Modifier',
    submit: 'Envoyer ma réservation',
    sending: 'Envoi en cours...',
    note: 'Notre équipe vous contacte sous 24-48h pour confirmer et établir un devis.',
    doneTitle: 'RÉSERVATION ENVOYÉE !',
    doneTextStart: 'Merci',
    doneTextEnd: 'Notre équipe Otaku Pulse vous contacte sous 24-48h pour confirmer votre événement et établir le devis définitif.',
    emailSent: 'Email de confirmation envoyé à',
    callAt: 'Nous vous appellerons au',
    goHome: "Retour à l'accueil",
    requiredError: 'Veuillez remplir tous les champs obligatoires.',
    dateError: 'Veuillez choisir une date.',
    serverError: 'Une erreur est survenue.',
    retryText: 'Autre (préciser ci-dessous)',
  },
  en: {
    home: 'Home',
    reservation: 'Reservation',
    titleLead: 'BOOK',
    titleTail: 'AN EVENT',
    subtitle: 'Create your custom Otaku event anywhere in Cameroon.',
    step1: 'Choose package',
    step2: 'Your details',
    step3: 'Confirmation',
    choosePack: 'Choose your package',
    selected: 'Selected',
    chooseThisPack: 'Choose this package',
    continue: 'Continue',
    yourInfo: 'Your information',
    identity: 'Identity',
    event: 'Event details',
    location: 'Location',
    message: 'Message',
    firstName: 'First name *',
    lastName: 'Last name *',
    email: 'Email *',
    phone: 'Phone *',
    whatsapp: 'WhatsApp',
    animeTheme: 'Anime Theme *',
    selectTheme: 'Choose a theme',
    guests: 'Number of guests *',
    wantedDate: 'Preferred date *',
    startTime: 'Start time',
    city: 'City *',
    district: 'District',
    selectDistrict: 'Choose',
    precisePlace: 'Address / Exact location',
    precisePlaceholder: 'Example: white villa, after the crossroads...',
    details: 'Additional details',
    detailsPlaceholder: 'Describe your event, expectations and any special requests...',
    back: 'Back',
    review: 'Review',
    reviewSend: 'Review & Send',
    selectedPack: 'Selected package',
    client: 'Client',
    selectedDate: 'Date',
    place: 'Location',
    notSpecified: 'Not specified',
    edit: 'Edit',
    submit: 'Send my reservation',
    sending: 'Sending...',
    note: 'Our team will contact you within 24-48h to confirm and prepare your quote.',
    doneTitle: 'RESERVATION SENT!',
    doneTextStart: 'Thank you',
    doneTextEnd: 'Our Otaku Pulse team will contact you within 24-48h to confirm your event and finalize the quote.',
    emailSent: 'Confirmation email sent to',
    callAt: 'We will call you at',
    goHome: 'Back to home',
    requiredError: 'Please fill in all required fields.',
    dateError: 'Please choose a date.',
    serverError: 'An error occurred.',
    retryText: 'Other (specify below)',
  },
}

function PackIcon({ name, color }) {
  if (name === 'shield') return <Shield size={28} color={color} strokeWidth={2.2} />
  if (name === 'swords') return <Swords size={28} color={color} strokeWidth={2.2} />
  return <Crown size={28} color={color} strokeWidth={2.2} />
}

export default function ReservationPage() {
  const { lang } = useLang()
  const toast = useToast()
  const T = I18N[lang]

  const [step, setStep] = useState(1)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    pack: '',
    nom: '',
    prenom: '',
    email: '',
    phone: '',
    whatsapp: '',
    theme: '',
    guests: '',
    date: '',
    time: '',
    ville: 'Yaoundé',
    quartier: '',
    lieu: '',
    message: '',
  })

  const s = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.nom || !form.prenom || !form.email || !form.phone || !form.theme || !form.guests) {
      toast.error(T.requiredError)
      return
    }

    if (!form.date) {
      toast.error(T.dateError)
      return
    }

    setSending(true)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://api-pulse-v9vy.onrender.com'}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'reservation-form', lang }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || T.serverError)
      }

      setDone(true)
    } catch (err) {
      toast.error(err.message || T.serverError)
    } finally {
      setSending(false)
    }
  }

  const stepLabels = [T.step1, T.step2, T.step3]
  const selectedPack = PACKS.find((p) => p.id === form.pack)

  return (
    <div className={styles.page}>
      <Navbar />

      <header className={styles.headerSection}>
        <div className="container">
          <div className={styles.breadcrumb}>
            <Link to="/">{T.home}</Link>
            <ChevronRight size={14} />
            <span>{T.reservation}</span>
          </div>

          <div className={styles.headerBadge}>
            <Sparkles size={14} />
            <span>Otaku Pulse Events</span>
          </div>

          <h1 className={styles.pageTitle}>
            <span className={styles.accent}>{T.titleLead}</span> {T.titleTail}
          </h1>
          <p className={styles.pageSubtitle}>{T.subtitle}</p>
        </div>
      </header>

      <div className="container">
        {!done && (
          <div className={styles.stepper}>
            {stepLabels.map((label, i) => (
              <div key={label} className={`${styles.step} ${step > i + 1 ? styles.stepDone : ''} ${step === i + 1 ? styles.stepActive : ''}`}>
                <div className={styles.stepCircle}>{step > i + 1 ? <Check size={16} /> : i + 1}</div>
                <span className={styles.stepLabel}>{label}</span>
                {i < 2 && <div className={`${styles.stepLine} ${step > i + 1 ? styles.stepLineDone : ''}`} />}
              </div>
            ))}
          </div>
        )}

        {step === 1 && !done && (
          <section>
            <h2 className={styles.sectionTitle}>{T.choosePack}</h2>

            <div className={styles.packsGrid}>
              {PACKS.map((pack) => {
                const features = lang === 'fr' ? pack.featuresF : pack.featuresE

                return (
                  <article
                    key={pack.id}
                    className={`${styles.packCard} ${form.pack === pack.id ? styles.packSelected : ''}`}
                    style={{ '--pcolor': pack.color }}
                    onClick={() => s('pack', pack.id)}
                  >
                    {pack.popular && <div className={styles.popularBadge}>Popular</div>}

                    <div className={styles.packIconWrap}>
                      <PackIcon name={pack.icon} color={pack.color} />
                    </div>

                    <h3 className={styles.packName} style={{ color: pack.color }}>
                      {lang === 'fr' ? pack.nameF : pack.nameE}
                    </h3>

                    <div className={styles.packPrice} style={{ color: pack.color }}>
                      {lang === 'fr' ? pack.priceF : pack.priceE}
                    </div>

                    <p className={styles.packDesc}>{lang === 'fr' ? pack.descF : pack.descE}</p>

                    <ul className={styles.packFeatures}>
                      {features.map((feature) => (
                        <li key={feature}>
                          <Check size={16} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div
                      className={`${styles.selectBtn} ${form.pack === pack.id ? styles.selectBtnActive : ''}`}
                      style={{ borderColor: pack.color, background: form.pack === pack.id ? pack.color : 'transparent', color: form.pack === pack.id ? '#ffffff' : pack.color }}
                    >
                      {form.pack === pack.id ? T.selected : T.chooseThisPack}
                    </div>
                  </article>
                )
              })}
            </div>

            <div className={styles.centerAction}>
              <button className={styles.nextBtn} disabled={!form.pack} onClick={() => setStep(2)} type="button">
                <span>{T.continue}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </section>
        )}

        {step === 2 && !done && (
          <section className={styles.formSection}>
            <h2 className={styles.sectionTitle}>{T.yourInfo}</h2>

            <div className={styles.formGrid}>
              <div className={styles.formCol}>
                <h3 className={styles.formGroupTitle}>
                  <User size={16} />
                  <span>{T.identity}</span>
                </h3>
                <FInput label={T.firstName} value={form.prenom} onChange={(v) => s('prenom', v)} />
                <FInput label={T.lastName} value={form.nom} onChange={(v) => s('nom', v)} />
                <FInput label={T.email} type="email" value={form.email} onChange={(v) => s('email', v)} />
                <FInput label={T.phone} value={form.phone} onChange={(v) => s('phone', v)} placeholder="+237 6XX XXX XXX" />
                <FInput label={T.whatsapp} value={form.whatsapp} onChange={(v) => s('whatsapp', v)} placeholder="+237 6XX XXX XXX" />
              </div>

              <div className={styles.formCol}>
                <h3 className={styles.formGroupTitle}>
                  <Sparkles size={16} />
                  <span>{T.event}</span>
                </h3>

                <div className={styles.fGroup}>
                  <label className={styles.fLabel}>{T.animeTheme}</label>
                  <select className={styles.fInput} value={form.theme} onChange={(e) => s('theme', e.target.value)}>
                    <option value="">-- {T.selectTheme} --</option>
                    {THEMES.map((theme) => (
                      <option key={theme} value={theme}>
                        {theme}
                      </option>
                    ))}
                  </select>
                </div>

                <FInput label={T.guests} type="number" value={form.guests} onChange={(v) => s('guests', v)} placeholder="Ex: 15" />
                <FInput label={T.wantedDate} type="date" value={form.date} onChange={(v) => s('date', v)} />
                <FInput label={T.startTime} type="time" value={form.time} onChange={(v) => s('time', v)} />
              </div>

              <div className={styles.formCol}>
                <h3 className={styles.formGroupTitle}>
                  <MapPin size={16} />
                  <span>{T.location}</span>
                </h3>

                <div className={styles.fGroup}>
                  <label className={styles.fLabel}>{T.city}</label>
                  <div className={styles.cityBtns}>
                    {['Yaoundé', 'Douala', 'Bafoussam', 'Autre'].map((city) => (
                      <button
                        key={city}
                        type="button"
                        className={`${styles.cityBtn} ${form.ville === city ? styles.cityActive : ''}`}
                        onClick={() => s('ville', city)}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.fGroup}>
                  <label className={styles.fLabel}>{T.district}</label>
                  <select className={styles.fInput} value={form.quartier} onChange={(e) => s('quartier', e.target.value)}>
                    <option value="">-- {T.selectDistrict} --</option>
                    {(QUARTIERS[form.ville] || []).map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                    <option value="__other__">{T.retryText}</option>
                  </select>
                </div>

                <div className={styles.fGroup}>
                  <label className={styles.fLabel}>{T.precisePlace}</label>
                  <textarea
                    className={`${styles.fInput} ${styles.textarea}`}
                    rows={2}
                    value={form.lieu}
                    onChange={(e) => s('lieu', e.target.value)}
                    placeholder={T.precisePlaceholder}
                  />
                </div>
              </div>

              <div className={styles.formCol}>
                <h3 className={styles.formGroupTitle}>
                  <MessageSquare size={16} />
                  <span>{T.message}</span>
                </h3>

                <div className={styles.fGroup}>
                  <label className={styles.fLabel}>{T.details}</label>
                  <textarea
                    className={`${styles.fInput} ${styles.textarea}`}
                    rows={5}
                    value={form.message}
                    onChange={(e) => s('message', e.target.value)}
                    placeholder={T.detailsPlaceholder}
                  />
                </div>
              </div>
            </div>

            <div className={styles.navBtns}>
              <button className={styles.backBtn} onClick={() => setStep(1)} type="button">
                <ArrowLeft size={16} />
                <span>{T.back}</span>
              </button>

              <button className={styles.nextBtn} onClick={() => setStep(3)} type="button">
                <span>{T.review}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </section>
        )}

        {step === 3 && !done && selectedPack && (
          <section className={styles.confirmSection}>
            <h2 className={styles.sectionTitle}>{T.reviewSend}</h2>

            <div className={styles.confirmCard}>
              <div className={styles.confirmBlock}>
                <div className={styles.confirmTitle}>{T.selectedPack}</div>
                <div className={styles.confirmValue} style={{ color: selectedPack.color }}>
                  {lang === 'fr' ? selectedPack.nameF : selectedPack.nameE} — {lang === 'fr' ? selectedPack.priceF : selectedPack.priceE}
                </div>
              </div>

              {[
                { icon: <User size={15} />, label: T.client, value: `${form.prenom} ${form.nom}` },
                { icon: <Mail size={15} />, label: T.email, value: form.email },
                { icon: <Phone size={15} />, label: T.phone, value: form.phone },
                { icon: <MessageSquare size={15} />, label: T.whatsapp, value: form.whatsapp || form.phone },
                { icon: <Sparkles size={15} />, label: T.animeTheme, value: form.theme },
                { icon: <Users size={15} />, label: T.guests, value: form.guests },
                {
                  icon: <CalendarDays size={15} />,
                  label: T.selectedDate,
                  value: new Date(form.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-CA', { dateStyle: 'long' }),
                },
                { icon: <Clock3 size={15} />, label: T.startTime, value: form.time || T.notSpecified },
                { icon: <MapPin size={15} />, label: T.place, value: `${form.quartier ? `${form.quartier}, ` : ''}${form.ville}` },
              ].map((row) => (
                <div key={row.label} className={styles.confirmRow}>
                  <span className={styles.confirmLbl}>
                    {row.icon}
                    <span>{row.label}</span>
                  </span>
                  <span className={styles.confirmVal}>{row.value}</span>
                </div>
              ))}

              {form.message && (
                <div className={styles.confirmBlock}>
                  <div className={styles.confirmTitle}>{T.message}</div>
                  <div className={styles.confirmMessage}>{form.message}</div>
                </div>
              )}
            </div>

            <div className={styles.confirmNote}>
              <CircleAlert size={18} />
              <span>{T.note}</span>
            </div>

            <div className={styles.navBtns}>
              <button className={styles.backBtn} onClick={() => setStep(2)} type="button">
                <ArrowLeft size={16} />
                <span>{T.edit}</span>
              </button>

              <button className={styles.submitBtn} onClick={handleSubmit} disabled={sending} type="button">
                <span>{sending ? T.sending : T.submit}</span>
              </button>
            </div>
          </section>
        )}

        {done && (
          <section className={styles.successSection}>
            <div className={styles.successIcon}>
              <PartyPopper size={54} />
            </div>
            <h2 className={styles.successTitle}>{T.doneTitle}</h2>
            <p className={styles.successText}>
              {T.doneTextStart} <strong>{form.prenom}</strong> ! {T.doneTextEnd}
            </p>
            <div className={styles.successInfo}>
              <div>
                <Mail size={16} />
                <span>
                  {T.emailSent} <strong>{form.email}</strong>
                </span>
              </div>
              <div>
                <Phone size={16} />
                <span>
                  {T.callAt} <strong>{form.phone}</strong>
                </span>
              </div>
            </div>
            <Link to="/" className={styles.homeBtn}>
              <ArrowLeft size={16} />
              <span>{T.goHome}</span>
            </Link>
          </section>
        )}
      </div>
    </div>
  )
}

function FInput({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div className={styles.fGroup}>
      <label className={styles.fLabel}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={styles.fInput} />
    </div>
  )
}

