// src/pages/Manga/publisher/index.jsx — Dashboard Créateur (style Webtoon Canvas)
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, BookOpen, Eye, Star, ChevronLeft, Edit3, Upload,
  Loader2, X, Image as ImageIcon, Trash2, FileText, Crown,
  Layers, BarChart3, Sparkles, Users, Coins, TrendingUp,
  Award, Medal, Heart, Trophy, LayoutDashboard, LineChart,
  CheckCircle2, Clock, XCircle, Zap,
} from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi, useMutation } from '../../../hooks/useApi'
import { mangaApi, chaptersApi, publishersApi } from '../../../api'
import { useToast } from '../../../contexts/ToastContext'
import Navbar from '../../../components/Navbar'
import Footer from '../../Home/sections/Footer'
import Modal from '../../../components/ui/Modal'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
import styles from './Publisher.module.css'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api-pulse-v9vy.onrender.com'

const GENRES_OPTIONS = ['action','aventure','romance','fantasy','sci-fi','shonen','seinen','slice of life','mystery','drame','horreur','sport','comédie']

/* ══ HELPER : Lecture safe d'un fichier en base64 ══ */
async function readFileToBase64Safe(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('Aucun fichier fourni'))
    if (!(file instanceof Blob)) return reject(new Error('Fichier invalide'))
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') return reject(new Error('Lecture de fichier échouée'))
      const commaIdx = result.indexOf(',')
      if (commaIdx === -1) return reject(new Error('Format de fichier non reconnu'))
      resolve({ data: result.substring(commaIdx + 1), mime: file.type || 'image/jpeg', dataUrl: result })
    }
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'))
    reader.readAsDataURL(file)
  })
}

/* ══ COPY i18n ══ */
const copy = {
  fr: {
    title: 'Espace Créateur',
    dashboard: 'Tableau de bord',
    subtitle: 'Gère tes mangas et publie tes chapitres',
    backCatalog: 'Retour au catalogue',
    needPublisher: 'Deviens Créateur sur Otaku Pulse',
    needPublisherSub: 'Postule pour publier tes propres mangas et toucher des revenus sur chaque déblocage de chapitre.',
    applyBtn: 'Postuler maintenant',
    pending: 'Ta candidature est en cours d\'examen',
    pendingSub: 'Notre équipe revient vers toi sous 48h.',
    rejected: 'Ta candidature a été rejetée',
    rejectedSub: 'Tu peux soumettre une nouvelle candidature avec plus de détails.',
    newManga: 'Nouveau manga',
    addChapter: 'Ajouter un chapitre',
    chapters: 'chapitres',
    tabOverview: 'Vue d\'ensemble',
    tabMangas: 'Mes Mangas',
    tabStats: 'Statistiques',
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
    accessPremium: 'Premium (déblocable en coins)',
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
    appBio: 'Présentation / motivation *',
    appBioPlaceholder: 'Parle-nous de toi, ton style, ton expérience...',
    appPortfolio: 'Liens portfolio (séparer par virgules)',
    appPortfolioPlaceholder: 'https://instagram.com/...,https://twitter.com/...',
    submitApp: 'Envoyer ma candidature',
    statViews: 'Vues totales',
    statReads: 'Lectures',
    statFollowers: 'Abonnés',
    statChapters: 'Chapitres',
    statMangas: 'Mangas',
    statCoins: 'Coins gagnés',
    statCoinsMonth: 'Ce mois',
    statRank: 'Classement',
    rankOf: (n) => `sur ${n} créateurs`,
    revenueTitle: 'Mes revenus',
    revenueSub: 'Tu touches 70% des coins dépensés sur tes chapitres premium',
    coinsBalance: 'Solde à percevoir',
    coinsEarned: 'Total gagné',
    topMangas: 'Tes mangas les plus vus',
    perfByManga: 'Performance par manga',
  },
  en: {
    title: 'Creator Space',
    dashboard: 'Dashboard',
    subtitle: 'Manage your manga and publish chapters',
    backCatalog: 'Back to catalog',
    needPublisher: 'Become a Creator on Otaku Pulse',
    needPublisherSub: 'Apply to publish your own manga and earn revenue on every chapter unlock.',
    applyBtn: 'Apply now',
    pending: 'Your application is under review',
    pendingSub: 'Our team gets back to you within 48 hours.',
    rejected: 'Your application was rejected',
    rejectedSub: 'You can submit a new application with more details.',
    newManga: 'New manga',
    addChapter: 'Add chapter',
    chapters: 'chapters',
    tabOverview: 'Overview',
    tabMangas: 'My Manga',
    tabStats: 'Statistics',
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
    accessPremium: 'Premium (unlockable with coins)',
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
    appBio: 'Introduction / motivation *',
    appBioPlaceholder: 'Tell us about you, your style, your experience...',
    appPortfolio: 'Portfolio links (comma-separated)',
    appPortfolioPlaceholder: 'https://instagram.com/...,https://twitter.com/...',
    submitApp: 'Submit my application',
    statViews: 'Total views',
    statReads: 'Reads',
    statFollowers: 'Followers',
    statChapters: 'Chapters',
    statMangas: 'Manga',
    statCoins: 'Coins earned',
    statCoinsMonth: 'This month',
    statRank: 'Rank',
    rankOf: (n) => `of ${n} creators`,
    revenueTitle: 'My revenue',
    revenueSub: 'You earn 70% of coins spent on your premium chapters',
    coinsBalance: 'Balance to receive',
    coinsEarned: 'Total earned',
    topMangas: 'Your most viewed manga',
    perfByManga: 'Performance by manga',
  },
}

