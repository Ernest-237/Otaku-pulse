// src/pages/Manga/index.jsx — Catalogue complet
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen, Crown, Search, Star, Clock, TrendingUp,
  Lock, Play, Filter, X, ChevronRight, Sparkles, Eye,
} from 'lucide-react'
import { useLang } from '../../contexts/LangContext'
import { useAuth } from '../../contexts/AuthContext'
import { useApi } from '../../hooks/useApi'
import { mangaApi } from '../../api'
import Navbar from '../../components/Navbar'
import Footer from '../Home/sections/Footer'
import { PageLoader, EmptyState } from '../../components/ui/Spinner'
import styles from './Manga.module.css'

// Genres disponibles (peut être étendu)
const GENRES = [
  { id: 'all',          labelF: 'Tous',         labelE: 'All' },
  { id: 'action',       labelF: 'Action',       labelE: 'Action' },
  { id: 'aventure',     labelF: 'Aventure',     labelE: 'Adventure' },
  { id: 'romance',      labelF: 'Romance',      labelE: 'Romance' },
  { id: 'fantasy',      labelF: 'Fantasy',      labelE: 'Fantasy' },
  { id: 'sci-fi',       labelF: 'Sci-Fi',       labelE: 'Sci-Fi' },
  { id: 'shonen',       labelF: 'Shōnen',       labelE: 'Shōnen' },
  { id: 'seinen',       labelF: 'Seinen',       labelE: 'Seinen' },
  { id: 'slice of life',labelF: 'Slice of Life',labelE: 'Slice of Life' },
  { id: 'mystery',      labelF: 'Mystère',      labelE: 'Mystery' },
  { id: 'drame',        labelF: 'Drame',        labelE: 'Drama' },
]

const SORT_OPTIONS = [
  { id: 'recent',   labelF: 'Récent',     labelE: 'Recent',     icon: Clock },
  { id: 'popular',  labelF: 'Populaire',  labelE: 'Popular',    icon: TrendingUp },
  { id: 'rating',   labelF: 'Mieux notés',labelE: 'Top rated',  icon: Star },
  { id: 'alphabet', labelF: 'A-Z',        labelE: 'A-Z',        icon: BookOpen },
]

const copy = {
  fr: {
    title: 'Catalogue Manga',
    subtitle: 'Découvre les meilleurs mangas — locaux et internationaux',
    continueReading: 'Reprendre la lecture',
    seeAll: 'Tout voir',
    searchPlaceholder: 'Rechercher un manga, un auteur...',
    filtersTitle: 'Filtres',
    genres: 'Genres',
    status: 'Statut',
    access: 'Accès',
    sort: 'Trier par',
    statusOngoing: 'En cours',
    statusCompleted: 'Terminé',
    statusHiatus: 'En pause',
    accessAll: 'Tous',
    accessFree: 'Gratuit',
    accessPremium: 'Premium',
    chapters: (n) => `${n} chap.`,
    free: 'Gratuit',
    premium: 'Premium',
    new: 'Nouveau',
    featured: 'Vedette',
    noResults: 'Aucun manga trouvé',
    noResultsSub: 'Essaye d\'autres filtres ou termes de recherche.',
    clearFilters: 'Effacer les filtres',
    loading: 'Chargement du catalogue...',
    resultsCount: (n) => `${n} manga${n > 1 ? 's' : ''}`,
    chapter: 'Chapitre',
    page: 'page',
    resume: 'Reprendre',
  },
  en: {
    title: 'Manga Catalog',
    subtitle: 'Discover the best manga — local and international',
    continueReading: 'Continue reading',
    seeAll: 'See all',
    searchPlaceholder: 'Search manga, author...',
    filtersTitle: 'Filters',
    genres: 'Genres',
    status: 'Status',
    access: 'Access',
    sort: 'Sort by',
    statusOngoing: 'Ongoing',
    statusCompleted: 'Completed',
    statusHiatus: 'On hiatus',
    accessAll: 'All',
    accessFree: 'Free',
    accessPremium: 'Premium',
    chapters: (n) => `${n} ch.`,
    free: 'Free',
    premium: 'Premium',
    new: 'New',
    featured: 'Featured',
    noResults: 'No manga found',
    noResultsSub: 'Try other filters or search terms.',
    clearFilters: 'Clear filters',
    loading: 'Loading catalog...',
    resultsCount: (n) => `${n} manga${n > 1 ? 's' : ''}`,
    chapter: 'Chapter',
    page: 'page',
    resume: 'Resume',
  },
}

