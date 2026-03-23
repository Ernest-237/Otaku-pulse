// src/pages/Home/sections/Events.jsx
// Charge les posts Blog de catégorie "event" — masqué si vide
import { useState } from 'react'
import { useLang }  from '../../../contexts/LangContext'
import { useToast } from '../../../contexts/ToastContext'
import { useApi }   from '../../../hooks/useApi'
import { blogApi, API_BASE } from '../../../api'
import styles from './Events.module.css'

export default function Events() {
  const { lang } = useLang()
  const toast    = useToast()
  const [selected, setSelected] = useState(null)

  // Charger uniquement les posts catégorie "event" publiés
  const { data, loading } = useApi(
    () => blogApi.getPosts({ category: 'event', limit: 6 }),
    [], true
  )

  const posts = (data?.posts || []).filter(p => p.isPublished !== false)

  // ⚠️ Si aucun événement publié → section masquée
  if (loading || posts.length === 0) return null

  return (
    <section id="events" className={styles.section}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <div className={styles.tag}>🎌 {lang==='fr' ? 'Événements' : 'Events'}</div>
          <h2 className={styles.title}>
            {lang==='fr' ? 'Nos ' : 'Our '}
            <span className={styles.titleAccent}>{lang==='fr' ? 'ÉVÉNEMENTS' : 'EVENTS'}</span>
          </h2>
          <p className={styles.subtitle}>
            {lang==='fr'
              ? 'Découvre nos prochains événements Otaku au Cameroun'
              : 'Discover our upcoming Otaku events in Cameroon'}
          </p>
        </div>

        <div className={styles.grid}>
          {posts.map(post => (
            <EventCard key={post.id} post={post} lang={lang} onClick={() => setSelected(post)} />
          ))}
        </div>
      </div>

      {/* Modal détail */}
      {selected && (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSelected(null)}>✕</button>
            <div className={styles.modalEmoji}>{selected.emoji || '🎌'}</div>
            <h2 className={styles.modalTitle}>{selected.title}</h2>
            {selected.excerpt && <p className={styles.modalExcerpt}>{selected.excerpt}</p>}
            {selected.content && <div className={styles.modalContent}>{selected.content}</div>}
            {selected.promoCode && (
              <div className={styles.promoBox}>
                🎁 Code promo : <strong className={styles.promoCode}>{selected.promoCode}</strong>
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
      {/* Image ou emoji */}
      <div className={styles.cardImg}>
        {imgSrc
          ? <img src={imgSrc} alt={post.title} loading="lazy" />
          : <span className={styles.cardEmoji}>{post.emoji || '🎌'}</span>}
        {post.isFeatured && <span className={styles.featuredBadge}>⭐ À la une</span>}
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          <span className={styles.cardCat}>🎌 Événement</span>
          <span className={styles.cardDate}>
            {new Date(post.createdAt).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
          </span>
        </div>
        <h3 className={styles.cardTitle}>{post.title}</h3>
        {post.excerpt && <p className={styles.cardExcerpt}>{post.excerpt}</p>}
        <button className={styles.cardBtn}>
          {lang==='fr' ? 'En savoir plus →' : 'Learn more →'}
        </button>
      </div>
    </div>
  )
}