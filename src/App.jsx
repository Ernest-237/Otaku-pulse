// src/App.jsx — Toutes les routes + Manga Platform complète (étape 3)
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
import MangaCatalog   from './pages/Manga'
import MangaDetail    from './pages/Manga/detail'
import MangaReader    from './pages/Manga/reader'
import MangaPlans     from './pages/Manga/plans'
import MangaLibrary   from './pages/Manga/library'
import MangaPublisher from './pages/Manga/publisher'

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

      {/* Manga Platform */}
      <Route path="/manga"                                    element={<MangaCatalog />} />
      <Route path="/manga/plans"                              element={<MangaPlans />} />
      <Route path="/manga/library"                            element={<PrivateRoute><MangaLibrary /></PrivateRoute>} />
      <Route path="/manga/publisher"                          element={<PrivateRoute><MangaPublisher /></PrivateRoute>} />
      <Route path="/manga/:slug"                              element={<MangaDetail />} />
      <Route path="/manga/:slug/chapter/:chapterNumber"       element={<MangaReader />} />

      {/* Pages privées */}
      <Route path="/profil" element={<PrivateRoute><Profil /></PrivateRoute>} />
      <Route path="/admin"  element={<AdminRoute><Admin /></AdminRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}