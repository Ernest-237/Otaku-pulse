// src/pages/Manga/detail/index.jsx — Page détail manga
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  Play, Plus, Check, Star, Eye, BookOpen, Crown, Lock,
  Calendar, ChevronLeft, MessageCircle, Heart, ArrowRight,
  Send, Trash2,
} from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi, useMutation } from '../../../hooks/useApi'
import { mangaApi, libraryApi, commentsApi } from '../../../api'
import Navbar from '../../../components/Navbar'
import Footer from '../../Home/sections/Footer'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
import { useToast } from '../../../contexts/ToastContext'
import styles from './MangaDetail.module.css'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api-pulse-v9vy.onrender.com'

const copy = {
  fr: {
    notFound: 'Manga introuvable',
    notFoundSub: 'Ce manga n\'existe pas ou a été retiré.',
    backToCatalog: 'Retour au catalogue',
    by: 'Par',
    chapters: 'chapitres',
    views: 'vues',
    rating: 'Note',
    resume: 'Reprendre',
    start: 'Commencer la lecture',
    chapter: 'Chapitre',
    page: 'page',
    of: 'sur',
    addToLibrary: 'Ajouter à ma bibliothèque',
    inLibrary: 'Dans ma bibliothèque',
    libraryStatus: {
      reading:       'En cours',
      completed:     'Terminé',
      plan_to_read:  'À lire',
      dropped:       'Abandonné',
      on_hold:       'En pause',
    },
    tabSynopsis: 'Synopsis',
    tabChapters: 'Chapitres',
    tabReviews: 'Avis',
    chaptersCount: (n) => `${n} chapitre${n > 1 ? 's' : ''}`,
    free: 'Gratuit',
    premium: 'Premium',
    publishedOn: 'Publié le',
    statusOngoing: 'En cours',
    statusCompleted: 'Terminé',
    statusHiatus: 'En pause',
    statusCancelled: 'Annulé',
    rateThis: 'Note ce manga',
    rateCta: 'Donner mon avis',
    submitRating: 'Envoyer ma note',
    yourReview: 'Ton avis (optionnel)',
    reviewPlaceholder: 'Partage ton ressenti...',
    ratingThanks: '✅ Merci pour ta note !',
    loginToRate: 'Connecte-toi pour noter ce manga',
    commentsTitle: 'Commentaires de la communauté',
    addComment: 'Ajouter un commentaire',
    commentPlaceholder: 'Que penses-tu de ce manga ?',
    sendComment: 'Publier',
    deleteComment: 'Supprimer',
    commentDeleted: 'Commentaire supprimé',
    commentSent: '✅ Commentaire publié',
    noComments: 'Aucun commentaire pour le moment',
    noCommentsSub: 'Sois le premier à donner ton avis !',
    loginToComment: 'Connecte-toi pour commenter',
    progressLabel: (chap, page, total) => `${chap}, page ${page} sur ${total}`,
    genres: 'Genres',
    tags: 'Tags',
  },
  en: {
    notFound: 'Manga not found',
    notFoundSub: 'This manga doesn\'t exist or was removed.',
    backToCatalog: 'Back to catalog',
    by: 'By',
    chapters: 'chapters',
    views: 'views',
    rating: 'Rating',
    resume: 'Resume',
    start: 'Start reading',
    chapter: 'Chapter',
    page: 'page',
    of: 'of',
    addToLibrary: 'Add to my library',
    inLibrary: 'In my library',
    libraryStatus: {
      reading:       'Reading',
      completed:     'Completed',
      plan_to_read:  'Plan to read',
      dropped:       'Dropped',
      on_hold:       'On hold',
    },
    tabSynopsis: 'Synopsis',
    tabChapters: 'Chapters',
    tabReviews: 'Reviews',
    chaptersCount: (n) => `${n} chapter${n > 1 ? 's' : ''}`,
    free: 'Free',
    premium: 'Premium',
    publishedOn: 'Published on',
    statusOngoing: 'Ongoing',
    statusCompleted: 'Completed',
    statusHiatus: 'On hiatus',
    statusCancelled: 'Cancelled',
    rateThis: 'Rate this manga',
    rateCta: 'Rate it',
    submitRating: 'Submit rating',
    yourReview: 'Your review (optional)',
    reviewPlaceholder: 'Share your thoughts...',
    ratingThanks: '✅ Thanks for your rating!',
    loginToRate: 'Log in to rate this manga',
    commentsTitle: 'Community comments',
    addComment: 'Add a comment',
    commentPlaceholder: 'What do you think about this manga?',
    sendComment: 'Post',
    deleteComment: 'Delete',
    commentDeleted: 'Comment deleted',
    commentSent: '✅ Comment posted',
    noComments: 'No comments yet',
    noCommentsSub: 'Be the first to share your thoughts!',
    loginToComment: 'Log in to comment',
    progressLabel: (chap, page, total) => `${chap}, page ${page} of ${total}`,
    genres: 'Genres',
    tags: 'Tags',
  },
}

