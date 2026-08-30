// src/pages/Boutique/partner/index.jsx — Espace Partenaire (boutique en libre-service)
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Store, Eye, Trash2, Edit3, Upload, Loader2, X, Image as ImageIcon,
  ChevronLeft, LayoutDashboard, Package, Settings, Sparkles, TrendingUp, Coins,
  Copy, Check, Share2, Link as LinkIcon, Palette,
} from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi, useMutation } from '../../../hooks/useApi'
import { suppliersApi, productsApi, API_BASE, shopUrl } from '../../../api'
import { useToast } from '../../../contexts/ToastContext'
import Navbar from '../../../components/Navbar'
import Footer from '../../Home/sections/Footer'
import Modal from '../../../components/ui/Modal'
import ShopPolicyModal from '../../../components/ShopPolicyModal'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
// Réutilise le même habillage visuel que l'espace créateur manga (même pattern de dashboard partenaire).
import styles from '../../Manga/publisher/Publisher.module.css'

const ALL_CATS = ['posters','stickers','accessoires','kits','manga','livre','dessin','echange','jeux']

async function readFileToBase64Safe(file) {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof Blob)) return reject(new Error('Fichier invalide'))
    const reader = new FileReader()
    reader.onload = () => {
      const r = reader.result
      const comma = r.indexOf(',')
      if (comma === -1) return reject(new Error('Format non reconnu'))
      resolve({ data: r.substring(comma + 1), mime: file.type || 'image/jpeg' })
    }
    reader.onerror = () => reject(new Error('Erreur lecture'))
    reader.readAsDataURL(file)
  })
}

const slugify = (str) => (str || '').toLowerCase().trim()
  .replace(/[àáâãäå]/g,'a').replace(/[èéêë]/g,'e').replace(/[ìíîï]/g,'i')
  .replace(/[òóôõö]/g,'o').replace(/[ùúûü]/g,'u').replace(/[^a-z0-9]+/g,'-')
  .replace(/^-+|-+$/g,'').substring(0,80)

export default function PartnerShopPage() {
  const { lang } = useLang()
  const { user, isLoggedIn } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState('overview')
  const [productModal, setProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  useEffect(() => { document.title = '🏪 Espace Partenaire — Otaku Pulse' }, [])

  const { data: myData, loading, refresh } = useApi(
    () => isLoggedIn ? suppliersApi.getMy() : Promise.resolve({ supplier: null }),
    [isLoggedIn], isLoggedIn
  )
  const shop = myData?.supplier || null
  const isApproved = shop?.status === 'approved'

  const { data: prodData, refresh: refreshProducts } = useApi(
    () => isApproved ? productsApi.getMine() : Promise.resolve({ products: [] }),
    [isApproved], isApproved
  )
  const products = prodData?.products || []

  const { data: statsData } = useApi(
    () => isApproved && shop?.id ? suppliersApi.getStats(shop.id) : Promise.resolve(null),
    [isApproved, shop?.id], isApproved
  )

  // ── Pas connecté ──
  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className="container">
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔐</div>
            <h2>Connecte-toi pour accéder à l'espace partenaire</h2>
            <Link to="/" className={styles.btnPrimary} onClick={() => sessionStorage.setItem('openLogin', '1')}>
              Se connecter
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className="container"><PageLoader /></div>
        <Footer />
      </div>
    )
  }

  // ── Pas encore de boutique, ou en attente/rejetée ──
  if (!shop || !isApproved) {
    return (
      <div className={styles.page}>
        <Navbar />
        <PartnerApplicationFlow shop={shop} toast={toast} onApplied={refresh} />
        <Footer />
      </div>
    )
  }

  // ── Dashboard boutique approuvée ──
  return (
    <div className={styles.page}>
      <Navbar />

      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className="container">
          <Link to="/boutique" className={styles.backLink}>
            <ChevronLeft size={14} /> Retour à la boutique
          </Link>
          <div className={styles.heroInner}>
            <div>
              <span className={styles.heroBadge}><Store size={11} /> PARTENAIRE</span>
              <h1 className={styles.heroTitle}>{shop.name}</h1>
              <p className={styles.heroSub}>{user?.pseudo} · {products.length} produit{products.length>1?'s':''}</p>
            </div>
            <button className={styles.heroCta} onClick={() => { setEditingProduct(null); setProductModal(true) }}>
              <Plus size={16} /> Nouveau produit
            </button>
          </div>
        </div>
      </section>

      <div className={styles.tabsBar}>
        <div className="container">
          <div className={styles.tabsInner}>
            <button className={`${styles.tabBtn} ${tab==='overview'?styles.tabActive:''}`} onClick={() => setTab('overview')}>
              <LayoutDashboard size={16} /> Vue d'ensemble
            </button>
            <button className={`${styles.tabBtn} ${tab==='products'?styles.tabActive:''}`} onClick={() => setTab('products')}>
              <Package size={16} /> Mes produits <span className={styles.tabCount}>{products.length}</span>
            </button>
            <button className={`${styles.tabBtn} ${tab==='settings'?styles.tabActive:''}`} onClick={() => setTab('settings')}>
              <Settings size={16} /> Paramètres boutique
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {tab === 'overview' && <OverviewTab shop={shop} stats={statsData} products={products} />}
        {tab === 'products' && (
          <ProductsTab products={products} onEdit={p => { setEditingProduct(p); setProductModal(true) }}
            onNew={() => { setEditingProduct(null); setProductModal(true) }}
            onDelete={async (id) => {
              if (!confirm('Retirer ce produit de la boutique ?')) return
              try { await productsApi.deleteMine(id); toast.success('🗑️ Produit retiré'); refreshProducts() }
              catch (err) { toast.error(err.message) }
            }} />
        )}
        {tab === 'settings' && <ShopSettingsTab shop={shop} toast={toast} onSaved={refresh} />}
      </div>

      {productModal && (
        <ProductModal product={editingProduct} toast={toast}
          onClose={() => { setProductModal(false); setEditingProduct(null) }}
          onSuccess={() => { setProductModal(false); setEditingProduct(null); refreshProducts() }} />
      )}

      <Footer />
    </div>
  )
}

