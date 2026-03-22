// src/contexts/LangContext.jsx
import { createContext, useContext, useState, useCallback } from 'react'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('op_lang') || 'fr'
  )

  const setLang = useCallback((l) => {
    setLangState(l)
    localStorage.setItem('op_lang', l)
    document.documentElement.lang = l
  }, [])

  // Helper de traduction simple
  const t = useCallback((fr, en) => lang === 'fr' ? fr : en, [lang])

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang doit être dans LangProvider')
  return ctx
}