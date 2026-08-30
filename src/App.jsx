// src/App.jsx — Toutes les routes + Manga Platform complète
//
// Découpage du bundle par route (React.lazy) : avant, chaque visiteur
// téléchargeait l'application entière — panneau d'administration et Recharts
// compris — pour afficher la page d'accueil. Sur une connexion 3G, cela
// représentait plusieurs secondes d'attente pour du code que l'immense
// majorité des visiteurs n'ouvrira jamais.
//
// Seule la page d'accueil reste en import direct : c'est la route la plus
// visitée, la charger paresseusement ajouterait un aller-retour réseau là où
// il fait le plus mal.
import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { PageLoader } from './components/ui/Spinner'
import Music from './components/Music'
import { MusicProvider } from './contexts/MusicContext'
import PolicyGate from './components/PolicyGate'

// Page d'accueil : chargée d'emblée.
import Home from './pages/Home'

// ── Pages secondaires, chargées à la demande ──
const BoutiquePage    = lazy(() => import('./pages/Boutique'))
const PartnerShopPage = lazy(() => import('./pages/Boutique/partner'))
const ReservationPage = lazy(() => import('./pages/Reservation'))
const LegalPage       = lazy(() => import('./pages/Legal'))
const Blog            = lazy(() => import('./pages/Blog'))
const Profil          = lazy(() => import('./pages/Profil'))
const FandomPage      = lazy(() => import('./pages/Fandom'))
const MembershipPage  = lazy(() => import('./pages/Membership'))
const PolesPage       = lazy(() => import('./pages/Poles'))

// Le panneau d'administration est le plus gros morceau du bundle (Recharts,
// tableaux, formulaires) pour deux utilisateurs. Il ne doit jamais partir
// chez un visiteur ordinaire.
const Admin = lazy(() => import('./pages/Admin'))

// ── Manga Platform ──
const MangaCatalog   = lazy(() => import('./pages/Manga'))
const MangaDetail    = lazy(() => import('./pages/Manga/detail'))
const MangaReader    = lazy(() => import('./pages/Manga/reader'))
const MangaPlans     = lazy(() => import('./pages/Manga/plans'))
const MangaLibrary   = lazy(() => import('./pages/Manga/library'))
const MangaPublisher = lazy(() => import('./pages/Manga/publisher'))
const CoinsPage      = lazy(() => import('./pages/Manga/coins'))

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
    <MusicProvider>
    <Music />
    <PolicyGate />
    {/* Un seul Suspense englobe toutes les routes : pendant qu'un morceau se
        télécharge, l'utilisateur voit le loader existant du site plutôt qu'un
        écran blanc. */}
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Pages publiques */}
      <Route path="/"            element={<Home />} />
      <Route path="/boutique"    element={<BoutiquePage />} />
      <Route path="/boutique/partenaire" element={<PrivateRoute><PartnerShopPage /></PrivateRoute>} />
      <Route path="/reservation" element={<ReservationPage />} />
      <Route path="/blog"        element={<Blog />} />
      <Route path="/legal"       element={<LegalPage />} />
      <Route path="/membership"  element={<MembershipPage />} />
      <Route path="/poles"       element={<PolesPage />} />
      <Route path="/fandom" element={<FandomPage />} />

      {/* Manga Platform */}
      <Route path="/manga"                                    element={<MangaCatalog />} />
      <Route path="/manga/plans"                              element={<MangaPlans />} />
      <Route path="/manga/library"                            element={<PrivateRoute><MangaLibrary /></PrivateRoute>} />
      <Route path="/manga/publisher"                          element={<PrivateRoute><MangaPublisher /></PrivateRoute>} />
      <Route path="/manga/:slug"                              element={<MangaDetail />} />
      <Route path="/manga/:slug/chapter/:chapterNumber"       element={<MangaReader />} />
      <Route path="/manga/coins"                              element={<CoinsPage />} />

      {/* Pages privées */}
      <Route path="/profil" element={<PrivateRoute><Profil /></PrivateRoute>} />
      <Route path="/admin"  element={<AdminRoute><Admin /></AdminRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
    </MusicProvider>
  )
}
