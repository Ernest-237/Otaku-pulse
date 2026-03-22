// src/pages/Home/sections/Boutique.jsx
import { useState, useCallback } from 'react'
import { useNavigate }   from 'react-router-dom'
import { useCart }   from '../../../contexts/CartContext'
import { useLang }   from '../../../contexts/LangContext'
import { useToast }  from '../../../contexts/ToastContext'
import { useApi }    from '../../../hooks/useApi'
import { productsApi } from '../../../api'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
import styles from './Boutique.module.css'

const CATS = [
  { key:'all',        fr:'Tous',         en:'All'          },
  { key:'posters',    fr:'Posters',      en:'Posters'      },
  { key:'stickers',   fr:'Stickers',     en:'Stickers'     },
  { key:'accessoires',fr:'Accessoires',  en:'Accessories'  },
  { key:'kits',       fr:'Kits Déco',    en:'Deco Kits'    },
  { key:'manga',      fr:'Manga',        en:'Manga'        },
  { key:'livre',      fr:'Livres',       en:'Books'        },
  { key:'dessin',     fr:'Dessin/Art',   en:'Art/Drawing'  },
  { key:'nutrition',  fr:'Nutrition',    en:'Nutrition'    },
  { key:'echange',    fr:'Échange',      en:'Exchange'     },
  { key:'jeux',       fr:'Jeux Vidéo',   en:'Video Games'  },
]

export default function Boutique() {
  const { lang }    = useLang()
  const { addItem } = useCart()
  const toast       = useToast()
  const navigate    = useNavigate()
  const [cat,       setCat]       = useState('all')
  const [search,    setSearch]    = useState('')
  const [wishlist,  setWishlist]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('op_wishlist') || '[]') } catch { return [] }
  })

  // ── Charger produits avec refresh ─────────────────────
  const fetchProducts = useCallback(() => productsApi.getAll({ limit:100 }), [])
  const { data, loading, error, refresh } = useApi(fetchProducts, [], true)
  const products = data?.products || []

  const filtered = products.filter(p => {
    const matchCat    = cat === 'all' || p.category === cat
    const matchSearch = !search || `${p.nameF} ${p.nameE || ''} ${p.descF || ''}`.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch && p.isActive !== false
  })

  const toggleWish = (product) => {
    const next = wishlist.includes(product.id)
      ? wishlist.filter(id => id !== product.id)
      : [...wishlist, product.id]
    setWishlist(next)
    localStorage.setItem('op_wishlist', JSON.stringify(next))
    toast.info(wishlist.includes(product.id) ? '💔 Retiré des favoris' : '❤️ Ajouté aux favoris')
  }

  const handleAddToCart = (product) => {
    addItem(product)
    toast.success(`✅ ${product.nameF} ajouté au panier !`)
  }

  return (
    <section id="boutique" className={styles.section}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.title}>
            <span className={styles.titleGreen}>BOUTIQUE</span> GOODIES
          </h2>
          <p className={styles.subtitle}>
            {lang==='fr' ? 'Articles exclusifs pour les vrais otakus 🎌' : 'Exclusive items for real otakus 🎌'}
          </p>
        </div>

        {/* Filtres */}
        <div className={styles.filters}>
          <div className={styles.cats}>
            {CATS.map(c => (
              <button
                key={c.key}
                className={`${styles.catBtn} ${cat===c.key ? styles.catActive : ''}`}
                onClick={() => setCat(c.key)}
              >
                {lang==='fr' ? c.fr : c.en}
              </button>
            ))}
          </div>
          <input
            className={styles.search}
            placeholder={lang==='fr' ? '🔍 Rechercher...' : '🔍 Search...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading && <PageLoader />}
        {error && (
          <div className={styles.errorBox}>
            <p>⚠️ Impossible de charger les produits</p>
            <button onClick={refresh} className={styles.retryBtn}>🔄 Réessayer</button>
          </div>
        )}

        {!loading && !error && (
          filtered.length === 0
            ? <EmptyState icon="📦" title={lang==='fr' ? 'Aucun produit dans cette catégorie' : 'No products in this category'} />
            : (
              <div className={styles.grid}>
                {filtered.map(product => (
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

        <div className={styles.cartCta}>
          <button className={styles.ctaBtn} onClick={() => navigate('/profil')}>
            🛒 {lang==='fr' ? 'Voir mon panier' : 'View my cart'}
          </button>
        </div>
      </div>
    </section>
  )
}

function ProductCard({ product, lang, inWishlist, onAddCart, onToggleWish }) {
  const hasPromo  = product.oldPrice && product.oldPrice > product.price
  const discount  = hasPromo ? Math.round((1 - product.price / product.oldPrice) * 100) : 0
  const imgSrc    = product.images?.[0] || product.imageUrl || null

  return (
    <div className={styles.card}>
      {/* Badge + Wishlist */}
      <div className={styles.cardTop}>
        <div className={styles.cardBadges}>
          {product.badge && <span className={styles.badge}>{product.badge}</span>}
          {hasPromo && <span className={styles.discountBadge}>-{discount}%</span>}
        </div>
        <button className={`${styles.wishBtn} ${inWishlist ? styles.wished : ''}`} onClick={onToggleWish}>
          {inWishlist ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Image ou emoji */}
      <div className={styles.cardImg}>
        {imgSrc
          ? <img src={imgSrc} alt={product.nameF} loading="lazy" className={styles.productImg}/>
          : <span className={styles.emoji}>{product.emoji || '🎁'}</span>
        }
      </div>

      {/* Catégorie */}
      <div className={styles.cardCat}>{product.category}</div>

      <div className={styles.cardBody}>
        <div className={styles.cardName}>{lang==='fr' ? product.nameF : (product.nameE || product.nameF)}</div>
        {product.descF && (
          <div className={styles.cardDesc}>{lang==='fr' ? product.descF : (product.descE || product.descF)}</div>
        )}
        <div className={styles.cardFooter}>
          <div className={styles.cardPrices}>
            <span className={styles.price}>{product.price?.toLocaleString()} <small>FCFA</small></span>
            {hasPromo && <span className={styles.oldPrice}>{product.oldPrice?.toLocaleString()}</span>}
          </div>
          <div className={`${styles.stock} ${product.stock <= 3 ? styles.lowStock : ''}`}>
            {product.stock <= 0 ? '🚫 Épuisé' : product.stock <= 3 ? `⚠️ ${product.stock} restants` : '✓ En stock'}
          </div>
        </div>
        <button
          className={styles.addBtn}
          onClick={onAddCart}
          disabled={!product.stock || product.stock <= 0}
        >
          {!product.stock || product.stock <= 0
            ? (lang==='fr' ? '🚫 Rupture de stock' : '🚫 Out of stock')
            : (lang==='fr' ? '🛒 Ajouter au panier' : '🛒 Add to cart')}
        </button>
      </div>
    </div>
  )
}