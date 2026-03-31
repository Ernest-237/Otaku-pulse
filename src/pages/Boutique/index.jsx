// src/pages/Boutique/index.jsx — Page boutique dédiée
import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useCart }   from '../../contexts/CartContext'
import { useLang }   from '../../contexts/LangContext'
import { useToast }  from '../../contexts/ToastContext'
import { useApi }    from '../../hooks/useApi'
import { productsApi, API_BASE } from '../../api'
import Navbar from '../../components/Navbar'
import { PageLoader, EmptyState } from '../../components/ui/Spinner'
import styles from './Boutique.module.css'

const CATS = [
  { key:'all',         fr:'Tous',        en:'All'         },
  { key:'posters',     fr:'Posters',     en:'Posters'     },
  { key:'stickers',    fr:'Stickers',    en:'Stickers'    },
  { key:'accessoires', fr:'Accessoires', en:'Accessories' },
  { key:'kits',        fr:'Kits Déco',   en:'Deco Kits'   },
  { key:'manga',       fr:'Manga',       en:'Manga'       },
  { key:'livre',       fr:'Livres',      en:'Books'       },
  { key:'dessin',      fr:'Art & Dessin',en:'Art & Drawing'},
  { key:'nutrition',   fr:'Nutrition',   en:'Nutrition'   },
  { key:'echange',     fr:'Échange',     en:'Exchange'    },
  { key:'jeux',        fr:'Jeux Vidéo',  en:'Video Games' },
]

export default function BoutiquePage() {
  const { lang }    = useLang()
  const { addItem, count } = useCart()
  const toast       = useToast()
  const [cat,    setCat]    = useState('all')
  const [search, setSearch] = useState('')
  const [wished, setWished]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('op_wishlist') || '[]') } catch { return [] }
  })

  const fetchProducts = useCallback(() => productsApi.getAll({ limit:100 }), [])
  const { data, loading, error, refresh } = useApi(fetchProducts, [], true)
  const products = (data?.products || []).filter(p => {
    const mC = cat === 'all' || p.category === cat
    const mS = !search || `${p.nameF} ${p.nameE || ''} ${p.descF || ''}`.toLowerCase().includes(search.toLowerCase())
    return mC && mS && p.isActive !== false
  })

  const toggleWish = (id) => {
    const next = wished.includes(id) ? wished.filter(x => x !== id) : [...wished, id]
    setWished(next)
    localStorage.setItem('op_wishlist', JSON.stringify(next))
    toast.info(wished.includes(id) ? '💔 Retiré des favoris' : '❤️ Ajouté aux favoris')
  }

  const addCart = (p) => {
    addItem(p)
    toast.success(`✅ ${p.nameF} ajouté au panier !`)
  }

  return (
    <div className={styles.page}>
      <Navbar />

      {/* Header */}
      <div className={styles.header}>
        <div className="container">
          <div className={styles.breadcrumb}>
            <Link to="/">Accueil</Link> <span>›</span> <span>Boutique</span>
          </div>
          <h1 className={styles.pageTitle}>
            🛒 <span className={styles.accent}>{lang==='fr' ? 'BOUTIQUE' : 'SHOP'}</span>
          </h1>
          <p className={styles.pageSubtitle}>
            {lang==='fr'
              ? 'Goodies anime livrés partout au Cameroun'
              : 'Anime goods delivered across Cameroon'}
          </p>
        </div>
      </div>

      <div className="container">
        {/* Filtres */}
        <div className={styles.filters}>
          <div className={styles.cats}>
            {CATS.map(c => (
              <button key={c.key}
                className={`${styles.catBtn} ${cat===c.key?styles.catActive:''}`}
                onClick={() => setCat(c.key)}>
                {lang==='fr' ? c.fr : c.en}
              </button>
            ))}
          </div>
          <input className={styles.search}
            placeholder={lang==='fr' ? '🔍 Rechercher...' : '🔍 Search...'}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Résultats */}
        <div className={styles.resultsBar}>
          <span className={styles.count}>{products.length} {lang==='fr' ? 'article(s)' : 'item(s)'}</span>
          {count > 0 && (
            <Link to="/profil" className={styles.cartLink}>
              🛒 Mon panier ({count})
            </Link>
          )}
        </div>

        {loading && <PageLoader />}
        {error && (
          <div className={styles.errorBox}>
            <p>⚠️ {lang==='fr' ? 'Impossible de charger les produits' : 'Could not load products'}</p>
            <button onClick={refresh} className={styles.retryBtn}>🔄 Réessayer</button>
          </div>
        )}

        {!loading && !error && (
          products.length === 0
            ? <EmptyState icon="📦"
                title={lang==='fr' ? 'Aucun produit dans cette catégorie' : 'No products in this category'} />
            : (
              <div className={styles.grid}>
                {products.map(p => (
                  <ProductCard key={p.id} product={p} lang={lang}
                    inWish={wished.includes(p.id)}
                    onAddCart={() => addCart(p)}
                    onToggleWish={() => toggleWish(p.id)} />
                ))}
              </div>
            )
        )}
      </div>
    </div>
  )
}

