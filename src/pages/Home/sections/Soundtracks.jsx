import { useState } from 'react'
import { ExternalLink, Headphones } from 'lucide-react'
import { useApi } from '../../../hooks/useApi'
import { request } from '../../../api'
import { useLang } from '../../../contexts/LangContext'
import styles from './Soundtracks.module.css'

export default function Soundtracks() {
  const { lang } = useLang()
  const fr = lang === 'fr'
  const [kind, setKind] = useState('OP')
  const [search, setSearch] = useState('')
  const [count, setCount] = useState(6)
  const { data, loading, error, refresh } = useApi(
    () => request('GET', '/api/anime/themes', null, false),
    []
  )
  const themes = (data?.themes || []).filter(
    (t) =>
      t.kind === kind &&
      `${t.title} ${t.animeTitle}`.toLowerCase().includes(search.toLowerCase())
  )
  return (
    <section id="soundtracks" className={styles.section}>
      <div className={`container ${styles.layout}`}>
        <div className={styles.intro}>
          <Headphones size={26} />
          <span>OTAKU SOUNDTRACKS</span>
          <h2>
            {fr
              ? 'Les premières notes.\nToute l’émotion.'
              : 'The first notes.\nAll the emotion.'}
          </h2>
          <p>
            {fr
              ? 'Ces génériques qu’on ne passe jamais. Retrouve les titres de tes séries et pars à la recherche de leur vidéo.'
              : 'The themes you never skip. Discover the songs from your series and search for their videos.'}
          </p>
          <small>
            {fr
              ? 'Catalogue actualisé automatiquement · MyAnimeList / Jikan'
              : 'Automatically updated catalogue · MyAnimeList / Jikan'}
          </small>
        </div>
        <div className={styles.library}>
          <div className={styles.controls}>
            <div>
              {['OP', 'ED'].map((k) => (
                <button
                  key={k}
                  aria-pressed={kind === k}
                  className={kind === k ? styles.active : ''}
                  onClick={() => {
                    setKind(k)
                    setCount(6)
                  }}
                >
                  {k === 'OP' ? 'Openings' : 'Endings'}
                </button>
              ))}
            </div>
            <input
              aria-label={fr ? 'Rechercher un générique' : 'Search a theme'}
              placeholder={fr ? 'Titre ou animé…' : 'Song or anime…'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCount(6)
              }}
            />
          </div>
          {loading ? (
            <p className={styles.empty} role="status">
              {fr ? 'La sélection arrive…' : 'Loading the selection…'}
            </p>
          ) : error ? (
            <div className={styles.empty}>
              <p>
                {fr
                  ? 'Le catalogue est momentanément indisponible.'
                  : 'The catalogue is temporarily unavailable.'}
              </p>
              <button onClick={refresh}>
                {fr ? 'Réessayer' : 'Try again'}
              </button>
            </div>
          ) : !themes.length ? (
            <p className={styles.empty}>
              {search
                ? fr
                  ? 'Aucun résultat pour cette recherche.'
                  : 'No matching themes.'
                : fr
                  ? 'Les génériques apparaîtront après leur première synchronisation.'
                  : 'Themes will appear after the first sync.'}
            </p>
          ) : (
            themes.slice(0, count).map((t, i) => (
              <a
                key={t.id}
                href={t.url}
                target="_blank"
                rel="noreferrer"
                className={styles.track}
              >
                <span className={styles.number}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <strong>{t.title}</strong>
                  <span>
                    {t.animeTitle} ·{' '}
                    {fr ? 'Rechercher la vidéo' : 'Search for video'}
                  </span>
                </div>
                <ExternalLink size={16} />
              </a>
            ))
          )}
          {themes.length > count && (
            <button
              className={styles.more}
              onClick={() => setCount((c) => c + 6)}
            >
              {fr ? 'Voir plus' : 'Show more'}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
