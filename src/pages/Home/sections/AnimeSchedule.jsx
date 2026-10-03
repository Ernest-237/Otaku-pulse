import MediaImage from '../../../components/ui/MediaImage'
import { useMemo, useState } from 'react'
import { Search, ArrowUpRight, Star } from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import { useApi } from '../../../hooks/useApi'
import { animeApi } from '../../../api'
import AnimeDialog, { coverUrl } from '../../../components/AnimeDialog'
import styles from './Discovery.module.css'

export default function AnimeSchedule() {
  const { lang } = useLang()
  const fr = lang === 'fr'
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [count, setCount] = useState(12)
  const { data, loading, error, refresh } = useApi(
    () => animeApi.getAll({ discover: true, limit: 100 }),
    []
  )
  const animes = useMemo(
    () =>
      (data?.animes || []).filter(
        (a) =>
          (filter === 'all' || a.status === filter) &&
          `${a.titleF} ${a.titleE || ''}`
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase())
      ),
    [data, filter, search]
  )
  const labels = {
    airing: fr ? 'En diffusion' : 'Airing',
    upcoming: fr ? 'Bientôt' : 'Upcoming',
  }
  return (
    <section id="anime-schedule" className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <span className={styles.kicker}>
              {fr ? 'LE CARNET DES DÉCOUVERTES' : 'THE DISCOVERY JOURNAL'}
            </span>
            <h2>{fr ? 'Ta prochaine obsession.' : 'Your next obsession.'}</h2>
            <p>
              {fr
                ? 'Les séries à suivre, les univers à explorer.'
                : 'Series to follow. Worlds to explore.'}
            </p>
          </div>
          <span className={styles.live}>
            <span />
            {fr ? 'Sélection de saison' : 'Seasonal selection'}
          </span>
        </div>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            {['all', 'airing', 'upcoming'].map((key) => (
              <button
                key={key}
                aria-pressed={filter === key}
                className={filter === key ? styles.active : ''}
                onClick={() => {
                  setFilter(key)
                  setCount(12)
                }}
              >
                {key === 'all'
                  ? fr
                    ? 'La sélection'
                    : 'Discover'
                  : labels[key]}
              </button>
            ))}
          </div>
          <label className={styles.search}>
            <Search size={16} />
            <input
              aria-label={fr ? 'Rechercher un animé' : 'Search anime'}
              placeholder={fr ? 'Un anime en tête ?' : 'Looking for an anime?'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCount(12)
              }}
            />
          </label>
        </div>
        {loading ? (
          <div
            className={styles.grid}
            aria-label={fr ? 'Chargement des animés' : 'Loading anime'}
            aria-busy="true"
          >
            {Array.from({ length: 6 }, (_, i) => (
              <div className={styles.skeleton} key={i} />
            ))}
          </div>
        ) : error ? (
          <div className={styles.empty} role="status">
            <p>
              {fr
                ? 'La sélection est momentanément indisponible.'
                : 'The selection is temporarily unavailable.'}
            </p>
            <button onClick={refresh}>{fr ? 'Réessayer' : 'Try again'}</button>
          </div>
        ) : !animes.length ? (
          <div className={styles.empty}>
            {search
              ? fr
                ? 'Aucun animé trouvé. Essaie un autre titre.'
                : 'No anime found. Try another title.'
              : fr
                ? 'La prochaine sélection se prépare. Repasse bientôt !'
                : 'The next selection is on its way. Check back soon!'}
          </div>
        ) : (
          <div className={styles.grid}>
            {animes.slice(0, count).map((a, i) => (
              <button
                key={a.id}
                className={styles.card}
                onClick={() => setSelected(a)}
                style={{ animationDelay: `${Math.min(i, 5) * 45}ms` }}
              >
                <div className={styles.poster}>
                  {a.coverUrl ? (
                    <MediaImage
                      src={coverUrl(a.coverUrl)}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.visibility = 'hidden'
                      }}
                    />
                  ) : (
                    <span className={styles.noCover}>アニメ</span>
                  )}
                  <span className={styles.status}>
                    {labels[a.status] || a.status}
                  </span>
                  <span className={styles.cardArrow}>
                    <ArrowUpRight size={18} />
                  </span>
                </div>
                <div className={styles.cardMeta}>
                  <span>{a.studio || 'Anime'}</span>
                  {a.score > 0 && (
                    <span>
                      <Star size={11} /> {(a.score / 10).toFixed(1)}
                    </span>
                  )}
                </div>
                <h3>{fr ? a.titleF : a.titleE || a.titleF}</h3>
                <p>
                  {a.nextEpisodeNumber
                    ? `${fr ? 'Épisode' : 'Episode'} ${a.nextEpisodeNumber} · ${a.weekday || (fr ? 'À suivre' : 'Coming up')}`
                    : (a.genres || []).slice(0, 2).join(' · ')}
                </p>
              </button>
            ))}
          </div>
        )}
        {animes.length > count && (
          <button
            className={styles.more}
            onClick={() => setCount((c) => c + 12)}
          >
            {fr ? 'Voir plus d’animés' : 'Show more anime'}
          </button>
        )}
        {data?.animes?.some((a) => a.syncedAt) && (
          <p className={styles.source}>
            {fr
              ? 'Catalogue synchronisé avec AniList'
              : 'Catalogue synced with AniList'}
          </p>
        )}
      </div>
      {selected && (
        <AnimeDialog
          anime={selected}
          lang={lang}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  )
}
