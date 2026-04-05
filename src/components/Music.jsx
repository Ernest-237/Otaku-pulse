import { useState, useEffect, useRef, useCallback } from 'react'
import { Music3, SkipForward, Volume2, VolumeX } from 'lucide-react'

const PLAYLIST = [
  '/assets/music/track-01.mp3',
  '/assets/music/track-00.mp3',
  '/assets/music/track-02.mp3',
  '/assets/music/track-03.mp3',
  '/assets/music/track-04.mp3',
  '/assets/music/track-05.mp3',
  '/assets/music/track-06.mp3',
  '/assets/music/track-07.mp3',
]

const LEGACY_SINGLE = '/assets/music/generique.mp3'

export default function Music() {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [trackIdx, setTrackIdx] = useState(0)
  const [trackName, setTrackName] = useState('')

  const getPlaylist = useCallback(() => {
    return PLAYLIST.length > 0 ? PLAYLIST : [LEGACY_SINGLE]
  }, [])

  const playTrack = useCallback(async (idx) => {
    const playlist = getPlaylist()
    const track = playlist[idx % playlist.length]
    if (!audioRef.current) return false

    audioRef.current.src = track
    audioRef.current.volume = 0.3
    audioRef.current.load()

    try {
      await audioRef.current.play()
      setPlaying(true)
      setShowPrompt(false)
      const name = track
        .split('/')
        .pop()
        ?.replace(/\.[^.]+$/, '')
        .replace(/-/g, ' ')
        .replace(/track\s*\d+\s*/i, '')
        .trim()
      setTrackName(name || `Piste ${idx + 1}`)
      return true
    } catch {
      setPlaying(false)
      return false
    }
  }, [getPlaylist])

  const nextTrack = useCallback(async () => {
    const next = (trackIdx + 1) % getPlaylist().length
    setTrackIdx(next)
    await playTrack(next)
  }, [trackIdx, getPlaylist, playTrack])

  useEffect(() => {
    const muted = localStorage.getItem('op_music_muted') === '1'
    if (muted) return

    const t = setTimeout(async () => {
      const ok = await playTrack(0)
      if (!ok) setShowPrompt(true)
    }, 1000)

    return () => clearTimeout(t)
  }, [playTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onEnded = () => nextTrack()
    audio.addEventListener('ended', onEnded)
    return () => audio.removeEventListener('ended', onEnded)
  }, [nextTrack])

  const toggle = async (e) => {
    e.stopPropagation()
    if (!audioRef.current) return

    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
      localStorage.setItem('op_music_muted', '1')
    } else {
      await playTrack(trackIdx)
      localStorage.setItem('op_music_muted', '0')
    }
  }

  const acceptMusic = async () => {
    localStorage.setItem('op_music_muted', '0')
    await playTrack(0)
    setShowPrompt(false)
  }

  const rejectMusic = () => {
    localStorage.setItem('op_music_muted', '1')
    setShowPrompt(false)
  }

  return (
    <>
      <audio ref={audioRef} preload="none" style={{ display: 'none' }} />

      {showPrompt && !playing && (
        <div
          style={{
            position: 'fixed',
            bottom: '5.5rem',
            right: '1.5rem',
            zIndex: 99999,
            background: 'rgba(255,255,255,.98)',
            border: '1.5px solid var(--border)',
            borderRadius: 18,
            padding: '1rem 1.1rem',
            maxWidth: 250,
            boxShadow: 'var(--shadow-lg)',
            animation: 'slideIn .35s ease',
          }}
        >
          <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

          <div style={{ color: 'var(--green-deep)', marginBottom: '.55rem' }}>
            <Music3 size={22} strokeWidth={2.2} />
          </div>

          <p style={{ fontSize: '.83rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '.95rem' }}>
            Activer la playlist Otaku pour une ambiance plus immersive ?
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={acceptMusic}
              type="button"
              style={{
                flex: 1,
                padding: '9px 10px',
                borderRadius: 999,
                border: 'none',
                background: 'var(--green)',
                color: '#fff',
                fontSize: '.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-green)',
              }}
            >
              Oui
            </button>

            <button
              onClick={rejectMusic}
              type="button"
              style={{
                flex: 1,
                padding: '9px 10px',
                borderRadius: 999,
                background: 'var(--bg-soft)',
                border: '1.5px solid var(--border)',
                color: 'var(--text-muted)',
                fontSize: '.82rem',
                cursor: 'pointer',
              }}
            >
              Non
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'fixed',
          bottom: '5rem',
          right: '1.5rem',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {playing && trackName && (
          <div
            style={{
              background: 'rgba(255,255,255,.98)',
              border: '1.5px solid var(--border)',
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: '.65rem',
              color: 'var(--text-muted)',
              fontWeight: 700,
              maxWidth: 120,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              boxShadow: 'var(--shadow-xs)',
              textTransform: 'capitalize',
            }}
          >
            {trackName}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6 }}>
          {playing && getPlaylist().length > 1 && (
            <button
              onClick={nextTrack}
              title="Piste suivante"
              type="button"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255,255,255,.98)',
                border: '1.5px solid var(--border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-strong)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <SkipForward size={16} strokeWidth={2.2} />
            </button>
          )}

          <button
            onClick={toggle}
            title={playing ? 'Couper la musique' : 'Jouer la musique'}
            type="button"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: playing ? 'var(--green)' : 'rgba(255,255,255,.98)',
              border: playing ? 'none' : '1.5px solid var(--border)',
              color: playing ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: playing ? 'var(--shadow-green)' : 'var(--shadow-sm)',
              transition: 'all .25s ease',
              animation: playing ? 'musicPulse 2.5s ease-in-out infinite' : 'none',
            }}
          >
            {playing ? <Volume2 size={18} strokeWidth={2.2} /> : <VolumeX size={18} strokeWidth={2.2} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes musicPulse {
          0%,100% { box-shadow: var(--shadow-green); }
          50%     { box-shadow: 0 8px 26px rgba(34,197,94,.28); }
        }
      `}</style>
    </>
  )
}
