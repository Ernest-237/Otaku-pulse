import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { blogApi, newsletterApi } from '../../api'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../contexts/ToastContext'
import Navbar from '../../components/Navbar'
import Footer from '../Home/sections/Footer'
import MediaImage from '../../components/ui/MediaImage'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { eventDate } from '../../components/EventCard'
import styles from '../PublicContent.module.css'

const categories = {
  all: 'Tout le journal',
  blog: 'Culture & actualités',
  event: 'Événements',
  promo: 'Bons plans',
  partner: 'Partenaires',
}
const safeLink = (value) =>
  /^(https?:\/\/|\/(?!\/))/.test(value || '') ? value : '/blog'
export default function BlogPage() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)
  const toast = useToast()
  const articleId = params.get('article')
  const { data, loading, error, refresh } = useApi(
    () => blogApi.getPosts({ search: query, category, page, limit: 9 }),
    [query, category, page]
  )
  const article = useApi(
    () => (articleId ? blogApi.getPost(articleId) : Promise.resolve(null)),
    [articleId]
  )
  const partners = useApi(() => blogApi.getPartners(), [])
  const promo = useApi(() => blogApi.getPopup(), [])
  useEffect(() => {
    document.title = 'Blog & actualités otaku — Otaku Pulse'
  }, [])
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])
  useEffect(() => {
    const p = promo.data?.popup
    if (!p?.isActive) return
    try {
      if (sessionStorage.getItem(`op_promo_${p.id}`)) return
    } catch {}
    const timer = setTimeout(() => setPopupOpen(true), 8000)
    return () => clearTimeout(timer)
  }, [promo.data])
  const dismissPromo = () => {
    setPopupOpen(false)
    try {
      sessionStorage.setItem(`op_promo_${promo.data?.popup?.id}`, '1')
    } catch {}
  }
  const post = article.data?.post
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <header className={styles.hero}>
          <div>
            <p className={styles.kicker}>🍵 Le journal des nakama</p>
            <h1>
              La culture otaku,
              <br />
              <em>tout près de chez toi.</em>
            </h1>
            <p>
              Le Cameroun a ses talents et ses rendez-vous. Retrouve les
              annonces, les créateurs et les nouvelles de la communauté.
            </p>
            <div className={styles.links}>
              <Link to="/evenements">L’agenda des événements ↗</Link>
              <Link to="/manga">Découvrir les mangas ↗</Link>
            </div>
          </div>
          <span className={styles.heroSeal} aria-hidden="true">
            🍵
          </span>
        </header>
        <div className={styles.filters}>
          <label>
            Rechercher
            <input
              type="search"
              placeholder="Une annonce, un créateur, une ville…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label>
            Rubrique
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(1)
              }}
            >
              {Object.entries(categories).map(([k, v]) => (
                <option value={k} key={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <span>{data?.total || 0} article(s)</span>
        </div>
        {loading ? (
          <p className={styles.empty} role="status">
            Chargement du journal…
          </p>
        ) : error ? (
          <div className={styles.empty} role="alert">
            {error}
            <Button onClick={refresh}>Réessayer</Button>
          </div>
        ) : data?.posts?.length ? (
          <div className={styles.grid}>
            {data.posts.map((p) => (
              <article className={styles.card} key={p.id}>
                <Link to={`?article=${p.id}`} tabIndex={-1} aria-hidden="true">
                  <MediaImage
                    src={p.imageUrl}
                    alt=""
                    loading="lazy"
                    className={styles.cover}
                  />
                </Link>
                <div className={styles.cardBody}>
                  <p className={styles.kicker}>
                    {p.isFeatured ? 'À la une · ' : ''}
                    {categories[p.category]}
                  </p>
                  <h3>
                    <Link to={`?article=${p.id}`}>{p.title}</Link>
                  </h3>
                  <p>{p.excerpt || p.content?.slice(0, 150)}</p>
                  {p.category === 'event' && (
                    <p>
                      {eventDate(p.eventDate)} · {p.eventCity}
                    </p>
                  )}
                  <div className={styles.cardFoot}>
                    <span>
                      {new Date(
                        p.publishedAt || p.createdAt
                      ).toLocaleDateString('fr-FR')}
                    </span>
                    <Link to={`?article=${p.id}`}>Lire l’article ↗</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <span aria-hidden="true">🍡</span>
            <h2>Le journal se prépare</h2>
            <p>
              Aucun article pour ces filtres. Les prochaines annonces
              apparaîtront ici.
            </p>
          </div>
        )}
        <div className="editorial-pagination">
          <Button
            variant="ghost"
            disabled={page === 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            Précédent
          </Button>
          <span>Page {page}</span>
          <Button
            variant="ghost"
            disabled={loading || page * 9 >= (data?.total || 0)}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
        </div>
        <aside className={styles.extras}>
          <div>
            <h2>Ils font vivre la communauté</h2>
            <div className={styles.partners}>
              {partners.data?.partners?.map((p) => (
                <a
                  key={p.id}
                  href={safeLink(p.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={p.description}
                >
                  {p.logoUrl ? (
                    <MediaImage src={p.logoUrl} alt="" />
                  ) : (
                    <span>{p.logo || '🍡'}</span>
                  )}
                  {p.name}
                </a>
              ))}
            </div>
            {!partners.data?.partners?.length && (
              <p>Les partenaires seront présentés ici.</p>
            )}
          </div>
          <form
            className="editorial-form"
            onSubmit={async (e) => {
              e.preventDefault()
              if (sending) return
              setSending(true)
              try {
                await newsletterApi.subscribe(email)
                setEmail('')
                toast.success('Inscription enregistrée !')
              } catch (err) {
                toast.error(err.message)
              } finally {
                setSending(false)
              }
            }}
          >
            <h2>Une lettre entre nakama</h2>
            <p>Reçois nos nouvelles et les prochains rendez-vous.</p>
            <label className="editorial-field">
              Ton adresse email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@exemple.com"
              />
            </label>
            <Button type="submit" disabled={sending}>
              M’inscrire à la newsletter
            </Button>
          </form>
        </aside>
        {articleId && (
          <Modal
            isOpen
            wide
            title={post?.title || 'Article'}
            onClose={() => setParams({})}
          >
            {article.loading ? (
              <p>Chargement…</p>
            ) : article.error ? (
              <p role="alert">
                {article.error}{' '}
                <button onClick={article.refresh}>Réessayer</button>
              </p>
            ) : (
              post && (
                <article className={styles.detail}>
                  {post.imageUrl && (
                    <MediaImage
                      src={post.imageUrl}
                      alt={post.title}
                      className={styles.detailCover}
                    />
                  )}
                  <p className={styles.kicker}>
                    {categories[post.category]} ·{' '}
                    {new Date(
                      post.publishedAt || post.createdAt
                    ).toLocaleDateString('fr-FR')}
                  </p>
                  {post.category === 'event' && (
                    <div className={styles.facts}>
                      <div>
                        <small>Date</small>
                        <strong>{eventDate(post.eventDate)}</strong>
                      </div>
                      <div>
                        <small>Lieu</small>
                        <strong>{post.eventCity}</strong>
                        <span>{post.eventVenue}</span>
                      </div>
                      <div>
                        <small>Entrée</small>
                        <strong>
                          {Number(post.eventPrice)
                            ? `${Number(post.eventPrice).toLocaleString('fr-FR')} FCFA`
                            : 'Gratuite'}
                        </strong>
                      </div>
                    </div>
                  )}
                  <p className={styles.prose}>{post.content}</p>
                  {post.eventUrl && (
                    <a href={safeLink(post.eventUrl)}>
                      Informations et inscriptions ↗
                    </a>
                  )}
                  {post.promoCode && (
                    <div className="editorial-notice">
                      {post.promoExpiry &&
                      new Date(post.promoExpiry) < new Date() ? (
                        'Offre expirée'
                      ) : (
                        <>
                          Code : <strong>{post.promoCode}</strong>
                          <button
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  post.promoCode
                                )
                                toast.success('Code copié')
                              } catch {
                                toast.error('Copie le code affiché ci-dessus.')
                              }
                            }}
                          >
                            Copier
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </article>
              )
            )}
          </Modal>
        )}
        {popupOpen && !articleId && promo.data?.popup && (
          <Modal isOpen title={promo.data.popup.title} onClose={dismissPromo}>
            <div className={styles.detail}>
              <p>{promo.data.popup.text}</p>
              {promo.data.popup.code && (
                <strong>{promo.data.popup.code}</strong>
              )}
              {promo.data.popup.url && (
                <a href={safeLink(promo.data.popup.url)}>Découvrir l’offre ↗</a>
              )}
            </div>
          </Modal>
        )}
      </main>
      <Footer />
    </>
  )
}
