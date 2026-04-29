// src/pages/Admin/index.jsx — COMPLET
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

const ALL_CATS = ['posters','stickers','accessoires','kits','manga','livre','dessin','nutrition','echange','jeux']

const SECTIONS = [
  { id:'dashboard',   icon:'📊', label:'Dashboard'      },
  { id:'orders',      icon:'🛒', label:'Commandes'      },
  { id:'products',    icon:'📦', label:'Produits'       },
  { id:'suppliers',   icon:'🤝', label:'Fournisseurs'   },
  { id:'events',      icon:'🎌', label:'Événements'     },
  { id:'blog',        icon:'📝', label:'Blog & Promos'  },
  { id:'hero',        icon:'🖼️', label:'Hero dynamique' },
  { id:'contacts',    icon:'📬', label:'Réservations'   },
  { id:'users',       icon:'👥', label:'Membres'        },
  { id:'membership',  icon:'🎴', label:'Carte Membre'   },
  // ── Manga Platform ──
  { id:'__manga_sep', icon:'',   label:'MANGA PLATFORM', divider:true },
  { id:'manga',       icon:'📚', label:'Mangas'         },
  { id:'publishers',  icon:'✍️', label:'Éditeurs'       },
  { id:'subs',        icon:'💎', label:'Abonnements'    },
  { id:'mangaComm',   icon:'💬', label:'Commentaires'   },
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
  {SECTIONS.map(s => s.divider ? (
    <div key={s.id} style={{
      padding:'12px 1rem 6px',
      fontSize:'.6rem',
      color:'rgba(124,58,237,.5)',
      letterSpacing:'2px',
      fontWeight:800,
      textTransform:'uppercase',
      borderTop:'1px solid rgba(255,255,255,.05)',
      marginTop:'8px',
      marginBottom:'4px',
    }}>{s.label}</div>
  ) : (
    <button key={s.id}
      className={`${styles.navItem} ${section===s.id?styles.navActive:''}`}
      onClick={() => setSection(s.id)}>
      <span className={styles.navIcon}>{s.icon}</span>{s.label}
    </button>
  ))}
</nav>
        <div className={styles.sbFooter}>
          <div className={styles.sbUser}>
            <span style={{ fontSize:'1.4rem' }}>{user?.role==='superadmin'?'👑':'⚙️'}</span>
            <div>
              <div className={styles.sbUserName}>{user?.pseudo}</div>
              <div className={styles.sbUserRole}>{user?.role?.toUpperCase()}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>🚪 Déconnexion</button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.topbar}>
          <h1 className={styles.topbarTitle}>
  {SECTIONS.find(s => s.id === section && !s.divider)?.icon}{' '}
  {SECTIONS.find(s => s.id === section && !s.divider)?.label || section}