/* ══ CANDIDATURE ══ */
function PartnerApplicationFlow({ shop, toast, onApplied }) {
  const [form, setForm] = useState({ name:'', email:'', phone:'', whatsapp:'', city:'Yaoundé', description:'', logoFile:null })
  const [acceptedPolicy, setAcceptedPolicy] = useState(false)
  const [policyOpen, setPolicyOpen] = useState(false)
  const { mutate, loading } = useMutation((data) => suppliersApi.apply(data))
  const s = (k,v) => setForm(f => ({ ...f, [k]:v }))

  if (shop?.status === 'pending') {
    return (
      <div className="container">
        <div className={styles.appCard}>
          <div className={styles.appIcon}>⏳</div>
          <h2 className={styles.appTitle}>Candidature en cours d'examen</h2>
          <p className={styles.appSub}>Notre équipe valide les nouvelles boutiques partenaires sous peu.</p>
          <Link to="/boutique" className={styles.btnGhost}><ChevronLeft size={14} /> Retour à la boutique</Link>
        </div>
      </div>
    )
  }

  const submit = async () => {
    if (!form.name.trim()) return toast.error('Nom de la marque requis')
    if (!form.phone.trim()) return toast.error('Téléphone requis')
    if (!acceptedPolicy) return toast.error('Merci d\'accepter la politique boutique & commissions')
    try {
      let logoData = null, logoMime = null
      if (form.logoFile) {
        const r = await readFileToBase64Safe(form.logoFile)
        logoData = r.data; logoMime = r.mime
      }
      const { error } = await mutate({ ...form, logoData, logoMime })
      if (error) toast.error(error)
      else { toast.success('🎉 Candidature envoyée !'); onApplied() }
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="container">
      <div className={styles.appCard}>
        <div className={styles.appIcon}>🏪</div>
        <h2 className={styles.appTitle}>Ouvrir ma boutique partenaire</h2>
        <p className={styles.appSub}>
          Vends tes produits directement dans l'espace Goodies d'Otaku Pulse : gère ton catalogue, tes prix,
          ton logo et tes promotions depuis ton propre espace.
        </p>

        {shop?.status === 'rejected' && shop.rejectedReason && (
          <div className={styles.appReject}>
            <strong>Motif du refus précédent :</strong>
            <p>{shop.rejectedReason}</p>
          </div>
        )}

        <div className={styles.appField}>
          <label>Nom de la marque *</label>
          <input value={form.name} onChange={e => s('name', e.target.value)} className={styles.appInput} placeholder="Ex: Sakura Goodies" />
        </div>
        <div className={styles.appField}>
          <label>Email</label>
          <input value={form.email} onChange={e => s('email', e.target.value)} className={styles.appInput} type="email" />
        </div>
        <div className={styles.appField}>
          <label>Téléphone / WhatsApp *</label>
          <input value={form.phone} onChange={e => s('phone', e.target.value)} className={styles.appInput} placeholder="+237 6XX XXX XXX" />
        </div>
        <div className={styles.appField}>
          <label>Ville</label>
          <input value={form.city} onChange={e => s('city', e.target.value)} className={styles.appInput} />
        </div>
        <div className={styles.appField}>
          <label>Description de ta boutique</label>
          <textarea rows={4} value={form.description} onChange={e => s('description', e.target.value)} className={styles.appTextarea}
            placeholder="Que vends-tu ? Quel est ton univers ?" />
        </div>
        <div className={styles.appField}>
          <label>Logo (optionnel, ajoutable plus tard)</label>
          <input type="file" accept="image/*" onChange={e => s('logoFile', e.target.files?.[0] || null)} />
        </div>

        <label style={{ display:'flex', alignItems:'flex-start', gap:8, cursor:'pointer', fontSize:'.82rem', textAlign:'left', margin:'.6rem 0 1rem' }}>
          <input type="checkbox" checked={acceptedPolicy} onChange={e => setAcceptedPolicy(e.target.checked)} style={{ marginTop:3, flexShrink:0 }} />
          <span>
            J'ai lu et j'accepte la{' '}
            <button type="button" onClick={() => setPolicyOpen(true)} style={{ color:'var(--green,#16a34a)', fontWeight:700, textDecoration:'underline', background:'none', border:'none', cursor:'pointer', padding:0, font:'inherit' }}>
              politique boutique & commissions
            </button>.
          </span>
        </label>

        <button onClick={submit} className={styles.btnPrimary} disabled={loading}>
          {loading ? <Loader2 size={14} className={styles.spinIcon} /> : <Sparkles size={14} />}
          Envoyer ma candidature
        </button>

        <Link to="/boutique" className={styles.btnGhostInline}><ChevronLeft size={13} /> Retour à la boutique</Link>
      </div>

      <ShopPolicyModal isOpen={policyOpen} onClose={() => setPolicyOpen(false)} />
    </div>
  )
}

/* ══ VUE D'ENSEMBLE ══ */
/* ══ LIEN PARTAGEABLE ══
   La carte la plus importante du tableau de bord : c'est par ce lien que le
   partenaire fait venir ses clients. Elle est donc placée tout en haut de la
   vue d'ensemble, avant même les statistiques. */
function ShopLinkCard({ shop }) {
  const [copied, setCopied] = useState(false)
  const link = shopUrl(shop.slug)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // Presse-papiers indisponible (HTTP non sécurisé, navigateur ancien) :
      // on sélectionne le texte pour que l'utilisateur copie à la main.
      window.prompt('Copie ton lien :', link)
    }
  }

  const share = async () => {
    const payload = { title: shop.name, text: `Découvre ${shop.name} sur Otaku Pulse`, url: link }
    if (navigator.share) { try { await navigator.share(payload); return } catch { /* annulé */ } }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shop.name} — ${link}`)}`, '_blank', 'noopener')
  }

  // Une boutique validée avant l'ajout des slugs peut ne pas encore en avoir :
  // le rattrapage tourne au démarrage du serveur, pas dans le navigateur.
  if (!shop.slug) {
    return (
      <div className={styles.appCard} style={{ marginBottom: '1.2rem' }}>
        <p style={{ margin: 0, fontSize: '.88rem' }}>
          Ton lien de boutique sera généré au prochain redémarrage du serveur.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.appCard} style={{ marginBottom: '1.4rem', maxWidth: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <LinkIcon size={16} />
        <strong style={{ fontSize: '.95rem' }}>Le lien de ta boutique</strong>
      </div>
      <p style={{ fontSize: '.82rem', opacity: .75, margin: '0 0 12px', lineHeight: 1.55 }}>
        Partage-le sur WhatsApp, Instagram ou en bio. Il s'ouvre pour tout le monde,
        même sans compte Otaku Pulse.
      </p>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        background: 'rgba(0,0,0,.04)', borderRadius: 12, padding: '10px 12px', marginBottom: 12,
      }}>
        <code style={{
          flex: 1, minWidth: 180, fontSize: '.82rem', fontWeight: 700,
          // Un slug long ne doit pas élargir la carte sur mobile.
          overflowWrap: 'anywhere',
        }}>{link}</code>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={copy} className={styles.btnPrimary} type="button">
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copié !' : 'Copier'}
        </button>
        <button onClick={share} className={styles.btnGhostInline} type="button">
          <Share2 size={14} /> Partager
        </button>
        <Link to={`/boutique/${shop.slug}`} className={styles.btnGhostInline}>
          <Eye size={14} /> Voir ma vitrine
        </Link>
      </div>
    </div>
  )
}

