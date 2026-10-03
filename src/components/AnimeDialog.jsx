import MediaImage from './ui/MediaImage'
import { useEffect, useRef } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { API_BASE , resolveMediaUrl } from '../api'
import styles from '../pages/Home/sections/Discovery.module.css'

export const coverUrl = (url) =>
  !url ? null : /^https?:\/\//.test(url) ? url : resolveMediaUrl(url)

export default function AnimeDialog({ anime, lang, onClose }) {
  const ref = useRef(null)
  const fr = lang === 'fr'
  useEffect(() => {
    const dialog = ref.current
    dialog.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previous
    }
  }, [])
  const title = fr ? anime.titleF : anime.titleE || anime.titleF
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      aria-label={title}
    >
      <div className={styles.dialogInner}>
        <button
          autoFocus
          className={styles.close}
          onClick={onClose}
          aria-label={fr ? 'Fermer' : 'Close'}
        >
          <X size={20} />
        </button>
        <span className={styles.kicker}>{anime.studio || 'ANIME'}</span>
        <h2>{title}</h2>
        <p>
          {(fr
            ? anime.synopsisF || anime.synopsisE
            : anime.synopsisE || anime.synopsisF) ||
            (fr ? 'Le synopsis arrive bientôt.' : 'Synopsis coming soon.')}
        </p>
        <div className={styles.tags}>
          {anime.genres?.map((g) => (
            <span key={g}>{g}</span>
          ))}
        </div>
        {anime.nextEpisodeAt && (
          <p>
            {fr ? 'Prochain épisode' : 'Next episode'} {anime.nextEpisodeNumber}{' '}
            ·{' '}
            {new Date(anime.nextEpisodeAt).toLocaleString(
              fr ? 'fr-FR' : 'en-GB',
              { dateStyle: 'medium', timeStyle: 'short' }
            )}
          </p>
        )}
        <div className={styles.characters}>
          {anime.characters?.map((c) => (
            <div key={c.name}>
              {c.imageUrl && <MediaImage src={c.imageUrl} alt="" loading="lazy" />}
              <span>{c.name}</span>
            </div>
          ))}
        </div>
        {anime.openingUrl && /^https?:\/\//.test(anime.openingUrl) && (
          <a href={anime.openingUrl} target="_blank" rel="noreferrer">
            {anime.openingTitle || 'Opening'} <ExternalLink size={14} />
          </a>
        )}
        {anime.themes?.map((t) => (
          <a
            className={styles.themeLink}
            key={t.id}
            href={t.url}
            target="_blank"
            rel="noreferrer"
          >
            {t.kind} · {t.title} <ExternalLink size={14} />
          </a>
        ))}
        {anime.siteUrl && (
          <a
            className={styles.themeLink}
            href={anime.siteUrl}
            target="_blank"
            rel="noreferrer"
          >
            {fr ? 'La fiche sur AniList' : 'View on AniList'}{' '}
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </dialog>
  )
}