</h1>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:'.75rem', color:'rgba(180,190,220,.5)' }}>
              {new Date().toLocaleDateString('fr-FR',{ dateStyle:'medium' })}
            </span>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>🌐 Site</Button>
          </div>
        </div>
        <div className={styles.content}>
          {section==='dashboard'  && <DashboardSection  toast={toast} setSection={setSection} />}
          {section==='orders'     && <OrdersSection     toast={toast} />}
          {section==='products'   && <ProductsSection   toast={toast} />}
          {section==='suppliers'  && <SuppliersSection  toast={toast} />}
          {section==='events'     && <EventsSection     />}
          {section==='blog'       && <BlogSection       toast={toast} />}
          {section==='hero'       && <HeroSection       toast={toast} />}
          {section==='contacts'   && <ContactsSection   toast={toast} />}
          {section==='users'      && <UsersSection      toast={toast} />}
          {section==='membership' && <MembershipSection toast={toast} />}
          {/* Manga Platform */}
{section==='manga'       && <MangaSection          toast={toast} />}
{section==='publishers'  && <PublishersSection     toast={toast} />}
{section==='subs'        && <SubscriptionsSection  toast={toast} />}
{section==='mangaComm'   && <MangaCommentsSection  toast={toast} />}
        </div>
      </main>
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
      // Appel PATCH /api/contact/:id
      const res = await fetch(`${API_BASE}/api/contact/${id}`, {
        method:'PATCH',
        headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${localStorage.getItem('op_token')}` },
        body: JSON.stringify({ status, adminNotes }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
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
                    <br/><small style={{ color:'rgba(180,190,220,.5)' }}>{c.email}</small>
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
    <Modal isOpen title="📬 Réservation" onClose={onClose}
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
        <p style={{ color:'rgba(180,190,220,.6)', fontSize:'.85rem', lineHeight:1.6, padding:'10px', background:'rgba(255,255,255,.03)', borderRadius:8, marginBottom:'1rem' }}>
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
                    {p.nameE && <div style={{ fontSize:'.75rem', color:'rgba(180,190,220,.45)' }}>{p.nameE}</div>}
                  </td>
                  <td>
                    {p.supplier
                      ? <span style={{ fontSize:'.78rem', background:'rgba(34,197,94,.1)', color:'#4ade80', borderRadius:6, padding:'3px 8px' }}>🤝 {p.supplier.name}</span>
                      : <span style={{ fontSize:'.75rem', color:'rgba(180,190,220,.4)' }}>Otaku Pulse</span>}
                  </td>
                  <td><Badge variant="gray" style={{ fontSize:'.65rem' }}>{p.category}</Badge></td>
                  <td>
                    <span style={{ fontFamily:'var(--font-title)', color:'#4ade80' }}>{p.price?.toLocaleString()} F</span>
                    {p.oldPrice && <div style={{ fontSize:'.72rem', color:'rgba(180,190,220,.4)', textDecoration:'line-through' }}>{p.oldPrice?.toLocaleString()}</div>}
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
    <Modal isOpen title={p?'✏️ Modifier produit':'📦 Nouveau produit'} onClose={onClose} wide
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
      <div style={{ marginBottom:'1rem' }}>
        <label style={{ display:'block', fontSize:'.7rem', fontWeight:700, color:'rgba(180,190,220,.5)', marginBottom:5, letterSpacing:1, textTransform:'uppercase' }}>Fournisseur</label>
        <select value={form.supplierId} onChange={e => { s('supplierId',e.target.value); s('isOwnProduct',!e.target.value) }}
          style={{ width:'100%', padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'#e2e8f0', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none' }}>
          <option value="" style={{ background:'#11142a' }}>⚡ Otaku Pulse (notre produit)</option>
          {suppliers.filter(s=>s.isActive).map(s => <option key={s.id} value={s.id} style={{ background:'#11142a' }}>🤝 {s.name}</option>)}
        </select>
      </div>
      <AInput label="URL image externe" value={form.imageUrl} onChange={v=>s('imageUrl',v)} placeholder="https://...jpg" />
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
        <input type="checkbox" checked={form.isActive} onChange={e=>s('isActive',e.target.checked)} style={{ accentColor:'var(--green)' }} />
        ✅ Produit actif
      </label>
    </Modal>
  )
}

// ══ EVENTS ════════════════════════════════════════════
function EventsSection() {
  const { data, loading } = useApi(() => eventsApi.getAll({ limit:50 }), [], true)
  if (loading) return <PageLoader />
  const events = data?.events || []
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>🎌 Événements ({events.length})</span>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table className={styles.table}>
          <thead><tr><th>Événement</th><th>Type</th><th>Date</th><th>Lieu</th><th>Inscrits</th><th>Statut</th></tr></thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id} className={styles.tr}>
                <td><strong>{e.img} {e.titleF}</strong></td>
                <td><Badge variant="blue" style={{ fontSize:'.65rem' }}>{e.type?.toUpperCase()}</Badge></td>
                <td style={{ fontSize:'.82rem' }}>{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                <td style={{ fontSize:'.82rem' }}>{e.venue||e.location||'—'}</td>
                <td><Badge variant={e.registered>=e.capacity?'red':'green'} style={{ fontSize:'.65rem' }}>{e.registered}/{e.capacity}</Badge></td>
                <td><Badge variant={statusVariant(e.status)} style={{ fontSize:'.65rem' }}>{STATUS_LABELS[e.status]||e.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!events.length && <EmptyState icon="🎌" title="Aucun événement" />}
      </div>
    </div>
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
                  <div style={{ fontSize:'.9rem', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3, color:'#e2e8f0' }}>{p.title}</div>
                  <div style={{ display:'flex', gap:7, flexWrap:'wrap', alignItems:'center' }}>
                    <Badge variant={CAT_COLORS[p.category]||'gray'} style={{ fontSize:'.62rem' }}>{p.category}</Badge>
                    <span style={{ fontSize:'.72rem', color:'rgba(180,190,220,.5)' }}>{new Date(p.createdAt).toLocaleDateString('fr-FR')}</span>
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
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px', background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:10 }}>
                <span style={{ fontSize:'1.5rem', width:36, textAlign:'center' }}>{p.logo||'🤝'}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'.85rem', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'#e2e8f0' }}>{p.name}</div>
                  <div style={{ fontSize:'.72rem', color:'rgba(180,190,220,.5)' }}>{p.description||''}</div>
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
      {postModal && <PostModal post={editingPost} onClose={() => { setPostModal(false); setEditingPost(null) }} onSave={savePost} />}
      {partModal && <PartnerModal onClose={() => setPartModal(false)} onSave={savePartner} />}
    </div>
  )
}

function PostModal({ post:p, onClose, onSave }) {
  const [form, setForm] = useState({ title:p?.title||'', category:p?.category||'blog', excerpt:p?.excerpt||'', content:p?.content||'', emoji:p?.emoji||'📰', imageUrl:p?.imageUrl||'', isFeatured:p?.isFeatured||false, isPublished:p?.isPublished!==false, promoCode:p?.promoCode||'' })
  const s = (k,v) => setForm(f=>({...f,[k]:v}))
  return (
    <Modal isOpen title={p?'✏️ Modifier':'📝 Nouvel article'} onClose={onClose} wide
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button variant="primary" onClick={()=>onSave(form)}>💾 Publier</Button></>}>
      <AInput label="Titre *" value={form.title} onChange={v=>s('title',v)} />
      <div className={styles.formGrid2}>
        <ASelect label="Catégorie" value={form.category} onChange={v=>s('category',v)}
          options={[{v:'blog',l:'📝 Blog'},{v:'event',l:'🎌 Événement'},{v:'promo',l:'🔥 Promo'},{v:'partner',l:'🤝 Partenaire'}]} />
        <AInput label="Emoji" value={form.emoji} onChange={v=>s('emoji',v)} />
      </div>
      <AInput label="Image URL" value={form.imageUrl} onChange={v=>s('imageUrl',v)} placeholder="https://...jpg" />
      <ATextarea label="Résumé" value={form.excerpt} onChange={v=>s('excerpt',v)} rows={2} />
      <ATextarea label="Contenu *" value={form.content} onChange={v=>s('content',v)} rows={6} />
      <AInput label="Code promo" value={form.promoCode} onChange={v=>s('promoCode',v)} placeholder="NAKAMA" />
      <div style={{ display:'flex', gap:'1.5rem', marginTop:'.8rem' }}>
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'.88rem', color:'#cbd5e1' }}><input type="checkbox" checked={form.isFeatured} onChange={e=>s('isFeatured',e.target.checked)} style={{ accentColor:'#22c55e' }} /> ⭐ À la une</label>
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'.88rem', color:'#cbd5e1' }}><input type="checkbox" checked={form.isPublished} onChange={e=>s('isPublished',e.target.checked)} style={{ accentColor:'#22c55e' }} /> ✅ Publié</label>
      </div>
    </Modal>
  )
}

function PartnerModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name:'', description:'', logo:'🤝', url:'' })
  const s = (k,v) => setForm(f=>({...f,[k]:v}))
  return (
    <Modal isOpen title="🤝 Nouveau partenaire" onClose={onClose}
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
      <p style={{ fontSize:'.8rem', color:'rgba(180,190,220,.5)', lineHeight:1.5, marginBottom:'1rem' }}>Popup visible sur la page Blog.</p>
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

// ══ USERS ═════════════════════════════════════════════
function UsersSection({ toast }) {
  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)
  const { data, loading, execute } = useApi(() => adminApi.getUsers({ limit:200 }), [], true)
  const users = data?.users || []
  const filtered = users.filter(u => {
    const mF = filter==='all'||(filter==='admin'?['admin','superadmin'].includes(u.role):filter==='banned'?u.isBanned:u.role===filter)
    const mS = !search||`${u.pseudo} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    return mF && mS
  })
  const save = async (id, payload) => {
    try { await adminApi.updateUser(id, payload); toast.success('✅ Mis à jour'); execute(); setSelected(null) }
    catch(err) { toast.error(err.message) }
  }

  if (loading) return <PageLoader />
  return (
    <div>
      <div className={styles.filters}>
        {[['all','Tous'],['user','Membres'],['admin','Admins'],['banned','Bannis']].map(([f,l]) => (
          <button key={f} className={`${styles.filterBtn} ${filter===f?styles.filterActive:''}`} onClick={()=>setFilter(f)}>{l}</button>
        ))}
        <input className={styles.searchBox} placeholder="🔍 Pseudo ou email..."
          value={search} onChange={e=>setSearch(e.target.value)} />
      </div>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>👥 Membres ({filtered.length})</span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className={styles.table}>
            <thead><tr><th>Membre</th><th>Email</th><th>Ville</th><th>Rôle</th><th>Inscrit</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className={styles.tr}>
                  <td><strong style={{ color:'#e2e8f0' }}>{u.pseudo}</strong>
                    {u.firstName && <div style={{ fontSize:'.75rem', color:'rgba(180,190,220,.45)' }}>{u.firstName} {u.lastName||''}</div>}
                  </td>
                  <td style={{ fontSize:'.82rem', color:'#cbd5e1' }}>{u.email}</td>
                  <td style={{ fontSize:'.82rem', color:'rgba(180,190,220,.6)' }}>{u.city||'—'}</td>
                  <td><Badge variant={u.role==='superadmin'?'red':u.role==='admin'?'amber':'gray'} style={{ fontSize:'.65rem' }}>{u.role}</Badge></td>
                  <td style={{ fontSize:'.78rem', color:'rgba(180,190,220,.5)' }}>{new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td><Badge variant={u.isBanned?'red':u.isVerified?'green':'amber'} style={{ fontSize:'.65rem' }}>{u.isBanned?'🔒 Banni':u.isVerified?'✅ Actif':'⏳'}</Badge></td>
                  <td><Button variant="ghost" size="sm" onClick={()=>setSelected(u)}>👁️</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <EmptyState icon="👥" title="Aucun membre" />}
        </div>
      </div>
      {selected && <UserModal user={selected} onClose={()=>setSelected(null)} onSave={save} />}
    </div>
  )
}

