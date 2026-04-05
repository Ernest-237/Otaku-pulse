import { useState } from 'react'
import { ArrowRight, CalendarDays, Sparkles, Star, Ticket, X } from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import { useApi } from '../../../hooks/useApi'
import { blogApi } from '../../../api'
import styles from './Events.module.css'

export default function Events() {
  const { lang } = useLang()
  const [selected, setSelected] = useState(null)

  const { data, loading } = useApi(
    () => blogApi.getPosts({ category: 'event', limit: 6 }),
    [],
    true
  )

  const posts = (data?.posts || []).filter((p) => p.isPublished !== false)

  if (loading || posts.length === 0) return null

  return (
    <section id="events" className={styles.section}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <div className={styles.tag}>
            <CalendarDays size={14} strokeWidth={2.2} />
            <span>{lang === 'fr' ? 'Événements' : 'Events'}</span>
          </div>

          <h2 className={styles.title}>
            {lang === 'fr' ? 'NOS ' : 'OUR '}
            <span className={styles.titleAccent}>{lang === 'fr' ? 'ÉVÉNEMENTS' : 'EVENTS'}</span>
          </h2>

          <p className={styles.subtitle}>
            {lang === 'fr'
              ? 'Découvre nos prochains événements Otaku au Cameroun'
              : 'Discover our upcoming Otaku events in Cameroon'}
          </p>
        </div>

        <div className={styles.grid}>
          {posts.map((post) => (
            <EventCard key={post.id} post={post} lang={lang} onClick={() => setSelected(post)} />
          ))}
        </div>
      </div>

      {selected && (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSelected(null)} aria-label="close modal">
              <X size={16} strokeWidth={2.4} />
            </button>

            <div className={styles.modalHero}>
              <Sparkles size={34} strokeWidth={2.1} />
            </div>

            <h2 className={styles.modalTitle}>{selected.title}</h2>
            {selected.excerpt && <p className={styles.modalExcerpt}>{selected.excerpt}</p>}
            {selected.content && <div className={styles.modalContent}>{selected.content}</div>}

            {selected.promoCode && (
              <div className={styles.promoBox}>
                <span className={styles.promoLabel}>
                  <Ticket size={16} strokeWidth={2.2} />
                  <span>{lang === 'fr' ? 'Code promo' : 'Promo code'}</span>
                </span>
                <strong className={styles.promoCode}>{selected.promoCode}</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function EventCard({ post, lang, onClick }) {
  const imgSrc = post.imageData
    ? `data:${post.imageMime};base64,${post.imageData}`
    : post.imageUrl || null

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.cardImg}>
        {imgSrc ? (
          <img src={imgSrc} alt={post.title} loading="lazy" />
        ) : (
          <span className={styles.cardPlaceholder}>
            <CalendarDays size={32} strokeWidth={2} />
          </span>
        )}

        {post.isFeatured && (
          <span className={styles.featuredBadge}>
            <Star size={13} strokeWidth={2.2} />
            <span>{lang === 'fr' ? 'À la une' : 'Featured'}</span>
          </span>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span className={styles.cardCat}>
            <CalendarDays size={12} strokeWidth={2.2} />
            <span>{lang === 'fr' ? 'Événement' : 'Event'}</span>
          </span>

          <span className={styles.cardDate}>
            {new Date(post.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>

        <h3 className={styles.cardTitle}>{post.title}</h3>
        {post.excerpt && <p className={styles.cardExcerpt}>{post.excerpt}</p>}

        <button className={styles.cardBtn}>
          <span>{lang === 'fr' ? 'En savoir plus' : 'Learn more'}</span>
          <ArrowRight size={15} strokeWidth={2.3} />
        </button>
      </div>
    </div>
  )
}

