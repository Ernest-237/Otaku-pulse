// src/pages/Manga/publisher/index.jsx — Dashboard éditeur (publisher)
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, BookOpen, Eye, Star, ChevronLeft, Edit3, Upload,
  Loader2, X, Image as ImageIcon, Trash2, FileText, Crown,
  Layers, BarChart3, Sparkles,
} from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi, useMutation } from '../../../hooks/useApi'
import { mangaApi, chaptersApi, publishersApi, fileToBase64 } from '../../../api'
import { useToast } from '../../../contexts/ToastContext'
import Navbar from '../../../components/Navbar'
import Footer from '../../Home/sections/Footer'
import Modal from '../../../components/ui/Modal'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
import styles from './Publisher.module.css'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api-pulse-v9vy.onrender.com'

const GENRES_OPTIONS = ['action','aventure','romance','fantasy','sci-fi','shonen','seinen','slice of life','mystery','drame','horreur','sport','comédie']

const copy = {
  fr: {
    title: 'Espace Éditeur',
    subtitle: 'Gère tes mangas et publie tes chapitres',
    backCatalog: 'Retour au catalogue',
    needPublisher: 'Cet espace est réservé aux éditeurs',
    needPublisherSub: 'Postule pour devenir éditeur et publier tes propres mangas sur Otaku Pulse.',
    applyBtn: 'Postuler maintenant',
    pending: 'Ta candidature est en cours d\'examen',
    pendingSub: 'Notre équipe revient vers toi sous 48h.',
    rejected: 'Ta candidature a été rejetée',
    rejectedSub: 'Tu peux soumettre une nouvelle candidature avec plus de détails.',
    newManga: 'Nouveau manga',
    addChapter: 'Ajouter un chapitre',
    chapters: 'chapitres',
    views: 'vues',
    rating: 'note',
    moderationStatus: {
      pending:   '⏳ En attente',
      approved:  '✅ Approuvé',
      rejected:  '❌ Rejeté',
      suspended: '🚫 Suspendu',
    },
    empty: 'Tu n\'as encore publié aucun manga',
    emptySub: 'Commence par créer ton premier manga !',
    formMangaTitle: 'Créer un nouveau manga',
    formChapterTitle: (manga) => `Ajouter un chapitre — ${manga}`,
    titleF: 'Titre français *',
    titleE: 'Titre anglais (optionnel)',
    synopsisF: 'Synopsis français *',
    synopsisE: 'Synopsis anglais (optionnel)',
    cover: 'Couverture (image)',
    banner: 'Bannière (optionnel)',
    genres: 'Genres',
    language: 'Langue principale',
    accessTier: 'Accès',
    accessFree: 'Gratuit',
    accessPremium: 'Premium (réservé aux abonnés)',
    ageRating: 'Public',
    chapterNumber: 'Numéro du chapitre *',
    chapterTitle: 'Titre du chapitre',
    chapterPages: 'Pages du chapitre (images en lot)',
    chapterAccess: 'Accès',
    pickFiles: 'Choisir les images',
    pagesCount: (n) => `${n} page${n > 1 ? 's' : ''} sélectionnée${n > 1 ? 's' : ''}`,
    cancel: 'Annuler',
    create: 'Créer',
    publish: 'Publier le chapitre',
    submitting: 'Envoi en cours...',
    successManga: '🎉 Manga créé ! En attente de modération admin.',
    successChapter: '🎉 Chapitre publié !',
    deleteManga: 'Supprimer ce manga ?',
    appBio: 'Présentation / motivation *',
    appBioPlaceholder: 'Parle-nous de toi, ton style, ton expérience...',
    appPortfolio: 'Liens portfolio (séparer par virgules)',
    appPortfolioPlaceholder: 'https://instagram.com/...,https://twitter.com/...',
    submitApp: 'Envoyer ma candidature',
  },
  en: {
    title: 'Publisher Space',
    subtitle: 'Manage your manga and publish chapters',
    backCatalog: 'Back to catalog',
    needPublisher: 'This space is for publishers only',
    needPublisherSub: 'Apply to become a publisher and publish your own manga on Otaku Pulse.',
    applyBtn: 'Apply now',
    pending: 'Your application is under review',
    pendingSub: 'Our team gets back to you within 48 hours.',
    rejected: 'Your application was rejected',
    rejectedSub: 'You can submit a new application with more details.',
    newManga: 'New manga',
    addChapter: 'Add chapter',
    chapters: 'chapters',
    views: 'views',
    rating: 'rating',
    moderationStatus: {
      pending:   '⏳ Pending',
      approved:  '✅ Approved',
      rejected:  '❌ Rejected',
      suspended: '🚫 Suspended',
    },
    empty: 'You haven\'t published any manga yet',
    emptySub: 'Start by creating your first manga!',
    formMangaTitle: 'Create a new manga',
    formChapterTitle: (manga) => `Add chapter — ${manga}`,
    titleF: 'French title *',
    titleE: 'English title (optional)',
    synopsisF: 'French synopsis *',
    synopsisE: 'English synopsis (optional)',
    cover: 'Cover image',
    banner: 'Banner (optional)',
    genres: 'Genres',
    language: 'Main language',
    accessTier: 'Access',
    accessFree: 'Free',
    accessPremium: 'Premium (subscribers only)',
    ageRating: 'Audience',
    chapterNumber: 'Chapter number *',
    chapterTitle: 'Chapter title',
    chapterPages: 'Chapter pages (batch images)',
    chapterAccess: 'Access',
    pickFiles: 'Pick images',
    pagesCount: (n) => `${n} page${n > 1 ? 's' : ''} selected`,
    cancel: 'Cancel',
    create: 'Create',
    publish: 'Publish chapter',
    submitting: 'Submitting...',
    successManga: '🎉 Manga created! Pending admin moderation.',
    successChapter: '🎉 Chapter published!',
    deleteManga: 'Delete this manga?',
    appBio: 'Introduction / motivation *',
    appBioPlaceholder: 'Tell us about you, your style, your experience...',
    appPortfolio: 'Portfolio links (comma-separated)',
    appPortfolioPlaceholder: 'https://instagram.com/...,https://twitter.com/...',
    submitApp: 'Submit my application',
  },
}