function UserModal({ user:u, onClose, onSave }) {
  const [role, setRole] = useState(u.role)
  const [ver,  setVer]  = useState(u.isVerified)
  const [nl,   setNl]   = useState(u.newsletterSubscribed)
  return (
    <Modal isOpen title={`👤 ${u.pseudo}`} onClose={onClose} wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          <Button variant={u.isBanned?'primary':'danger'} onClick={()=>onSave(u.id,{isBanned:!u.isBanned})}>
            {u.isBanned?'🔓 Débannir':'🔒 Bannir'}
          </Button>
          <Button variant="primary" onClick={()=>onSave(u.id,{role,isVerified:ver,newsletterSubscribed:nl})}>
            💾 Sauvegarder
          </Button>
        </>
      }>
      <div className={styles.detailGrid} style={{ marginBottom:'1.2rem' }}>
        {[['Pseudo',u.pseudo],['Email',u.email],['Prénom/Nom',`${u.firstName||'—'} ${u.lastName||''}`],
          ['Téléphone',u.phone||'—'],['WhatsApp',u.whatsapp||'—'],
          ['Ville',u.city||'—'],['Quartier',u.quartier||'—'],['Connexions',`${u.loginCount||0}x`]]
          .map(([l,v]) => (
            <div key={l} className={styles.detailItem}>
              <div className={styles.detailLbl}>{l}</div>
              <strong style={{ fontSize:'.88rem', color:'#e2e8f0' }}>{v}</strong>
            </div>
          ))}
      </div>
      <div style={{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)', borderRadius:12, padding:'1.2rem' }}>
        <div className={styles.formGrid2}>
          <ASelect label="Rôle" value={role} onChange={setRole}
            options={[{v:'user',l:'👤 Membre'},{v:'admin',l:'⚙️ Admin'},{v:'superadmin',l:'👑 Super Admin'}]} />
          <ASelect label="Vérification" value={String(ver)} onChange={v=>setVer(v==='true')}
            options={[{v:'true',l:'✅ Vérifié'},{v:'false',l:'⏳ Non vérifié'}]} />
        </div>
        <ASelect label="Newsletter" value={String(nl)} onChange={v=>setNl(v==='true')}
          options={[{v:'true',l:'✅ Abonné'},{v:'false',l:'❌ Désabonné'}]} />
      </div>
    </Modal>
  )
}

