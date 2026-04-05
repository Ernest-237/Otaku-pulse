import { useState, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ChevronRight,
  Heart,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  Star,
  Store,
  Truck,
} from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useLang } from '../../contexts/LangContext'
import { useToast } from '../../contexts/ToastContext'
import { useApi } from '../../hooks/useApi'
import { productsApi, API_BASE } from '../../api'
import Navbar from '../../components/Navbar'
import { PageLoader, EmptyState } from '../../components/ui/Spinner'
import styles from './Boutique.module.css'

const CATS = [
  { key: 'all', fr: 'Tous', en: 'All' },
  { key: 'posters', fr: 'Posters', en: 'Posters' },
  { key: 'stickers', fr: 'Stickers', en: 'Stickers' },
  { key: 'accessoires', fr: 'Accessoires', en: 'Accessories' },
  { key: 'kits', fr: 'Kits Déco', en: 'Deco Kits' },
  { key: 'manga', fr: 'Manga', en: 'Manga' },
  { key: 'livre', fr: 'Livres', en: 'Books' },
  { key: 'dessin', fr: 'Art & Dessin', en: 'Art & Drawing' },
  { key: 'nutrition', fr: 'Nutrition', en: 'Nutrition' },
  { key: 'echange', fr: 'Échange', en: 'Exchange' },
  { key: 'jeux', fr: 'Jeux Vidéo', en: 'Video Games' },
]

const I18N = {
  fr: {
    home: 'Accueil',
    shop: 'Boutique',
    titleLead: 'BOUTIQUE',
    titleTail: 'OTAKU',
    subtitle: 'Goodies anime, posters, accessoires et exclusivités livrés partout au Cameroun.',
    search: 'Rechercher un produit...',
    results: 'article(s)',
    myCart: 'Mon panier',
    loadError: 'Impossible de charger les produits',
    retry: 'Réessayer',
    empty: 'Aucun produit dans cette catégorie',
    added: 'ajouté au panier !',
    wishAdd: 'Ajouté aux favoris',
    wishRemove: 'Retiré des favoris',
    addToCart: 'Ajouter au panier',
    outOfStock: 'Rupture de stock',
    soldOut: 'Épuisé',
    inStock: 'En stock',
    left: 'restants',
    featured: 'À la une',
    supplier: 'Fournisseur',
    delivery: 'Livraison Cameroun',
  },
  en: {
    home: 'Home',
    shop: 'Shop',
    titleLead: 'SHOP',
    titleTail: 'OTAKU',
    subtitle: 'Anime goods, posters, accessories and exclusives delivered across Cameroon.',
    search: 'Search a product...',
    results: 'item(s)',
    myCart: 'My cart',
    loadError: 'Could not load products',
    retry: 'Try again',
    empty: 'No products in this category',
    added: 'added to cart!',
    wishAdd: 'Added to wishlist',
    wishRemove: 'Removed from wishlist',
    addToCart: 'Add to cart',
    outOfStock: 'Out of stock',
    soldOut: 'Sold out',
    inStock: 'In stock',
    left: 'left',
    featured: 'Featured',
    supplier: 'Supplier',
    delivery: 'Delivery in Cameroon',
  },
}

