// src/pages/Admin/index.jsx — COMPLET (dark néon gaming)
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth }  from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { adminApi, productsApi, eventsApi, contactApi, blogApi, suppliersApi, fileToBase64, API_BASE, request } from '../../api'
import { useApi } from '../../hooks/useApi'
import { PageLoader, EmptyState } from '../../components/ui/Spinner'
import ImageUploader from '../../components/ui/ImageUploader'
import Modal   from '../../components/ui/Modal'
import Button  from '../../components/ui/Button'
import Badge, { statusVariant, STATUS_LABELS } from '../../components/ui/Badge'
import HeroSection       from './sections/HeroSection'
import DashboardSection  from './sections/DashboardSection'
import MembershipSection from './sections/MembershipSection'
import SuppliersSection  from './sections/SuppliersSection'
import OrdersSection     from './sections/OrdersSection'
import styles from './Admin.module.css'
import MangaSection         from './sections/MangaSection'
import PublishersSection    from './sections/PublishersSection'
import SubscriptionsSection from './sections/SubscriptionsSection'
import MangaCommentsSection from './sections/MangaCommentsSection'
import CoinsSection from './sections/CoinsSection'
import InvoicesSection from './sections/InvoicesSection'
import FandomSection from './sections/FandomSection'
import AnimeSection from './sections/AnimeSection'
// Icônes de navigation — vectorielles plutôt qu'émojis : chaque émoji
// apportait sa propre palette, ce qui saturait visuellement le menu.
import {
  LayoutDashboard, ShoppingCart, FileText, Package, Store, CalendarDays,
  Newspaper, Image as ImageIcon, Gamepad2, Tv, Inbox, Users, CreditCard,
  BookOpen, PenLine, Gem, MessageSquare, Coins, Menu, X, Globe, LogOut,
  Crown, Settings, Zap,
} from 'lucide-react'

const ALL_CATS = ['posters','stickers','accessoires','kits','manga','livre','dessin','nutrition','echange','jeux']

/* ══════════════════════════════════════════════════════
   NAVIGATION
   Groupée par domaine métier plutôt qu'en liste plate de 19 entrées : on
   retrouve un écran par son domaine, pas en balayant tout le menu.
   Icônes vectorielles au lieu d'émojis — les émojis apportaient chacun leur
   propre palette, ce qui participait au bruit visuel de l'ancien panneau.
   ══════════════════════════════════════════════════════ */
const NAV = [
  {
    group: 'Commerce',
    items: [
      { id: 'dashboard',  icon: LayoutDashboard, label: 'Dashboard'     },
      { id: 'orders',     icon: ShoppingCart,    label: 'Commandes'     },
      { id: 'invoices',   icon: FileText,        label: 'Factures'      },
      { id: 'products',   icon: Package,         label: 'Produits'      },
      { id: 'suppliers',  icon: Store,           label: 'Fournisseurs'  },
    ],
  },
  {
    group: 'Communauté',
    items: [
      { id: 'events',     icon: CalendarDays,    label: 'Événements'    },
      { id: 'contacts',   icon: Inbox,           label: 'Réservations'  },
      { id: 'fandom',     icon: Gamepad2,        label: 'Fandom'        },
      { id: 'anime',      icon: Tv,              label: 'Planning Anime'},
      { id: 'users',      icon: Users,           label: 'Membres'       },
      { id: 'membership', icon: CreditCard,      label: 'Carte Membre'  },
    ],
  },
  {
    group: 'Contenu',
    items: [
      { id: 'blog',       icon: Newspaper,       label: 'Blog & Promos' },
      { id: 'hero',       icon: ImageIcon,       label: 'Hero dynamique'},
    ],
  },
  {
    group: 'Manga',
    items: [
      { id: 'manga',      icon: BookOpen,        label: 'Mangas'        },
      { id: 'publishers', icon: PenLine,         label: 'Éditeurs'      },
      { id: 'subs',       icon: Gem,             label: 'Abonnements'   },
      { id: 'mangaComm',  icon: MessageSquare,   label: 'Commentaires'  },
      { id: 'coins',      icon: Coins,           label: 'Coins'         },
    ],
  },
]

const FLAT = NAV.flatMap(g => g.items)

