// src/App.jsx — Toutes les routes + Manga Platform (étape 2)
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
import MangaCatalog from './pages/Manga'
import MangaDetail  from './pages/Manga/detail'

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

      {/* Manga Platform — étape 2 */}
      <Route path="/manga"        element={<MangaCatalog />} />
      <Route path="/manga/:slug"  element={<MangaDetail />} />
      {/* /manga/:slug/chapter/:chapterNumber → étape 3 (Reader) */}

      {/* Pages privées */}
      <Route path="/profil" element={<Profil />} />
      <Route path="/admin"  element={<AdminRoute><Admin /></AdminRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}