export default function MangaCatalogPage() {
  const { lang } = useLang()
  const t = copy[lang]
  const { user, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  // Filtres
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('all')
  const [status, setStatus] = useState('all')
  const [accessTier, setAccessTier] = useState('all')
  const [sort, setSort] = useState('recent')
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => { document.title = `📚 ${t.title} — Otaku Pulse` }, [t.title])

  // Fetch mangas
  const params = useMemo(() => {
    const p = { sort, limit: 48, page: 1 }
    if (search.trim())          p.search = search.trim()
    if (genre !== 'all')        p.genre = genre
    if (status !== 'all')       p.status = status
    if (accessTier !== 'all')   p.accessTier = accessTier
    return p
  }, [search, genre, status, accessTier, sort])

  const { data, loading } = useApi(
    () => mangaApi.getAll(params),
    [JSON.stringify(params)],
    true
  )
  const mangas = data?.mangas || []
  const total = data?.total ?? 0

  // Continue Reading (uniquement si connecté)
  const { data: progressData } = useApi(
    () => isLoggedIn ? mangaApi.continueReading() : Promise.resolve({ progress: [] }),
    [isLoggedIn],
    isLoggedIn
  )
  const progressList = progressData?.progress || []

  const clearFilters = () => {
    setSearch(''); setGenre('all'); setStatus('all'); setAccessTier('all'); setSort('recent')
  }

  const hasActiveFilters = search || genre !== 'all' || status !== 'all' || accessTier !== 'all' || sort !== 'recent'

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ── HERO COMPACT ── */}
      <section className={styles.heroBar}>
        <div className={styles.heroGlow} />
        <div className="container">
          <div className={styles.heroBarInner}>
            <div className={styles.heroLeft}>
              <span className={styles.heroBadge}>
                <Sparkles size={12} /> CATALOGUE
              </span>
              <h1 className={styles.heroTitle}>
                {t.title.split(' ')[0]}{' '}
                <span className={styles.heroAccent}>{t.title.split(' ')[1]}</span>
              </h1>
              <p className={styles.heroSub}>{t.subtitle}</p>
            </div>
            <div className={styles.heroRight}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>{total}</span>
                <span className={styles.heroStatLbl}>{t.resultsCount(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTINUE READING ── */}
      {isLoggedIn && progressList.length > 0 && (
        <section className={styles.continueSection}>
          <div className="container">
            <div className={styles.continueHeader}>
              <h2 className={styles.continueTitle}>
                <Play size={18} /> {t.continueReading}
              </h2>
            </div>
            <div className={styles.continueRow}>
              {progressList.map(p => (
                <ContinueCard key={p.id} progress={p} t={t} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SEARCH + FILTERS BAR ── */}
      <section className={styles.toolsBar}>
        <div className="container">
          <div className={styles.toolsInner}>
            <div className={styles.searchWrap}>
              <Search size={18} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
              />
              {search && (
                <button className={styles.searchClear} onClick={() => setSearch('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              className={`${styles.filterToggle} ${filtersOpen ? styles.filterToggleOpen : ''}`}
              onClick={() => setFiltersOpen(o => !o)}
            >
              <Filter size={15} />
              <span>{t.filtersTitle}</span>
              {hasActiveFilters && <span className={styles.filterDot} />}
            </button>

            <div className={styles.sortChips}>
              {SORT_OPTIONS.map(s => (
                <button
                  key={s.id}
                  className={`${styles.sortChip} ${sort === s.id ? styles.sortChipActive : ''}`}
                  onClick={() => setSort(s.id)}
                  title={lang === 'fr' ? s.labelF : s.labelE}
                >
                  <s.icon size={14} />
                  <span>{lang === 'fr' ? s.labelF : s.labelE}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filtres détaillés */}
          {filtersOpen && (
            <div className={styles.filtersPanel}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>{t.genres}</label>
                <div className={styles.chipsRow}>
                  {GENRES.map(g => (
                    <button
                      key={g.id}
                      className={`${styles.chip} ${genre === g.id ? styles.chipActive : ''}`}
                      onClick={() => setGenre(g.id)}
                    >
                      {lang === 'fr' ? g.labelF : g.labelE}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterRow}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>{t.access}</label>
                  <div className={styles.chipsRow}>
                    {[
                      { id: 'all',     label: t.accessAll },
                      { id: 'free',    label: t.accessFree },
                      { id: 'premium', label: t.accessPremium },
                    ].map(a => (
                      <button
                        key={a.id}
                        className={`${styles.chip} ${accessTier === a.id ? styles.chipActive : ''}`}
                        onClick={() => setAccessTier(a.id)}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>{t.status}</label>
                  <div className={styles.chipsRow}>
                    {[
                      { id: 'all',       label: t.accessAll },
                      { id: 'ongoing',   label: t.statusOngoing },
                      { id: 'completed', label: t.statusCompleted },
                      { id: 'hiatus',    label: t.statusHiatus },
                    ].map(s => (
                      <button
                        key={s.id}
                        className={`${styles.chip} ${status === s.id ? styles.chipActive : ''}`}
                        onClick={() => setStatus(s.id)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <button className={styles.clearBtn} onClick={clearFilters}>
                  <X size={14} /> {t.clearFilters}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── GRID MANGAS ── */}
      <section className={styles.catalog}>
        <div className="container">
          {loading && !data ? (
            <div className={styles.skeletonGrid}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonCover} />
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLineSmall} />
                </div>
              ))}
            </div>
          ) : mangas.length === 0 ? (
            <EmptyState icon="📚" title={t.noResults} message={t.noResultsSub} />
          ) : (
            <div className={styles.mangaGrid}>
              {mangas.map(m => (
                <MangaCard key={m.id} manga={m} t={t} lang={lang} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

/* ══ MANGA CARD ══════════════════════════════════════ */
function MangaCard({ manga, t, lang }) {
  const title = lang === 'fr' ? manga.titleF : (manga.titleE || manga.titleF)
  const synopsis = lang === 'fr' ? manga.synopsisF : (manga.synopsisE || manga.synopsisF)
  const isPremium = manga.accessTier === 'premium'
  const isNew = manga.publishedAt &&
    (Date.now() - new Date(manga.publishedAt).getTime()) < 14 * 24 * 60 * 60 * 1000

  return (
    <Link to={`/manga/${manga.slug}`} className={styles.mangaCard}>
      <div className={styles.coverWrap}>
        {manga.coverUrl ? (
          <img
            src={`${import.meta.env.VITE_API_URL || 'https://api-pulse-v9vy.onrender.com'}${manga.coverUrl}`}
            alt={title}
            className={styles.coverImg}
            loading="lazy"
          />
        ) : (
          <div className={styles.coverPlaceholder}>
            <BookOpen size={32} />
          </div>
        )}

        {/* Badges en coin */}
        <div className={styles.badges}>
          {manga.isFeatured && (
            <span className={`${styles.badge} ${styles.badgeFeatured}`}>
              <Crown size={10} /> {t.featured}
            </span>
          )}
          {isNew && (
            <span className={`${styles.badge} ${styles.badgeNew}`}>
              ✨ {t.new}
            </span>
          )}
        </div>
        <div className={styles.badgesRight}>
          {isPremium ? (
            <span className={`${styles.badge} ${styles.badgePremium}`}>
              <Lock size={10} /> {t.premium}
            </span>
          ) : (
            <span className={`${styles.badge} ${styles.badgeFree}`}>
              {t.free}
            </span>
          )}
        </div>

        {/* Hover overlay (desktop) */}
        <div className={styles.cardOverlay}>
          <div className={styles.overlaySynopsis}>
            {synopsis?.substring(0, 140)}{synopsis?.length > 140 ? '…' : ''}
          </div>
          <div className={styles.overlayBtn}>
            <Play size={14} /> Lire
          </div>
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{title}</h3>
        <div className={styles.cardMeta}>
          <span className={styles.cardAuthor}>{manga.author?.pseudo || manga.authorName || '—'}</span>
          <div className={styles.cardStats}>
            {manga.averageRating > 0 && (
              <span className={styles.cardStat}>
                <Star size={11} fill="currentColor" /> {manga.averageRating.toFixed(1)}
              </span>
            )}
            {manga.viewCount > 0 && (
              <span className={styles.cardStat}>
                <Eye size={11} /> {formatCount(manga.viewCount)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ══ CONTINUE CARD (Reprendre) ═══════════════════════ */
function ContinueCard({ progress, t, lang }) {
  const m = progress.manga
  const c = progress.chapter
  if (!m) return null
  const title = lang === 'fr' ? m.titleF : (m.titleE || m.titleF)
  const pct = c?.pageCount > 0 ? Math.round((progress.pageIndex / c.pageCount) * 100) : 0

  return (
    <Link
      to={`/manga/${m.slug}`}
      className={styles.continueCard}
    >
      <div className={styles.continueCover}>
        {m.coverUrl ? (
          <img
            src={`${import.meta.env.VITE_API_URL || 'https://api-pulse-v9vy.onrender.com'}${m.coverUrl}`}
            alt={title}
            loading="lazy"
          />
        ) : (
          <div className={styles.coverPlaceholder}><BookOpen size={28} /></div>
        )}
        <div className={styles.continuePlay}>
          <Play size={18} fill="currentColor" />
        </div>
      </div>
      <div className={styles.continueBody}>
        <div className={styles.continueTitleText}>{title}</div>
        <div className={styles.continueChapter}>
          {t.chapter} {c?.chapterNumber} • {t.page} {progress.pageIndex + 1}
        </div>
        <div className={styles.continueProgress}>
          <div className={styles.continueProgressBar} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  )
}

function formatCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return n.toString()
}