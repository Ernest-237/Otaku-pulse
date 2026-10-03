import MediaImage from './ui/MediaImage'
import { useEffect, useState } from 'react'
import { ChevronRight, Quote, X } from 'lucide-react'
import { request } from '../api'
import styles from './FloatingCharacter.module.css'

// Each adapted quote owns its character ID: a portrait can never drift from its author.
const QUOTES = [
  {
    text: 'Ceux qui abandonnent leurs amis sont pires que ceux qui enfreignent les règles.',
    char: 'Kakashi Hatake',
    anime: 'Naruto',
    id: 85,
    initials: 'KH',
  },
  {
    text: 'Le monde est cruel, mais aussi très beau.',
    char: 'Mikasa Ackerman',
    anime: 'L’Attaque des Titans',
    id: 40881,
    initials: 'MA',
  },
  {
    text: 'Si tu ne te bats pas, tu ne peux pas gagner.',
    char: 'Eren Yeager',
    anime: 'L’Attaque des Titans',
    id: 40882,
    initials: 'EY',
  },
]

export default function FloatingCharacter() {
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('char_dismissed') === '1'
    } catch {
      return false
    }
  })
  const [index, setIndex] = useState(
    () => Math.floor(Date.now() / 86400000) % QUOTES.length
  )
  const [portraits, setPortraits] = useState({})
  const [failed, setFailed] = useState({})
  const q = QUOTES[index]
  useEffect(() => {
    let active = true
    request('GET', '/api/anime/quote-portraits', null, false)
      .then((data) => {
        if (active) setPortraits(data?.portraits || {})
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  if (dismissed) return null
  return (
    <aside className={styles.wrapper} aria-label="La pause citation">
      {open && (
        <div id="quote-bubble" className={styles.bubble} key={index}>
          <button
            className={styles.close}
            aria-label="Masquer les citations pour cette session"
            onClick={() => {
              setDismissed(true)
              try {
                sessionStorage.setItem('char_dismissed', '1')
              } catch {}
            }}
          >
            <X size={14} />
          </button>
          <span className={styles.label}>LA PAUSE CITATION</span>
          <blockquote>« {q.text} »</blockquote>
          <strong>{q.char}</strong>
          <small>{q.anime} · Traduction adaptée</small>
          <button
            className={styles.next}
            onClick={() => setIndex((i) => (i + 1) % QUOTES.length)}
          >
            Autre personnage <ChevronRight size={14} />
          </button>
        </div>
      )}
      <button
        className={styles.trigger}
        aria-expanded={open}
        aria-controls="quote-bubble"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${open ? 'Réduire' : 'Lire'} la citation de ${q.char}`}
      >
        {portraits[q.id] && !failed[q.id] ? (
          <MediaImage
            key={q.id}
            src={portraits[q.id]}
            alt={q.char}
            onError={() => setFailed((v) => ({ ...v, [q.id]: true }))}
          />
        ) : (
          <span className={styles.initials}>{q.initials}</span>
        )}
        <Quote size={12} className={styles.quoteIcon} />
      </button>
    </aside>
  )
}
