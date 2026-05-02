// src/pages/Manga/library/index.jsx — Bibliothèque personnelle MyAnimeList-style
import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen, Bookmark, CheckCircle, PauseCircle, XCircle,
  Clock, Star, Eye, Search, Trash2, Play, ChevronLeft,
} from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi, useMutation } from '../../../hooks/useApi'
import { libraryApi } from '../../../api'
import { useToast } from '../../../contexts/ToastContext'
import Navbar from '../../../components/Navbar'
import Footer from '../../Home/sections/Footer'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
import styles from './Library.module.css'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api-pulse-v9vy.onrender.com'

const STATUS_TABS = [
  { id: 'reading',      labelF: 'En cours',     labelE: 'Reading',      icon: BookOpen,     color: '#22c55e' },
  { id: 'plan_to_read', labelF: 'À lire',       labelE: 'Plan to read', icon: Bookmark,     color: '#a78bfa' },
  { id: 'completed',    labelF: 'Terminés',     labelE: 'Completed',    icon: CheckCircle,  color: '#3b82f6' },
  { id: 'on_hold',      labelF: 'En pause',     labelE: 'On hold',      icon: PauseCircle,  color: '#f59e0b' },
  { id: 'dropped',      labelF: 'Abandonnés',   labelE: 'Dropped',      icon: XCircle,      color: '#ef4444' },
]

const copy = {
  fr: {
    title: 'Ma Bibliothèque',
    subtitle: 'Tous tes mangas en un seul endroit',
    backCatalog: 'Retour au catalogue',
    needLogin: 'Connecte-toi pour accéder à ta bibliothèque',
    loginBtn: 'Se connecter',
    searchPlaceholder: 'Rechercher dans ma bibliothèque...',
    empty: (status) => `Aucun manga dans "${status}"`,
    emptySub: 'Ajoute des mangas depuis le catalogue !',
    exploreCatalog: 'Explorer le catalogue',
    resume: 'Reprendre',
    open: 'Ouvrir',
    chapter: 'Ch.',
    page: 'page',
    remove: 'Retirer',
    rating: 'Ma note',
    totalCount: (n) => `${n} manga${n > 1 ? 's' : ''} au total`,
    statusCount: (n) => `${n} dans cette catégorie`,
  },
  en: {
    title: 'My Library',
    subtitle: 'All your manga in one place',
    backCatalog: 'Back to catalog',
    needLogin: 'Log in to access your library',
    loginBtn: 'Log in',
    searchPlaceholder: 'Search in my library...',
    empty: (status) => `No manga in "${status}"`,
    emptySub: 'Add manga from the catalog!',
    exploreCatalog: 'Explore catalog',
    resume: 'Resume',
    open: 'Open',
    chapter: 'Ch.',
    page: 'page',
    remove: 'Remove',
    rating: 'My rating',
    totalCount: (n) => `${n} manga${n > 1 ? 's' : ''} total`,
    statusCount: (n) => `${n} in this category`,
  },
}

