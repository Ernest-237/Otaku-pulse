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
  UtensilsCrossed,
  Soup,
  Cake,
  CupSoda,
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
  // 🍜 Menus Otaku retiré temporairement (changement d'axe produit) — remettre
  // cette ligne pour réactiver : { key: 'nutrition', fr: '🍜 Menus Otaku', en: '🍜 Otaku Menus' },
  { key: 'posters', fr: 'Posters', en: 'Posters' },
  { key: 'stickers', fr: 'Stickers', en: 'Stickers' },
  { key: 'accessoires', fr: 'Accessoires', en: 'Accessories' },
  { key: 'kits', fr: 'Kits Déco', en: 'Deco Kits' },
  { key: 'manga', fr: 'Manga', en: 'Manga' },
  { key: 'livre', fr: 'Livres', en: 'Books' },
  { key: 'dessin', fr: 'Art & Dessin', en: 'Art & Drawing' },
  { key: 'echange', fr: 'Échange', en: 'Exchange' },
  { key: 'jeux', fr: 'Jeux Vidéo', en: 'Video Games' },
]

/* ══════════════════════════════════════════════════════
   MENUS OTAKU — data statique des 4 menus thématiques
   Le bouton "Commander" ajoute au panier via addItem.
   Chaque menu a un id unique préfixé "menu-" pour le panier.
   ══════════════════════════════════════════════════════ */
const OTAKU_MENUS = [
  {
    id: 'menu-shonen',
    key: 'shonen',
    theme: 'shonen',
    emoji: '🔥',
    nameF: 'Menu Shonen & Aventure',
    nameE: 'Shonen & Adventure Menu',
    tagline: 'Pour les héros au grand cœur',
    total: 4200,
    sections: [
      {
        icon: 'soup', label: 'Portion Salée', price: '1 000 FCFA',
        items: [
          { name: 'Boulettes de Ki (06)', price: '500 FCFA' },
          { name: 'Samoussas du NV Monde (06)', price: '500 FCFA' },
        ],
      },
      {
        icon: 'cake', label: 'Portion Sucrée', price: '2 000 FCFA',
        items: [
          { name: 'Pop Cake Pokéball (05)', price: '1 000 FCFA' },
          { name: 'Crêpes Gear 5 (03)', price: '1 000 FCFA' },
        ],
      },
      {
        icon: 'drink', label: "L'Élixir du Hokage", price: '1 200 FCFA',
        desc: 'Une gorgée pour éveiller ton chakra et assez d\'énergie pour traverser Grand Line sans escale.',
      },
    ],
  },
  {
    id: 'menu-seinen',
    key: 'seinen',
    theme: 'dark',
    emoji: '🖤',
    nameF: 'Menu Seinen & Dark Fantasy',
    nameE: 'Seinen & Dark Fantasy Menu',
    tagline: 'Pour les âmes des abysses',
    total: 5300,
    sections: [
      {
        icon: 'soup', label: 'Portion Salée', price: '1 000 FCFA',
        items: [
          { name: 'Nems Occultes (06)', price: '500 FCFA' },
          { name: "Samoussas de l'Éclipse (06)", price: '500 FCFA' },
        ],
      },
      {
        icon: 'cake', label: 'Portion Sucrée', price: '2 500 FCFA',
        items: [
          { name: 'Roulé de crêpes Sang Mêlé (03)', price: '1 500 FCFA' },
          { name: 'Pop Cake Doigts de Sukuna (05)', price: '1 000 FCFA' },
        ],
      },
      {
        icon: 'drink', label: "L'extension du territoire", price: '1 800 FCFA',
        desc: 'Plonge dans les abysses avec ce breuvage, une saveur si puissante qu\'elle pourrait sceller n\'importe quel fléau.',
      },
    ],
  },
  {
    id: 'menu-shojo',
    key: 'shojo',
    theme: 'shojo',
    emoji: '🌸',
    nameF: 'Menu Shojo & Kawaii',
    nameE: 'Shojo & Kawaii Menu',
    tagline: "Douceur et élégance au nom de la lune",
    total: 5800,
    sections: [
      {
        icon: 'soup', label: 'Portion Salée', price: '1 500 FCFA',
        items: [
          { name: 'Boulettes Anya (06)', price: '500 FCFA' },
          { name: 'Nems de la Rosée (06)', price: '1 000 FCFA' },
        ],
      },
      {
        icon: 'cake', label: 'Portion Sucrée', price: '2 500 FCFA',
        items: [
          { name: 'Crêpes Ruban Magique', price: '1 500 FCFA' },
          { name: 'Pop Cake Petit Suie (05)', price: '1 000 FCFA' },
        ],
      },
      {
        icon: 'drink', label: 'Le Prisme Lunaire', price: '1 800 FCFA',
        desc: 'Un cocktail infusé de magie et de douceur pour punir les forces du mal au nom de l\'élégance.',
      },
    ],
  },
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
    // Menus
    menuIntroTitle: 'Nos Menus Otaku',
    menuIntroSub: 'Des plats thématiques inspirés de tes univers préférés. Commande ton menu complet, livré sur Yaoundé lors de nos journées spéciales.',
    orderMenu: 'Commander ce menu',
    menuTotal: 'Menu complet',
    menuNote: '🚚 Livraison uniquement les jours annoncés — confirme ta commande sur WhatsApp',
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
    // Menus
    menuIntroTitle: 'Our Otaku Menus',
    menuIntroSub: 'Themed dishes inspired by your favorite universes. Order your full menu, delivered in Yaoundé on our special days.',
    orderMenu: 'Order this menu',
    menuTotal: 'Full menu',
    menuNote: '🚚 Delivery only on announced days — confirm your order on WhatsApp',
  },
}

