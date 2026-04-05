import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Ban,
  Check,
  Heart,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
} from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useCart } from '../../../contexts/CartContext'
import { useLang } from '../../../contexts/LangContext'
import { useToast } from '../../../contexts/ToastContext'
import { useApi } from '../../../hooks/useApi'
import { productsApi } from '../../../api'
import { PageLoader } from '../../../components/ui/Spinner'
import styles from './Boutique.module.css'

const CATS = [
  { key: 'all', fr: 'Tous', en: 'All' },
  { key: 'posters', fr: 'Posters', en: 'Posters' },
  { key: 'stickers', fr: 'Stickers', en: 'Stickers' },
  { key: 'accessoires', fr: 'Accessoires', en: 'Accessories' },
  { key: 'kits', fr: 'Kits Déco', en: 'Deco Kits' },
  { key: 'manga', fr: 'Manga', en: 'Manga' },
  { key: 'livre', fr: 'Livres', en: 'Books' },
  { key: 'dessin', fr: 'Dessin/Art', en: 'Art/Drawing' },
  { key: 'nutrition', fr: 'Nutrition', en: 'Nutrition' },
  { key: 'echange', fr: 'Échange', en: 'Exchange' },
  { key: 'jeux', fr: 'Jeux Vidéo', en: 'Video Games' },
]

export default function Boutique() {
  const { lang } = useLang()
  const { user } = useAuth()
  const { addItem, count } = useCart()
  const toast = useToast()
  const navigate = useNavigate()
  const [cat, setCat] = useState('all')
  const [search, setSearch] = useState('')
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('op_wishlist') || '[]')
    } catch {
      return []
    }
  })

  const fetchProducts = useCallback(() => productsApi.getAll({ limit: 100 }), [])
  const { data, loading, error, refresh } = useApi(fetchProducts, [], true)
  const products = data?.products || []

  const filtered = products.filter((p) => {
    const matchCat = cat === 'all' || p.category === cat
    const matchSearch =
      !search ||
      `${p.nameF} ${p.nameE || ''} ${p.descF || ''} ${p.descE || ''}`.toLowerCase().includes(search.toLowerCase())

    return matchCat && matchSearch && p.isActive !== false
  })

  const toggleWish = (product) => {
    const already = wishlist.includes(product.id)
    const next = already ? wishlist.filter((id) => id !== product.id) : [...wishlist, product.id]

    setWishlist(next)
    localStorage.setItem('op_wishlist', JSON.stringify(next))
    toast.info(already ? 'Retiré des favoris' : 'Ajouté aux favoris')
  }

  const handleAddToCart = (product) => {
    addItem(product)
    toast.success(`${product.nameF} ajouté au panier`)
  }

  return (
    <section id="boutique" className={styles.section}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.title}>
            <span className={styles.titleGreen}>BOUTIQUE</span> GOODIES
          </h2>
          <p className={styles.subtitle}>
            {lang === 'fr'
              ? 'Articles exclusifs pour les vrais otakus'
              : 'Exclusive items for real otakus'}
          </p>
        </div>

        <div className={styles.filters}>
          <div className={styles.cats}>
            {CATS.map((c) => (
              <button
                key={c.key}
                className={`${styles.catBtn} ${cat === c.key ? styles.catActive : ''}`}
                onClick={() => setCat(c.key)}
              >
                {lang === 'fr' ? c.fr : c.en}
              </button>
            ))}
          </div>

          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>
              <Search size={16} strokeWidth={2.3} />
            </span>
            <input
              className={styles.search}
              placeholder={lang === 'fr' ? 'Rechercher un article...' : 'Search an item...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading && <PageLoader />}

        {error && (
          <div className={styles.errorBox}>
            <AlertTriangle size={22} strokeWidth={2.2} />
            <p>{lang === 'fr' ? 'Impossible de charger les produits' : 'Unable to load products'}</p>
            <button onClick={refresh} className={styles.retryBtn}>
              <RefreshCw size={16} strokeWidth={2.2} />
              <span>{lang === 'fr' ? 'Réessayer' : 'Retry'}</span>
            </button>
          </div>
        )}

        {!loading && !error && (
          filtered.length === 0 ? (
            <div className={styles.emptyBox}>
              <span className={styles.emptyIcon}>
                <Package size={28} strokeWidth={2.1} />
              </span>
              <h3>{lang === 'fr' ? 'Aucun produit dans cette catégorie' : 'No products in this category'}</h3>
              <p>{lang === 'fr' ? 'Essaie un autre filtre ou une autre recherche.' : 'Try another filter or search.'}</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  lang={lang}
                  inWishlist={wishlist.includes(product.id)}
                  onAddCart={() => handleAddToCart(product)}
                  onToggleWish={() => toggleWish(product)}
                />
              ))}
            </div>
          )
        )}

        {user && count > 0 && (
          <div className={styles.cartCta}>
            <button className={styles.ctaBtn} onClick={() => navigate('/profil')}>
              <ShoppingCart size={18} strokeWidth={2.2} />
              <span>{lang === 'fr' ? `Voir mon panier (${count})` : `View my cart (${count})`}</span>
            </button>
          </div>
        )}

        <div className={styles.cartCta}>
          <button className={styles.ctaBtnSecondary} onClick={() => navigate('/boutique')}>
            <Store size={18} strokeWidth={2.2} />
            <span>{lang === 'fr' ? 'Voir toute la boutique' : 'See full shop'}</span>
          </button>
        </div>
      </div>
    </section>
  )
}

