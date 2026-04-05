import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Copy,
  Handshake,
  Mail,
  Megaphone,
  Newspaper,
  Search,
  Sparkles,
  Tag,
  TicketPercent,
  X,
  Zap,
} from 'lucide-react'
import { useLang } from '../../contexts/LangContext'
import { useToast } from '../../contexts/ToastContext'
import { useApi } from '../../hooks/useApi'
import { blogApi, newsletterApi } from '../../api'
import Navbar from '../../components/Navbar'
import Footer from '../Home/sections/Footer'
import Modal from '../../components/ui/Modal'
import { PageLoader, EmptyState } from '../../components/ui/Spinner'
import Badge, { statusVariant } from '../../components/ui/Badge'
import styles from './Blog.module.css'

const copy = {
  fr: {
    metaTitle: 'Blog & Actualités — Otaku Pulse',
    heroBadge: 'Blog & actualités',
    heroTitleA: 'ACTUS',
    heroTitleB: 'OTAKU PULSE',
    heroSub: 'Annonces, événements, promotions exclusives et actualités de la communauté Otaku au Cameroun.',
    searchPlaceholder: 'Rechercher un article, une promo, un événement...',
    all: 'Tous',
    categories: {
      blog: 'Blog',
      event: 'Événement',
      promo: 'Promo',
      partner: 'Partenaire',
    },
    featured: 'À la une',
    readMore: 'Lire l’article',
    author: 'Otaku Pulse',
    partners: 'Partenaires',
    partnersEmpty: 'Partenariats en cours...',
    newsletter: 'Newsletter',
    newsletterText: 'Reçois nos actus, drops et promos en avant-première.',
    newsletterBtn: 'S’abonner',
    subscribed: '✅ Abonné à la newsletter !',
    noPost: 'Aucun article trouvé',
    noPostMsg: 'Essaie une autre recherche ou une autre catégorie.',
    popupBtn: 'En profiter',
    copyCode: 'Code copié !',
    byDate: (date) => date,
    results: (n) => `${n} résultat${n > 1 ? 's' : ''}`,
  },
  en: {
    metaTitle: 'Blog & News — Otaku Pulse',
    heroBadge: 'Blog & news',
    heroTitleA: 'OTAKU',
    heroTitleB: 'PULSE NEWS',
    heroSub: 'Announcements, events, exclusive promotions and community updates for Otaku fans in Cameroon.',
    searchPlaceholder: 'Search an article, promo, or event...',
    all: 'All',
    categories: {
      blog: 'Blog',
      event: 'Event',
      promo: 'Promo',
      partner: 'Partner',
    },
    featured: 'Featured',
    readMore: 'Read article',
    author: 'Otaku Pulse',
    partners: 'Partners',
    partnersEmpty: 'Partnerships in progress...',
    newsletter: 'Newsletter',
    newsletterText: 'Get our latest news, drops and promos first.',
    newsletterBtn: 'Subscribe',
    subscribed: '✅ Subscribed to the newsletter!',
    noPost: 'No article found',
    noPostMsg: 'Try another search or category.',
    popupBtn: 'Use it now',
    copyCode: 'Code copied!',
    byDate: (date) => date,
    results: (n) => `${n} item${n > 1 ? 's' : ''}`,
  },
}

const SAMPLE = [
  {
    id: 1,
    category: 'event',
    emoji: '🎌',
    isFeatured: true,
    title: 'Grand Lancement — 30 Juin 2026',
    excerpt: 'Le premier événement officiel Otaku Pulse à Yaoundé. Zone Hokage, mixologie narrative et mapping vidéo.',
    content:
      'Le premier événement officiel Otaku Pulse aura lieu le 30 Juin 2026 à Yaoundé.\n\nAu programme :\n• Décoration immersive\n• Cocktails narratifs\n• Mapping vidéo\n• Playlist anime',
    createdAt: '2026-03-01',
  },
  {
    id: 2,
    category: 'promo',
    emoji: '🔥',
    title: 'Offre Lancement — 15% sur Pack Chūnin',
    excerpt: "Jusqu'au 30 Avril 2026, -15% avec le code NAKAMA.",
    content: "Profite de 15% de réduction sur le Pack Chūnin avec le code NAKAMA jusqu'au 30 Avril 2026.",
    createdAt: '2026-03-10',
    promoCode: 'NAKAMA',
  },
  {
    id: 3,
    category: 'blog',
    emoji: '📝',
    title: 'Comment choisir son thème anime ?',
    excerpt: 'Nos conseils pour trouver le thème parfait parmi 50+ options.',
    content: 'Pense à tes invités, à l’ambiance souhaitée et au niveau d’immersion voulu.',
    createdAt: '2026-03-15',
  },
]