export default function Admin() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const toast    = useToast()
  const [section, setSection] = useState('dashboard')
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => { document.title = 'Admin — Otaku Pulse' }, [])

  // Sur mobile la navigation est un tiroir : il doit se refermer dès qu'on a
  // choisi un écran, sinon il masque le contenu qu'on vient de demander.
  const go = (id) => { setSection(id); setNavOpen(false) }

  const handleLogout = async () => { await logout(); navigate('/') }
  const current = FLAT.find(s => s.id === section)

  return (
    <div className="adm-root min-h-screen bg-ink-950 text-fg">

      {/* Voile du tiroir mobile */}
      {navOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Barre latérale ── */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col',
          'border-r border-line bg-ink-900',
          'transition-transform duration-200 ease-out',
          // Hors écran sur mobile tant que le tiroir est fermé ; toujours
          // visible à partir de `lg`.
          navOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        ].join(' ')}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/15 text-brand">
            <Zap size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-extrabold tracking-wider">OTAKU PULSE</div>
            <div className="text-[0.62rem] font-semibold tracking-[0.18em] text-fg-faint">
              ADMINISTRATION
            </div>
          </div>
          <button
            className="rounded-lg p-1 text-fg-muted hover:bg-ink-800 hover:text-fg lg:hidden"
            onClick={() => setNavOpen(false)}
            aria-label="Fermer le menu"
          >
            <X size={17} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          {NAV.map(g => (
            <div key={g.group} className="mb-4 last:mb-0">
              <div className="px-2.5 pb-1.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-fg-faint">
                {g.group}
              </div>
              {g.items.map(item => {
                const Icon = item.icon
                const active = section === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item.id)}
                    className={[
                      'mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2',
                      'text-left text-[0.83rem] transition-colors',
                      active
                        // L'écran actif est le SEUL élément coloré du menu :
                        // c'est ce qui le rend immédiatement repérable.
                        ? 'bg-brand/12 font-semibold text-brand-hi'
                        : 'text-fg-muted hover:bg-ink-800 hover:text-fg',
                    ].join(' ')}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-ink-850 px-2.5 py-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-800 text-fg-muted">
              {user?.role === 'superadmin' ? <Crown size={15} /> : <Settings size={15} />}
            </span>
            <div className="min-w-0">
              <div className="truncate text-[0.8rem] font-semibold">{user?.pseudo}</div>
              <div className="text-[0.65rem] uppercase tracking-wider text-fg-faint">
                {user?.role}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-[0.8rem] font-semibold text-fg-muted transition-colors hover:border-danger/40 hover:text-danger"
          >
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Zone principale ── */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-ink-900/95 px-4 py-3 backdrop-blur sm:px-6">
          <button
            className="rounded-lg p-1.5 text-fg-muted hover:bg-ink-800 hover:text-fg lg:hidden"
            onClick={() => setNavOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu size={19} />
          </button>

          <h1 className="flex min-w-0 items-center gap-2 text-[0.95rem] font-bold">
            {current?.icon && <current.icon size={17} className="shrink-0 text-brand" />}
            <span className="truncate">{current?.label || section}</span>
          </h1>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-fg-faint sm:inline">
              {new Date().toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
            </span>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-fg-muted transition-colors hover:bg-ink-800 hover:text-fg"
            >
              <Globe size={13} /> <span className="hidden sm:inline">Site</span>
            </button>
          </div>
        </header>

        <main className="px-4 py-5 sm:px-6 sm:py-6">
          {section==='dashboard'  && <DashboardSection  toast={toast} setSection={setSection} />}
          {section==='orders'     && <OrdersSection     toast={toast} />}
          {section==='invoices'   && <InvoicesSection   toast={toast} />}
          {section==='products'   && <ProductsSection   toast={toast} />}
          {section==='suppliers'  && <SuppliersSection  toast={toast} />}
          {section==='events'     && <EventsSection     toast={toast} />}
          {section==='blog'       && <BlogSection       toast={toast} />}
          {section==='hero'       && <HeroSection       toast={toast} />}
          {section==='fandom'     && <FandomSection     toast={toast} />}
          {section==='anime'      && <AnimeSection      toast={toast} />}
          {section==='contacts'   && <ContactsSection   toast={toast} />}
          {section==='users'      && <UsersSection      toast={toast} />}
          {section==='membership' && <MembershipSection toast={toast} />}
          {section==='manga'      && <MangaSection          toast={toast} />}
          {section==='publishers' && <PublishersSection     toast={toast} />}
          {section==='subs'       && <SubscriptionsSection  toast={toast} />}
          {section==='mangaComm'  && <MangaCommentsSection  toast={toast} />}
          {section==='coins'      && <CoinsSection          toast={toast} />}
        </main>
      </div>
    </div>
  )
}

// ══ CONTACTS / RÉSERVATIONS ═══════════════════════════
function ContactsSection({ toast }) {
  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)
  const { data, loading, execute } = useApi(() => adminApi.getContacts({ limit:100 }), [], true)
  const contacts = data?.contacts || []
  const filtered = contacts.filter(c => {
    const mF = filter==='all' || c.status===filter
    const mS = !search || `${c.nom} ${c.prenom} ${c.email} ${c.theme||''}`.toLowerCase().includes(search.toLowerCase())
    return mF && mS
  })

  const save = async (id, status, adminNotes) => {
    try {
      await request('PATCH', `/api/contact/${id}`, { status, adminNotes })
      toast.success('✅ Mis à jour')
      execute()
      setSelected(null)
    } catch(err) { toast.error(err.message) }
  }

  if (loading) return <PageLoader />
  return (
    <div>
      <div className={styles.filters}>
        {['all','new','contacted','quoted','confirmed','cancelled','completed'].map(s => (
          <button key={s}
            className={`${styles.filterBtn} ${filter===s?styles.filterActive:''}`}
            onClick={() => setFilter(s)}>
            {s==='all'?'Tous':STATUS_LABELS[s]||s}
          </button>
        ))}
        <input className={styles.searchBox} placeholder="🔍 Rechercher..."
          value={search} onChange={e=>setSearch(e.target.value)} />
      </div>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>📬 Réservations ({filtered.length})</span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className={styles.table}>
            <thead><tr>
              <th>Client</th><th>Pack</th><th>Thème</th>
              <th>Date</th><th>Pers.</th><th>Statut</th><th></th>
            </tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className={styles.tr}>
                  <td>
                    <strong>{c.prenom} {c.nom}</strong>
                    <br/><small style={{ color:'var(--ad-text-2,#8fa896)' }}>{c.email}</small>
                  </td>
                  <td><Badge variant="blue" style={{ fontSize:'.65rem' }}>{c.pack?.toUpperCase()}</Badge></td>
                  <td style={{ fontSize:'.82rem' }}>{c.theme}</td>
                  <td style={{ fontSize:'.8rem' }}>{new Date(c.date).toLocaleDateString('fr-FR')}</td>
                  <td>{c.guests}</td>
                  <td><Badge variant={statusVariant(c.status)} style={{ fontSize:'.65rem' }}>{STATUS_LABELS[c.status]||c.status}</Badge></td>
                  <td><Button variant="ghost" size="sm" onClick={() => setSelected(c)}>✏️</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <EmptyState icon="📭" title="Aucune réservation" />}
        </div>
      </div>
      {selected && <ContactModal c={selected} onClose={() => setSelected(null)} onSave={save} />}
    </div>
  )
}

function ContactModal({ c, onClose, onSave }) {
  const [status, setStatus] = useState(c.status)
  const [notes,  setNotes]  = useState(c.adminNotes||'')
  return (
    <Modal isOpen dark title="📬 Réservation" onClose={onClose}
      footer={
        <><Button variant="ghost" onClick={onClose}>Fermer</Button>
        <Button variant="primary" onClick={() => onSave(c.id, status, notes)}>💾 Sauvegarder</Button></>
      }>
      <div className={styles.detailGrid}>
        {[
          ['Client',   `${c.prenom} ${c.nom}`],
          ['Email',    c.email],
          ['Téléphone',c.phone||'—'],
          ['Pack',     c.pack?.toUpperCase()],
          ['Thème',    c.theme],
          ['Date',     new Date(c.date).toLocaleDateString('fr-FR')],
          ['Ville',    c.ville||'—'],
          ['Personnes',c.guests],
        ].map(([l,v]) => (
          <div key={l} className={styles.detailItem}>
            <div className={styles.detailLbl}>{l}</div>
            <strong style={{ fontSize:'.88rem' }}>{v}</strong>
          </div>
        ))}
      </div>
      {c.message && (
        <p style={{ color:'var(--ad-text-2,#8fa896)', fontSize:'.85rem', lineHeight:1.6, padding:'10px', background:'rgba(255,255,255,.03)', borderRadius:8, marginBottom:'1rem' }}>
          {c.message}
        </p>
      )}
      <ASelect label="Statut" value={status} onChange={setStatus}
        options={['new','contacted','quoted','confirmed','cancelled','completed'].map(s=>({v:s,l:STATUS_LABELS[s]||s}))} />
      <ATextarea label="Notes admin" value={notes} onChange={setNotes} rows={3} />
    </Modal>
  )
}

// ══ PRODUCTS ══════════════════════════════════════════
function ProductsSection({ toast }) {
  const [filter,    setFilter]    = useState('all')
  const [search,    setSearch]    = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState(null)
  const { data, loading, execute } = useApi(() => productsApi.getAll({ limit:200 }), [], true)
  const products = data?.products || []
  const filtered = products.filter(p => {
    const mC = filter==='all' || p.category===filter
    const mS = !search || `${p.nameF} ${p.nameE||''}`.toLowerCase().includes(search.toLowerCase())
    return mC && mS
  })

  const save = async (payload) => {
    try {
      editing ? await productsApi.update(editing.id, payload) : await productsApi.create(payload)
      toast.success(editing ? '✅ Produit mis à jour' : '✅ Produit créé')
      execute(); setModalOpen(false); setEditing(null)
    } catch(err) { toast.error(err.message) }
  }
  const del = async (id, name) => {
    if (!confirm(`Désactiver "${name}" ?`)) return
    try { await productsApi.delete(id); execute(); toast.success('🗑️ Désactivé') }
    catch(err) { toast.error(err.message) }
  }

  if (loading) return <PageLoader />
  return (
    <div>
      <div className={styles.filters}>
        <button className={`${styles.filterBtn} ${filter==='all'?styles.filterActive:''}`}
          onClick={() => setFilter('all')}>Tous ({products.length})</button>
        {ALL_CATS.map(c => (
          <button key={c} className={`${styles.filterBtn} ${filter===c?styles.filterActive:''}`}
            onClick={() => setFilter(c)}>{c.charAt(0).toUpperCase()+c.slice(1)}</button>
        ))}
        <input className={styles.searchBox} placeholder="🔍 Rechercher..."
          value={search} onChange={e=>setSearch(e.target.value)} />
        <Button variant="primary" size="sm"
          style={{ marginLeft:'auto', whiteSpace:'nowrap' }}
          onClick={() => { setEditing(null); setModalOpen(true) }}>+ Ajouter</Button>
      </div>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>📦 Produits ({filtered.length})</span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className={styles.table}>
            <thead><tr>
              <th>Image</th><th>Produit</th><th>Fournisseur</th>
              <th>Catégorie</th><th>Prix</th><th>Stock</th><th>Statut</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className={styles.tr}>
                  <td>
                    {p.imageUrl
                      ? <img src={p.imageUrl.startsWith('/')?`${API_BASE}${p.imageUrl}`:p.imageUrl}
                          alt={p.nameF} className={styles.productThumb}
                          onError={e=>{e.target.style.display='none'}} />
                      : <div className={styles.productEmoji}>{p.emoji||'🎁'}</div>}
                  </td>
                  <td>
                    <strong>{p.nameF}</strong>
                    {p.nameE && <div style={{ fontSize:'.75rem', color:'var(--ad-text-2,#8fa896)' }}>{p.nameE}</div>}
                  </td>
                  <td>
                    {p.supplier
                      ? <span style={{ fontSize:'.78rem', background:'rgba(51,255,51,.1)', color:'#4ade80', borderRadius:6, padding:'3px 8px' }}>🤝 {p.supplier.name}</span>
                      : <span style={{ fontSize:'.75rem', color:'var(--ad-text-2,#8fa896)' }}>Otaku Pulse</span>}
                  </td>
                  <td><Badge variant="gray" style={{ fontSize:'.65rem' }}>{p.category}</Badge></td>
                  <td>
                    <span style={{ fontFamily:'var(--font-title)', color:'#4ade80' }}>{p.price?.toLocaleString()} F</span>
                    {p.oldPrice && <div style={{ fontSize:'.72rem', color:'var(--ad-text-2,#8fa896)', textDecoration:'line-through' }}>{p.oldPrice?.toLocaleString()}</div>}
                  </td>
                  <td><Badge variant={p.stock<=0?'red':p.stock<=3?'amber':'green'} style={{ fontSize:'.65rem' }}>{p.stock}</Badge></td>
                  <td><Badge variant={p.isActive?'green':'gray'} style={{ fontSize:'.65rem' }}>{p.isActive?'Actif':'Inactif'}</Badge></td>
                  <td style={{ display:'flex', gap:6 }}>
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(p); setModalOpen(true) }}>✏️</Button>
                    <Button variant="danger" size="sm" onClick={() => del(p.id, p.nameF)}>🗑️</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <EmptyState icon="📦" title="Aucun produit" />}
        </div>
      </div>
      {modalOpen && (
        <ProductModal product={editing}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={save} toast={toast} />
      )}
    </div>
  )
}

