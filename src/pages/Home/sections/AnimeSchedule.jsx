// src/pages/Home/sections/AnimeSchedule.jsx
// Planning des animés à venir/en cours pour le mois courant (géré depuis l'admin)
import { useState } from 'react'
import { CalendarDays, Play, Sparkles, X } from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import { useApi } from '../../../hooks/useApi'
import { animeApi, API_BASE } from '../../../api'
import styles from './Events.module.css'

const currentMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` }

export default function AnimeSchedule() {
  const { lang } = useLang()
  const [selected, setSelected] = useState(null)

  const { data, loading } = useApi(
    () => animeApi.getAll({ month: currentMonth() }),
    [],
    true
  )

  const animes = data?.animes || []
  if (loading || animes.length === 0) return null

  const STATUS_LABEL = {
    upcoming: lang === 'fr' ? 'À venir' : 'Upcoming',
    airing:   lang === 'fr' ? 'En cours' : 'Airing',
    ended:    lang === 'fr' ? 'Terminé' : 'Ended',
  }

  return (
    <section id="anime-schedule" className={styles.section}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <div className={styles.tag}>
            <CalendarDays size={14} strokeWidth={2.2} />
            <span>{lang === 'fr' ? 'Planning du mois' : "This month's lineup"}</span>
          </div>
          <h2 className={styles.title}>
            {lang === 'fr' ? 'ANIMÉS ' : 'ANIME '}
            <span className={styles.titleAccent}>{lang === 'fr' ? 'DU MOMENT' : 'RIGHT NOW'}</span>
          </h2>
          <p className={styles.subtitle}>
            {lang === 'fr'
              ? 'Ce qui sort et ce qui tourne ce mois-ci — mis à jour chaque semaine'
              : "What's dropping and what's airing this month — updated weekly"}
          </p>
        </div>

        <div className={styles.grid}>
          {animes.map(a => (
            <AnimeCard key={a.id} anime={a} lang={lang} statusLabel={STATUS_LABEL[a.status]} onClick={() => setSelected(a)} />
          ))}
        </div>
      </div>

      {selected && (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSelected(null)} aria-label="close modal">
              <X size={16} strokeWidth={2.4} />
            </button>

            <div className={styles.modalEmoji}><Sparkles size={34} strokeWidth={2.1} /></div>
            <h2 className={styles.modalTitle}>{lang === 'en' ? (selected.titleE || selected.titleF) : selected.titleF}</h2>
            {(lang === 'en' ? selected.synopsisE : selected.synopsisF) && (
              <p className={styles.modalExcerpt}>{lang === 'en' ? selected.synopsisE : selected.synopsisF}</p>
            )}

            {selected.openingUrl && (
              <a href={selected.openingUrl} target="_blank" rel="noreferrer" className={styles.cardBtn} style={{ marginBottom:'1rem' }}>
                <Play size={15} strokeWidth={2.3} /> {selected.openingTitle || (lang === 'fr' ? "Voir l'opening" : 'Watch opening')}
              </a>
            )}

            {selected.characters?.length > 0 && (
              <div className={styles.modalContent}>
                <strong>{lang === 'fr' ? 'Personnages' : 'Characters'}</strong>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>
                  {selected.characters.map((c, i) => (
                    <span key={i} style={{ fontSize:'.8rem', padding:'4px 10px', borderRadius:20, background:'var(--green-pale)', color:'var(--green)' }}>
                      {c.name}{c.role ? ` · ${c.role}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function AnimeCard({ anime, lang, statusLabel, onClick }) {
  const title = lang === 'en' ? (anime.titleE || anime.titleF) : anime.titleF
  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.cardImg}>
        {anime.coverUrl
          ? <img src={`${API_BASE}${anime.coverUrl}`} alt={title} loading="lazy" />
          : <span className={styles.cardEmoji}>📺</span>}
        <span className={styles.featuredBadge}>{statusLabel}</span>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardMeta}>
          {anime.weekday && <span className={styles.cardCat}>{anime.weekday}</span>}
          {anime.studio && <span className={styles.cardDate}>{anime.studio}</span>}
        </div>
        <h3 className={styles.cardTitle}>{title}</h3>
        {anime.openingTitle && (
          <p className={styles.cardExcerpt}>🎵 {anime.openingTitle}</p>
        )}
      </div>
    </div>
  )
}