// ══ FORM HELPERS ══════════════════════════════════════
function AInput({ label, type='text', value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      <label style={{ display:'block', fontSize:'.7rem', fontWeight:700, letterSpacing:1, color:'rgba(180,190,220,.5)', marginBottom:5, textTransform:'uppercase' }}>{label}</label>
      <input type={type} value={value??''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:'100%', padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'#e2e8f0', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none', transition:'border-color .2s' }}
        onFocus={e=>e.target.style.borderColor='rgba(124,58,237,.6)'}
        onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'} />
    </div>
  )
}
function ASelect({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      <label style={{ display:'block', fontSize:'.7rem', fontWeight:700, letterSpacing:1, color:'rgba(180,190,220,.5)', marginBottom:5, textTransform:'uppercase' }}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:'100%', padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'#e2e8f0', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none' }}>
        {options.map(o=><option key={o.v} value={o.v} style={{ background:'#11142a' }}>{o.l}</option>)}
      </select>
    </div>
  )
}
function ATextarea({ label, value, onChange, rows=3 }) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      <label style={{ display:'block', fontSize:'.7rem', fontWeight:700, letterSpacing:1, color:'rgba(180,190,220,.5)', marginBottom:5, textTransform:'uppercase' }}>{label}</label>
      <textarea value={value??''} onChange={e=>onChange(e.target.value)} rows={rows}
        style={{ width:'100%', padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'#e2e8f0', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none', resize:'vertical', lineHeight:1.6 }}
        onFocus={e=>e.target.style.borderColor='rgba(124,58,237,.6)'}
        onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'} />
    </div>
  )
}