function ProductModal({ product:p, onClose, onSave, toast }) {
  const [form, setForm] = useState({
    nameF:p?.nameF||'', nameE:p?.nameE||'', slug:p?.slug||'',
    category:p?.category||'posters', price:p?.price||'',
    oldPrice:p?.oldPrice||'', stock:p?.stock||'',
    emoji:p?.emoji||'🎁', badge:p?.badge||'', descF:p?.descF||'',
    imageUrl:p?.imageUrl||'', isActive:p?.isActive!==false,
    supplierId:p?.supplierId||'', isOwnProduct:p?.isOwnProduct!==false,
  })
  const { data:suppData } = useApi(() => suppliersApi.getAll(), [], true)
  const suppliers = suppData?.suppliers || []
  const s = (k,v) => setForm(f => ({ ...f, [k]:v }))
  const slugify = str => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')

  return (
    <Modal isOpen dark title={p?'✏️ Modifier produit':'📦 Nouveau produit'} onClose={onClose} wide
      footer={
        <><Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button variant="primary" onClick={() => onSave({
          ...form,
          price:parseFloat(form.price)||0,
          oldPrice:parseFloat(form.oldPrice)||null,
          stock:parseInt(form.stock)||0,
          supplierId:form.supplierId||null,
        })}>💾 Enregistrer</Button></>
      }>
      <div className={styles.formGrid2}>
        <AInput label="Nom FR *" value={form.nameF} onChange={v => { s('nameF',v); if(!p) s('slug',slugify(v)) }} />
        <AInput label="Nom EN"   value={form.nameE} onChange={v => s('nameE',v)} />
      </div>
      <AInput label="Slug URL" value={form.slug} onChange={v => s('slug',v)} />
      <ASelectRaw label="Fournisseur" value={form.supplierId}
        onChange={e => { s('supplierId',e.target.value); s('isOwnProduct',!e.target.value) }}>
        <option value="">⚡ Otaku Pulse (notre produit)</option>
        {suppliers.filter(sp=>sp.isActive && sp.status==='approved').map(sp => <option key={sp.id} value={sp.id}>🤝 {sp.name}</option>)}
      </ASelectRaw>

      {/* ── IMAGE : fichier OU lien ── */}
      <AField label="Image du produit">
        <ImageUploader
          currentUrl={form.imageUrl && form.imageUrl.startsWith('/') ? `${API_BASE}${form.imageUrl}` : form.imageUrl}
          onUpload={async (data, mime) => {
            // Stocke la data URL base64 directement dans imageUrl
            s('imageUrl', `data:${mime};base64,${data}`)
            toast?.success?.('📸 Image chargée')
          }}
          onUrlChange={(url) => s('imageUrl', url)}
          placeholder="Cliquer ou glisser une image produit"
        />
      </AField>

      <div className={styles.formGrid2}>
        <ASelect label="Catégorie *" value={form.category} onChange={v=>s('category',v)}
          options={ALL_CATS.map(c=>({v:c,l:c.charAt(0).toUpperCase()+c.slice(1)}))} />
        <AInput label="Emoji" value={form.emoji} onChange={v=>s('emoji',v)} />
        <AInput label="Prix FCFA *" type="number" value={form.price} onChange={v=>s('price',v)} />
        <AInput label="Ancien prix" type="number" value={form.oldPrice||''} onChange={v=>s('oldPrice',v)} />
        <AInput label="Stock *" type="number" value={form.stock} onChange={v=>s('stock',v)} />
        <AInput label="Badge" value={form.badge||''} onChange={v=>s('badge',v)} placeholder="PROMO, NEW..." />
      </div>
      <ATextarea label="Description FR" value={form.descF||''} onChange={v=>s('descF',v)} rows={2} />
      <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'.88rem', marginTop:'.5rem', color:'#cbd5e1' }}>
        <input type="checkbox" checked={form.isActive} onChange={e=>s('isActive',e.target.checked)} style={{ accentColor:'#33ff33' }} />
        ✅ Produit actif
      </label>
    </Modal>
  )
}

