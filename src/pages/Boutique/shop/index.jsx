// src/pages/Boutique/shop/index.jsx — vitrine publique d'une boutique partenaire
//
// Route : /boutique/<slug>. C'est le lien que le partenaire partage sur
// WhatsApp, Instagram ou en bio. Il doit donc s'ouvrir sans compte, sans
// redirection et sans écran de chargement interminable sur une 3G.
//
// La page est volontairement autonome : elle ne dépend d'aucun état global
// autre que le panier, pour qu'un visiteur non connecté puisse commander.
import { useState, useMemo, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Share2, Search, Package, Plus, Check, Copy,
  MapPin, Store, BadgeCheck, Eye, Loader2, MessageCircle,
} from 'lucide-react'
import { useApi } from '../../../hooks/useApi'
import { suppliersApi, shopUrl, API_BASE } from '../../../api'
import { useCart } from '../../../contexts/CartContext'
import { useToast } from '../../../contexts/ToastContext'
import styles from './Shop.module.css'

const fmt = (n) => Number(n || 0).toLocaleString('fr-FR')

// Les images stockées en base sont servies par l'API sous un chemin relatif ;
// une URL externe (Cloudinary) est utilisée telle quelle.
const resolveImg = (url) =>
  !url ? null : url.startsWith('/') ? `${API_BASE}${url}` : url