export default function BoutiquePage() {
  const location = useLocation()
  const { lang } = useLang()
  const { addItem, count } = useCart()
  const toast = useToast()
  const T = I18N[lang]

  const [cat, setCat] = useState('all')
  const [search, setSearch] = useState(() => new URLSearchParams(location.search).get('q') || '')
  const [wished, setWished] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('op_wishlist') || '[]')
    } catch {
      return []
    }
  })

  const fetchProducts = useCallback(() => productsApi.getAll({ limit: 100 }), [])
  const { data, loading, error, refresh } = useApi(fetchProducts, [], true)

  const products = (data?.products || []).filter((p) => {
    const matchCat = cat === 'all' || p.category === cat
    const matchSearch =
      !search ||
      `${p.nameF} ${p.nameE || ''} ${p.descF || ''} ${p.descE || ''}`.toLowerCase().includes(search.toLowerCase())

    return matchCat && matchSearch && p.isActive !== false
  })

  const toggleWish = (id) => {
    const next = wished.includes(id) ? wished.filter((x) => x !== id) : [...wished, id]
    const wasWished = wished.includes(id)

    setWished(next)
    localStorage.setItem('op_wishlist', JSON.stringify(next))
    toast.info(wasWished ? T.wishRemove : T.wishAdd)
  }

  const addCart = (product) => {
    addItem(product)
    toast.success(`${lang === 'fr' ? product.nameF : product.nameE || product.nameF} ${T.added}`)
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <header className={styles.header}>
        <div className="container">
          <div className={styles.breadcrumb}>
            <Link to="/">{T.home}</Link>
            <ChevronRight size={14} />
            <span>{T.shop}</span>
          </div>

          <div className={styles.headerTop}>
            <div>
              <div className={styles.headerBadge}>
                <Store size={14} />
                <span>{T.delivery}</span>
              </div>
              <h1 className={styles.pageTitle}>
                <span className={styles.accent}>{T.titleLead}</span> {T.titleTail}
              </h1>
              <p className={styles.pageSubtitle}>{T.subtitle}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        <div className={styles.filters}>
          <div className={styles.cats}>
            {CATS.map((c) => (
              <button
                key={c.key}
                className={`${styles.catBtn} ${cat === c.key ? styles.catActive : ''}`}
                onClick={() => setCat(c.key)}
                type="button"
              >
                {lang === 'fr' ? c.fr : c.en}
              </button>
            ))}
          </div>

          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.search}
              placeholder={T.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.resultsBar}>
          <span className={styles.count}>
            {products.length} {T.results}
          </span>

          {count > 0 && (
            <Link to="/profil" className={styles.cartLink}>
              <ShoppingCart size={16} />
              <span>
                {T.myCart} ({count})
              </span>
            </Link>
          )}
        </div>

        {loading && <PageLoader />}

        {error && (
          <div className={styles.errorBox}>
            <p>{T.loadError}</p>
            <button onClick={refresh} className={styles.retryBtn} type="button">
              <RefreshCw size={16} />
              <span>{T.retry}</span>
            </button>
          </div>
        )}

        {!loading && !error &&
          (products.length === 0 ? (
            <EmptyState icon="📦" title={T.empty} />
          ) : (
            <div className={styles.grid}>
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  lang={lang}
                  t={T}
                  inWish={wished.includes(p.id)}
                  onAddCart={() => addCart(p)}
                  onToggleWish={() => toggleWish(p.id)}
                />
              ))}
            </div>
          ))}
      </main>
    </div>
  )
}

function ProductCard({ product: p, lang, t, inWish, onAddCart, onToggleWish }) {
  const hasPromo = p.oldPrice && p.oldPrice > p.price
  const discount = hasPromo ? Math.round((1 - p.price / p.oldPrice) * 100) : 0

  const imgSrc = p.imageUrl ? (p.imageUrl.startsWith('/') ? `${API_BASE}${p.imageUrl}` : p.imageUrl) : null

  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.cardBadges}>
          {p.badge && <span className={styles.badge}>{p.badge}</span>}
          {hasPromo && <span className={styles.discountBadge}>-{discount}%</span>}
          {p.isFeatured && (
            <span className={styles.featBadge}>
              <Star size={12} />
              <span>{t.featured}</span>
            </span>
          )}
        </div>

        <button
          className={`${styles.wishBtn} ${inWish ? styles.wished : ''}`}
          onClick={onToggleWish}
          type="button"
          aria-label={inWish ? t.wishRemove : t.wishAdd}
        >
          <Heart size={16} fill={inWish ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className={styles.cardImg}>
        {imgSrc ? (
          <img src={imgSrc} alt={p.nameF} loading="lazy" className={styles.productImg} />
        ) : (
          <div className={styles.fallbackIcon}>
            <Package size={34} />
          </div>
        )}
      </div>

      {p.supplier && (
        <div className={styles.supplierTag}>
          <Truck size={14} />
          <span>
            {t.supplier}: {p.supplier.name}
          </span>
        </div>
      )}

      <div className={styles.catTag}>{p.category}</div>

      <div className={styles.cardBody}>
        <div className={styles.cardName}>{lang === 'fr' ? p.nameF : p.nameE || p.nameF}</div>

        {p.descF && <div className={styles.cardDesc}>{lang === 'fr' ? p.descF : p.descE || p.descF}</div>}

        <div className={styles.cardFooter}>
          <div className={styles.prices}>
            <span className={styles.price}>
              {p.price?.toLocaleString()} <small>FCFA</small>
            </span>
            {hasPromo && <span className={styles.oldPrice}>{p.oldPrice?.toLocaleString()}</span>}
          </div>

          <span className={`${styles.stock} ${p.stock <= 3 ? styles.lowStock : ''}`}>
            {p.stock <= 0
              ? t.soldOut
              : p.stock <= 3
                ? `${p.stock} ${t.left}`
                : t.inStock}
          </span>
        </div>

        <button className={styles.addBtn} onClick={onAddCart} disabled={!p.stock || p.stock <= 0} type="button">
          <ShoppingCart size={16} />
          <span>{!p.stock || p.stock <= 0 ? t.outOfStock : t.addToCart}</span>
        </button>
      </div>
    </article>
  )
}