const STATUS_LABELS_FR = {
  ongoing:   'En cours',
  completed: 'Terminé',
  hiatus:    'En pause',
  cancelled: 'Annulé',
}
const STATUS_LABELS_EN = {
  ongoing:   'Ongoing',
  completed: 'Completed',
  hiatus:    'On hiatus',
  cancelled: 'Cancelled',
}

export default function MangaDetailPage() {
  const { slug } = useParams()
  const { lang } = useLang()
  const t = copy[lang]
  const { user, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [tab, setTab] = useState('chapters')
  const [rateOpen, setRateOpen] = useState(false)

  const { data, loading, refresh } = useApi(
    () => mangaApi.getBySlug(slug),
    [slug, isLoggedIn],
    true
  )

  const manga = data?.manga
  const chapters = data?.chapters || []
  const progress = data?.progress
  const inLibrary = data?.inLibrary

  useEffect(() => {
    if (manga) {
      const title = lang === 'fr' ? manga.titleF : (manga.titleE || manga.titleF)
      document.title = `📖 ${title} — Otaku Pulse`
    }
  }, [manga, lang])

  if (loading && !data) return (
    <div className={styles.page}>
      <Navbar />
      <PageLoader />
      <Footer />
    </div>
  )

  if (!manga) return (
    <div className={styles.page}>
      <Navbar />
      <div className="container">
        <div className={styles.notFound}>
          <EmptyState icon="📚" title={t.notFound} message={t.notFoundSub} />
          <Link to="/manga" className={styles.backLink}>
            <ChevronLeft size={16} /> {t.backToCatalog}
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )

  const title = lang === 'fr' ? manga.titleF : (manga.titleE || manga.titleF)
  const synopsis = lang === 'fr' ? manga.synopsisF : (manga.synopsisE || manga.synopsisF)
  const statusLabel = (lang === 'fr' ? STATUS_LABELS_FR : STATUS_LABELS_EN)[manga.status] || manga.status

  // Bouton CTA principal
  const resumeChapter = progress
    ? chapters.find(c => c.id === progress.chapterId)
    : null
  const firstChapter = chapters[0]

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ── HERO BANNER ── */}
      <section className={styles.hero}>
        {/* Bannière de fond */}
        <div className={styles.heroBg}>
          {manga.bannerUrl && (
            <img
              src={`${API_BASE}${manga.bannerUrl}`}
              alt=""
              aria-hidden
              className={styles.heroBgImg}
            />
          )}
          <div className={styles.heroGradient} />
        </div>

        <div className="container">
          <Link to="/manga" className={styles.backLinkSmall}>
            <ChevronLeft size={16} /> {t.backToCatalog}
          </Link>

          <div className={styles.heroInner}>
            {/* Cover */}
            <div className={styles.coverWrap}>
              {manga.coverUrl ? (
                <img
                  src={`${API_BASE}${manga.coverUrl}`}
                  alt={title}
                  className={styles.coverImg}
                />
              ) : (
                <div className={styles.coverPlaceholder}>
                  <BookOpen size={48} />
                </div>
              )}
              {/* Badge accès en bas de la cover */}
              {manga.accessTier === 'premium' ? (
                <span className={`${styles.accessBadge} ${styles.accessPremium}`}>
                  <Lock size={11} /> {t.premium}
                </span>
              ) : (
                <span className={`${styles.accessBadge} ${styles.accessFree}`}>
                  {t.free}
                </span>
              )}
            </div>

            {/* Infos */}
            <div className={styles.info}>
              {manga.isFeatured && (
                <span className={styles.featuredBadge}>
                  <Crown size={11} /> VEDETTE
                </span>
              )}

              <h1 className={styles.title}>{title}</h1>

              <div className={styles.byLine}>
                <span className={styles.byLabel}>{t.by}</span>
                <span className={styles.author}>
                  {manga.author?.pseudo || manga.authorName}
                </span>
                <span className={styles.dot}>•</span>
                <span className={styles.statusChip}>{statusLabel}</span>
              </div>

              {/* Stats row */}
              <div className={styles.stats}>
                {manga.averageRating > 0 && (
                  <div className={styles.stat}>
                    <Star size={16} fill="currentColor" className={styles.statStarIcon} />
                    <span className={styles.statValue}>{manga.averageRating.toFixed(1)}</span>
                    <span className={styles.statLabel}>({manga.ratingCount})</span>
                  </div>
                )}
                <div className={styles.stat}>
                  <Eye size={16} />
                  <span className={styles.statValue}>{formatCount(manga.viewCount)}</span>
                  <span className={styles.statLabel}>{t.views}</span>
                </div>
                <div className={styles.stat}>
                  <BookOpen size={16} />
                  <span className={styles.statValue}>{manga.totalChapters}</span>
                  <span className={styles.statLabel}>{t.chapters}</span>
                </div>
              </div>

              {/* Genres */}
              {manga.genres?.length > 0 && (
                <div className={styles.genresRow}>
                  {manga.genres.map(g => (
                    <span key={g} className={styles.genreChip}>{g}</span>
                  ))}
                </div>
              )}

              {/* CTA */}
              <div className={styles.ctaRow}>
                {resumeChapter ? (
                  <button
                    className={styles.ctaPrimary}
                    onClick={() => navigate(`/manga/${manga.slug}/chapter/${resumeChapter.chapterNumber}`)}
                  >
                    <Play size={16} fill="currentColor" />
                    <div className={styles.ctaPrimaryText}>
                      <span>{t.resume}</span>
                      <span className={styles.ctaPrimarySub}>
                        {t.progressLabel(
                          `${t.chapter} ${resumeChapter.chapterNumber}`,
                          progress.pageIndex + 1,
                          resumeChapter.pageCount
                        )}
                      </span>
                    </div>
                  </button>
                ) : firstChapter ? (
                  <button
                    className={styles.ctaPrimary}
                    onClick={() => navigate(`/manga/${manga.slug}/chapter/${firstChapter.chapterNumber}`)}
                  >
                    <Play size={16} fill="currentColor" />
                    <span>{t.start}</span>
                  </button>
                ) : null}

                <LibraryButton
                  inLibrary={inLibrary}
                  mangaId={manga.id}
                  isLoggedIn={isLoggedIn}
                  t={t}
                  onChange={refresh}
                  toast={toast}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TABS ── */}
      <section className={styles.tabsSection}>
        <div className="container">
          <div className={styles.tabs}>
            {[
              { id: 'synopsis', label: t.tabSynopsis },
              { id: 'chapters', label: `${t.tabChapters} (${chapters.length})` },
              { id: 'reviews',  label: t.tabReviews },
            ].map(tabItem => (
              <button
                key={tabItem.id}
                className={`${styles.tab} ${tab === tabItem.id ? styles.tabActive : ''}`}
                onClick={() => setTab(tabItem.id)}
              >
                {tabItem.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'synopsis' && (
            <div className={styles.synopsisTab}>
              <div className={styles.synopsis}>
                {synopsis ? (
                  <p>{synopsis}</p>
                ) : (
                  <p className={styles.synopsisEmpty}>Synopsis à venir...</p>
                )}
              </div>

              {manga.tags?.length > 0 && (
                <div className={styles.tagsSection}>
                  <h4 className={styles.sectionLabel}>{t.tags}</h4>
                  <div className={styles.tagsRow}>
                    {manga.tags.map(tag => (
                      <span key={tag} className={styles.tag}>#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {manga.author?.publisherInfo?.bio && (
                <div className={styles.authorCard}>
                  <h4 className={styles.sectionLabel}>{t.by} {manga.author.pseudo}</h4>
                  <p>{manga.author.publisherInfo.bio}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'chapters' && (
            <ChaptersList
              chapters={chapters}
              mangaSlug={manga.slug}
              progress={progress}
              t={t}
              lang={lang}
            />
          )}

          {tab === 'reviews' && (
            <ReviewsTab
              manga={manga}
              user={user}
              isLoggedIn={isLoggedIn}
              t={t}
              lang={lang}
              onRated={refresh}
              toast={toast}
            />
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

/* ══ LIBRARY BUTTON ══════════════════════════════════ */
function LibraryButton({ inLibrary, mangaId, isLoggedIn, t, onChange, toast }) {
  const [open, setOpen] = useState(false)
  const { mutate: addToLib, loading: addingLib } = useMutation((status) => libraryApi.add(mangaId, status))
  const { mutate: removeLib, loading: removingLib } = useMutation(() => libraryApi.remove(mangaId))

  const STATUSES = [
    { id: 'reading',      label: t.libraryStatus.reading,       icon: '📖' },
    { id: 'plan_to_read', label: t.libraryStatus.plan_to_read,  icon: '📌' },
    { id: 'completed',    label: t.libraryStatus.completed,     icon: '✅' },
    { id: 'on_hold',      label: t.libraryStatus.on_hold,       icon: '⏸️' },
    { id: 'dropped',      label: t.libraryStatus.dropped,       icon: '🚫' },
  ]

  if (!isLoggedIn) {
    return (
      <Link to="/" className={styles.ctaSecondary}
        onClick={() => sessionStorage.setItem('openLogin', '1')}>
        <Plus size={16} /> {t.addToLibrary}
      </Link>
    )
  }

  const handleSelect = async (status) => {
    const { error } = await addToLib(status)
    setOpen(false)
    if (error) toast.error(error)
    else { toast.success('✅ ' + t.libraryStatus[status]); onChange?.() }
  }

  const handleRemove = async () => {
    const { error } = await removeLib()
    setOpen(false)
    if (error) toast.error(error)
    else { toast.info('Retiré de ta bibliothèque'); onChange?.() }
  }

  return (
    <div className={styles.libWrap}>
      <button
        className={`${styles.ctaSecondary} ${inLibrary ? styles.ctaSecondaryActive : ''}`}
        onClick={() => setOpen(o => !o)}
        disabled={addingLib || removingLib}
      >
        {inLibrary ? <Check size={16} /> : <Plus size={16} />}
        {inLibrary ? t.libraryStatus[inLibrary.status] || t.inLibrary : t.addToLibrary}
      </button>
      {open && (
        <>
          <div className={styles.libBackdrop} onClick={() => setOpen(false)} />
          <div className={styles.libMenu}>
            {STATUSES.map(s => (
              <button
                key={s.id}
                className={`${styles.libItem} ${inLibrary?.status === s.id ? styles.libItemActive : ''}`}
                onClick={() => handleSelect(s.id)}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
                {inLibrary?.status === s.id && <Check size={14} />}
              </button>
            ))}
            {inLibrary && (
              <>
                <div className={styles.libDivider} />
                <button className={`${styles.libItem} ${styles.libItemDanger}`} onClick={handleRemove}>
                  <Trash2 size={14} />
                  <span>Retirer</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ══ CHAPTERS LIST ═══════════════════════════════════ */
function ChaptersList({ chapters, mangaSlug, progress, t, lang }) {
  if (!chapters.length) {
    return (
      <div className={styles.chaptersEmpty}>
        <BookOpen size={42} />
        <p>Aucun chapitre publié pour le moment.</p>
      </div>
    )
  }

  return (
    <div className={styles.chaptersList}>
      {chapters.map(c => {
        const isReading = progress?.chapterId === c.id && !progress?.isCompleted
        const isDone = progress && progress.chapterId !== c.id && progress.isCompleted
                       && progress.chapter?.chapterNumber > c.chapterNumber
        return (
          <Link
            key={c.id}
            to={`/manga/${mangaSlug}/chapter/${c.chapterNumber}`}
            className={`${styles.chapterRow} ${isReading ? styles.chapterRowReading : ''}`}
          >
            <div className={styles.chapterNum}>
              <span className={styles.chapterNumLbl}>{t.chapter}</span>
              <span className={styles.chapterNumVal}>{c.chapterNumber}</span>
            </div>
            <div className={styles.chapterInfo}>
              <div className={styles.chapterTitle}>
                {c.title || `${t.chapter} ${c.chapterNumber}`}
                {isReading && <span className={styles.readingTag}>EN COURS</span>}
                {isDone && <Check size={14} className={styles.doneIcon} />}
              </div>
              <div className={styles.chapterMeta}>
                <span><Calendar size={11} /> {formatDate(c.publishedAt, lang)}</span>
                <span><Eye size={11} /> {formatCount(c.viewCount)}</span>
                <span>{c.pageCount} pages</span>
              </div>
            </div>
            <div className={styles.chapterAccess}>
              {c.accessTier === 'premium' ? (
                <span className={styles.chapterPremium}>
                  <Lock size={11} /> {t.premium}
                </span>
              ) : (
                <span className={styles.chapterFree}>{t.free}</span>
              )}
              <ArrowRight size={16} className={styles.chapterArrow} />
            </div>
          </Link>
        )
      })}
    </div>
  )
}

/* ══ REVIEWS TAB ═════════════════════════════════════ */
function ReviewsTab({ manga, user, isLoggedIn, t, lang, onRated, toast }) {
  const [showRateForm, setShowRateForm] = useState(false)
  const [stars, setStars] = useState(5)
  const [hoverStar, setHoverStar] = useState(0)
  const [review, setReview] = useState('')
  const [commentText, setCommentText] = useState('')

  const { mutate: rateManga, loading: rating } = useMutation(
    (data) => mangaApi.rate(manga.id, data.rating, data.review)
  )
  const { mutate: postComment, loading: posting } = useMutation(
    (data) => commentsApi.create(data)
  )
  const { mutate: deleteComment } = useMutation((id) => commentsApi.delete(id))

  const { data: commentsData, refresh: refreshComments } = useApi(
    () => commentsApi.getForManga(manga.id, { limit: 50 }),
    [manga.id],
    true
  )
  const comments = commentsData?.comments || []

  const handleRate = async () => {
    const { error } = await rateManga({ rating: stars, review })
    if (error) toast.error(error)
    else {
      toast.success(t.ratingThanks)
      setShowRateForm(false)
      setReview('')
      onRated?.()
    }
  }

  const handlePostComment = async () => {
    if (!commentText.trim()) return
    const { error } = await postComment({ mangaId: manga.id, content: commentText.trim() })
    if (error) toast.error(error)
    else {
      toast.success(t.commentSent)
      setCommentText('')
      refreshComments()
    }
  }

  const handleDelete = async (id) => {
    const { error } = await deleteComment(id)
    if (error) toast.error(error)
    else { toast.info(t.commentDeleted); refreshComments() }
  }

  return (
    <div className={styles.reviewsTab}>
      {/* Rating section */}
      <div className={styles.ratingCard}>
        <div className={styles.ratingLeft}>
          <div className={styles.ratingNum}>
            {manga.averageRating > 0 ? manga.averageRating.toFixed(1) : '—'}
          </div>
          <div className={styles.ratingStars}>
            {[1,2,3,4,5].map(n => (
              <Star
                key={n}
                size={16}
                fill={manga.averageRating >= n ? 'currentColor' : 'none'}
                strokeWidth={1.5}
                className={manga.averageRating >= n ? styles.starOn : styles.starOff}
              />
            ))}
          </div>
          <div className={styles.ratingCount}>
            {manga.ratingCount} avis
          </div>
        </div>
        <div className={styles.ratingRight}>
          <h3 className={styles.ratingPrompt}>{t.rateThis}</h3>
          {!isLoggedIn ? (
            <p className={styles.ratingMuted}>{t.loginToRate}</p>
          ) : !showRateForm ? (
            <button className={styles.rateBtn} onClick={() => setShowRateForm(true)}>
              <Star size={14} /> {t.rateCta}
            </button>
          ) : (
            <div className={styles.rateForm}>
              <div className={styles.rateStars}>
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHoverStar(n)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => setStars(n)}
                    className={styles.rateStarBtn}
                  >
                    <Star
                      size={28}
                      fill={(hoverStar || stars) >= n ? 'currentColor' : 'none'}
                      className={(hoverStar || stars) >= n ? styles.starOn : styles.starOff}
                    />
                  </button>
                ))}
              </div>
              <textarea
                className={styles.rateTextarea}
                placeholder={t.reviewPlaceholder}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <div className={styles.rateActions}>
                <button className={styles.rateCancel} onClick={() => setShowRateForm(false)}>
                  Annuler
                </button>
                <button className={styles.rateSubmit} onClick={handleRate} disabled={rating}>
                  {rating ? 'Envoi...' : t.submitRating}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className={styles.commentsSection}>
        <h3 className={styles.commentsTitle}>
          <MessageCircle size={18} /> {t.commentsTitle} ({comments.length})
        </h3>

        {/* Form */}
        {isLoggedIn ? (
          <div className={styles.commentForm}>
            <textarea
              className={styles.commentInput}
              placeholder={t.commentPlaceholder}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              maxLength={1000}
            />
            <div className={styles.commentFormFoot}>
              <span className={styles.commentCount}>{commentText.length}/1000</span>
              <button
                className={styles.commentSubmit}
                onClick={handlePostComment}
                disabled={posting || !commentText.trim()}
              >
                <Send size={14} /> {posting ? '...' : t.sendComment}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.commentLoginPrompt}>
            <Link to="/" onClick={() => sessionStorage.setItem('openLogin', '1')}>
              {t.loginToComment}
            </Link>
          </div>
        )}

        {/* Comments list */}
        {comments.length === 0 ? (
          <div className={styles.commentsEmpty}>
            <MessageCircle size={40} />
            <h4>{t.noComments}</h4>
            <p>{t.noCommentsSub}</p>
          </div>
        ) : (
          <div className={styles.commentsList}>
            {comments.map(c => (
              <div key={c.id} className={styles.commentItem}>
                <div className={styles.commentAvatar}>
                  {c.user?.avatar || '🎌'}
                </div>
                <div className={styles.commentBody}>
                  <div className={styles.commentHead}>
                    <span className={styles.commentAuthor}>{c.user?.pseudo || 'Anonyme'}</span>
                    <span className={styles.commentDate}>{formatDate(c.createdAt, lang, true)}</span>
                  </div>
                  <p className={styles.commentText}>{c.content}</p>
                  {(user?.id === c.userId || ['admin','superadmin'].includes(user?.role)) && (
                    <button className={styles.commentDelBtn} onClick={() => handleDelete(c.id)}>
                      <Trash2 size={11} /> {t.deleteComment}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ══ HELPERS ══ */
function formatCount(n) {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return n.toString()
}

function formatDate(date, lang = 'fr', short = false) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US',
    short ? { dateStyle: 'short' } : { day: '2-digit', month: 'short', year: 'numeric' })
}