// src/contexts/MusicContext.jsx — permet à une page (ex: lecteur manga) de
// mettre en pause temporairement la playlist globale du site pour jouer sa propre piste.
import { createContext, useContext, useRef, useCallback } from 'react'

const MusicContext = createContext(null)

export function MusicProvider({ children }) {
  const controlsRef = useRef({ pause: () => {}, resume: () => {} })
  const overriddenRef = useRef(false)

  const registerControls = useCallback((controls) => { controlsRef.current = controls }, [])

  const pauseForOverride = useCallback(() => {
    overriddenRef.current = true
    controlsRef.current.pause()
  }, [])

  const resumeFromOverride = useCallback(() => {
    if (!overriddenRef.current) return
    overriddenRef.current = false
    controlsRef.current.resume()
  }, [])

  return (
    <MusicContext.Provider value={{ registerControls, pauseForOverride, resumeFromOverride }}>
      {children}
    </MusicContext.Provider>
  )
}

export function useMusicControls() {
  const ctx = useContext(MusicContext)
  if (!ctx) throw new Error('useMusicControls doit être utilisé sous MusicProvider')
  return ctx
}