// ══ EVENTS ════════════════════════════════════════════
function EventsSection({ toast }) {
  const { data, loading, execute } = useApi(() => eventsApi.getAll({ limit:50 }), [], true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [regsFor, setRegsFor] = useState(null)
  const events = data?.events || []

  const save = async (form) => {
    try {
      editing ? await eventsApi.update(editing.id, form) : await eventsApi.create(form)
      toast.success('✅ Événement enregistré'); execute(); setModal(false); setEditing(null)
    } catch(err) { toast.error(err.message) }
  }

  if (loading) return <PageLoader />
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>🎌 Événements ({events.length})</span>
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setModal(true) }}>+ Événement</Button>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table className={styles.table}>
          <thead><tr><th>Événement</th><th>Type</th><th>Date</th><th>Lieu</th><th>Inscrits</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id} className={styles.tr}>
                <td><strong>{e.img} {e.titleF}</strong></td>
                <td><Badge variant="blue" style={{ fontSize:'.65rem' }}>{e.type?.toUpperCase()}</Badge></td>
                <td style={{ fontSize:'.82rem' }}>{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                <td style={{ fontSize:'.82rem' }}>{e.venue||e.location||'—'}</td>
                <td><Badge variant={e.registered>=e.capacity?'red':'green'} style={{ fontSize:'.65rem' }}>{e.registered}/{e.capacity}</Badge></td>
                <td><Badge variant={statusVariant(e.status)} style={{ fontSize:'.65rem' }}>{STATUS_LABELS[e.status]||e.status}</Badge></td>
                <td style={{ display:'flex', gap:6 }}>
                  <Button variant="ghost" size="sm" onClick={() => setRegsFor(e)}>👥 Inscrits</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(e); setModal(true) }}>✏️</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!events.length && <EmptyState icon="🎌" title="Aucun événement" />}
      </div>
      {modal && <EventModal event={editing} onClose={() => { setModal(false); setEditing(null) }} onSave={save} toast={toast} />}
      {regsFor && <RegistrationsModal event={regsFor} onClose={() => setRegsFor(null)} toast={toast} onPaid={execute} />}
    </div>
  )
}