/* ══════════════════════════════════════════════════════
   PAGE PRINCIPALE
   ══════════════════════════════════════════════════════ */
export default function PublisherPage() {
  const { lang } = useLang()
  const t = copy[lang]
  const { user, isLoggedIn, isPublisher } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [tab, setTab] = useState('overview')
  const [mangaModalOpen, setMangaModalOpen] = useState(false)
  const [chapterModalOpen, setChapterModalOpen] = useState(false)
  const [selectedManga, setSelectedManga] = useState(null)

  const canPublish = isPublisher || ['admin','superadmin'].includes(user?.role)

  useEffect(() => { document.title = `✍️ ${t.title} — Otaku Pulse` }, [t.title])

  // Candidature (si pas créateur)
  const { data: appsData } = useApi(
    () => isLoggedIn && !canPublish ? publishersApi.getMyApplication() : Promise.resolve({ application: null }),
    [isLoggedIn, canPublish],
    isLoggedIn && !canPublish
  )
  const myApp = appsData?.application

  // Dashboard (si créateur)
  const { data: dashData, loading, refresh } = useApi(
    () => isLoggedIn && canPublish ? publishersApi.getDashboard() : Promise.resolve({ mangas: [], stats: {} }),
    [isLoggedIn, canPublish],
    isLoggedIn && canPublish
  )
  const myMangas = dashData?.mangas || []
  const stats = dashData?.stats || {}
  const topMangas = dashData?.topMangas || []

  // ── Pas connecté ──
  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className="container">
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔐</div>
            <h2>Connecte-toi pour accéder à l'espace créateur</h2>
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

  // ── Pas créateur : candidature ──
  if (!canPublish) {
    return (
      <div className={styles.page}>
        <Navbar />
        <PublisherApplicationFlow existingApp={myApp} t={t} toast={toast} />
        <Footer />
      </div>
    )
  }

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
                <Crown size={11} /> CRÉATEUR
              </span>
              <h1 className={styles.heroTitle}>
                {t.dashboard}
              </h1>
              <p className={styles.heroSub}>
                {user?.pseudo} · {stats.totalMangas || 0} {t.statMangas.toLowerCase()}
                {stats.rank ? ` · 🏆 #${stats.rank} ${t.rankOf(stats.totalCreators)}` : ''}
              </p>
            </div>
            <button className={styles.heroCta} onClick={() => setMangaModalOpen(true)}>
              <Plus size={16} /> {t.newManga}
            </button>
          </div>
        </div>
      </section>

      {/* ── TABS ── */}
      <div className={styles.tabsBar}>
        <div className="container">
          <div className={styles.tabsInner}>
            <button className={`${styles.tabBtn} ${tab === 'overview' ? styles.tabActive : ''}`}
              onClick={() => setTab('overview')}>
              <LayoutDashboard size={16} /> {t.tabOverview}
            </button>
            <button className={`${styles.tabBtn} ${tab === 'mangas' ? styles.tabActive : ''}`}
              onClick={() => setTab('mangas')}>
              <BookOpen size={16} /> {t.tabMangas}
              <span className={styles.tabCount}>{myMangas.length}</span>
            </button>
            <button className={`${styles.tabBtn} ${tab === 'stats' ? styles.tabActive : ''}`}
              onClick={() => setTab('stats')}>
              <LineChart size={16} /> {t.tabStats}
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {loading ? <PageLoader /> : (
          <>
            {tab === 'overview' && (
              <OverviewTab stats={stats} topMangas={topMangas} t={t} lang={lang}
                onNewManga={() => setMangaModalOpen(true)} />
            )}
            {tab === 'mangas' && (
              <MangasTab myMangas={myMangas} t={t} lang={lang}
                onNewManga={() => setMangaModalOpen(true)}
                onAddChapter={(m) => { setSelectedManga(m); setChapterModalOpen(true) }} />
            )}
            {tab === 'stats' && (
              <StatsTab stats={stats} myMangas={myMangas} t={t} lang={lang} />
            )}
          </>
        )}
      </div>

      {mangaModalOpen && (
        <CreateMangaModal t={t}
          onClose={() => setMangaModalOpen(false)}
          onSuccess={() => { toast.success(t.successManga); refresh(); setMangaModalOpen(false) }}
          toast={toast} />
      )}

      {chapterModalOpen && selectedManga && (
        <CreateChapterModal manga={selectedManga} t={t}
          onClose={() => { setChapterModalOpen(false); setSelectedManga(null) }}
          onSuccess={() => { toast.success(t.successChapter); refresh(); setChapterModalOpen(false); setSelectedManga(null) }}
          toast={toast} />
      )}

      <Footer />
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   ONGLET : VUE D'ENSEMBLE
   ══════════════════════════════════════════════════════ */
function OverviewTab({ stats, topMangas, t, lang, onNewManga }) {
  const cards = [
    { ico: <Eye size={20} />,    val: formatCount(stats.totalViews),     lbl: t.statViews,     color: '#22c55e' },
    { ico: <BookOpen size={20} />, val: formatCount(stats.totalReads),   lbl: t.statReads,     color: '#3b82f6' },
    { ico: <Users size={20} />,  val: formatCount(stats.totalFollowers), lbl: t.statFollowers, color: '#ec4899' },
    { ico: <Layers size={20} />, val: stats.totalChapters || 0,          lbl: t.statChapters,  color: '#a78bfa' },
    { ico: <Coins size={20} />,  val: formatCount(stats.coinsEarned),    lbl: t.statCoins,     color: '#f59e0b' },
    { ico: <Trophy size={20} />, val: stats.rank ? `#${stats.rank}` : '—', lbl: t.statRank,    color: '#eab308' },
  ]

  return (
    <div className={styles.tabContent}>
      {/* Stats grid */}
      <div className={styles.statsGrid}>
        {cards.map((s, i) => (
          <div key={i} className={styles.statCard} style={{ '--stat-color': s.color }}>
            <div className={styles.statIcon}>{s.ico}</div>
            <div className={styles.statValue}>{s.val}</div>
            <div className={styles.statLabel}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Carte revenus */}
      <div className={styles.revenueCard}>
        <div className={styles.revenueGlow} />
        <div className={styles.revenueHead}>
          <div>
            <h3 className={styles.revenueTitle}><Coins size={18} /> {t.revenueTitle}</h3>
            <p className={styles.revenueSub}>{t.revenueSub}</p>
          </div>
        </div>
        <div className={styles.revenueStats}>
          <div className={styles.revenueStat}>
            <div className={styles.revenueStatLabel}>{t.coinsBalance}</div>
            <div className={styles.revenueStatValue}>
              <Coins size={22} /> {(stats.coinsBalance || 0).toLocaleString('fr-FR')}
            </div>
          </div>
          <div className={styles.revenueDivider} />
          <div className={styles.revenueStat}>
            <div className={styles.revenueStatLabel}>{t.coinsEarned}</div>
            <div className={styles.revenueStatValue} style={{ color: '#94a3b8' }}>
              <Coins size={18} /> {(stats.coinsEarned || 0).toLocaleString('fr-FR')}
            </div>
          </div>
          <div className={styles.revenueDivider} />
          <div className={styles.revenueStat}>
            <div className={styles.revenueStatLabel}>{t.statCoinsMonth}</div>
            <div className={styles.revenueStatValue} style={{ color: '#22c55e' }}>
              <TrendingUp size={18} /> +{(stats.monthEarnings || 0).toLocaleString('fr-FR')}
            </div>
          </div>
        </div>
      </div>

      {/* Top mangas */}
      {topMangas.length > 0 && (
        <div className={styles.overviewSection}>
          <h3 className={styles.overviewTitle}>🔥 {t.topMangas}</h3>
          <div className={styles.topList}>
            {topMangas.map((m, i) => {
              const title = lang === 'fr' ? m.titleF : (m.titleE || m.titleF)
              return (
                <Link to={`/manga/${m.slug}`} key={m.id} className={styles.topItem}>
                  <span className={styles.topRank}>#{i + 1}</span>
                  {m.coverUrl ? (
                    <img src={`${API_BASE}${m.coverUrl}`} alt={title} className={styles.topCover} />
                  ) : (
                    <div className={styles.topCoverPh}><BookOpen size={16} /></div>
                  )}
                  <div className={styles.topInfo}>
                    <div className={styles.topName}>{title}</div>
                    <div className={styles.topMeta}>
                      <span><Eye size={11} /> {formatCount(m.viewCount)}</span>
                      <span><Users size={11} /> {formatCount(m.followerCount)}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   ONGLET : MES MANGAS
   ══════════════════════════════════════════════════════ */
function MangasTab({ myMangas, t, lang, onNewManga, onAddChapter }) {
  if (!myMangas.length) {
    return (
      <div className={styles.tabContent}>
        <div className={styles.emptyBox}>
          <EmptyState icon="📚" title={t.empty} message={t.emptySub} />
          <button className={styles.btnPrimary} onClick={onNewManga}>
            <Plus size={14} /> {t.newManga}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.mangasGrid}>
        {myMangas.map(m => (
          <MyMangaCard key={m.id} manga={m} lang={lang} t={t}
            onAddChapter={() => onAddChapter(m)} />
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   ONGLET : STATISTIQUES
   ══════════════════════════════════════════════════════ */
function StatsTab({ stats, myMangas, t, lang }) {
  const maxViews = Math.max(...myMangas.map(m => m.viewCount || 0), 1)

  return (
    <div className={styles.tabContent}>
      {/* Récap chiffres clés */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} style={{ '--stat-color': '#22c55e' }}>
          <div className={styles.statIcon}><Eye size={20} /></div>
          <div className={styles.statValue}>{formatCount(stats.totalViews)}</div>
          <div className={styles.statLabel}>{t.statViews}</div>
        </div>
        <div className={styles.statCard} style={{ '--stat-color': '#ec4899' }}>
          <div className={styles.statIcon}><Heart size={20} /></div>
          <div className={styles.statValue}>{formatCount(stats.totalFollowers)}</div>
          <div className={styles.statLabel}>{t.statFollowers}</div>
        </div>
        <div className={styles.statCard} style={{ '--stat-color': '#f59e0b' }}>
          <div className={styles.statIcon}><Coins size={20} /></div>
          <div className={styles.statValue}>{formatCount(stats.coinsEarned)}</div>
          <div className={styles.statLabel}>{t.statCoins}</div>
        </div>
        <div className={styles.statCard} style={{ '--stat-color': '#eab308' }}>
          <div className={styles.statIcon}><Trophy size={20} /></div>
          <div className={styles.statValue}>{stats.rank ? `#${stats.rank}` : '—'}</div>
          <div className={styles.statLabel}>{t.statRank}</div>
        </div>
      </div>

      {/* Performance par manga (barres) */}
      {myMangas.length > 0 && (
        <div className={styles.overviewSection}>
          <h3 className={styles.overviewTitle}><BarChart3 size={18} /> {t.perfByManga}</h3>
          <div className={styles.perfList}>
            {[...myMangas]
              .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
              .map(m => {
                const title = lang === 'fr' ? m.titleF : (m.titleE || m.titleF)
                const pct = Math.round(((m.viewCount || 0) / maxViews) * 100)
                return (
                  <div key={m.id} className={styles.perfItem}>
                    <div className={styles.perfHead}>
                      <span className={styles.perfName}>{title}</span>
                      <span className={styles.perfViews}><Eye size={12} /> {formatCount(m.viewCount)}</span>
                    </div>
                    <div className={styles.perfBarTrack}>
                      <div className={styles.perfBarFill} style={{ width: `${pct}%` }} />
                    </div>
                    <div className={styles.perfMeta}>
                      <span><Users size={11} /> {formatCount(m.followerCount)} abonnés</span>
                      <span><Layers size={11} /> {m.totalChapters} chap.</span>
                      <span><Star size={11} /> {m.averageRating?.toFixed(1) || '—'}</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ══ APPLICATION FLOW ══ */
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
    if (!bio.trim() || bio.length < 20) return toast.error('Bio requise (min 20 caractères)')
    const portfolioLinks = portfolio.split(',').map(s => s.trim()).filter(Boolean)
    const { error } = await mutate({ bio: bio.trim(), portfolioLinks })
    if (error) toast.error(error)
    else toast.success('🎉 Candidature envoyée ! Réponse sous 48h.')
  }

  return (
    <div className="container">
      <div className={styles.appCard}>
        <div className={styles.appIcon}>🎨</div>
        <h2 className={styles.appTitle}>{t.needPublisher}</h2>
        <p className={styles.appSub}>{t.needPublisherSub}</p>

        {/* Avantages créateur */}
        <div className={styles.appPerks}>
          <div className={styles.appPerk}><Coins size={16} /> Gagne 70% sur chaque déblocage</div>
          <div className={styles.appPerk}><Users size={16} /> Construis ta communauté d'abonnés</div>
          <div className={styles.appPerk}><Award size={16} /> Deviens un créateur certifié officiel</div>
        </div>

        {existingApp?.status === 'rejected' && existingApp.adminNotes && (
          <div className={styles.appReject}>
            <strong>Motif du rejet précédent :</strong>
            <p>{existingApp.adminNotes}</p>
          </div>
        )}

        <div className={styles.appField}>
          <label>{t.appBio}</label>
          <textarea rows={5} placeholder={t.appBioPlaceholder}
            value={bio} onChange={e => setBio(e.target.value)} className={styles.appTextarea} />
          <div className={styles.appCharCount}>{bio.length} / 1000</div>
        </div>

        <div className={styles.appField}>
          <label>{t.appPortfolio}</label>
          <input type="text" placeholder={t.appPortfolioPlaceholder}
            value={portfolio} onChange={e => setPortfolio(e.target.value)} className={styles.appInput} />
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

/* ══ MANGA CARD ══ */
function MyMangaCard({ manga, lang, t, onAddChapter }) {
  const title = lang === 'fr' ? manga.titleF : (manga.titleE || manga.titleF)
  const STATUS_COLORS = { pending:'#f59e0b', approved:'#22c55e', rejected:'#ef4444', suspended:'#6b7280' }

  return (
    <div className={styles.mangaCard}>
      <div className={styles.mangaCover}>
        {manga.coverUrl ? (
          <img src={`${API_BASE}${manga.coverUrl}`} alt={title} loading="lazy" />
        ) : (
          <div className={styles.mangaCoverPh}><BookOpen size={32} /></div>
        )}
        <span className={styles.mangaStatus}
          style={{ background: STATUS_COLORS[manga.moderationStatus], color: '#fff' }}>
          {t.moderationStatus[manga.moderationStatus]}
        </span>
        {manga.isOfficial && <span className={styles.mangaOfficial} title="Certifié Officiel">🏅</span>}
      </div>
      <div className={styles.mangaBody}>
        <h3 className={styles.mangaTitle}>{title}</h3>

        <div className={styles.mangaStats}>
          <span><Layers size={11} /> {manga.totalChapters} {t.chapters}</span>
          <span><Eye size={11} /> {formatCount(manga.viewCount)}</span>
          <span><Users size={11} /> {formatCount(manga.followerCount)}</span>
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
          <Link to={`/manga/${manga.slug}`} className={styles.mangaActionGhost}
            target="_blank" rel="noreferrer">
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

/* ══ CREATE MANGA MODAL ══ */
function CreateMangaModal({ t, onClose, onSuccess, toast }) {
  const [form, setForm] = useState({
    titleF: '', titleE: '', synopsisF: '', synopsisE: '',
    language: 'fr', accessTier: 'free', ageRating: '13+',
    genres: [], coverFile: null, bannerFile: null,
  })
  const { mutate, loading } = useMutation((data) => mangaApi.create(data))

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleGenre = (g) => {
    set('genres', form.genres.includes(g) ? form.genres.filter(x => x !== g) : [...form.genres, g])
  }

  const submit = async () => {
    if (!form.titleF.trim())    return toast.error('Titre français requis')
    if (!form.synopsisF.trim()) return toast.error('Synopsis français requis')
    if (!form.coverFile)        return toast.error('Couverture requise')

    try {
      const cover  = await readFileToBase64Safe(form.coverFile)
      const banner = form.bannerFile ? await readFileToBase64Safe(form.bannerFile) : null

      const payload = {
        titleF: form.titleF.trim(), titleE: form.titleE.trim() || null,
        synopsisF: form.synopsisF.trim(), synopsisE: form.synopsisE.trim() || null,
        language: form.language, accessTier: form.accessTier, ageRating: form.ageRating,
        genres: form.genres,
        coverImageData: cover.data, coverImageMime: cover.mime,
        bannerImageData: banner ? banner.data : null,
        bannerImageMime: banner ? banner.mime : null,
      }

      const { error } = await mutate(payload)
      if (error) toast.error(error)
      else onSuccess()
    } catch (err) {
      console.error('Manga create error:', err)
      toast.error(err.message || 'Erreur lors de la création')
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
            <button key={g} type="button" onClick={() => toggleGenre(g)}
              className={`${styles.genreChip} ${form.genres.includes(g) ? styles.genreChipActive : ''}`}>
              {g}
            </button>
          ))}
        </div>
      </FormField>

      <div className={styles.formGrid2}>
        <FormField label={t.cover + ' *'}>
          <FileInput file={form.coverFile} onChange={f => set('coverFile', f)} accept="image/*" label="Choisir une cover" />
        </FormField>
        <FormField label={t.banner}>
          <FileInput file={form.bannerFile} onChange={f => set('bannerFile', f)} accept="image/*" label="Choisir une bannière" />
        </FormField>
      </div>
    </Modal>
  )
}

/* ══ CREATE CHAPTER MODAL ══ */
function CreateChapterModal({ manga, t, onClose, onSuccess, toast }) {
  const { lang } = useLang()
  const title = lang === 'fr' ? manga.titleF : (manga.titleE || manga.titleF)
  const mangaId = String(manga?.id || '')
  const [form, setForm] = useState({
    chapterNumber: (manga.totalChapters || 0) + 1,
    title: '', accessTier: 'free', pageFiles: [],
  })
  const { mutate, loading } = useMutation((data) => {
    if (!mangaId) return Promise.resolve({ error: 'ID du manga manquant' })
    return chaptersApi.create(mangaId, data)
  })
  const [progress, setProgress] = useState(0)

  const handleFiles = (files) => {
    const arr = Array.from(files).filter(f => f && f.type && f.type.startsWith('image/'))
    setForm(f => ({ ...f, pageFiles: [...f.pageFiles, ...arr] }))
  }
  const removePage = (idx) => setForm(f => ({ ...f, pageFiles: f.pageFiles.filter((_, i) => i !== idx) }))
  const movePage = (from, to) => {
    if (to < 0 || to >= form.pageFiles.length) return
    const newPages = [...form.pageFiles]
    const [moved] = newPages.splice(from, 1)
    newPages.splice(to, 0, moved)
    setForm(f => ({ ...f, pageFiles: newPages }))
  }

  const submit = async () => {
    if (!mangaId)               return toast.error('Erreur : ID manga manquant')
    if (!form.chapterNumber)    return toast.error('Numéro requis')
    if (!form.pageFiles.length) return toast.error('Ajoute au moins 1 page')

    try {
      const pages = []
      for (let i = 0; i < form.pageFiles.length; i++) {
        const result = await readFileToBase64Safe(form.pageFiles[i])
        pages.push({ data: result.data, mime: result.mime, order: i })
        setProgress(Math.round(((i + 1) / form.pageFiles.length) * 100))
      }

      const payload = {
        chapterNumber: parseFloat(form.chapterNumber),
        title: form.title.trim() || null,
        accessTier: form.accessTier,
        pages, isPublished: true,
      }

      const { error } = await mutate(payload)
      if (error) toast.error(error)
      else onSuccess()
    } catch (err) {
      console.error('Chapter publish error:', err)
      toast.error(err.message || 'Erreur lors de la publication')
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
            placeholder="Ex: Le réveil" className={styles.formInput} maxLength={150} />
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
        <div className={styles.dropZone}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}>
          <input type="file" multiple accept="image/*"
            onChange={e => handleFiles(e.target.files)} id="chapPages" style={{ display: 'none' }} />
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

/* ══ HELPERS UI ══ */
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
        onChange={e => onChange(e.target.files?.[0] || null)} style={{ display: 'none' }} />
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