export default function LibraryPage() {
  const { lang } = useLang()
  const t = copy[lang]
  const { user, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [tab, setTab] = useState('reading')
  const [search, setSearch] = useState('')

  useEffect(() => { document.title = `📚 ${t.title} — Otaku Pulse` }, [t.title])

  const { data, loading, refresh } = useApi(
    () => isLoggedIn ? libraryApi.getMyLibrary({ status: tab, limit: 200 }) : Promise.resolve({ items: [] }),
    [isLoggedIn, tab],
    isLoggedIn
  )
  const items = data?.items || []

  // Compteurs par status (chargés en background une fois)
  const { data: countsData } = useApi(
    () => isLoggedIn ? libraryApi.getCounts() : Promise.resolve({ counts: {} }),
    [isLoggedIn, tab], // refresh quand tab change
    isLoggedIn
  )
  const counts = countsData?.counts || {}
  const totalCount = Object.values(counts).reduce((s, n) => s + (n || 0), 0)

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(it => {
      const title = lang === 'fr' ? it.manga?.titleF : (it.manga?.titleE || it.manga?.titleF)
      return title?.toLowerCase().includes(q)
    })
  }, [items, search, lang])

  const handleRemove = async (item) => {
    if (!confirm('Retirer ce manga de ta bibliothèque ?')) return
    try {
      await libraryApi.remove(item.mangaId)
      toast.info('Retiré de ta bibliothèque')
      refresh()
    } catch (err) { toast.error(err.message) }
  }

  // ── Not logged in ──
  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loginGate}>
          <div className="container">
            <div className={styles.loginCard}>
              <div className={styles.loginIcon}>📚</div>
              <h1 className={styles.loginTitle}>{t.needLogin}</h1>
              <Link to="/" className={styles.loginBtn}
                onClick={() => sessionStorage.setItem('openLogin', '1')}>
                🔐 {t.loginBtn}
              </Link>
              <Link to="/manga" className={styles.loginBackLink}>
                <ChevronLeft size={14} /> {t.backCatalog}
              </Link>
            </div>
          </div>
        </div>
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
              <h1 className={styles.heroTitle}>
                {t.title.split(' ')[0]}{' '}
                <span className={styles.heroAccent}>{t.title.split(' ').slice(1).join(' ')}</span>
              </h1>
              <p className={styles.heroSub}>{t.subtitle}</p>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{totalCount}</span>
                <span className={styles.heroStatLbl}>Mangas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TABS ── */}
      <section className={styles.tabsBar}>
        <div className="container">
          <div className={styles.tabsRow}>
            {STATUS_TABS.map(s => {
              const Icon = s.icon
              const count = counts[s.id] || 0
              return (
                <button
                  key={s.id}
                  className={`${styles.tab} ${tab === s.id ? styles.tabActive : ''}`}
                  onClick={() => setTab(s.id)}
                  style={tab === s.id ? { '--tab-color': s.color } : {}}
                >
                  <Icon size={15} />
                  <span>{lang === 'fr' ? s.labelF : s.labelE}</span>
                  {count > 0 && <span className={styles.tabCount}>{count}</span>}
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* ── ITEMS ── */}
      <section className={styles.itemsSection}>
        <div className="container">
          {loading ? <PageLoader /> :
           !filtered.length ? (
            <div className={styles.emptyBox}>
              <EmptyState
                icon={STATUS_TABS.find(s => s.id === tab)?.icon === BookOpen ? '📖' : '📚'}
                title={t.empty(STATUS_TABS.find(s => s.id === tab)?.[lang === 'fr' ? 'labelF' : 'labelE'])}
                message={t.emptySub}
              />
              <Link to="/manga" className={styles.emptyBtn}>
                <BookOpen size={14} /> {t.exploreCatalog}
              </Link>
            </div>
          ) : (
            <div className={styles.itemsGrid}>
              {filtered.map(item => (
                <LibraryCard
                  key={item.id}
                  item={item}
                  lang={lang}
                  t={t}
                  onRemove={() => handleRemove(item)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

/* ══ LIBRARY CARD ════════════════════════════════════ */
function LibraryCard({ item, lang, t, onRemove }) {
  const m = item.manga
  if (!m) return null

  const title = lang === 'fr' ? m.titleF : (m.titleE || m.titleF)
  const progress = item.progress
  const resumeChapter = progress?.chapter

  return (
    <div className={styles.libCard}>
      <Link to={`/manga/${m.slug}`} className={styles.libCover}>
        {m.coverUrl ? (
          <img
            src={`${API_BASE}${m.coverUrl}`}
            alt={title}
            loading="lazy"
          />
        ) : (
          <div className={styles.coverPh}><BookOpen size={32} /></div>
        )}
        {m.accessTier === 'premium' && (
          <span className={styles.libCoverBadge}>👑</span>
        )}
      </Link>

      <div className={styles.libBody}>
        <Link to={`/manga/${m.slug}`} className={styles.libTitle}>
          {title}
        </Link>
        <div className={styles.libMeta}>
          <span>{m.author?.pseudo || m.authorName}</span>
          {item.rating && (
            <span className={styles.libRating}>
              <Star size={11} fill="currentColor" /> {item.rating}
            </span>
          )}
        </div>

        {/* Progress info */}
        {progress && resumeChapter ? (
          <div className={styles.libProgress}>
            <div className={styles.libProgressLabel}>
              <span>{t.chapter} {resumeChapter.chapterNumber}</span>
              {resumeChapter.pageCount > 0 && (
                <span className={styles.libProgressPage}>
                  {progress.pageIndex + 1}/{resumeChapter.pageCount}
                </span>
              )}
            </div>
            <div className={styles.libProgressBar}>
              <div
                className={styles.libProgressFill}
                style={{ width: `${resumeChapter.pageCount ? Math.round((progress.pageIndex / resumeChapter.pageCount) * 100) : 0}%` }}
              />
            </div>
          </div>
        ) : (
          <div className={styles.libNoProgress}>
            {m.totalChapters} chapitre{m.totalChapters > 1 ? 's' : ''} disponible{m.totalChapters > 1 ? 's' : ''}
          </div>
        )}

        <div className={styles.libActions}>
          {progress && resumeChapter ? (
            <Link
              to={`/manga/${m.slug}/chapter/${resumeChapter.chapterNumber}`}
              className={styles.libActionPrimary}
            >
              <Play size={13} fill="currentColor" /> {t.resume}
            </Link>
          ) : (
            <Link to={`/manga/${m.slug}`} className={styles.libActionPrimary}>
              <BookOpen size={13} /> {t.open}
            </Link>
          )}
          <button className={styles.libActionRemove} onClick={onRemove} title={t.remove}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}