// ── Modale "Inscrits" : liste des inscriptions + confirmation de paiement ──
function RegistrationsModal({ event, onClose, toast, onPaid }) {
  const { data, loading, execute } = useApi(() => eventsApi.getRegistrations(event.id), [event.id], true)
  const [busyId, setBusyId] = useState(null)
  const registrations = data?.registrations || []

  const regBadge = (status) => ({ confirmed:'green', waitlist:'amber', cancelled:'red' }[status] || 'gray')
  const payBadge = (status) => (status === 'paid' ? 'green' : 'orange')

  const confirmPayment = async (reg) => {
    setBusyId(reg.id)
    try {
      await eventsApi.confirmPayment(reg.id)
      toast.success('✅ Paiement confirmé, billet envoyé au client')
      execute(); onPaid?.()
    } catch (err) { toast.error(err.message) }
    finally { setBusyId(null) }
  }

  return (
    <Modal isOpen dark wide title={`👥 Inscrits — ${event.titleF}`} onClose={onClose}>
      {loading ? <PageLoader /> : (
        <div style={{ overflowX:'auto' }}>
          <table className={styles.table}>
            <thead><tr><th>Nom</th><th>Contact</th><th>Invités</th><th>Statut</th><th>Paiement</th><th>Billet</th><th></th></tr></thead>
            <tbody>
              {registrations.map(r => (
                <tr key={r.id} className={styles.tr}>
                  <td><strong>{r.name || r.user?.pseudo || '—'}</strong></td>
                  <td style={{ fontSize:'.8rem' }}>{r.email}{r.phone ? ` · ${r.phone}` : ''}</td>
                  <td>{r.guests || 1}</td>
                  <td><Badge variant={regBadge(r.status)} style={{ fontSize:'.65rem' }}>{r.status === 'waitlist' ? "Liste d'attente" : r.status === 'cancelled' ? 'Annulé' : 'Confirmé'}</Badge></td>
                  <td><Badge variant={payBadge(r.paymentStatus)} style={{ fontSize:'.65rem' }}>{r.paymentStatus === 'paid' ? '✅ Payé' : '⏳ En attente'}</Badge></td>
                  <td style={{ fontSize:'.75rem', fontFamily:'monospace' }}>{r.ticketCode}</td>
                  <td>
                    {r.paymentStatus !== 'paid' && (
                      <Button variant="primary" size="sm" disabled={busyId === r.id} onClick={() => confirmPayment(r)}>
                        {busyId === r.id ? '⏳...' : '✅ Confirmer paiement'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!registrations.length && <EmptyState icon="👥" title="Aucun inscrit pour le moment" />}
        </div>
      )}
    </Modal>
  )
}

function EventModal({ event:e, onClose, onSave, toast }) {
  const [form, setForm] = useState({
    titleF: e?.titleF||'', titleE: e?.titleE||'', descF: e?.descF||'', descE: e?.descE||'',
    date: e?.date||'', timeStart: e?.timeStart||'', timeEnd: e?.timeEnd||'',
    venue: e?.venue||'', city: e?.city||'Yaoundé', type: e?.type||'custom',
    capacity: e?.capacity??50, price: e?.price??0, isFree: e?.isFree||false,
    img: e?.img||'🎌', status: e?.status||'upcoming', featured: e?.featured||false,
    imageUrl: e?.imageUrl||'',
  })
  const s = (k,v) => setForm(f => ({ ...f, [k]:v }))

  const submit = () => {
    if (!form.titleF.trim()) return toast.error('Titre requis')
    if (!form.date) return toast.error('Date requise')
    onSave(form)
  }

  return (
    <Modal isOpen dark title={e ? '✏️ Modifier événement' : '🎌 Nouvel événement'} onClose={onClose} wide
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button variant="primary" onClick={submit}>💾 Enregistrer</Button></>}>
      <div className={styles.formGrid2}>
        <AInput label="Titre FR *" value={form.titleF} onChange={v=>s('titleF',v)} />
        <AInput label="Titre EN" value={form.titleE} onChange={v=>s('titleE',v)} />
      </div>
      <div className={styles.formGrid2}>
        <ATextarea label="Description FR" value={form.descF} onChange={v=>s('descF',v)} rows={2} />
        <ATextarea label="Description EN" value={form.descE} onChange={v=>s('descE',v)} rows={2} />
      </div>
      <div className={styles.formGrid2}>
        <AInput label="Date *" type="date" value={form.date} onChange={v=>s('date',v)} />
        <AInput label="Lieu" value={form.venue} onChange={v=>s('venue',v)} />
      </div>
      <div className={styles.formGrid2}>
        <AInput label="Heure début" type="time" value={form.timeStart} onChange={v=>s('timeStart',v)} />
        <AInput label="Heure fin" type="time" value={form.timeEnd} onChange={v=>s('timeEnd',v)} />
      </div>
      <div className={styles.formGrid2}>
        <AInput label="Ville" value={form.city} onChange={v=>s('city',v)} />
        <ASelect label="Type" value={form.type} onChange={v=>s('type',v)}
          options={[{v:'genin',l:'Genin'},{v:'chunin',l:'Chūnin'},{v:'hokage',l:'Hokage'},{v:'custom',l:'Custom'}]} />
      </div>
      <div className={styles.formGrid2}>
        <AInput label="Capacité" type="number" value={form.capacity} onChange={v=>s('capacity',Number(v))} />
        <AInput label="Prix (FCFA)" type="number" value={form.price} onChange={v=>s('price',Number(v))} />
      </div>
      <div className={styles.formGrid2}>
        <ASelect label="Statut" value={form.status} onChange={v=>s('status',v)}
          options={[{v:'upcoming',l:'À venir'},{v:'ongoing',l:'En cours'},{v:'past',l:'Passé'},{v:'cancelled',l:'Annulé'},{v:'draft',l:'Brouillon'}]} />
        <AInput label="Emoji" value={form.img} onChange={v=>s('img',v)} />
      </div>

      <AField label="Image de l'événement">
        <ImageUploader
          currentUrl={form.imageUrl && form.imageUrl.startsWith('/') ? `${API_BASE}${form.imageUrl}` : form.imageUrl}
          onUpload={async (data, mime) => { s('imageUrl', `data:${mime};base64,${data}`); toast?.success?.('📸 Image chargée') }}
          onUrlChange={(url) => s('imageUrl', url)}
          placeholder="Cliquer ou glisser une image d'événement"
        />
      </AField>

      <div style={{ display:'flex', gap:'1.5rem', marginTop:'.8rem' }}>
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'.88rem', color:'#cbd5e1' }}><input type="checkbox" checked={form.isFree} onChange={e=>s('isFree',e.target.checked)} style={{ accentColor:'#33ff33' }} /> 🆓 Gratuit</label>
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'.88rem', color:'#cbd5e1' }}><input type="checkbox" checked={form.featured} onChange={e=>s('featured',e.target.checked)} style={{ accentColor:'#33ff33' }} /> ⭐ Mis en avant</label>
      </div>
    </Modal>
  )
}

