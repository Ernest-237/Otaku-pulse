import { useCallback, useEffect, useRef, useState } from 'react'
import { SkipForward, Volume2, VolumeX } from 'lucide-react'
import { useMusicControls } from '../contexts/MusicContext'
import styles from './MusicControls.module.css'

// Optional local ambience. The automatically updated OP/ED catalogue lives in Soundtracks.
const PLAYLIST = [
  '/assets/music/track-08.mpeg',
  '/assets/music/track-09.mpeg',
  ...Array.from({ length: 8 }, (_, i) => `/assets/music/track-0${i}.mp3`),
]

export default function Music() {
  const audio = useRef(null)
  const index = useRef(0)
  const resumeAfterOverride = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState('')
  const { registerControls } = useMusicControls()
  const play = useCallback(async () => {
    if (!audio.current) return
    setError('')
    audio.current.volume = 0.25
    try {
      await audio.current.play()
    } catch {
      setPlaying(false)
      setError('Lecture indisponible. Essaie la piste suivante.')
    }
  }, [])
  const next = useCallback(() => {
    index.current = (index.current + 1) % PLAYLIST.length
    if (!audio.current) return
    audio.current.src = PLAYLIST[index.current]
    play()
  }, [play])
  useEffect(() => {
    const element = audio.current
    registerControls({
      pause: () => {
        resumeAfterOverride.current = !element.paused
        element.pause()
      },
      resume: () => {
        if (resumeAfterOverride.current) {
          resumeAfterOverride.current = false
          play()
        }
      },
    })
    return () => {
      element.pause()
      registerControls({ pause: () => {}, resume: () => {} })
    }
  }, [registerControls, play])
  return (
    <div className={styles.controls}>
      <audio
        ref={audio}
        src={PLAYLIST[0]}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={next}
        onError={() => {
          setPlaying(false)
          setError('Piste indisponible. Essaie la suivante.')
        }}
      />
      {error && (
        <span className={styles.error} role="status">
          {error}
        </span>
      )}
      {(playing || error) && (
        <button
          type="button"
          onClick={next}
          aria-label="Piste d’ambiance suivante"
          title="Piste d’ambiance suivante"
        >
          <SkipForward size={15} />
        </button>
      )}
      <button
        type="button"
        className={playing ? styles.playing : ''}
        aria-label={
          playing ? 'Mettre l’ambiance en pause' : 'Écouter l’ambiance musicale'
        }
        title={
          playing ? 'Mettre l’ambiance en pause' : 'Écouter l’ambiance musicale'
        }
        aria-pressed={playing}
        onClick={() => (playing ? audio.current?.pause() : play())}
      >
        {playing ? <Volume2 size={17} /> : <VolumeX size={17} />}
      </button>
    </div>
  )
}
