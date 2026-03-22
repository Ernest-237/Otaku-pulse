// src/App.jsx
import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { PageLoader } from './components/ui/Spinner'

// Import direct — plus stable que lazy pour le développement initial
import Home   from './pages/Home'
import Admin  from './pages/Admin'
import Blog   from './pages/Blog'
import Profil from './pages/Profil'

// ── Guard admin ───────────────────────────────────────
function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user || !['admin','superadmin'].includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return children
}

// ── Guard connecté ────────────────────────────────────
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user)   return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/"       element={<Home />} />
      <Route path="/blog"   element={<Blog />} />
      <Route path="/profil" element={
        <PrivateRoute><Profil /></PrivateRoute>
      } />
      <Route path="/admin"  element={
        <AdminRoute><Admin /></AdminRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}