// ══ BLOG ══════════════════════════════════════════════
function BlogSection({ toast }) {
  const [postModal,   setPostModal]   = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [partModal,   setPartModal]   = useState(false)
  const { data:postsData, loading:lP, execute:refetchPosts } = useApi(() => blogApi.getPosts({limit:50}), [], true)
  const { data:partData,  loading:lPart, execute:refetchPart } = useApi(() => blogApi.getPartners(), [], true)
  const posts    = postsData?.posts    || []
  const partners = partData?.partners  || []
  const CAT_COLORS = { blog:'purple', event:'green', promo:'red', partner:'amber' }
  const CAT_ICONS  = { blog:'📝', event:'🎌', promo:'🔥', partner:'🤝' }

  const savePost = async (payload) => {
    try {
      editingPost ? await blogApi.updatePost(editingPost.id, payload) : await blogApi.createPost(payload)
      toast.success('✅ Article publié'); refetchPosts(); setPostModal(false); setEditingPost(null)
    } catch(err) { toast.error(err.message) }
  }
  const delPost = async id => {
    if (!confirm('Supprimer ?')) return
    try { await blogApi.deletePost(id); refetchPosts(); toast.success('🗑️ Supprimé') }
    catch(err) { toast.error(err.message) }
  }
  const savePartner = async payload => {
    try { await blogApi.createPartner(payload); toast.success('✅ Partenaire ajouté'); refetchPart(); setPartModal(false) }
    catch(err) { toast.error(err.message) }
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'1.5rem', alignItems:'start' }}>
      <div>
        <div className={styles.card} style={{ marginBottom:'1.5rem' }}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>📝 Articles ({posts.length})</span>
            <Button variant="primary" size="sm" onClick={() => { setEditingPost(null); setPostModal(true) }}>+ Publier</Button>
          </div>
          <div style={{ padding:'1rem' }}>
            {lP && <PageLoader />}
            {posts.map(p => (
              <div key={p.id} className={styles.postItem}>
                <span style={{ fontSize:'1.8rem', width:46, textAlign:'center', flexShrink:0 }}>{p.emoji||CAT_ICONS[p.category]||'📰'}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'.9rem', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3, color:'var(--ad-text,#e8ffe8)' }}>{p.title}</div>
                  <div style={{ display:'flex', gap:7, flexWrap:'wrap', alignItems:'center' }}>
                    <Badge variant={CAT_COLORS[p.category]||'gray'} style={{ fontSize:'.62rem' }}>{p.category}</Badge>
                    <span style={{ fontSize:'.72rem', color:'var(--ad-text-2,#8fa896)' }}>{new Date(p.createdAt).toLocaleDateString('fr-FR')}</span>
                    <span style={{ fontSize:'.72rem', color:p.isPublished?'#4ade80':'#f87171' }}>{p.isPublished?'✅ Publié':'🔴 Masqué'}</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <Button variant="ghost" size="sm" onClick={() => { setEditingPost(p); setPostModal(true) }}>✏️</Button>
                  <Button variant="danger" size="sm" onClick={() => delPost(p.id)}>🗑️</Button>
                </div>
              </div>
            ))}
            {!posts.length && !lP && <EmptyState icon="📝" title="Aucun article" />}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>🤝 Partenaires ({partners.length})</span>
            <Button variant="primary" size="sm" onClick={() => setPartModal(true)}>+ Ajouter</Button>
          </div>
          <div style={{ padding:'1rem', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
            {partners.map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px', background:'rgba(255,255,255,.03)', border:'1px solid var(--ad-border,rgba(51,255,51,.12))', borderRadius:10 }}>
                <span style={{ fontSize:'1.5rem', width:36, textAlign:'center' }}>{p.logo||'🤝'}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'.85rem', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--ad-text,#e8ffe8)' }}>{p.name}</div>
                  <div style={{ fontSize:'.72rem', color:'var(--ad-text-2,#8fa896)' }}>{p.description||''}</div>
                </div>
                <Button variant="danger" size="sm" onClick={async () => { try { await blogApi.deletePartner(p.id); refetchPart() } catch(e) { toast.error(e.message) }}}>✕</Button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div className={styles.card} style={{ position:'sticky', top:'70px' }}>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>🔥 Popup Promo</span></div>
          <PopupForm toast={toast} />
        </div>
      </div>
      {postModal && <PostModal post={editingPost} onClose={() => { setPostModal(false); setEditingPost(null) }} onSave={savePost} toast={toast} />}
      {partModal && <PartnerModal onClose={() => setPartModal(false)} onSave={savePartner} />}
    </div>
  )
}

function PostModal({ post:p, onClose, onSave, toast }) {
  const [form, setForm] = useState({ title:p?.title||'', category:p?.category||'blog', excerpt:p?.excerpt||'', content:p?.content||'', emoji:p?.emoji||'📰', imageUrl:p?.imageUrl||'', isFeatured:p?.isFeatured||false, isPublished:p?.isPublished!==false, promoCode:p?.promoCode||'' })
  const s = (k,v) => setForm(f=>({...f,[k]:v}))
  return (
    <Modal isOpen dark title={p?'✏️ Modifier':'📝 Nouvel article'} onClose={onClose} wide
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button variant="primary" onClick={()=>onSave(form)}>💾 Publier</Button></>}>
      <AInput label="Titre *" value={form.title} onChange={v=>s('title',v)} />
      <div className={styles.formGrid2}>
        <ASelect label="Catégorie" value={form.category} onChange={v=>s('category',v)}
          options={[{v:'blog',l:'📝 Blog'},{v:'event',l:'🎌 Événement'},{v:'promo',l:'🔥 Promo'},{v:'partner',l:'🤝 Partenaire'}]} />
        <AInput label="Emoji" value={form.emoji} onChange={v=>s('emoji',v)} />
      </div>

      {/* ── IMAGE : fichier OU lien ── */}
      <AField label="Image de l'article">
        <ImageUploader
          currentUrl={form.imageUrl && form.imageUrl.startsWith('/') ? `${API_BASE}${form.imageUrl}` : form.imageUrl}
          onUpload={async (data, mime) => {
            s('imageUrl', `data:${mime};base64,${data}`)
            toast?.success?.('📸 Image chargée')
          }}
          onUrlChange={(url) => s('imageUrl', url)}
          placeholder="Cliquer ou glisser une image d'article"
        />
      </AField>

      <ATextarea label="Résumé" value={form.excerpt} onChange={v=>s('excerpt',v)} rows={2} />
      <ATextarea label="Contenu *" value={form.content} onChange={v=>s('content',v)} rows={6} />
      <AInput label="Code promo" value={form.promoCode} onChange={v=>s('promoCode',v)} placeholder="NAKAMA" />
      <div style={{ display:'flex', gap:'1.5rem', marginTop:'.8rem' }}>
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'.88rem', color:'#cbd5e1' }}><input type="checkbox" checked={form.isFeatured} onChange={e=>s('isFeatured',e.target.checked)} style={{ accentColor:'#33ff33' }} /> ⭐ À la une</label>
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'.88rem', color:'#cbd5e1' }}><input type="checkbox" checked={form.isPublished} onChange={e=>s('isPublished',e.target.checked)} style={{ accentColor:'#33ff33' }} /> ✅ Publié</label>
      </div>
    </Modal>
  )
}

function PartnerModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name:'', description:'', logo:'🤝', url:'' })
  const s = (k,v) => setForm(f=>({...f,[k]:v}))
  return (
    <Modal isOpen dark title="🤝 Nouveau partenaire" onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button variant="primary" onClick={()=>onSave(form)}>💾 Ajouter</Button></>}>
      <AInput label="Nom *" value={form.name} onChange={v=>s('name',v)} />
      <AInput label="Description" value={form.description} onChange={v=>s('description',v)} />
      <div className={styles.formGrid2}>
        <AInput label="Emoji" value={form.logo} onChange={v=>s('logo',v)} />
        <AInput label="Site web" value={form.url} onChange={v=>s('url',v)} placeholder="https://..." />
      </div>
    </Modal>
  )
}

function PopupForm({ toast }) {
  const [form, setForm] = useState({ title:'OFFRE LIMITÉE', text:'Profite de notre offre !', emoji:'🔥', code:'' })
  const s = (k,v) => setForm(f=>({...f,[k]:v}))
  return (
    <div style={{ padding:'1rem' }}>
      <p style={{ fontSize:'.8rem', color:'var(--ad-text-2,#8fa896)', lineHeight:1.5, marginBottom:'1rem' }}>Popup visible sur la page Blog.</p>
      <AInput label="Emoji" value={form.emoji} onChange={v=>s('emoji',v)} />
      <AInput label="Titre" value={form.title} onChange={v=>s('title',v)} />
      <ATextarea label="Texte" value={form.text} onChange={v=>s('text',v)} rows={2} />
      <AInput label="Code promo" value={form.code} onChange={v=>s('code',v)} placeholder="NAKAMA" />
      <Button variant="primary" onClick={async()=>{
        try { await blogApi.savePopup({...form,isActive:true}); toast.success('✅ Popup activée !') }
        catch(e) { toast.error(e.message) }
      }} style={{ width:'100%', marginTop:'.8rem' }}>⚡ Activer</Button>
    </div>
  )
}

