// src/App.jsx — Toutes les routes + Manga Platform
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { PageLoader } from './components/ui/Spinner'
import Music from './components/Music'

// Pages existantes
import Home          from './pages/Home'
import BoutiquePage  from './pages/Boutique'
import ReservationPage from './pages/Reservation'
import LegalPage     from './pages/Legal'
import Blog          from './pages/Blog'
import Profil        from './pages/Profil'
import Admin         from './pages/Admin'
import FandomPage    from './pages/Fandom'
import MembershipPage from './pages/Membership'

// ── Manga Platform ──
import MangaIndex    from './pages/Manga'

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
function PublisherRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/" replace />
  if (!['publisher','admin','superadmin'].includes(user.role)) return <Navigate to="/manga" replace />
  return children
}

export default function App() {
  return (
    <>
    <Music />
    <Routes>
      {/* Pages publiques */}
      <Route path="/"            element={<Home />} />
      <Route path="/boutique"    element={<BoutiquePage />} />
      <Route path="/reservation" element={<ReservationPage />} />
      <Route path="/blog"        element={<Blog />} />
      <Route path="/legal"       element={<LegalPage />} />
      <Route path="/fandom"      element={<FandomPage />} />
      <Route path="/membership"  element={<MembershipPage />} />

      {/* Manga Platform — l'ordre compte ! */}
      <Route path="/manga" element={<MangaIndex />} />
      {/* Les routes manga additionnelles (detail, reader, library, plans, publisher)
          seront ajoutées à l'étape 2 une fois les pages livrées */}

      {/* Pages privées */}
      <Route path="/profil" element={<Profil />} />
      <Route path="/admin"  element={<AdminRoute><Admin /></AdminRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}