const SECTION_ICON = {
  soup:  <Soup size={15} />,
  cake:  <Cake size={15} />,
  drink: <CupSoda size={15} />,
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

  // Mode "menus" activé quand on est sur la catégorie nutrition
  const isMenuView = cat === 'nutrition'

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

  // Ajouter un menu au panier (format compatible avec ton système)
  const addMenuToCart = (menu) => {
    addItem({
      id: menu.id,
      nameF: menu.nameF,
      nameE: menu.nameE,
      price: menu.total,
      emoji: menu.emoji,
      category: 'nutrition',
      stock: 999,
      imageUrl: null,
    })
    toast.success(`${lang === 'fr' ? menu.nameF : menu.nameE} ${T.added}`)
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

          {!isMenuView && (
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                className={styles.search}
                placeholder={T.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* ══ VUE MENUS OTAKU ══ */}
        {isMenuView ? (
          <MenusView lang={lang} t={T} onOrder={addMenuToCart} count={count} />
        ) : (
          <>
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
          </>
        )}
      </main>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   VUE MENUS OTAKU
   ══════════════════════════════════════════════════════ */
function MenusView({ lang, t, onOrder, count }) {
  return (
    <div className={styles.menusWrap}>
      <div className={styles.menuIntro}>
        <div className={styles.menuIntroIcon}><UtensilsCrossed size={26} /></div>
        <h2 className={styles.menuIntroTitle}>{t.menuIntroTitle}</h2>
        <p className={styles.menuIntroSub}>{t.menuIntroSub}</p>
        {count > 0 && (
          <Link to="/profil" className={styles.menuCartLink}>
            <ShoppingCart size={16} /> {t.myCart} ({count})
          </Link>
        )}
      </div>

      <div className={styles.menusGrid}>
        {OTAKU_MENUS.map((menu) => (
          <MenuCard key={menu.id} menu={menu} lang={lang} t={t} onOrder={() => onOrder(menu)} />
        ))}
      </div>

      <p className={styles.menuGlobalNote}>{t.menuNote}</p>
    </div>
  )
}

function MenuCard({ menu, lang, t, onOrder }) {
  const name = lang === 'fr' ? menu.nameF : menu.nameE

  return (
    <article className={`${styles.menuCard} ${styles[`theme_${menu.theme}`]}`}>
      <div className={styles.menuCardGlow} />

      {/* Header */}
      <div className={styles.menuCardHead}>
        <span className={styles.menuCardEmoji}>{menu.emoji}</span>
        <div>
          <h3 className={styles.menuCardName}>{name}</h3>
          <p className={styles.menuCardTagline}>{menu.tagline}</p>
        </div>
      </div>

      {/* Sections */}
      <div className={styles.menuSections}>
        {menu.sections.map((sec, i) => (
          <div key={i} className={styles.menuSection}>
            <div className={styles.menuSectionHead}>
              <span className={styles.menuSectionIcon}>{SECTION_ICON[sec.icon]}</span>
              <span className={styles.menuSectionLabel}>{sec.label}</span>
              <span className={styles.menuSectionPrice}>{sec.price}</span>
            </div>
            {sec.items && (
              <ul className={styles.menuItems}>
                {sec.items.map((item, j) => (
                  <li key={j} className={styles.menuItem}>
                    <span className={styles.menuItemName}>{item.name}</span>
                    <span className={styles.menuItemDots} />
                    <span className={styles.menuItemPrice}>{item.price}</span>
                  </li>
                ))}
              </ul>
            )}
            {sec.desc && <p className={styles.menuSectionDesc}>{sec.desc}</p>}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={styles.menuCardFooter}>
        <div className={styles.menuTotal}>
          <span className={styles.menuTotalLabel}>{t.menuTotal}</span>
          <span className={styles.menuTotalPrice}>{menu.total.toLocaleString()} <small>FCFA</small></span>
        </div>
        <button className={styles.menuOrderBtn} onClick={onOrder} type="button">
          <ShoppingCart size={16} />
          <span>{t.orderMenu}</span>
        </button>
      </div>
    </article>
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