/* ══ MEMBRES ══════════════════════════════════════════
   Seul un superadmin peut accorder ou retirer des rôles. Le serveur applique
   la même règle (PATCH /api/admin/users/:id/role) : l'interface ne fait que
   refléter une décision prise côté API, jamais l'inverse. */

const ROLE_META = {
  superadmin: { label: 'Super Admin', cls: 'text-danger  border-danger/40  bg-danger/10'  },
  admin:      { label: 'Admin',       cls: 'text-warn    border-warn/40    bg-warn/10'    },
  publisher:  { label: 'Éditeur',     cls: 'text-info    border-info/40    bg-info/10'    },
  partner:    { label: 'Partenaire',  cls: 'text-violet  border-violet/40  bg-violet/10'  },
  user:       { label: 'Membre',      cls: 'text-fg-muted border-line      bg-ink-800'    },
}

const ROLE_OPTIONS = [
  { v: 'user',       l: 'Membre',      d: 'Aucun privilège particulier.' },
  { v: 'publisher',  l: 'Éditeur',     d: 'Peut publier des mangas et des chapitres.' },
  { v: 'partner',    l: 'Partenaire',  d: 'Peut tenir une boutique et vendre des produits.' },
  { v: 'admin',      l: 'Admin',       d: "Accès complet au panneau d'administration." },
  { v: 'superadmin', l: 'Super Admin', d: 'Accès complet + peut accorder des rôles.' },
]

function RoleBadge({ role }) {
  const m = ROLE_META[role] || ROLE_META.user
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.68rem] font-bold ${m.cls}`}>
      {m.label}
    </span>
  )
}

function UsersSection({ toast }) {
  const { user: me } = useAuth()
  const isSuperadmin = me?.role === 'superadmin'

  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)

  const { data, loading, execute } = useApi(() => adminApi.getUsers({ limit: 200 }), [], true)
  const users = data?.users || []

  const filtered = users.filter(u => {
    const mF = filter === 'all'
      || (filter === 'admin'  ? ['admin','superadmin'].includes(u.role)
      :  filter === 'banned' ? u.isBanned
      :  u.role === filter)
    const mS = !search || `${u.pseudo} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    return mF && mS
  })

  const staffCount = users.filter(u => ['admin','superadmin'].includes(u.role) && !u.isBanned).length

  const save = async (id, payload) => {
    try { await adminApi.updateUser(id, payload); toast.success('Membre mis à jour'); execute(); setSelected(null) }
    catch (err) { toast.error(err.message) }
  }

  // Le rôle passe par sa propre route : le serveur refuse un changement de rôle
  // envoyé sur la route de profil, et refuse tout court si l'appelant n'est pas
  // superadmin.
  const saveRole = async (id, role) => {
    try {
      const r = await adminApi.setUserRole(id, role)
      toast.success(r.message || 'Rôle mis à jour')
      execute()
      setSelected(null)
    } catch (err) { toast.error(err.message) }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      {/* Un seul administrateur actif = point de défaillance unique. C'est
          exactement ce qui a rendu le site inadministrable : on le signale. */}
      {isSuperadmin && staffCount <= 1 && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-warn/35 bg-warn/10 px-4 py-3 text-[0.83rem] text-warn">
          <span className="mt-px shrink-0">⚠️</span>
          <span>
            <strong>Un seul compte administrateur actif.</strong> Si tu perds l'accès à ce
            compte, plus personne ne peut administrer le site. Promeus un second compte
            de confiance en « Admin ».
          </span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[['all','Tous'],['user','Membres'],['admin','Admins'],['partner','Partenaires'],['banned','Suspendus']].map(([f,l]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              'rounded-full border px-3.5 py-1.5 text-[0.8rem] font-semibold transition-colors',
              filter === f
                ? 'border-brand bg-brand/12 text-brand-hi'
                : 'border-line text-fg-muted hover:bg-ink-800 hover:text-fg',
            ].join(' ')}
          >
            {l}
          </button>
        ))}
        <input
          className="adm-input ml-auto w-full sm:w-64"
          placeholder="Pseudo ou email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="adm-card p-0">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-[0.85rem] font-bold">Membres ({filtered.length})</span>
          {!isSuperadmin && (
            <span className="text-[0.72rem] text-fg-faint">
              Seul un superadmin peut modifier les rôles
            </span>
          )}
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Membre</th><th>Email</th><th>Ville</th><th>Rôle</th><th>Inscrit</th><th>Statut</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="font-semibold text-fg">
                      {u.pseudo}
                      {u.id === me?.id && (
                        <span className="ml-1.5 text-[0.68rem] font-normal text-fg-faint">(toi)</span>
                      )}
                    </div>
                    {u.firstName && (
                      <div className="text-[0.74rem] text-fg-muted">{u.firstName} {u.lastName || ''}</div>
                    )}
                  </td>
                  <td className="text-[0.8rem] text-fg-muted">{u.email}</td>
                  <td className="text-[0.8rem] text-fg-muted">{u.city || '—'}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td className="text-[0.76rem] text-fg-faint">
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <span className={[
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-[0.68rem] font-bold',
                      u.isBanned  ? 'border-danger/40 bg-danger/10 text-danger'
                      : u.isVerified ? 'border-brand/35 bg-brand/10 text-brand'
                      : 'border-warn/35 bg-warn/10 text-warn',
                    ].join(' ')}>
                      {u.isBanned ? 'Suspendu' : u.isVerified ? 'Actif' : 'En attente'}
                    </span>
                  </td>
                  <td>
                    <button className="adm-btn adm-btn-ghost !px-3 !py-1" onClick={() => setSelected(u)}>
                      Gérer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <EmptyState icon="👥" title="Aucun membre" />}
        </div>
      </div>

      {selected && (
        <UserModal
          user={selected}
          me={me}
          isSuperadmin={isSuperadmin}
          staffCount={staffCount}
          onClose={() => setSelected(null)}
          onSave={save}
          onSaveRole={saveRole}
        />
      )}
    </div>
  )
}

