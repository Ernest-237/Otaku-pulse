// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://api-pulse-v9vy.onrender.com'
const AuthContext = createContext(null)

async function postJSON(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)
  return data
}

async function postAuth(path) {
  const token = localStorage.getItem('op_token')
  if (!token) return
  await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  }).catch(() => {})
}

async function getAuth(path) {
  const token = localStorage.getItem('op_token')
  if (!token) return null
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

// ═══════════════════════════════════════════════════════
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [activeSubscription, setActiveSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restaurer session au démarrage
  useEffect(() => {
    const savedUser  = localStorage.getItem('op_user')
    const savedToken = localStorage.getItem('op_token')
    const savedSub   = localStorage.getItem('op_subscription')
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
        if (savedSub) setActiveSubscription(JSON.parse(savedSub))
      } catch {
        localStorage.removeItem('op_user')
        localStorage.removeItem('op_token')
        localStorage.removeItem('op_subscription')
      }
    }
    setLoading(false)
  }, [])

  const refreshSubscription = useCallback(async () => {
    const data = await getAuth('/api/subscriptions/active')
    if (data?.subscription) {
      setActiveSubscription(data.subscription)
      localStorage.setItem('op_subscription', JSON.stringify(data.subscription))
    } else {
      setActiveSubscription(null)
      localStorage.removeItem('op_subscription')
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await postJSON('/api/auth/login', { email, password })
    localStorage.setItem('op_token',   data.accessToken)
    localStorage.setItem('op_refresh', data.refreshToken)
    localStorage.setItem('op_user',    JSON.stringify(data.user))
    setUser(data.user)
    // Récupérer abonnement actif
    refreshSubscription()
    return data.user
  }, [refreshSubscription])

  const register = useCallback(async (pseudo, email, password) => {
    const data = await postJSON('/api/auth/register', { pseudo, email, password })
    localStorage.setItem('op_token',   data.accessToken)
    localStorage.setItem('op_refresh', data.refreshToken)
    localStorage.setItem('op_user',    JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await postAuth('/api/auth/logout')
    localStorage.removeItem('op_token')
    localStorage.removeItem('op_refresh')
    localStorage.removeItem('op_user')
    localStorage.removeItem('op_subscription')
    setUser(null)
    setActiveSubscription(null)
  }, [])

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates }
      localStorage.setItem('op_user', JSON.stringify(updated))
      return updated
    })
  }, [])

  // Computed values
  const isPublisher = !!user && ['publisher','admin','superadmin'].includes(user.role)
  const hasActiveSubscription = !!activeSubscription
                              && new Date(activeSubscription.expiresAt) > new Date()

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      activeSubscription,
      isLoggedIn: !!user,
      isAdmin: !!user && ['admin','superadmin'].includes(user.role),
      isPublisher,
      hasActiveSubscription,
      login,
      register,
      logout,
      updateUser,
      refreshSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}