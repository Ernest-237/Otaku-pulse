// src/pages/Manga/reader/index.jsx — Lecteur immersif vertical webtoon
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, X, Crown, List, Lock, Play,
  ArrowLeft, ArrowRight, Loader2, Settings, Eye, EyeOff,
} from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import { useAuth } from '../../../contexts/AuthContext'
import { mangaApi, chaptersApi, readingApi } from '../../../api'
import { useToast } from '../../../contexts/ToastContext'
import styles from './Reader.module.css'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api-pulse-v9vy.onrender.com'

const copy = {
  fr: {
    loading: 'Chargement du chapitre...',
    chapterNotFound: 'Chapitre introuvable',
    backToManga: 'Retour au manga',
    nextChapter: 'Chapitre suivant',
    prevChapter: 'Chapitre précédent',
    listChapters: 'Tous les chapitres',
    chapter: 'Chapitre',
    page: 'Page',
    of: 'sur',
    completed: '🎉 Chapitre terminé !',
    completedSub: 'Bravo ! Que veux-tu faire ensuite ?',
    readNext: 'Lire le chapitre suivant',
    backCatalog: 'Retour au catalogue',
    rateThis: 'Noter ce manga',
    premiumLockTitle: 'Continue ta lecture',
    premiumLockSub: 'Ce chapitre est réservé aux membres Premium',
    premiumLockBtn: 'Voir les abonnements',
    premiumLockLogin: 'Connecte-toi pour continuer',
    teaser: 'TEASER • Page suivante réservée aux Premium',
    settings: 'Paramètres',
    showHeader: 'Afficher la barre',
    hideHeader: 'Masquer la barre',
  },
  en: {
    loading: 'Loading chapter...',
    chapterNotFound: 'Chapter not found',
    backToManga: 'Back to manga',
    nextChapter: 'Next chapter',
    prevChapter: 'Previous chapter',
    listChapters: 'All chapters',
    chapter: 'Chapter',
    page: 'Page',
    of: 'of',
    completed: '🎉 Chapter complete!',
    completedSub: 'Well done! What would you like to do next?',
    readNext: 'Read next chapter',
    backCatalog: 'Back to catalog',
    rateThis: 'Rate this manga',
    premiumLockTitle: 'Continue reading',
    premiumLockSub: 'This chapter is for Premium members only',
    premiumLockBtn: 'See plans',
    premiumLockLogin: 'Log in to continue',
    teaser: 'TEASER • Next page is Premium only',
    settings: 'Settings',
    showHeader: 'Show header',
    hideHeader: 'Hide header',
  },
}