function UserModal({ user: u, me, isSuperadmin, staffCount, onClose, onSave, onSaveRole }) {
  const [role, setRole] = useState(u.role)
  const [ver,  setVer]  = useState(u.isVerified)
  const [nl,   setNl]   = useState(u.newsletterSubscribed)

  const isSelf     = u.id === me?.id
  const isStaff    = ['admin','superadmin'].includes(u.role)
  const wantsStaff = ['admin','superadmin'].includes(role)

  // Les mêmes règles que le serveur, reproduites ici pour expliquer le refus
  // AVANT le clic plutôt que d'afficher une erreur après coup.
  const roleBlocked =
    isSelf && !wantsStaff
      ? 'Tu ne peux pas retirer tes propres privilèges. Demande à un autre superadmin.'
      : isStaff && !wantsStaff && staffCount <= 1
        ? "C'est le dernier compte administrateur actif. Promeus quelqu'un d'autre d'abord."
        : null

  const roleChanged = role !== u.role

  return (
    <Modal isOpen dark wide title={`Membre — ${u.pseudo}`} onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          <Button
            variant={u.isBanned ? 'primary' : 'danger'}
            disabled={isSelf}
            onClick={() => onSave(u.id, { isBanned: !u.isBanned })}
          >
            {u.isBanned ? 'Réactiver' : 'Suspendre'}
          </Button>
          <Button variant="primary" onClick={() => onSave(u.id, { isVerified: ver, newsletterSubscribed: nl })}>
            Enregistrer
          </Button>
        </>
      }>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Pseudo', u.pseudo], ['Email', u.email],
          ['Prénom / Nom', `${u.firstName || '—'} ${u.lastName || ''}`],
          ['Téléphone', u.phone || '—'], ['WhatsApp', u.whatsapp || '—'],
          ['Ville', u.city || '—'], ['Quartier', u.quartier || '—'],
          ['Connexions', `${u.loginCount || 0}`]].map(([l, v]) => (
          <div key={l} className="rounded-lg border border-line bg-ink-800/50 px-3 py-2">
            <div className="mb-0.5 text-[0.64rem] uppercase tracking-wider text-fg-faint">{l}</div>
            <div className="truncate text-[0.85rem] font-semibold text-fg" title={String(v)}>{v}</div>
          </div>
        ))}
      </div>

      {/* ── Rôle et privilèges ── */}
      <div className="rounded-xl border border-line bg-ink-800/40 p-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[0.72rem] font-bold uppercase tracking-wider text-fg-muted">
            Rôle et privilèges
          </span>
          <RoleBadge role={u.role} />
        </div>

        {!isSuperadmin ? (
          <p className="m-0 text-[0.8rem] text-fg-muted">
            Seul un <strong className="text-fg">superadmin</strong> peut accorder ou retirer un rôle.
          </p>
        ) : (
          <>
            <p className="mb-3 mt-1 text-[0.78rem] leading-relaxed text-fg-muted">
              Accorder « Admin » donne l'accès complet au panneau. « Super Admin » y ajoute
              le droit d'accorder des rôles à son tour.
            </p>

            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              {ROLE_OPTIONS.map(o => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setRole(o.v)}
                  className={[
                    'rounded-lg border px-3 py-2.5 text-left transition-colors',
                    role === o.v
                      ? 'border-brand bg-brand/10'
                      : 'border-line hover:bg-ink-800',
                  ].join(' ')}
                >
                  <div className="text-[0.83rem] font-semibold text-fg">{o.l}</div>
                  <div className="mt-0.5 text-[0.72rem] leading-snug text-fg-muted">{o.d}</div>
                </button>
              ))}
            </div>

            {roleBlocked && (
              <div className="mb-3 rounded-lg border border-warn/35 bg-warn/10 px-3 py-2 text-[0.78rem] text-warn">
                {roleBlocked}
              </div>
            )}

            <button
              type="button"
              className="adm-btn adm-btn-primary"
              disabled={!roleChanged || !!roleBlocked}
              onClick={() => onSaveRole(u.id, role)}
            >
              {roleChanged
                ? `Appliquer : ${ROLE_META[role]?.label || role}`
                : 'Aucun changement de rôle'}
            </button>

            {roleChanged && wantsStaff && !roleBlocked && (
              <p className="mb-0 mt-2.5 text-[0.74rem] text-fg-faint">
                {u.pseudo} devra se déconnecter puis se reconnecter pour que ses nouveaux
                privilèges prennent effet.
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Compte ── */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="adm-label">Vérification</label>
          <select className="adm-input" value={String(ver)} onChange={e => setVer(e.target.value === 'true')}>
            <option value="true">Vérifié</option>
            <option value="false">Non vérifié</option>
          </select>
        </div>
        <div>
          <label className="adm-label">Newsletter</label>
          <select className="adm-input" value={String(nl)} onChange={e => setNl(e.target.value === 'true')}>
            <option value="true">Abonné</option>
            <option value="false">Désabonné</option>
          </select>
        </div>
      </div>

      {isSelf && (
        <p className="mt-3 mb-0 text-[0.76rem] text-fg-faint">
          C'est ton propre compte : la suspension et le retrait de privilèges sont
          désactivés pour t'éviter de te verrouiller dehors.
        </p>
      )}
    </Modal>
  )
}

// ══ FORM HELPERS (dark néon) ══════════════════════════
const labelStyle = {
  display:'block', fontSize:'.7rem', fontWeight:700, letterSpacing:1,
  color:'var(--ad-text-2,#8fa896)', marginBottom:5, textTransform:'uppercase',
}
const fieldStyle = {
  width:'100%', padding:'10px 12px', borderRadius:10,
  background:'var(--ad-bg,#0a0e0a)', border:'1px solid var(--ad-border-2,rgba(51,255,51,.22))',
  color:'var(--ad-text,#e8ffe8)', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none',
  transition:'border-color .2s, box-shadow .2s',
}
const onFocusField = e => { e.target.style.borderColor='rgba(51,255,51,.5)'; e.target.style.boxShadow='0 0 0 3px rgba(51,255,51,.12)' }
const onBlurField  = e => { e.target.style.borderColor='var(--ad-border-2,rgba(51,255,51,.22))'; e.target.style.boxShadow='none' }

function AField({ label, children }) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function AInput({ label, type='text', value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value??''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={fieldStyle} onFocus={onFocusField} onBlur={onBlurField} />
    </div>
  )
}

function ASelect({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={fieldStyle} onFocus={onFocusField} onBlur={onBlurField}>
        {options.map(o=><option key={o.v} value={o.v} style={{ background:'#0f140f' }}>{o.l}</option>)}
      </select>
    </div>
  )
}

// Select avec children bruts (pour le cas fournisseurs)
function ASelectRaw({ label, value, onChange, children }) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={onChange}
        style={fieldStyle} onFocus={onFocusField} onBlur={onBlurField}>
        {children}
      </select>
    </div>
  )
}

function ATextarea({ label, value, onChange, rows=3 }) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      <label style={labelStyle}>{label}</label>
      <textarea value={value??''} onChange={e=>onChange(e.target.value)} rows={rows}
        style={{ ...fieldStyle, resize:'vertical', lineHeight:1.6 }}
        onFocus={onFocusField} onBlur={onBlurField} />
    </div>
  )
}