function OverviewTab({ shop, stats, products }) {
  const cards = [
    { ico:<Package size={20}/>, val: products.length, lbl:'Produits actifs', color:'#22c55e' },
    { ico:<Eye size={20}/>, val: stats?.unitsSold ?? 0, lbl:'Unités vendues', color:'#3b82f6' },
    { ico:<TrendingUp size={20}/>, val: stats ? `${(stats.totalSales||0).toLocaleString('fr-FR')} F` : '—', lbl:'Ventes totales', color:'#f59e0b' },
    { ico:<Coins size={20}/>, val: `${Math.round((shop.commission||0)*100)}%`, lbl:'Commission Otaku Pulse', color:'#a78bfa' },
  ]
  return (
    <div className={styles.tabContent}>
      <ShopLinkCard shop={shop} />
      <div className={styles.statsGrid}>
        {cards.map((c,i) => (
          <div key={i} className={styles.statCard} style={{ '--stat-color': c.color }}>
            <div className={styles.statIcon}>{c.ico}</div>
            <div className={styles.statValue}>{c.val}</div>
            <div className={styles.statLabel}>{c.lbl}</div>
          </div>
        ))}
      </div>
      {shop.viewCount > 0 && (
        <p style={{ fontSize: '.8rem', opacity: .7, marginTop: '1rem' }}>
          👁️ Ta vitrine a été consultée {shop.viewCount.toLocaleString('fr-FR')} fois.
        </p>
      )}
    </div>
  )
}