export default function PartnerShop() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { addItem } = useCart()

  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('all')
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data, loading, error } = useApi(() => suppliersApi.getShop(slug), [slug])

  const shop     = data?.shop || null
  const products = data?.products || []
  const cats     = data?.categories || []

  useEffect(() => {
    // Le titre de l'onglet devient le nom de la boutique : c'est ce qui
    // s'affiche quand quelqu'un garde le lien en favori.
    if (shop?.name) document.title = `${shop.name} — Otaku Pulse`
    return () => { document.title = 'Otaku Pulse' }
  }, [shop?.name])

  // Fermer le menu de partage sur un clic extérieur.
  useEffect(() => {
    if (!shareOpen) return
    const close = () => setShareOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [shareOpen])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter(p => {
      if (cat !== 'all' && p.category !== cat) return false
      if (!q) return true
      return `${p.nameF || ''} ${p.nameE || ''} ${p.descF || ''}`.toLowerCase().includes(q)
    })
  }, [products, search, cat])

  const link = shop ? shopUrl(shop.slug) : ''

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success('Lien copié !')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard indisponible (http non sécurisé, navigateur ancien) :
      // on affiche le lien pour que l'utilisateur le copie à la main.
      toast.error(`Copie impossible. Le lien : ${link}`)
    }
  }

  const share = async () => {
    const payload = {
      title: shop.name,
      text: shop.tagline || `Découvre ${shop.name} sur Otaku Pulse`,
      url: link,
    }
    // L'API de partage native n'existe que sur mobile et en HTTPS. Ailleurs,
    // on ouvre le menu de repli plutôt que de ne rien faire.
    if (navigator.share) {
      try { await navigator.share(payload); return } catch { /* partage annulé */ }
    }
    setShareOpen(o => !o)
  }

  const addToCart = (p) => {
    addItem(p)
    toast.success(`${p.nameF} ajouté au panier`)
  }

  // ── États ──
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.state}>
          <Loader2 size={30} className={styles.spin} />
          <span>Chargement de la boutique…</span>
        </div>
      </div>
    )
  }

  if (error || !shop) {
    return (
      <div className={styles.page}>
        <div className={styles.state}>
          <Store size={44} opacity={.35} />
          <div className={styles.stateTitle}>Boutique introuvable</div>
          <p style={{ margin: 0, maxWidth: '40ch' }}>
            Ce lien n'existe pas, ou la boutique n'est plus active.
          </p>
          <Link to="/boutique" className={styles.backLink}>
            <ArrowLeft size={16} /> Voir toute la boutique
          </Link>
        </div>
      </div>
    )
  }

  const bannerSrc = resolveImg(shop.bannerUrl)
  const logoSrc   = resolveImg(shop.logoUrl)

  return (
    // La couleur du partenaire est injectée en variable CSS : toute la feuille
    // de style s'y adapte sans qu'on duplique la moindre règle.
    <div className={styles.page} style={{ '--accent': shop.accent || '#16a34a' }}>

      <header className={styles.hero}>
        {bannerSrc && (
          <>
            <div className={styles.heroImage} style={{ backgroundImage: `url(${bannerSrc})` }} />
            <div className={styles.heroVeil} />
          </>
        )}

        <div className={`container ${styles.heroInner}`}>
          <div className={styles.topBar}>
            <button className={styles.roundBtn} onClick={() => navigate('/boutique')}
              aria-label="Retour à la boutique générale">
              <ArrowLeft size={19} />
            </button>

            <div className={styles.shareWrap} onClick={e => e.stopPropagation()}>
              <button className={styles.roundBtn} onClick={share} aria-label="Partager la boutique">
                <Share2 size={18} />
              </button>

              {shareOpen && (
                <div className={styles.shareMenu}>
                  <button className={styles.shareItem} onClick={copyLink}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Lien copié' : 'Copier le lien'}
                  </button>
                  <a
                    className={styles.shareItem}
                    href={`https://wa.me/?text=${encodeURIComponent(`${shop.name} — ${link}`)}`}
                    target="_blank" rel="noopener noreferrer"
                  >
                    <MessageCircle size={16} /> Partager sur WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className={styles.identity}>
            {logoSrc ? (
              <img className={styles.logo} src={logoSrc} alt={shop.name} />
            ) : (
              <div className={`${styles.logo} ${styles.logoFallback}`}>
                {shop.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={styles.idText}>
              <h1 className={styles.shopName}>
                {shop.name}
                <span className={styles.verified}><BadgeCheck size={12} /> Vérifiée</span>
              </h1>
              {shop.tagline && <p className={styles.tagline}>{shop.tagline}</p>}
            </div>
          </div>

          {shop.description && !shop.tagline && (
            <p className={styles.tagline}>{shop.description}</p>
          )}

          <div className={styles.metaRow}>
            {shop.city && <span className={styles.metaChip}><MapPin size={13} /> {shop.city}</span>}
            <span className={styles.metaChip}>
              <Package size={13} /> {products.length} produit{products.length > 1 ? 's' : ''}
            </span>
            {shop.viewCount > 0 && (
              <span className={styles.metaChip}><Eye size={13} /> {fmt(shop.viewCount)} vues</span>
            )}
          </div>
        </div>
      </header>

      <div className={`container ${styles.controls}`}>
        <div className={styles.searchRow}>
          <Search size={18} color="#64748b" />
          <input
            className={styles.searchInput}
            placeholder={`Rechercher dans ${shop.name}…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="container">
        {cats.length > 1 && (
          <div className={styles.chips}>
            <button
              className={`${styles.chip} ${cat === 'all' ? styles.chipActive : ''}`}
              onClick={() => setCat('all')}
            >
              Tout
            </button>
            {cats.map(c => (
              <button key={c}
                className={`${styles.chip} ${cat === c ? styles.chipActive : ''}`}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className={styles.grid}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              {products.length === 0
                ? "Cette boutique n'a pas encore publié de produit."
                : 'Aucun produit ne correspond à ta recherche.'}
            </div>
          ) : filtered.map(p => (
            <ProductCard key={p.id} product={p} onAdd={() => addToCart(p)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product: p, onAdd }) {
  const hasPromo = p.oldPrice && p.oldPrice > p.price
  const discount = hasPromo ? Math.round((1 - p.price / p.oldPrice) * 100) : 0
  const img = resolveImg(p.imageUrl)
  const outOfStock = !p.stock || p.stock <= 0

  return (
    <article className={styles.card}>
      <div className={styles.cardMedia}>
        {img
          ? <img className={styles.cardImg} src={img} alt={p.nameF} loading="lazy" />
          : <Package size={30} className={styles.cardFallback} />}
        {hasPromo && <span className={styles.discount}>−{discount}%</span>}
        {outOfStock && <div className={styles.soldOut}>Épuisé</div>}
      </div>

      <div className={styles.cardName}>{p.nameF}</div>

      <div className={styles.cardFoot}>
        <div className={styles.priceCol}>
          <div className={styles.price}>{fmt(p.price)} <small>FCFA</small></div>
          {hasPromo && <span className={styles.oldPrice}>{fmt(p.oldPrice)} FCFA</span>}
        </div>
        <button
          className={styles.addBtn}
          onClick={onAdd}
          disabled={outOfStock}
          aria-label={`Ajouter ${p.nameF} au panier`}
          type="button"
        >
          <Plus size={17} />
        </button>
      </div>
    </article>
  )
}