function ProductCard({ product, lang, inWishlist, onAddCart, onToggleWish }) {
  const hasPromo = product.oldPrice && product.oldPrice > product.price
  const discount = hasPromo ? Math.round((1 - product.price / product.oldPrice) * 100) : 0
  const imgSrc = product.images?.[0] || product.imageUrl || null
  const outOfStock = !product.stock || product.stock <= 0
  const lowStock = !outOfStock && product.stock <= 3

  const stockLabel = outOfStock
    ? (lang === 'fr' ? 'Rupture de stock' : 'Out of stock')
    : lowStock
      ? (lang === 'fr' ? `${product.stock} restants` : `${product.stock} left`)
      : (lang === 'fr' ? 'En stock' : 'In stock')

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.cardBadges}>
          {product.badge && <span className={styles.badge}>{product.badge}</span>}
          {hasPromo && <span className={styles.discountBadge}>-{discount}%</span>}
        </div>

        <button
          className={`${styles.wishBtn} ${inWishlist ? styles.wished : ''}`}
          onClick={onToggleWish}
          aria-label="wishlist"
        >
          <Heart size={16} strokeWidth={2.2} />
        </button>
      </div>

      <div className={styles.cardImg}>
        {imgSrc ? (
          <img src={imgSrc} alt={product.nameF} loading="lazy" className={styles.productImg} />
        ) : (
          <span className={styles.productFallback}>
            <Package size={30} strokeWidth={2.1} />
          </span>
        )}
      </div>

      <div className={styles.cardCat}>{product.category}</div>

      <div className={styles.cardBody}>
        <div className={styles.cardName}>{lang === 'fr' ? product.nameF : (product.nameE || product.nameF)}</div>

        {product.descF && (
          <div className={styles.cardDesc}>{lang === 'fr' ? product.descF : (product.descE || product.descF)}</div>
        )}

        <div className={styles.cardFooter}>
          <div className={styles.cardPrices}>
            <span className={styles.price}>{product.price?.toLocaleString('fr-FR')} <small>FCFA</small></span>
            {hasPromo && <span className={styles.oldPrice}>{product.oldPrice?.toLocaleString('fr-FR')}</span>}
          </div>

          <div className={`${styles.stock} ${lowStock ? styles.lowStock : ''} ${outOfStock ? styles.outStock : ''}`}>
            {outOfStock ? (
              <Ban size={14} strokeWidth={2.2} />
            ) : lowStock ? (
              <AlertTriangle size={14} strokeWidth={2.2} />
            ) : (
              <Check size={14} strokeWidth={2.4} />
            )}
            <span>{stockLabel}</span>
          </div>
        </div>

        <button className={styles.addBtn} onClick={onAddCart} disabled={outOfStock}>
          <ShoppingCart size={16} strokeWidth={2.2} />
          <span>
            {outOfStock
              ? (lang === 'fr' ? 'Indisponible' : 'Unavailable')
              : (lang === 'fr' ? 'Ajouter au panier' : 'Add to cart')}
          </span>
        </button>
      </div>
    </div>
  )
}