/* ══ MES PRODUITS ══ */
function ProductsTab({ products, onEdit, onNew, onDelete }) {
  if (!products.length) {
    return (
      <div className={styles.tabContent}>
        <div className={styles.emptyBox}>
          <EmptyState icon="📦" title="Aucun produit" message="Ajoute ton premier produit à ta boutique." />
          <button className={styles.btnPrimary} onClick={onNew}><Plus size={14} /> Nouveau produit</button>
        </div>
      </div>
    )
  }
  return (
    <div className={styles.tabContent}>
      <div className={styles.mangasGrid}>
        {products.map(p => (
          <div key={p.id} className={styles.mangaCard}>
            <div className={styles.mangaCover}>
              {p.imageUrl ? <img src={`${API_BASE}${p.imageUrl}`} alt={p.nameF} loading="lazy" />
                : <div className={styles.mangaCoverPh}><ImageIcon size={32} /></div>}
              {!p.isActive && <span className={styles.mangaStatus} style={{ background:'#6b7280' }}>MASQUÉ</span>}
            </div>
            <div className={styles.mangaBody}>
              <h3 className={styles.mangaTitle}>{p.nameF}</h3>
              <div className={styles.mangaStats}>
                <span>{p.price?.toLocaleString('fr-FR')} {p.currency||'FCFA'}</span>
                {p.oldPrice && <span style={{ textDecoration:'line-through', opacity:.6 }}>{p.oldPrice.toLocaleString('fr-FR')}</span>}
                <span>Stock: {p.stock}</span>
              </div>
              <div className={styles.mangaActions}>
                <button onClick={() => onEdit(p)} className={styles.mangaActionGhost}><Edit3 size={12} /> Éditer</button>
                <button onClick={() => onDelete(p.id)} className={styles.mangaActionGhost}><Trash2 size={12} /> Retirer</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductModal({ product, onClose, onSuccess, toast }) {
  const isEdit = !!product
  const [form, setForm] = useState({
    nameF: product?.nameF || '', nameE: product?.nameE || '',
    descF: product?.descF || '', descE: product?.descE || '',
    price: product?.price || '', oldPrice: product?.oldPrice || '',
    category: product?.category || ALL_CATS[0], stock: product?.stock ?? 0,
    badge: product?.badge || '', emoji: product?.emoji || '🎁',
    imageFile: null,
  })
  const [busy, setBusy] = useState(false)
  const s = (k,v) => setForm(f => ({ ...f, [k]:v }))

  const submit = async () => {
    if (!form.nameF.trim()) return toast.error('Nom du produit requis')
    if (!form.price) return toast.error('Prix requis')
    setBusy(true)
    try {
      const payload = {
        nameF: form.nameF.trim(), nameE: form.nameE.trim() || null,
        descF: form.descF.trim() || null, descE: form.descE.trim() || null,
        price: parseInt(form.price, 10),
        oldPrice: form.oldPrice ? parseInt(form.oldPrice, 10) : null,
        category: form.category, stock: parseInt(form.stock, 10) || 0,
        badge: form.badge.trim() || null, emoji: form.emoji,
      }
      if (!isEdit) payload.slug = `${slugify(form.nameF)}-${Date.now().toString(36)}`
      if (form.imageFile) {
        const r = await readFileToBase64Safe(form.imageFile)
        payload.imageData = r.data; payload.imageMime = r.mime
      }
      if (isEdit) await productsApi.updateMine(product.id, payload)
      else await productsApi.createMine(payload)
      toast.success(isEdit ? '✅ Produit mis à jour' : '🎉 Produit ajouté')
      onSuccess()
    } catch (err) { toast.error(err.message) }
    finally { setBusy(false) }
  }

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? '✏️ Modifier le produit' : '📦 Nouveau produit'} wide
      footer={
        <>
          <button onClick={onClose} className={styles.modalBtnGhost}>Annuler</button>
          <button onClick={submit} disabled={busy} className={styles.modalBtnPrimary}>
            {busy ? <Loader2 size={14} className={styles.spinIcon} /> : <Upload size={14} />}
            Enregistrer
          </button>
        </>
      }>
      <div className={styles.formGrid2}>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Nom FR *</label>
          <input value={form.nameF} onChange={e => s('nameF', e.target.value)} className={styles.formInput} maxLength={150} />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Nom EN</label>
          <input value={form.nameE} onChange={e => s('nameE', e.target.value)} className={styles.formInput} maxLength={150} />
        </div>
      </div>
      <div className={styles.formGrid2}>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Description FR</label>
          <textarea value={form.descF} onChange={e => s('descF', e.target.value)} rows={3} className={styles.formTextarea} />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Description EN</label>
          <textarea value={form.descE} onChange={e => s('descE', e.target.value)} rows={3} className={styles.formTextarea} />
        </div>
      </div>
      <div className={styles.formGrid2}>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Prix (FCFA) *</label>
          <input type="number" value={form.price} onChange={e => s('price', e.target.value)} className={styles.formInput} />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Prix barré (promo, optionnel)</label>
          <input type="number" value={form.oldPrice} onChange={e => s('oldPrice', e.target.value)} className={styles.formInput} />
        </div>
      </div>
      <div className={styles.formGrid2}>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Catégorie</label>
          <select value={form.category} onChange={e => s('category', e.target.value)} className={styles.formInput}>
            {ALL_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Stock</label>
          <input type="number" value={form.stock} onChange={e => s('stock', e.target.value)} className={styles.formInput} />
        </div>
      </div>
      <div className={styles.formGrid2}>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Étiquette (ex: PROMO, NOUVEAU)</label>
          <input value={form.badge} onChange={e => s('badge', e.target.value)} className={styles.formInput} maxLength={50} />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Emoji</label>
          <input value={form.emoji} onChange={e => s('emoji', e.target.value)} className={styles.formInput} maxLength={4} />
        </div>
      </div>
      <div className={styles.formField}>
        <label className={styles.formLabel}>Image du produit</label>
        <input type="file" accept="image/*" onChange={e => s('imageFile', e.target.files?.[0] || null)} />
      </div>
    </Modal>
  )
}

/* ══ PARAMÈTRES BOUTIQUE ══ */
function ShopSettingsTab({ shop, toast, onSaved }) {
  const [form, setForm] = useState({
    name: shop.name || '', description: shop.description || '',
    email: shop.email || '', phone: shop.phone || '', whatsapp: shop.whatsapp || '', city: shop.city || '',
    orangeMoneyNumber: shop.orangeMoneyNumber || '', mtnMoneyNumber: shop.mtnMoneyNumber || '',
    // ── Vitrine publique ──
    slug: shop.slug || '', tagline: shop.tagline || '', accent: shop.accent || '#16a34a',
    logoFile: null, bannerFile: null,
  })
  const [busy, setBusy] = useState(false)
  const [policyOpen, setPolicyOpen] = useState(false)
  const [slugState, setSlugState] = useState(null) // null | 'checking' | 'ok' | 'taken' | 'format'
  const s = (k,v) => setForm(f => ({ ...f, [k]:v }))

  // Vérification de disponibilité du lien, en léger différé : sans ce délai,
  // chaque frappe déclencherait une requête, ce qui est inutile et lourd sur
  // une connexion mobile.
  useEffect(() => {
    const wanted = form.slug.trim().toLowerCase()
    if (!wanted || wanted === shop.slug) { setSlugState(null); return }
    setSlugState('checking')
    const timer = setTimeout(async () => {
      try {
        const r = await suppliersApi.checkSlug(wanted)
        setSlugState(r.available ? 'ok' : (r.reason === 'format' ? 'format' : 'taken'))
      } catch { setSlugState(null) }
    }, 450)
    return () => clearTimeout(timer)
  }, [form.slug, shop.slug])

  const save = async () => {
    if (slugState === 'taken' || slugState === 'format')
      return toast.error('Corrige le lien de ta boutique avant d\'enregistrer.')

    setBusy(true)
    try {
      const payload = { ...form }
      delete payload.logoFile
      delete payload.bannerFile
      // Le slug n'est envoyé que s'il a réellement changé : cela évite de
      // déclencher inutilement la vérification d'unicité côté serveur.
      const wanted = form.slug.trim().toLowerCase()
      if (wanted === shop.slug) delete payload.slug
      else payload.slug = wanted

      if (form.logoFile) {
        const r = await readFileToBase64Safe(form.logoFile)
        payload.logoData = r.data; payload.logoMime = r.mime
      }
      if (form.bannerFile) {
        const r = await readFileToBase64Safe(form.bannerFile)
        payload.bannerData = r.data; payload.bannerMime = r.mime
      }
      await suppliersApi.updateMe(payload)
      toast.success('✅ Boutique mise à jour')
      onSaved()
    } catch (err) { toast.error(err.message) }
    finally { setBusy(false) }
  }

  const slugHint = {
    checking: { txt: 'Vérification…',                       color: 'inherit' },
    ok:       { txt: '✓ Ce lien est disponible',            color: '#16a34a' },
    taken:    { txt: '✕ Ce lien est déjà pris',             color: '#dc2626' },
    format:   { txt: '✕ 3 à 50 caractères : lettres minuscules, chiffres et tirets', color: '#dc2626' },
  }[slugState]

  return (
    <div className={styles.tabContent}>
      <div className={styles.appCard} style={{ maxWidth: 560 }}>
        {shop.logoMime && (
          <img src={`${API_BASE}/api/suppliers/${shop.id}/logo`} alt="logo"
            style={{ width:72, height:72, borderRadius:16, objectFit:'cover', margin:'0 auto 1rem' }} />
        )}
        <div className={styles.appField}>
          <label>Nom de la marque</label>
          <input value={form.name} onChange={e => s('name', e.target.value)} className={styles.appInput} />
        </div>
        {/* ── Vitrine publique ── */}
        <div className={styles.appField}>
          <label>Lien de ta boutique</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.78rem', opacity: .65, whiteSpace: 'nowrap' }}>/boutique/</span>
            <input
              value={form.slug}
              onChange={e => s('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              className={styles.appInput}
              style={{ flex: 1, minWidth: 140 }}
              placeholder="ma-boutique"
              maxLength={50}
            />
          </div>
          {slugHint && (
            <small style={{ display: 'block', marginTop: 5, color: slugHint.color, fontSize: '.76rem' }}>
              {slugHint.txt}
            </small>
          )}
          {/* Avertissement volontairement explicite : le partenaire a pu
              partager son ancien lien sur WhatsApp ou en bio Instagram, et
              rien ne redirigera automatiquement vers le nouveau. */}
          {form.slug.trim().toLowerCase() !== shop.slug && shop.slug && (
            <small style={{ display: 'block', marginTop: 5, color: '#d97706', fontSize: '.76rem' }}>
              ⚠️ Changer ce lien rendra inaccessibles tous les liens que tu as déjà partagés.
            </small>
          )}
        </div>

        <div className={styles.appField}>
          <label>Accroche (affichée sous le nom sur ta vitrine)</label>
          <input value={form.tagline} onChange={e => s('tagline', e.target.value)}
            className={styles.appInput} maxLength={120}
            placeholder="Goodies anime authentiques, livrés à Yaoundé" />
        </div>

        <div className={styles.appField}>
          <label><Palette size={13} style={{ verticalAlign: -2 }} /> Couleur de ta vitrine</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="color" value={form.accent} onChange={e => s('accent', e.target.value)}
              style={{ width: 48, height: 38, padding: 2, borderRadius: 10, cursor: 'pointer' }} />
            <code style={{ fontSize: '.8rem', opacity: .75 }}>{form.accent}</code>
          </div>
        </div>

        <div className={styles.appField}>
          <label>Image de couverture</label>
          <input type="file" accept="image/*" onChange={e => s('bannerFile', e.target.files?.[0] || null)} />
          <small style={{ display: 'block', marginTop: 4, opacity: .65, fontSize: '.75rem' }}>
            Format paysage recommandé (1200×400). Sans image, un dégradé basé sur ta couleur est utilisé.
          </small>
        </div>

        <div className={styles.appField}>
          <label>Description</label>
          <textarea rows={3} value={form.description} onChange={e => s('description', e.target.value)} className={styles.appTextarea} />
        </div>
        <div className={styles.appField}>
          <label>Email</label>
          <input value={form.email} onChange={e => s('email', e.target.value)} className={styles.appInput} />
        </div>
        <div className={styles.appField}>
          <label>Téléphone / WhatsApp</label>
          <input value={form.phone} onChange={e => s('phone', e.target.value)} className={styles.appInput} />
        </div>
        <div className={styles.appField}>
          <label>Ville</label>
          <input value={form.city} onChange={e => s('city', e.target.value)} className={styles.appInput} />
        </div>
        <div className={styles.appField}>
          <label>Numéro Orange Money</label>
          <input value={form.orangeMoneyNumber} onChange={e => s('orangeMoneyNumber', e.target.value)} className={styles.appInput} placeholder="+237 69X XXX XXX" />
        </div>
        <div className={styles.appField}>
          <label>Numéro MTN Mobile Money</label>
          <input value={form.mtnMoneyNumber} onChange={e => s('mtnMoneyNumber', e.target.value)} className={styles.appInput} placeholder="+237 67X XXX XXX" />
        </div>
        <div className={styles.appField}>
          <label>Changer le logo</label>
          <input type="file" accept="image/*" onChange={e => s('logoFile', e.target.files?.[0] || null)} />
        </div>
        <button onClick={save} className={styles.btnPrimary} disabled={busy}>
          {busy ? <Loader2 size={14} className={styles.spinIcon} /> : <Sparkles size={14} />}
          Enregistrer
        </button>

        <button type="button" onClick={() => setPolicyOpen(true)} className={styles.btnGhostInline} style={{ marginTop: '.8rem' }}>
          📜 Voir la politique boutique & commissions
        </button>
      </div>

      <ShopPolicyModal isOpen={policyOpen} onClose={() => setPolicyOpen(false)} />
    </div>
  )
}
