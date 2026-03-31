// src/components/Music.jsx
import { useState, useEffect, useRef, useCallback } from 'react'

export default function Music() {
  const audioRef     = useRef(null)
  const [playing,    setPlaying]    = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  const playAudio = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.volume = 0.35
    audioRef.current.play()
      .then(() => { setPlaying(true); setShowPrompt(false) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const wasMuted = localStorage.getItem('op_music_muted') === '1'
    if (wasMuted) return
    // Essayer autoplay direct
    setTimeout(() => {
      if (!audioRef.current) return
      audioRef.current.volume = 0.35
      audioRef.current.play()
        .then(() => setPlaying(true))
        .catch(() => setShowPrompt(true)) // Bloqué → montrer prompt
    }, 800)
  }, [])

  const toggle = e => {
    e.stopPropagation()
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
      localStorage.setItem('op_music_muted', '1')
    } else {
      playAudio()
      localStorage.setItem('op_music_muted', '0')
    }
  }

  const acceptMusic = () => {
    localStorage.setItem('op_music_muted', '0')
    playAudio()
  }

  const rejectMusic = () => {
    localStorage.setItem('op_music_muted', '1')
    setShowPrompt(false)
  }

  return (
    <>
      <audio ref={audioRef} loop preload="auto" style={{ display:'none' }}>
        <source src="/assets/music/aizo.mp3" type="audio/mpeg" />
      </audio>

      {/* ── Popup musique ─────────────────────────────── */}
      {showPrompt && !playing && (
        <div style={{
          position: 'fixed',
          bottom: '5.5rem',
          right: '1.5rem',
          zIndex: 99999,          /* ⚠️ très haut pour passer au-dessus de tout */
          background: 'rgba(10,22,40,0.97)',
          border: '1px solid rgba(34,197,94,0.35)',
          borderRadius: 14,
          padding: '1rem 1.2rem',
          maxWidth: 230,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 30px rgba(0,0,0,.6)',
          pointerEvents: 'all',   /* ⚠️ s'assurer que les clics passent */
        }}>
          <div style={{ fontSize:'1.3rem', marginBottom:'.4rem' }}>🎵</div>
          <p style={{ fontSize:'.82rem', color:'rgba(200,230,255,.8)', lineHeight:1.5, marginBottom:'.9rem' }}>
            Activer la musique Otaku pour une meilleure expérience ?
          </p>
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={acceptMusic}
              style={{
                flex:1, padding:'8px', borderRadius:8, border:'none',
                background:'linear-gradient(135deg,#22c55e,#16a34a)',
                color:'#071220', fontSize:'.82rem', fontWeight:800,
                cursor:'pointer', pointerEvents:'all',
              }}>
              🎵 Oui
            </button>
            <button
              onClick={rejectMusic}
              style={{
                flex:1, padding:'8px', borderRadius:8,
                background:'rgba(255,255,255,.07)',
                border:'1px solid rgba(255,255,255,.12)',
                color:'rgba(200,230,255,.7)', fontSize:'.82rem',
                cursor:'pointer', pointerEvents:'all',
              }}>
              Non
            </button>
          </div>
        </div>
      )}

      {/* ── Bouton flottant ───────────────────────────── */}
      <button
        onClick={toggle}
        title={playing ? 'Couper la musique' : 'Activer la musique'}
        style={{
          position: 'fixed', bottom: '5rem', right: '1.5rem',
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(12,26,46,0.92)',
          border: `1px solid ${playing ? 'rgba(34,197,94,0.4)' : 'rgba(200,230,255,0.15)'}`,
          color: playing ? '#22c55e' : 'rgba(200,230,255,.5)',
          fontSize: '1.1rem', cursor: 'pointer', zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)', transition: 'all .3s',
          animation: playing ? 'musicPulse 2s ease-in-out infinite' : 'none',
        }}>
        {playing ? '🎵' : '🔇'}
        <style>{`
          @keyframes musicPulse {
            0%,100% { box-shadow: 0 4px 15px rgba(0,0,0,.3), 0 0 10px rgba(34,197,94,.15); }
            50%      { box-shadow: 0 4px 15px rgba(0,0,0,.3), 0 0 20px rgba(34,197,94,.4); }
          }
        `}</style>
      </button>
    </>
  )
}