function ProductCard({ product:p, lang, inWish, onAddCart, onToggleWish }) {
  const hasPromo = p.oldPrice && p.oldPrice > p.price
  const discount = hasPromo ? Math.round((1 - p.price/p.oldPrice)*100) : 0

  // Image : URL API si imageData en BD, sinon imageUrl externe
  const imgSrc = p.imageUrl
    ? (p.imageUrl.startsWith('/') ? `${API_BASE}${p.imageUrl}` : p.imageUrl)
    : null

  return (
    <div className={styles.card}>
      {/* Badges + Wishlist */}
      <div className={styles.cardTop}>
        <div className={styles.cardBadges}>
          {p.badge    && <span className={styles.badge}>{p.badge}</span>}
          {hasPromo   && <span className={styles.discountBadge}>-{discount}%</span>}
          {p.isFeatured && <span className={styles.featBadge}>⭐</span>}
        </div>
        <button className={`${styles.wishBtn} ${inWish?styles.wished:''}`} onClick={onToggleWish}>
          {inWish ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Image */}
      <div className={styles.cardImg}>
        {imgSrc
          ? <img src={imgSrc} alt={p.nameF} loading="lazy" className={styles.productImg}/>
          : <span className={styles.emoji}>{p.emoji || '🎁'}</span>}
      </div>

      {/* Fournisseur */}
      {p.supplier && (
        <div className={styles.supplierTag}>🤝 {p.supplier.name}</div>
      )}
      <div className={styles.catTag}>{p.category}</div>

      <div className={styles.cardBody}>
        <div className={styles.cardName}>{lang==='fr' ? p.nameF : (p.nameE || p.nameF)}</div>
        {p.descF && <div className={styles.cardDesc}>{lang==='fr' ? p.descF : (p.descE || p.descF)}</div>}
        <div className={styles.cardFooter}>
          <div className={styles.prices}>
            <span className={styles.price}>{p.price?.toLocaleString()} <small>FCFA</small></span>
            {hasPromo && <span className={styles.oldPrice}>{p.oldPrice?.toLocaleString()}</span>}
          </div>
          <span className={`${styles.stock} ${p.stock<=3?styles.lowStock:''}`}>
            {p.stock<=0 ? '🚫 Épuisé' : p.stock<=3 ? `⚠️ ${p.stock}` : '✓'}
          </span>
        </div>
        <button className={styles.addBtn} onClick={onAddCart} disabled={!p.stock || p.stock<=0}>
          {!p.stock || p.stock<=0
            ? '🚫 Rupture'
            : (lang==='fr' ? '🛒 Ajouter au panier' : '🛒 Add to cart')}
        </button>
      </div>
    </div>
  )
}