// src/pages/Admin/index.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth }  from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { adminApi, productsApi, eventsApi, contactApi, blogApi, suppliersApi, fileToBase64, API_BASE } from '../../api'
import { useApi } from '../../hooks/useApi'
import { PageLoader, EmptyState } from '../../components/ui/Spinner'
import ImageUploader from '../../components/ui/ImageUploader'
import Modal   from '../../components/ui/Modal'
import Button  from '../../components/ui/Button'
import Badge, { statusVariant, STATUS_LABELS } from '../../components/ui/Badge'
import HeroSection      from './sections/HeroSection'
import DashboardSection  from './sections/DashboardSection'
import MembershipSection from './sections/MembershipSection'
import SuppliersSection from './sections/SuppliersSection'
import OrdersSection    from './sections/OrdersSection'
import styles from './Admin.module.css'

const ALL_CATS = ['posters','stickers','accessoires','kits','manga','livre','dessin','nutrition','echange','jeux']

const SECTIONS = [
  { id:'dashboard',  icon:'📊', label:'Dashboard'     },
  { id:'orders',     icon:'🛒', label:'Commandes'      },
  { id:'products',   icon:'📦', label:'Produits'       },
  { id:'suppliers',  icon:'🤝', label:'Fournisseurs'   },
  { id:'events',     icon:'🎌', label:'Événements'     },
  { id:'blog',       icon:'📝', label:'Blog & Promos'  },
  { id:'hero',       icon:'🖼️', label:'Hero dynamique' },
  { id:'contacts',   icon:'📬', label:'Réservations'   },
  { id:'users',      icon:'👥', label:'Membres'        },
  { id:'membership',  icon:'🎴', label:'Carte Membre'    },
]

export default function Admin() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const toast    = useToast()
  const [section, setSection] = useState('dashboard')

  useEffect(() => { document.title = 'Admin — Otaku Pulse' }, [])

  const handleLogout = async () => { await logout(); navigate('/') }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sbLogo}>
          <span className={styles.sbBolt}>⚡</span>
          <span className={styles.sbName}>OTAKU PULSE</span>
          <span className={styles.sbBadge}>ADMIN</span>
        </div>
        <nav className={styles.sbNav}>
          {SECTIONS.map(s => (
            <button key={s.id} className={`${styles.navItem} ${section===s.id?styles.navActive:''}`} onClick={() => setSection(s.id)}>
              <span className={styles.navIcon}>{s.icon}</span>{s.label}
            </button>
          ))}
        </nav>
        <div className={styles.sbFooter}>
          <div className={styles.sbUser}>
            <span style={{ fontSize:'1.4rem' }}>{user?.role==='superadmin'?'👑':'⚙️'}</span>
            <div><div className={styles.sbUserName}>{user?.pseudo}</div><div className={styles.sbUserRole}>{user?.role?.toUpperCase()}</div></div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>🚪 Déconnexion</button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.topbar}>
          <h1 className={styles.topbarTitle}>{SECTIONS.find(s=>s.id===section)?.icon} {SECTIONS.find(s=>s.id===section)?.label}</h1>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:'.75rem', color:'var(--muted)' }}>{new Date().toLocaleDateString('fr-FR',{ dateStyle:'medium' })}</span>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>🌐 Site</Button>
          </div>
        </div>
        <div className={styles.content}>
          {section==='dashboard'  && <DashboardSection toast={toast} setSection={setSection} />}
          {section==='orders'     && <OrdersSection    toast={toast} />}
          {section==='products'   && <ProductsSection  toast={toast} />}
          {section==='suppliers'  && <SuppliersSection toast={toast} />}
          {section==='events'     && <EventsSection    />}
          {section==='blog'       && <BlogSection      toast={toast} />}
          {section==='hero'       && <HeroSection      toast={toast} />}
          {section==='contacts'   && <ContactsSection  toast={toast} />}
          {section==='users'      && <UsersSection     toast={toast} />}
          {section==='membership'  && <MembershipSection toast={toast} />}
        </div>
      </main>
    </div>
  )
}