export default function ReaderPage() {
  const { slug, chapterNumber } = useParams()
  const { lang } = useLang()
  const t = copy[lang]
  const { user, isLoggedIn, hasActiveSubscription } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [manga, setManga] = useState(null)
  const [chapter, setChapter] = useState(null)
  const [pages, setPages] = useState([])  // tableau de page urls/data
  const [chaptersList, setChaptersList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [headerVisible, setHeaderVisible] = useState(true)
  const [showChapList, setShowChapList] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [premiumLocked, setPremiumLocked] = useState(false)

  const containerRef = useRef(null)
  const pageRefs = useRef([])
  const hideTimer = useRef(null)
  const lastSavedPage = useRef(-1)
  const lastSavedAt = useRef(0)

  const isPremiumChapter = chapter?.accessTier === 'premium'
  const userHasAccess = isLoggedIn && hasActiveSubscription

  /* ── FETCH chapter ── */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setCompleted(false)
    setPremiumLocked(false)
    setCurrentPage(0)
    pageRefs.current = []

    async function loadChapter() {
      try {
        // 1. Load manga (avec liste des chapitres)
        const mangaRes = await mangaApi.getBySlug(slug)
        if (cancelled) return
        if (!mangaRes?.manga) {
          setError('not_found')
          setLoading(false)
          return
        }
        setManga(mangaRes.manga)
        setChaptersList(mangaRes.chapters || [])

        // 2. Trouver le chapitre dans la liste
        const ch = (mangaRes.chapters || []).find(c => String(c.chapterNumber) === String(chapterNumber))
        if (!ch) {
          setError('chapter_not_found')
          setLoading(false)
          return
        }

        // 3. Load chapter pages
        try {
          const chapRes = await chaptersApi.getById(ch.id)
          if (cancelled) return
          setChapter(chapRes.chapter)
          setPages(chapRes.pages || [])
        } catch (chapErr) {
          // Si erreur 403 = premium locked
          if (chapErr.status === 403 || chapErr.message?.includes('premium') || chapErr.message?.includes('abonnement')) {
            setChapter(ch)
            setPages([]) // l'utilisateur verra l'overlay premium
            setPremiumLocked(true)
          } else {
            throw chapErr
          }
        }

        setLoading(false)
      } catch (err) {
        if (cancelled) return
        console.error('Reader error:', err)
        setError(err.message || 'load_error')
        setLoading(false)
      }
    }

    loadChapter()
    return () => { cancelled = true }
  }, [slug, chapterNumber])

  /* ── Title doc ── */
  useEffect(() => {
    if (manga && chapter) {
      const title = lang === 'fr' ? manga.titleF : (manga.titleE || manga.titleF)
      document.title = `${title} — Ch.${chapter.chapterNumber} — Otaku Pulse`
    }
  }, [manga, chapter, lang])

  /* ── Auto-hide header après 3s ── */
  const showHeaderTransient = useCallback(() => {
    setHeaderVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setHeaderVisible(false), 3000)
  }, [])

  useEffect(() => {
    showHeaderTransient()
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [showHeaderTransient])

  /* ── Save progress ── */
  const saveProgress = useCallback(async (pageIdx, isCompleted = false) => {
    if (!isLoggedIn || !chapter) return
    if (lastSavedPage.current === pageIdx && !isCompleted) return
    const now = Date.now()
    if (now - lastSavedAt.current < 5000 && !isCompleted) return

    try {
      await readingApi.saveProgress({
        mangaId: manga.id,
        chapterId: chapter.id,
        pageIndex: pageIdx,
        isCompleted,
      })
      lastSavedPage.current = pageIdx
      lastSavedAt.current = now
    } catch (err) {
      console.warn('Save progress failed (silent):', err.message)
    }
  }, [isLoggedIn, manga, chapter])

  /* ── Tracking page courante via IntersectionObserver ── */
  useEffect(() => {
    if (!pages.length || premiumLocked) return

    const observer = new IntersectionObserver((entries) => {
      let bestEntry = null
      let bestRatio = 0
      entries.forEach(entry => {
        if (entry.intersectionRatio > bestRatio) {
          bestRatio = entry.intersectionRatio
          bestEntry = entry
        }
      })
      if (bestEntry && bestRatio > 0.4) {
        const idx = parseInt(bestEntry.target.dataset.pageIdx, 10)
        if (!isNaN(idx)) {
          setCurrentPage(idx)
          saveProgress(idx)

          // Détection fin du chapitre
          if (idx === pages.length - 1 && bestRatio > 0.7) {
            setCompleted(true)
            saveProgress(idx, true)
          }
        }
      }
    }, { threshold: [0.4, 0.7], rootMargin: '0px' })

    pageRefs.current.forEach(el => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [pages, premiumLocked, saveProgress])

  /* ── Auto-save toutes les 8s sur la page courante ── */
  useEffect(() => {
    if (!isLoggedIn || !chapter) return
    const interval = setInterval(() => {
      saveProgress(currentPage)
    }, 8000)
    return () => clearInterval(interval)
  }, [isLoggedIn, chapter, currentPage, saveProgress])

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showChapList) setShowChapList(false)
        else navigate(`/manga/${slug}`)
      } else if (e.key === 'h' || e.key === 'H') {
        setHeaderVisible(v => !v)
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        scrollNextPage()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        scrollPrevPage()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, slug, showChapList])

  const scrollNextPage = () => {
    const next = Math.min(currentPage + 1, pages.length - 1)
    pageRefs.current[next]?.scrollIntoView({ behavior:'smooth', block:'start' })
  }
  const scrollPrevPage = () => {
    const prev = Math.max(currentPage - 1, 0)
    pageRefs.current[prev]?.scrollIntoView({ behavior:'smooth', block:'start' })
  }

  /* ── Navigation chapitres ── */
  const sortedChapters = useMemo(() =>
    [...chaptersList].sort((a,b) => parseFloat(a.chapterNumber) - parseFloat(b.chapterNumber))
  , [chaptersList])

  const currentChapIdx = sortedChapters.findIndex(c => String(c.chapterNumber) === String(chapterNumber))
  const prevChapter = currentChapIdx > 0 ? sortedChapters[currentChapIdx - 1] : null
  const nextChapter = currentChapIdx >= 0 && currentChapIdx < sortedChapters.length - 1
    ? sortedChapters[currentChapIdx + 1] : null

  const goToChapter = (chapNumber) => {
    setShowChapList(false)
    setCompleted(false)
    navigate(`/manga/${slug}/chapter/${chapNumber}`)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  /* ── RENDER ── */
  if (loading) {
    return (
      <div className={styles.fullscreen}>
        <div className={styles.loadingBox}>
          <Loader2 size={42} className={styles.spinner} />
          <p>{t.loading}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.fullscreen}>
        <div className={styles.errorBox}>
          <h1 className={styles.errorTitle}>📚 {t.chapterNotFound}</h1>
          <p>{error}</p>
          <Link to={`/manga/${slug}`} className={styles.errorBtn}>
            <ChevronLeft size={16} /> {t.backToManga}
          </Link>
        </div>
      </div>
    )
  }

  const title = lang === 'fr' ? manga.titleF : (manga.titleE || manga.titleF)
  const progressPct = pages.length > 0
    ? Math.round(((currentPage + 1) / pages.length) * 100)
    : 0

  return (
    <div
      className={styles.reader}
      ref={containerRef}
      onClick={showHeaderTransient}
      onMouseMove={showHeaderTransient}
    >
      {/* ── HEADER FLOATING ── */}
      <header className={`${styles.header} ${!headerVisible ? styles.headerHidden : ''}`}>
        <div className={styles.headerInner}>
          <Link to={`/manga/${slug}`} className={styles.backBtn} onClick={e => e.stopPropagation()}>
            <ChevronLeft size={18} />
            <span className={styles.backText}>{title}</span>
          </Link>

          <div className={styles.headerCenter}>
            <span className={styles.chapInfo}>
              {t.chapter} {chapter.chapterNumber}
              {chapter.title && chapter.title !== `Chapitre ${chapter.chapterNumber}` && (
                <span className={styles.chapTitle}> — {chapter.title}</span>
              )}
            </span>
            {pages.length > 0 && (
              <span className={styles.pageCounter}>
                {currentPage + 1} / {pages.length}
              </span>
            )}
          </div>

          <div className={styles.headerActions} onClick={e => e.stopPropagation()}>
            <button className={styles.iconBtn} onClick={() => setShowChapList(true)} title={t.listChapters}>
              <List size={18} />
            </button>
            <button className={styles.iconBtn} onClick={() => setHeaderVisible(false)} title={t.hideHeader}>
              <EyeOff size={18} />
            </button>
            <Link to={`/manga/${slug}`} className={styles.iconBtn} title={t.backToManga}>
              <X size={18} />
            </Link>
          </div>
        </div>

        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
      </header>

      {/* ── PAGES VERTICALES ── */}
      <main className={styles.pagesContainer}>
        {premiumLocked ? (
          <PremiumLockOverlay
            t={t}
            isLoggedIn={isLoggedIn}
            slug={slug}
            chapter={chapter}
          />
        ) : pages.length === 0 ? (
          <div className={styles.loadingBox}>
            <p>Aucune page dans ce chapitre.</p>
          </div>
        ) : (
          <>
            {pages.map((p, i) => (
  <ChapterPage
    key={i}
    page={p}
    idx={i}
    total={pages.length}
    pageRef={el => pageRefs.current[i] = el}
  />
))}

            {/* Fin de chapitre */}
            {completed && (
              <CompletedOverlay
                t={t}
                manga={manga}
                slug={slug}
                nextChapter={nextChapter}
                onGoNext={() => nextChapter && goToChapter(nextChapter.chapterNumber)}
              />
            )}
          </>
        )}
      </main>

      {/* ── BOTTOM NAV (chapitres) ── */}
      {!premiumLocked && pages.length > 0 && (
        <div className={`${styles.bottomNav} ${!headerVisible ? styles.bottomNavHidden : ''}`}>
          <button
            className={styles.navChapBtn}
            disabled={!prevChapter}
            onClick={() => prevChapter && goToChapter(prevChapter.chapterNumber)}
          >
            <ArrowLeft size={16} />
            <span>{t.prevChapter}</span>
          </button>

          <button className={styles.navListBtn} onClick={() => setShowChapList(true)}>
            <List size={16} />
            <span>Ch. {chapter.chapterNumber}/{sortedChapters.length}</span>
          </button>

          <button
            className={styles.navChapBtn}
            disabled={!nextChapter}
            onClick={() => nextChapter && goToChapter(nextChapter.chapterNumber)}
          >
            <span>{t.nextChapter}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ── DRAWER CHAPITRES ── */}
      {showChapList && (
        <ChaptersDrawer
          chapters={sortedChapters}
          currentChapNumber={chapterNumber}
          mangaTitle={title}
          onClose={() => setShowChapList(false)}
          onSelect={goToChapter}
          t={t}
        />
      )}
    </div>
  )
}

