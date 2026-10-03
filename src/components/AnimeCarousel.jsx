import MediaImage from './ui/MediaImage'
// src/components/AnimeCarousel.jsx
// Bandeau d'affiches anime en défilement automatique (planning admin-géré)
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../contexts/LangContext'
import { useApi } from '../hooks/useApi'
import { animeApi, API_BASE , resolveMediaUrl } from '../api'
import styles from './AnimeCarousel.module.css'

// Une affiche importée depuis AniList est une URL absolue vers leur CDN ;
// une affiche téléversée est un chemin relatif servi par notre API.
// Préfixer aveuglément par API_BASE casserait la première.
const resolveCover = (url) =>
  !url ? null : url.startsWith('http') ? url : resolveMediaUrl(url)

export default function AnimeCarousel({ variant = 'light', label, fallback = null }) {
  const { lang } = useLang()
  const { data, loading } = useApi(() => animeApi.getAll({ discover: true, limit: 20 }), [], true)
  const animes = data?.animes || []

  // Dupliqué une fois pour un défilement en boucle continue (CSS pur, sans lib)
  const track = useMemo(() => [...animes, ...animes], [animes])

  if (loading) return null
  if (animes.length === 0) return fallback

  return (
    <div className={`${styles.wrap} ${variant === 'dark' ? styles.dark : ''}`}>
      {label && (
        <div className={styles.label}>
          <span className={styles.dot} />
          <span>{label}</span>
        </div>
      )}
      <div className={styles.viewport}>
        <div className={styles.track} style={{ animationDuration: `${Math.max(animes.length * 3.5, 12)}s` }}>
          {track.map((a, i) => {
            const title = lang === 'en' ? (a.titleE || a.titleF) : a.titleF
            return (
              <Link key={`${a.id}-${i}`} to="/#anime-schedule" className={styles.card} title={title} tabIndex={i >= animes.length ? -1 : 0} aria-hidden={i >= animes.length || undefined}>
                {a.coverUrl
                  ? <MediaImage src={resolveCover(a.coverUrl)} alt={title} loading="lazy" />
                  : <span className={styles.cardFallback}>📺</span>}
                <span className={`${styles.statusDot} ${styles[a.status] || ''}`} />
                <span className={styles.cardTitle}>{title}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
