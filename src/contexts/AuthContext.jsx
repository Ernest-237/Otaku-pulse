// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://api-pulse-v9vy.onrender.com'
const AuthContext = createContext(null)

// ── Helpers fetch directs (pas de dépendance circulaire) ──
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

// ═══════════════════════════════════════════════════════
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Restaurer session au démarrage
  useEffect(() => {
    const savedUser  = localStorage.getItem('op_user')
    const savedToken = localStorage.getItem('op_token')
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('op_user')
        localStorage.removeItem('op_token')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await postJSON('/api/auth/login', { email, password })
    localStorage.setItem('op_token',   data.accessToken)
    localStorage.setItem('op_refresh', data.refreshToken)
    localStorage.setItem('op_user',    JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

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
    setUser(null)
  }, [])

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates }
      localStorage.setItem('op_user', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isLoggedIn: !!user,
      isAdmin: !!user && ['admin','superadmin'].includes(user.role),
      login,
      register,
      logout,
      updateUser,
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