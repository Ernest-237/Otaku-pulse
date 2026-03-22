// src/contexts/ToastContext.jsx
import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    info:    (msg) => addToast(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  )
}

const COLORS = { success: '#22c55e', error: '#dc2626', info: '#3b82f6' }
const ICONS  = { success: '✓', error: '✕', info: 'ℹ' }

function ToastContainer({ toasts }) {
  if (!toasts.length) return null
  return (
    <div style={{
      position: 'fixed', bottom: '2rem', right: '2rem',
      display: 'flex', flexDirection: 'column', gap: '8px',
      zIndex: 9999, pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: '#0d1f35',
          border: `1px solid ${COLORS[t.type]}`,
          borderRadius: 12, padding: '10px 16px',
          color: '#f0fdf4', fontFamily: "'Rajdhani', sans-serif",
          fontSize: '0.92rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: `0 10px 30px rgba(0,0,0,.4), 0 0 0 1px ${COLORS[t.type]}22`,
          animation: 'toastIn .3s ease',
          maxWidth: 320,
        }}>
          <span style={{ color: COLORS[t.type], fontSize: '1.1rem' }}>
            {ICONS[t.type]}
          </span>
          {t.message}
        </div>
      ))}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast doit être dans ToastProvider')
  return ctx.toast
}