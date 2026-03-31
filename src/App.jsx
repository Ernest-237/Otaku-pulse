// src/App.jsx — Toutes les routes
import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { PageLoader } from './components/ui/Spinner'

// Pages
import Home        from './pages/Home'
import BoutiquePage from './pages/Boutique'
import ReservationPage from './pages/Reservation'
import LegalPage   from './pages/Legal'
import Blog        from './pages/Blog'
import Profil      from './pages/Profil'
import Admin       from './pages/Admin'
import FandomPage  from './pages/Fandom'

// Guards
function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user || !['admin','superadmin'].includes(user.role)) return <Navigate to="/" replace />
  return children
}
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Pages publiques */}
      <Route path="/"            element={<Home />} />
      <Route path="/boutique"    element={<BoutiquePage />} />
      <Route path="/reservation" element={<ReservationPage />} />
      <Route path="/blog"        element={<Blog />} />
      <Route path="/legal"       element={<LegalPage />} />
      <Route path="/fandom"      element={<FandomPage />} />

      {/* Pages privées */}
      <Route path="/profil" element={<Profil />} />
      <Route path="/admin"  element={<AdminRoute><Admin /></AdminRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}