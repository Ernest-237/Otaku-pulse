// src/components/Music.jsx
import { useState, useEffect, useRef, useCallback } from 'react'

export default function Music() {
  const audioRef   = useRef(null)
  const [playing,  setPlaying]    = useState(false)
  const startedRef = useRef(false)

  const play = useCallback(() => {
    audioRef.current?.play()
      .then(() => setPlaying(true))
      .catch(() => {})
  }, [])

  // Lancer dès la première interaction utilisateur
  useEffect(() => {
    const wasMuted = localStorage.getItem('op_music_muted') === '1'
    if (wasMuted) return

    const start = () => {
      if (startedRef.current) return
      startedRef.current = true
      play()
      ;['click','touchstart','keydown','scroll'].forEach(ev =>
        document.removeEventListener(ev, start)
      )
    }
    ;['click','touchstart','keydown','scroll'].forEach(ev =>
      document.addEventListener(ev, start, { once: true, passive: true })
    )
    return () => {
      ;['click','touchstart','keydown','scroll'].forEach(ev =>
        document.removeEventListener(ev, start)
      )
    }
  }, [play])

  const toggle = (e) => {
    e.stopPropagation()
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
      localStorage.setItem('op_music_muted', '1')
    } else {
      play()
      localStorage.setItem('op_music_muted', '0')
    }
  }

  return (
    <>
      <audio ref={audioRef} loop preload="auto" style={{ display:'none' }}>
        <source src="/assets/music/generique.mp3" type="audio/mpeg" />
      </audio>
      <button
        onClick={toggle}
        title={playing ? 'Couper la musique' : 'Activer la musique'}
        style={{
          position:'fixed', bottom:'5rem', right:'1.5rem',
          width:44, height:44, borderRadius:'50%',
          background:'rgba(12,26,46,0.9)',
          border:`1px solid ${playing ? 'rgba(34,197,94,0.4)' : 'rgba(220,38,38,0.4)'}`,
          color: playing ? '#22c55e' : '#dc2626',
          fontSize:'1.1rem', cursor:'pointer', zIndex:999,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 15px rgba(0,0,0,.3)',
          backdropFilter:'blur(8px)', transition:'all .3s',
          animation: playing ? 'musicPulse 2s ease-in-out infinite' : 'none',
        }}
      >
        {playing ? '🎵' : '🔇'}
        <style>{`
          @keyframes musicPulse {
            0%,100% { box-shadow:0 4px 15px rgba(0,0,0,.3),0 0 10px rgba(34,197,94,.15); }
            50%      { box-shadow:0 4px 15px rgba(0,0,0,.3),0 0 20px rgba(34,197,94,.4); }
          }
          button:focus { outline:none; }
        `}</style>
      </button>
    </>
  )
}