function categoryIcon(category) {
  switch (category) {
    case 'event':
      return <Megaphone size={14} />
    case 'promo':
      return <TicketPercent size={14} />
    case 'partner':
      return <Handshake size={14} />
    default:
      return <Newspaper size={14} />
  }
}

export default function BlogPage() {
  const { lang } = useLang()
  const toast = useToast()
  const t = copy[lang]

  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedPost, setSelectedPost] = useState(null)
  const [email, setEmail] = useState('')
  const [popup, setPopup] = useState(null)

  useEffect(() => {
    document.title = t.metaTitle
  }, [t.metaTitle])

  const { data: postsData, loading: loadingPosts } = useApi(() => blogApi.getPosts({ limit: 50 }), [], true)
  const { data: partnersData } = useApi(() => blogApi.getPartners(), [], true)
  const { data: popupData } = useApi(() => blogApi.getPopup(), [], true)

  const posts = postsData?.posts?.length ? postsData.posts : SAMPLE
  const partners = partnersData?.partners || []

  useEffect(() => {
    if (popupData?.popup?.isActive) {
      const timer = setTimeout(() => setPopup(popupData.popup), 3500)
      return () => clearTimeout(timer)
    }
    if (!popupData && posts.length) {
      const timer = setTimeout(() => {
        setPopup({ emoji: '🔥', title: 'OFFRE LANCEMENT', text: 'Utilise NAKAMA pour -15% sur le Pack Chūnin', code: 'NAKAMA' })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [popupData, posts.length])

  const filtered = useMemo(() => {
    return posts.filter((post) => {
      const matchCategory = category === 'all' || post.category === category
      const haystack = `${post.title} ${post.excerpt || ''} ${post.content || ''}`.toLowerCase()
      const matchSearch = !search || haystack.includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [posts, category, search])

  const subscribe = async (e) => {
    e.preventDefault()
    try {
      await newsletterApi.subscribe(email, lang)
      setEmail('')
      toast.success(t.subscribed)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code)
    toast.success(t.copyCode)
  }

  const categories = [
    { key: 'all', label: t.all, icon: <Sparkles size={14} /> },
    { key: 'blog', label: t.categories.blog, icon: <Newspaper size={14} /> },
    { key: 'event', label: t.categories.event, icon: <Megaphone size={14} /> },
    { key: 'promo', label: t.categories.promo, icon: <TicketPercent size={14} /> },
    { key: 'partner', label: t.categories.partner, icon: <Handshake size={14} /> },
  ]

  return (
    <div className={styles.page}>
      <Navbar />

      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className="container">
          <div className={styles.heroBadge}>
            <Zap size={14} />
            <span>{t.heroBadge}</span>
          </div>
          <h1 className={styles.heroTitle}>
            {t.heroTitleA} <span>{t.heroTitleB}</span>
          </h1>
          <p className={styles.heroSub}>{t.heroSub}</p>

          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={styles.searchInput}
            />
          </div>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container">
          <div className={styles.topRow}>
            <div className={styles.cats}>
              {categories.map((item) => (
                <button
                  key={item.key}
                  className={`${styles.catBtn} ${category === item.key ? styles.catActive : ''}`}
                  onClick={() => setCategory(item.key)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <div className={styles.resultsCount}>{t.results(filtered.length)}</div>
          </div>

          <div className={styles.layout}>
            <div>
              {loadingPosts && <PageLoader />}

              {!loadingPosts && filtered.length === 0 && (
                <EmptyState icon="📰" title={t.noPost} message={t.noPostMsg} />
              )}

              {!loadingPosts && filtered.map((post, index) => {
                const isFeatured = index === 0 && category === 'all'
                return (
                  <article
                    key={post.id}
                    className={`${styles.postCard} ${isFeatured ? styles.featured : ''}`}
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className={styles.postThumb}>
                      {post.imageUrl ? <img src={post.imageUrl} alt={post.title} loading="lazy" /> : <span>{post.emoji || '📰'}</span>}
                    </div>
                    <div className={styles.postBody}>
                      <div className={styles.postMeta}>
                        <Badge variant={statusVariant(post.category)} style={{ fontSize: '.68rem' }}>
                          <span className={styles.badgeInner}>
                            {categoryIcon(post.category)}
                            {t.categories[post.category] || post.category}
                          </span>
                        </Badge>
                        <span className={styles.postDate}>
                          <CalendarDays size={14} />
                          {new Date(post.createdAt || Date.now()).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-CA', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        {post.isFeatured && <span className={styles.featuredTag}>{t.featured}</span>}
                      </div>

                      <h2 className={styles.postTitle}>{post.title}</h2>
                      <p className={styles.postExcerpt}>{post.excerpt || post.content?.slice(0, 150) || ''}</p>

                      <div className={styles.postFooter}>
                        <span className={styles.authorLine}>
                          <Tag size={14} />
                          {t.author}
                        </span>
                        <span className={styles.readMore}>
                          {t.readMore}
                          <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            <aside className={styles.sidebar}>
              <div className={styles.sideBox}>
                <h3 className={styles.sideTitle}>
                  <Handshake size={16} />
                  {t.partners}
                </h3>
                {partners.length ? (
                  partners.map((partner) => (
                    <a key={partner.id} href={partner.url || '#'} target="_blank" rel="noreferrer" className={styles.partnerLink}>
                      <span className={styles.partLogo}>{partner.logo || '🤝'}</span>
                      <div>
                        <span className={styles.partName}>{partner.name}</span>
                        <span className={styles.partDesc}>{partner.description || ''}</span>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className={styles.sideText}>{t.partnersEmpty}</p>
                )}
              </div>

              <div className={styles.sideBox}>
                <h3 className={styles.sideTitle}>
                  <Mail size={16} />
                  {t.newsletter}
                </h3>
                <p className={styles.sideText}>{t.newsletterText}</p>
                <form onSubmit={subscribe} className={styles.newsletterForm}>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    className={styles.nlInput}
                  />
                  <button type="submit" className={styles.nlBtn}>
                    <Zap size={16} />
                    {t.newsletterBtn}
                  </button>
                </form>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Modal isOpen={!!selectedPost} onClose={() => setSelectedPost(null)} title={selectedPost?.title}>
        {selectedPost && (
          <div className={styles.modalBody}>
            {selectedPost.imageUrl && <img src={selectedPost.imageUrl} alt={selectedPost.title} className={styles.modalImage} />}
            <div className={styles.modalMeta}>
              <Badge variant={statusVariant(selectedPost.category)} style={{ fontSize: '.68rem' }}>
                <span className={styles.badgeInner}>
                  {categoryIcon(selectedPost.category)}
                  {t.categories[selectedPost.category] || selectedPost.category}
                </span>
              </Badge>
              {selectedPost.promoCode && (
                <button className={styles.codeBtn} onClick={() => copyCode(selectedPost.promoCode)}>
                  <Copy size={14} />
                  {selectedPost.promoCode}
                </button>
              )}
            </div>
            <div className={styles.modalContent}>
              {(selectedPost.content || '').split('\n').map((line, index) =>
                line ? <p key={index}>{line}</p> : <br key={index} />,
              )}
            </div>
          </div>
        )}
      </Modal>

      {popup && (
        <div className={styles.promoPopup}>
          <button className={styles.popupClose} onClick={() => setPopup(null)}>
            <X size={16} />
          </button>
          <span className={styles.popupEmoji}>{popup.emoji || '🔥'}</span>
          <div className={styles.popupTitle}>{popup.title}</div>
          <div className={styles.popupText}>{popup.text}</div>
          {popup.code && (
            <button className={styles.popupCode} onClick={() => copyCode(popup.code)}>
              <Copy size={14} />
              {popup.code}
            </button>
          )}
          <Link to="/membership" className={styles.popupCta} onClick={() => setPopup(null)}>
            <Zap size={15} />
            {t.popupBtn}
          </Link>
        </div>
      )}

      <Footer />
    </div>
  )
}