export default function PublisherPage() {
  const { lang } = useLang()
  const t = copy[lang]
  const { user, isLoggedIn, isPublisher } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [mangaModalOpen, setMangaModalOpen] = useState(false)
  const [chapterModalOpen, setChapterModalOpen] = useState(false)
  const [selectedManga, setSelectedManga] = useState(null)

  useEffect(() => { document.title = `✍️ ${t.title} — Otaku Pulse` }, [t.title])

  // Vérification candidature
  const { data: appsData } = useApi(
    () => isLoggedIn && !isPublisher ? publishersApi.getMyApplication() : Promise.resolve({ application: null }),
    [isLoggedIn, isPublisher],
    isLoggedIn && !isPublisher
  )
  const myApp = appsData?.application

  // Fetch mes mangas
  const { data: mangasData, loading, refresh } = useApi(
    () => isLoggedIn && isPublisher ? mangaApi.getMy({ limit: 50 }) : Promise.resolve({ mangas: [] }),
    [isLoggedIn, isPublisher],
    isLoggedIn && isPublisher
  )
  const myMangas = mangasData?.mangas || []

  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className="container">
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔐</div>
            <h2>Connecte-toi pour accéder à l'espace éditeur</h2>
            <Link to="/" className={styles.btnPrimary}
              onClick={() => sessionStorage.setItem('openLogin', '1')}>
              Se connecter
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // ── User pas publisher : afficher candidature ──
  if (!isPublisher) {
    return (
      <div className={styles.page}>
        <Navbar />
        <PublisherApplicationFlow
          existingApp={myApp}
          t={t}
          toast={toast}
        />
        <Footer />
      </div>
    )
  }

  // Stats globales
  const totalChapters = myMangas.reduce((s, m) => s + (m.totalChapters || 0), 0)
  const totalViews = myMangas.reduce((s, m) => s + (m.viewCount || 0), 0)
  const totalReads = myMangas.reduce((s, m) => s + (m.readCount || 0), 0)

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className="container">
          <Link to="/manga" className={styles.backLink}>
            <ChevronLeft size={14} /> {t.backCatalog}
          </Link>
          <div className={styles.heroInner}>
            <div>
              <span className={styles.heroBadge}>
                <Crown size={11} /> ÉDITEUR
              </span>
              <h1 className={styles.heroTitle}>
                {t.title.split(' ')[0]}{' '}
                <span className={styles.heroAccent}>{t.title.split(' ')[1]}</span>
              </h1>
              <p className={styles.heroSub}>{t.subtitle}</p>
            </div>
            <button
              className={styles.heroCta}
              onClick={() => setMangaModalOpen(true)}
            >
              <Plus size={16} /> {t.newManga}
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className={styles.statsSection}>
        <div className="container">
          <div className={styles.statsGrid}>
            {[
              { ico: <BookOpen size={20} />, val: myMangas.length, lbl: 'Mangas',     color: '#22c55e' },
              { ico: <Layers size={20} />,   val: totalChapters,    lbl: 'Chapitres',  color: '#3b82f6' },
              { ico: <Eye size={20} />,      val: formatCount(totalViews), lbl: 'Vues totales', color: '#a78bfa' },
              { ico: <Sparkles size={20} />, val: formatCount(totalReads), lbl: 'Lectures',     color: '#eab308' },
            ].map((s, i) => (
              <div key={i} className={styles.statCard} style={{ '--stat-color': s.color }}>
                <div className={styles.statIcon}>{s.ico}</div>
                <div className={styles.statValue}>{s.val}</div>
                <div className={styles.statLabel}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MES MANGAS ── */}
      <section className={styles.mangasSection}>
        <div className="container">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>📚 Mes mangas</h2>
          </div>

          {loading ? <PageLoader /> :
           !myMangas.length ? (
            <div className={styles.emptyBox}>
              <EmptyState icon="📚" title={t.empty} message={t.emptySub} />
              <button className={styles.btnPrimary} onClick={() => setMangaModalOpen(true)}>
                <Plus size={14} /> {t.newManga}
              </button>
            </div>
          ) : (
            <div className={styles.mangasGrid}>
              {myMangas.map(m => (
                <MyMangaCard
                  key={m.id}
                  manga={m}
                  lang={lang}
                  t={t}
                  onAddChapter={() => { setSelectedManga(m); setChapterModalOpen(true) }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {mangaModalOpen && (
        <CreateMangaModal
          t={t}
          onClose={() => setMangaModalOpen(false)}
          onSuccess={() => {
            toast.success(t.successManga)
            refresh()
            setMangaModalOpen(false)
          }}
          toast={toast}
        />
      )}

      {chapterModalOpen && selectedManga && (
        <CreateChapterModal
          manga={selectedManga}
          t={t}
          onClose={() => { setChapterModalOpen(false); setSelectedManga(null) }}
          onSuccess={() => {
            toast.success(t.successChapter)
            refresh()
            setChapterModalOpen(false)
            setSelectedManga(null)
          }}
          toast={toast}
        />
      )}

      <Footer />
    </div>
  )
}

/* ══ APPLICATION FLOW ══════════════════════════════════ */
function PublisherApplicationFlow({ existingApp, t, toast }) {
  const [bio, setBio] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const { mutate, loading } = useMutation((data) => publishersApi.apply(data))

  if (existingApp?.status === 'pending') {
    return (
      <div className="container">
        <div className={styles.appCard}>
          <div className={styles.appIcon}>⏳</div>
          <h2 className={styles.appTitle}>{t.pending}</h2>
          <p className={styles.appSub}>{t.pendingSub}</p>
          <Link to="/manga" className={styles.btnGhost}>
            <ChevronLeft size={14} /> {t.backCatalog}
          </Link>
        </div>
      </div>
    )
  }

  const submit = async () => {
    if (!bio.trim() || bio.length < 20) {
      return toast.error('Bio requise (min 20 caractères)')
    }
    const portfolioLinks = portfolio.split(',').map(s => s.trim()).filter(Boolean)
    const { error } = await mutate({ bio: bio.trim(), portfolioLinks })
    if (error) toast.error(error)
    else toast.success('🎉 Candidature envoyée ! Réponse sous 48h.')
  }

  return (
    <div className="container">
      <div className={styles.appCard}>
        <div className={styles.appIcon}>✍️</div>
        <h2 className={styles.appTitle}>{t.needPublisher}</h2>
        <p className={styles.appSub}>{t.needPublisherSub}</p>

        {existingApp?.status === 'rejected' && existingApp.adminNotes && (
          <div className={styles.appReject}>
            <strong>Motif du rejet précédent :</strong>
            <p>{existingApp.adminNotes}</p>
          </div>
        )}

        <div className={styles.appField}>
          <label>{t.appBio}</label>
          <textarea
            rows={5}
            placeholder={t.appBioPlaceholder}
            value={bio}
            onChange={e => setBio(e.target.value)}
            className={styles.appTextarea}
          />
          <div className={styles.appCharCount}>{bio.length} / 1000</div>
        </div>

        <div className={styles.appField}>
          <label>{t.appPortfolio}</label>
          <input
            type="text"
            placeholder={t.appPortfolioPlaceholder}
            value={portfolio}
            onChange={e => setPortfolio(e.target.value)}
            className={styles.appInput}
          />
        </div>

        <button onClick={submit} className={styles.btnPrimary} disabled={loading}>
          {loading ? <Loader2 size={14} className={styles.spinIcon} /> : <Sparkles size={14} />}
          {t.submitApp}
        </button>

        <Link to="/manga" className={styles.btnGhostInline}>
          <ChevronLeft size={13} /> {t.backCatalog}
        </Link>
      </div>
    </div>
  )
}

/* ══ MANGA CARD ════════════════════════════════════════ */
function MyMangaCard({ manga, lang, t, onAddChapter }) {
  const title = lang === 'fr' ? manga.titleF : (manga.titleE || manga.titleF)
  const STATUS_COLORS = { pending:'#f59e0b', approved:'#22c55e', rejected:'#ef4444', suspended:'#6b7280' }

  return (
    <div className={styles.mangaCard}>
      <div className={styles.mangaCover}>
        {manga.coverUrl ? (
          <img
            src={`${API_BASE}${manga.coverUrl}`}
            alt={title}
            loading="lazy"
          />
        ) : (
          <div className={styles.mangaCoverPh}><BookOpen size={32} /></div>
        )}
        <span
          className={styles.mangaStatus}
          style={{ background: STATUS_COLORS[manga.moderationStatus], color: '#fff' }}
        >
          {t.moderationStatus[manga.moderationStatus]}
        </span>
      </div>
      <div className={styles.mangaBody}>
        <h3 className={styles.mangaTitle}>{title}</h3>

        <div className={styles.mangaStats}>
          <span><Layers size={11} /> {manga.totalChapters} {t.chapters}</span>
          <span><Eye size={11} /> {formatCount(manga.viewCount)}</span>
          {manga.averageRating > 0 && (
            <span><Star size={11} fill="currentColor" /> {manga.averageRating.toFixed(1)}</span>
          )}
        </div>

        {manga.rejectedReason && manga.moderationStatus === 'rejected' && (
          <div className={styles.mangaReject}>
            <strong>Motif du rejet :</strong>
            <p>{manga.rejectedReason}</p>
          </div>
        )}

        <div className={styles.mangaActions}>
          <Link
            to={`/manga/${manga.slug}`}
            className={styles.mangaActionGhost}
            target="_blank"
            rel="noreferrer"
          >
            <Eye size={12} /> Voir
          </Link>
          {manga.moderationStatus === 'approved' && (
            <button onClick={onAddChapter} className={styles.mangaActionPrimary}>
              <Plus size={12} /> {t.addChapter}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══ CREATE MANGA MODAL ══════════════════════════════════ */
function CreateMangaModal({ t, onClose, onSuccess, toast }) {
  const { lang } = useLang()
  const [form, setForm] = useState({
    titleF: '',
    titleE: '',
    synopsisF: '',
    synopsisE: '',
    language: 'fr',
    accessTier: 'free',
    ageRating: '13+',
    genres: [],
    coverFile: null,
    bannerFile: null,
  })
  const { mutate, loading } = useMutation((data) => mangaApi.create(data))

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleGenre = (g) => {
    set('genres', form.genres.includes(g)
      ? form.genres.filter(x => x !== g)
      : [...form.genres, g])
  }

  const submit = async () => {
    if (!form.titleF.trim()) return toast.error('Titre français requis')
    if (!form.synopsisF.trim()) return toast.error('Synopsis français requis')
    if (!form.coverFile) return toast.error('Couverture requise')

    try {
      const coverData = await fileToBase64(form.coverFile)
      const bannerData = form.bannerFile ? await fileToBase64(form.bannerFile) : null

      const payload = {
        titleF: form.titleF.trim(),
        titleE: form.titleE.trim() || null,
        synopsisF: form.synopsisF.trim(),
        synopsisE: form.synopsisE.trim() || null,
        language: form.language,
        accessTier: form.accessTier,
        ageRating: form.ageRating,
        genres: form.genres,
        coverImageData: coverData.split(',')[1],
        coverImageMime: form.coverFile.type,
        bannerImageData: bannerData ? bannerData.split(',')[1] : null,
        bannerImageMime: form.bannerFile?.type || null,
      }

      const { error } = await mutate(payload)
      if (error) toast.error(error)
      else onSuccess()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={t.formMangaTitle} wide
      footer={
        <>
          <button onClick={onClose} className={styles.modalBtnGhost}>{t.cancel}</button>
          <button onClick={submit} disabled={loading} className={styles.modalBtnPrimary}>
            {loading ? <Loader2 size={14} className={styles.spinIcon} /> : <Sparkles size={14} />}
            {loading ? t.submitting : t.create}
          </button>
        </>
      }>

      <div className={styles.formGrid2}>
        <FormField label={t.titleF}>
          <input type="text" value={form.titleF} onChange={e => set('titleF', e.target.value)}
            className={styles.formInput} maxLength={150} />
        </FormField>
        <FormField label={t.titleE}>
          <input type="text" value={form.titleE} onChange={e => set('titleE', e.target.value)}
            className={styles.formInput} maxLength={150} />
        </FormField>
      </div>

      <FormField label={t.synopsisF}>
        <textarea value={form.synopsisF} onChange={e => set('synopsisF', e.target.value)}
          rows={3} className={styles.formTextarea} maxLength={1000} />
      </FormField>

      <FormField label={t.synopsisE}>
        <textarea value={form.synopsisE} onChange={e => set('synopsisE', e.target.value)}
          rows={2} className={styles.formTextarea} maxLength={1000} />
      </FormField>

      <div className={styles.formGrid3}>
        <FormField label={t.language}>
          <select value={form.language} onChange={e => set('language', e.target.value)} className={styles.formInput}>
            <option value="fr">🇫🇷 Français</option>
            <option value="en">🇬🇧 English</option>
          </select>
        </FormField>
        <FormField label={t.accessTier}>
          <select value={form.accessTier} onChange={e => set('accessTier', e.target.value)} className={styles.formInput}>
            <option value="free">🆓 {t.accessFree}</option>
            <option value="premium">👑 {t.accessPremium}</option>
          </select>
        </FormField>
        <FormField label={t.ageRating}>
          <select value={form.ageRating} onChange={e => set('ageRating', e.target.value)} className={styles.formInput}>
            <option value="all">Tous publics</option>
            <option value="13+">13+</option>
            <option value="16+">16+</option>
            <option value="18+">18+</option>
          </select>
        </FormField>
      </div>

      <FormField label={t.genres}>
        <div className={styles.genresChips}>
          {GENRES_OPTIONS.map(g => (
            <button
              key={g}
              type="button"
              onClick={() => toggleGenre(g)}
              className={`${styles.genreChip} ${form.genres.includes(g) ? styles.genreChipActive : ''}`}
            >
              {g}
            </button>
          ))}
        </div>
      </FormField>

      <div className={styles.formGrid2}>
        <FormField label={t.cover + ' *'}>
          <FileInput
            file={form.coverFile}
            onChange={f => set('coverFile', f)}
            accept="image/*"
            label="Choisir une cover"
          />
        </FormField>
        <FormField label={t.banner}>
          <FileInput
            file={form.bannerFile}
            onChange={f => set('bannerFile', f)}
            accept="image/*"
            label="Choisir une bannière"
          />
        </FormField>
      </div>
    </Modal>
  )
}

/* ══ CREATE CHAPTER MODAL ════════════════════════════════ */
function CreateChapterModal({ manga, t, onClose, onSuccess, toast }) {
  const { lang } = useLang()
  const title = lang === 'fr' ? manga.titleF : (manga.titleE || manga.titleF)
  const [form, setForm] = useState({
    chapterNumber: (manga.totalChapters || 0) + 1,
    title: '',
    accessTier: 'free',
    pageFiles: [],
  })
  const { mutate, loading } = useMutation((data) => chaptersApi.create(manga.id, data))
  const [progress, setProgress] = useState(0)

  const handleFiles = (files) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'))
    setForm(f => ({ ...f, pageFiles: [...f.pageFiles, ...arr] }))
  }
  const removePage = (idx) => {
    setForm(f => ({ ...f, pageFiles: f.pageFiles.filter((_, i) => i !== idx) }))
  }
  const movePage = (from, to) => {
    if (to < 0 || to >= form.pageFiles.length) return
    const newPages = [...form.pageFiles]
    const [moved] = newPages.splice(from, 1)
    newPages.splice(to, 0, moved)
    setForm(f => ({ ...f, pageFiles: newPages }))
  }

  const submit = async () => {
    if (!form.chapterNumber) return toast.error('Numéro requis')
    if (!form.pageFiles.length) return toast.error('Ajoute au moins 1 page')

    try {
      // Convert all pages to base64
      const pages = []
      for (let i = 0; i < form.pageFiles.length; i++) {
        const f = form.pageFiles[i]
        const data = await fileToBase64(f)
        pages.push({
          data: data.split(',')[1],
          mime: f.type,
          order: i,
        })
        setProgress(Math.round(((i + 1) / form.pageFiles.length) * 100))
      }

      const payload = {
        chapterNumber: parseFloat(form.chapterNumber),
        title: form.title.trim() || null,
        accessTier: form.accessTier,
        pages,
        isPublished: true,
      }

      const { error } = await mutate(payload)
      if (error) toast.error(error)
      else onSuccess()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProgress(0)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={t.formChapterTitle(title)} wide
      footer={
        <>
          <button onClick={onClose} className={styles.modalBtnGhost}>{t.cancel}</button>
          <button onClick={submit} disabled={loading} className={styles.modalBtnPrimary}>
            {loading ? <Loader2 size={14} className={styles.spinIcon} /> : <Upload size={14} />}
            {loading ? `${t.submitting} ${progress}%` : t.publish}
          </button>
        </>
      }>

      <div className={styles.formGrid3}>
        <FormField label={t.chapterNumber}>
          <input type="number" step="0.1" value={form.chapterNumber}
            onChange={e => setForm(f => ({ ...f, chapterNumber: e.target.value }))}
            className={styles.formInput} />
        </FormField>
        <FormField label={t.chapterTitle}>
          <input type="text" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Ex: Le réveil"
            className={styles.formInput} maxLength={150} />
        </FormField>
        <FormField label={t.chapterAccess}>
          <select value={form.accessTier}
            onChange={e => setForm(f => ({ ...f, accessTier: e.target.value }))}
            className={styles.formInput}>
            <option value="free">🆓 {t.accessFree}</option>
            <option value="premium">👑 {t.accessPremium}</option>
          </select>
        </FormField>
      </div>

      <FormField label={t.chapterPages + ' *'}>
        <div
          className={styles.dropZone}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={e => handleFiles(e.target.files)}
            id="chapPages"
            style={{ display: 'none' }}
          />
          <label htmlFor="chapPages" className={styles.dropZoneLabel}>
            <ImageIcon size={28} />
            <strong>{t.pickFiles}</strong>
            <span>Glisse-dépose ou clique pour choisir</span>
          </label>
        </div>

        {form.pageFiles.length > 0 && (
          <>
            <div className={styles.pagesCount}>{t.pagesCount(form.pageFiles.length)}</div>
            <div className={styles.pagesList}>
              {form.pageFiles.map((f, i) => (
                <div key={i} className={styles.pageItem}>
                  <span className={styles.pageItemNum}>{i + 1}</span>
                  <span className={styles.pageItemName}>{f.name}</span>
                  <span className={styles.pageItemSize}>{(f.size / 1024).toFixed(0)}KB</span>
                  <div className={styles.pageItemActions}>
                    <button onClick={() => movePage(i, i - 1)} disabled={i === 0} title="Monter">↑</button>
                    <button onClick={() => movePage(i, i + 1)} disabled={i === form.pageFiles.length - 1} title="Descendre">↓</button>
                    <button onClick={() => removePage(i)} title="Retirer" className={styles.pageItemRemove}>
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </FormField>
    </Modal>
  )
}

/* ══ HELPERS ══ */
function FormField({ label, children }) {
  return (
    <div className={styles.formField}>
      <label className={styles.formLabel}>{label}</label>
      {children}
    </div>
  )
}

function FileInput({ file, onChange, accept, label }) {
  const id = `file-${Math.random().toString(36).slice(2, 8)}`
  return (
    <div className={styles.fileInputWrap}>
      <input type="file" id={id} accept={accept}
        onChange={e => onChange(e.target.files?.[0] || null)}
        style={{ display: 'none' }} />
      <label htmlFor={id} className={styles.fileInputLabel}>
        <Upload size={14} />
        <span>{file ? file.name : label}</span>
      </label>
      {file && (
        <button onClick={() => onChange(null)} className={styles.fileInputClear}>
          <X size={12} />
        </button>
      )}
    </div>
  )
}

function formatCount(n) {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return n.toString()
}