/* ══ READER PAGE COMPONENT ══════════════════════════════ */
function ChapterPage({ page, idx, total, pageRef }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  // Format de la page : peut être { url } ou { data, mime }
  const src = page.url
    ? `${API_BASE}${page.url}`
    : page.data
      ? `data:${page.mime || 'image/jpeg'};base64,${page.data}`
      : null

  return (
    <div
      className={styles.pageWrap}
      ref={pageRef}
      data-page-idx={idx}
    >
      {!loaded && !error && (
        <div className={styles.pageSkeleton}>
          <Loader2 size={32} className={styles.spinner} />
          <span>Page {idx + 1} / {total}</span>
        </div>
      )}
      {src && !error && (
        <img
          src={src}
          alt={`Page ${idx + 1}`}
          className={`${styles.pageImg} ${loaded ? styles.pageLoaded : ''}`}
          loading={idx < 3 ? 'eager' : 'lazy'}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
      {error && (
        <div className={styles.pageError}>
          ⚠️ Page {idx + 1} indisponible
        </div>
      )}
    </div>
  )
}

/* ══ PREMIUM LOCK OVERLAY ══════════════════════════════ */
function PremiumLockOverlay({ t, isLoggedIn, slug, chapter }) {
  return (
    <div className={styles.premiumLock}>
      <div className={styles.premiumGlow} />
      <div className={styles.premiumCard}>
        <div className={styles.premiumIcon}>
          <Crown size={48} />
        </div>
        <h2 className={styles.premiumTitle}>{t.premiumLockTitle}</h2>
        <p className={styles.premiumSub}>{t.premiumLockSub}</p>
        <div className={styles.premiumChapInfo}>
          <Lock size={14} />
          <span>{t.chapter} {chapter.chapterNumber}</span>
          {chapter.title && chapter.title !== `Chapitre ${chapter.chapterNumber}` && (
            <>
              <span style={{ opacity:.5 }}>—</span>
              <span>{chapter.title}</span>
            </>
          )}
        </div>

        {isLoggedIn ? (
          <Link to="/manga/plans" className={styles.premiumBtn}>
            <Crown size={16} fill="currentColor" /> {t.premiumLockBtn}
          </Link>
        ) : (
          <Link
            to="/"
            className={styles.premiumBtn}
            onClick={() => sessionStorage.setItem('openLogin', '1')}
          >
            🔐 {t.premiumLockLogin}
          </Link>
        )}

        <Link to={`/manga/${slug}`} className={styles.premiumBack}>
          <ChevronLeft size={14} /> {t.backToManga}
        </Link>
      </div>
    </div>
  )
}

/* ══ COMPLETED OVERLAY (fin de chapitre) ═══════════════ */
function CompletedOverlay({ t, manga, slug, nextChapter, onGoNext }) {
  return (
    <div className={styles.completed}>
      <div className={styles.completedCard}>
        <h2 className={styles.completedTitle}>{t.completed}</h2>
        <p className={styles.completedSub}>{t.completedSub}</p>

        <div className={styles.completedActions}>
          {nextChapter && (
            <button onClick={onGoNext} className={styles.completedPrimary}>
              <Play size={16} fill="currentColor" />
              {t.readNext}
              <span className={styles.completedSubBtn}>
                Ch. {nextChapter.chapterNumber}
                {nextChapter.accessTier === 'premium' && <Crown size={11} />}
              </span>
            </button>
          )}
          <Link to={`/manga/${slug}`} className={styles.completedSecondary}>
            <ChevronLeft size={16} /> {t.backToManga}
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ══ CHAPTERS DRAWER ═══════════════════════════════════ */
function ChaptersDrawer({ chapters, currentChapNumber, mangaTitle, onClose, onSelect, t }) {
  return (
    <>
      <div className={styles.drawerBackdrop} onClick={onClose} />
      <aside className={styles.drawer}>
        <div className={styles.drawerHead}>
          <div>
            <div className={styles.drawerTitle}>{t.listChapters}</div>
            <div className={styles.drawerSub}>{mangaTitle}</div>
          </div>
          <button className={styles.iconBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <div className={styles.drawerList}>
          {chapters.map(c => (
            <button
              key={c.id}
              onClick={() => onSelect(c.chapterNumber)}
              className={`${styles.drawerItem} ${String(c.chapterNumber) === String(currentChapNumber) ? styles.drawerItemActive : ''}`}
            >
              <div className={styles.drawerItemNum}>
                <span className={styles.drawerItemNumLbl}>CH</span>
                <span className={styles.drawerItemNumVal}>{c.chapterNumber}</span>
              </div>
              <div className={styles.drawerItemBody}>
                <div className={styles.drawerItemTitle}>
                  {c.title || `${t.chapter} ${c.chapterNumber}`}
                </div>
                <div className={styles.drawerItemMeta}>
                  {c.pageCount} pages · {c.viewCount || 0} vues
                </div>
              </div>
              {c.accessTier === 'premium' && <Crown size={14} className={styles.drawerItemPremium} />}
            </button>
          ))}
        </div>
      </aside>
    </>
  )
}