import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Check,
  ChevronRight,
  Heart,
  LogOut,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Pencil,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { useLang } from '../../contexts/LangContext'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { useToast } from '../../contexts/ToastContext'
import { useApi, useMutation } from '../../hooks/useApi'
import { usersApi, ordersApi } from '../../api'
import QUARTIERS from '../../data/quartiers'
import Navbar from '../../components/Navbar'
import Footer from '../Home/sections/Footer'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Badge, { statusVariant } from '../../components/ui/Badge'
import { PageLoader, EmptyState } from '../../components/ui/Spinner'
import styles from './Profil.module.css'

const STEP_ORDER = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered']

const copy = {
  fr: {
    title: 'Mon Profil — Otaku Pulse',
    loginTitle: 'Ton panier t’attend',
    loginText: 'Tu as des articles dans ton panier. Crée un compte ou connecte-toi pour finaliser ta commande et suivre tes achats.',
    loginBtn: 'Se connecter / S’inscrire',
    continueGuest: 'Continuer sans compte',
    heroFallback: 'Compte invité',
    profileTab: 'Profil',
    cartTab: 'Panier',
    wishlistTab: 'Favoris',
    ordersTab: 'Commandes',
    edit: 'Modifier',
    logout: 'Déconnexion',
    cartCount: 'Panier',
    ordersCount: 'Commandes',
    totalSpent: 'FCFA',
    cartTitle: (count) => `Articles (${count})`,
    summary: 'Récapitulatif',
    subtotal: 'Sous-total',
    shipping: 'Livraison',
    freeShipping: 'Gratuite',
    freeHint: 'Livraison gratuite dès 15 000 FCFA',
    total: 'Total',
    checkout: 'Finaliser l’achat',
    loginPrompt: 'Connecte-toi pour finaliser ta commande',
    note: 'Livraison sur tout le Cameroun • Paiement : MTN Money / Orange Money',
    emptyCart: 'Ton panier est vide',
    emptyCartMsg: 'Explore la boutique et ajoute des goodies.',
    emptyWishlist: 'Aucun favori',
    emptyWishlistMsg: 'Clique sur le cœur dans la boutique pour sauvegarder des articles.',
    emptyOrders: 'Aucune commande',
    emptyOrdersMsg: 'Tes commandes apparaîtront ici.',
    wishlistTitle: (count) => `Mes Favoris (${count})`,
    ordersTitle: (count) => `Mes Commandes (${count})`,
    addToCart: 'Ajouter',
    remove: 'Retirer',
    save: 'Enregistrer',
    password: 'Mot de passe',
    currentPwd: 'Actuel',
    newPwd: 'Nouveau (min 8)',
    changePwd: 'Modifier le mot de passe',
    firstName: 'Prénom',
    lastName: 'Nom',
    phone: 'Téléphone',
    whatsapp: 'WhatsApp',
    city: 'Ville',
    quartier: 'Quartier habituel',
    checkoutTitle: 'Finaliser la commande',
    deliveryInfo: 'Informations de livraison',
    whatsappRequired: 'Numéro WhatsApp requis',
    quartierRequired: 'Quartier de livraison requis',
    paymentInfo:
      'Après confirmation, notre équipe vous contacte sur WhatsApp pour le paiement via MTN Money ou Orange Money, puis organise la livraison dans votre quartier.',
    confirmOrder: 'Confirmer la commande',
    cancel: 'Annuler',
    orderSent: 'COMMANDE ENVOYÉE !',
    orderSentText: 'Notre équipe va vous contacter sur WhatsApp pour confirmer et organiser la livraison.',
    trackOrder: 'Suivre ma commande',
    requiredFields: 'Numéro WhatsApp et quartier requis',
    profileUpdated: '✅ Profil mis à jour !',
    passwordUpdated: '✅ Mot de passe modifié !',
    passwordShort: 'Minimum 8 caractères',
    added: '✅ Ajouté au panier !',
    removedWishlist: 'Retiré des favoris',
    inStock: 'En stock',
    outStock: 'Épuisé',
    lowStock: (n) => `${n} restants`,
    orderHistory: 'Historique',
    orderedItems: 'Articles commandés',
    deliveryDetails: 'Informations de livraison',
    fromShop: 'Retour boutique',
    status: {
      pending: 'En attente',
      confirmed: 'Confirmée',
      preparing: 'En préparation',
      shipped: 'En livraison',
      delivered: 'Livrée',
      cancelled: 'Annulée',
      refunded: 'Remboursée',
    },
    statusDesc: {
      pending: 'Commande reçue, notre équipe va vous contacter sous peu.',
      confirmed: 'Votre commande est confirmée et le paiement validé.',
      preparing: 'Vos articles sont en cours de préparation.',
      shipped: 'Votre commande est en route vers vous.',
      delivered: 'Commande livrée. Profite de tes goodies Otaku !',
      cancelled: 'Cette commande a été annulée.',
      refunded: 'Remboursement effectué.',
    },
  },
  en: {
    title: 'My Profile — Otaku Pulse',
    loginTitle: 'Your cart is waiting',
    loginText: 'You already have items in your cart. Create an account or log in to complete your order and track your purchases.',
    loginBtn: 'Log in / Sign up',
    continueGuest: 'Continue as guest',
    heroFallback: 'Guest account',
    profileTab: 'Profile',
    cartTab: 'Cart',
    wishlistTab: 'Wishlist',
    ordersTab: 'Orders',
    edit: 'Edit',
    logout: 'Logout',
    cartCount: 'Cart',
    ordersCount: 'Orders',
    totalSpent: 'FCFA',
    cartTitle: (count) => `Items (${count})`,
    summary: 'Summary',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    freeShipping: 'Free',
    freeHint: 'Free delivery from 15,000 FCFA',
    total: 'Total',
    checkout: 'Checkout',
    loginPrompt: 'Log in to complete your order',
    note: 'Delivery across Cameroon • Payment: MTN Money / Orange Money',
    emptyCart: 'Your cart is empty',
    emptyCartMsg: 'Explore the shop and add some goodies.',
    emptyWishlist: 'No wishlist item',
    emptyWishlistMsg: 'Click the heart in the shop to save items.',
    emptyOrders: 'No order yet',
    emptyOrdersMsg: 'Your orders will appear here.',
    wishlistTitle: (count) => `My Wishlist (${count})`,
    ordersTitle: (count) => `My Orders (${count})`,
    addToCart: 'Add',
    remove: 'Remove',
    save: 'Save',
    password: 'Password',
    currentPwd: 'Current',
    newPwd: 'New (min 8)',
    changePwd: 'Change password',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone',
    whatsapp: 'WhatsApp',
    city: 'City',
    quartier: 'Usual district',
    checkoutTitle: 'Complete your order',
    deliveryInfo: 'Delivery details',
    whatsappRequired: 'WhatsApp number required',
    quartierRequired: 'Delivery district required',
    paymentInfo:
      'After confirmation, our team contacts you on WhatsApp for payment via MTN Money or Orange Money, then arranges the delivery to your district.',
    confirmOrder: 'Confirm order',
    cancel: 'Cancel',
    orderSent: 'ORDER SENT!',
    orderSentText: 'Our team will contact you on WhatsApp to confirm and organize delivery.',
    trackOrder: 'Track my order',
    requiredFields: 'WhatsApp number and district are required',
    profileUpdated: '✅ Profile updated!',
    passwordUpdated: '✅ Password changed!',
    passwordShort: 'Minimum 8 characters',
    added: '✅ Added to cart!',
    removedWishlist: 'Removed from wishlist',
    inStock: 'In stock',
    outStock: 'Out of stock',
    lowStock: (n) => `${n} left`,
    orderHistory: 'History',
    orderedItems: 'Ordered items',
    deliveryDetails: 'Delivery information',
    fromShop: 'Back to shop',
    status: {
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    },
    statusDesc: {
      pending: 'Order received, our team will contact you shortly.',
      confirmed: 'Your order is confirmed and payment validated.',
      preparing: 'Your items are currently being prepared.',
      shipped: 'Your order is on the way.',
      delivered: 'Order delivered. Enjoy your Otaku goodies!',
      cancelled: 'This order has been cancelled.',
      refunded: 'Refund completed.',
    },
  },
}

export default function ProfilPage() {
  const { lang } = useLang()
  const t = copy[lang]
  const { user, logout, updateUser } = useAuth()
  const { items, count, total, shipping, subtotal, addItem, removeItem, updateQty, clearCart } = useCart()
  const toast = useToast()
  const navigate = useNavigate()

  const [tab, setTab] = useState('cart')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [lastOrder, setLastOrder] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(!user)

  useEffect(() => {
    document.title = t.title
  }, [t.title])

  useEffect(() => {
    if (user) setShowLoginModal(false)
  }, [user])

  const { data: ordersData, execute: refetchOrders } = useApi(() => (user ? ordersApi.getMy() : Promise.resolve({ orders: [] })), [user?.id], true)
  const ordersCount = ordersData?.orders?.length || 0

  const heroName = user?.pseudo || t.heroFallback

  const tabs = [
    { id: 'cart', label: t.cartTab, icon: <ShoppingCart size={16} />, badge: count },
    { id: 'wishlist', label: t.wishlistTab, icon: <Heart size={16} /> },
    { id: 'orders', label: t.ordersTab, icon: <Package size={16} />, badge: ordersCount },
    { id: 'profil', label: t.profileTab, icon: <UserRound size={16} /> },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className={styles.page}>
      <Navbar />

      {showLoginModal && !user && (
        <div className={styles.loginOverlay}>
          <div className={styles.loginCard}>
            <div className={styles.loginIcon}><ShoppingCart size={36} /></div>
            <h2 className={styles.loginTitle}>{t.loginTitle}</h2>
            <p className={styles.loginText}>{t.loginText}</p>

            {items.length > 0 && (
              <div className={styles.loginSummary}>
                <div className={styles.loginSummaryHead}>{t.cartTitle(count)}</div>
                {items.slice(0, 3).map((item) => (
                  <div key={item.id} className={styles.loginRow}>
                    <span>{item.emoji || '🎁'} {item.name}</span>
                    <strong>{(item.price * item.qty).toLocaleString()} F</strong>
                  </div>
                ))}
                <div className={styles.loginTotal}><span>{t.total}</span><strong>{total.toLocaleString()} FCFA</strong></div>
              </div>
            )}

            <div className={styles.loginActions}>
              <Link to="/" className={styles.loginPrimary} onClick={() => sessionStorage.setItem('openLogin', '1')}>
                {t.loginBtn}
              </Link>
              <button className={styles.loginSecondary} onClick={() => setShowLoginModal(false)}>
                {t.continueGuest}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroInner}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>{user?.avatar || '🎌'}</div>
              <div className={styles.onlineDot} />
            </div>
            <div className={styles.heroInfo}>
              <div className={styles.heroPseudo}>{heroName}</div>
              <div className={styles.heroEmail}>{user?.email || 'guest@otaku-pulse.com'}</div>
              <div className={styles.heroBadges}>
                {user?.role === 'superadmin' && <Badge variant="red">Super Admin</Badge>}
                {user?.role === 'admin' && <Badge variant="amber">Admin</Badge>}
                {user?.role === 'user' && <Badge variant="gray">Otaku</Badge>}
                {user?.isVerified && <Badge variant="green">Vérifié</Badge>}
                {user?.city && <Badge variant="blue">{user.city}</Badge>}
              </div>
              <div className={styles.quickStats}>
                <div className={styles.qStat}><span className={styles.qStatVal}>{count}</span><span className={styles.qStatLbl}>{t.cartCount}</span></div>
                <div className={styles.qStat}><span className={styles.qStatVal}>{ordersCount}</span><span className={styles.qStatLbl}>{t.ordersCount}</span></div>
                <div className={styles.qStat}><span className={styles.qStatVal}>{Math.round(total / 1000) || 0}K</span><span className={styles.qStatLbl}>{t.totalSpent}</span></div>
              </div>
            </div>
            <div className={styles.heroActions}>
              <Button variant="primary" onClick={() => setTab('cart')}>
                <ShoppingCart size={16} />
                {t.cartTab}
              </Button>
              <Button variant="ghost" onClick={() => setTab('profil')}>
                <Pencil size={16} />
                {t.edit}
              </Button>
              {user && (
                <Button variant="danger" onClick={handleLogout}>
                  <LogOut size={16} />
                  {t.logout}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.content}>
        <div className="container">
          <div className={styles.tabs}>
            {tabs.map((item) => (
              <button key={item.id} className={`${styles.tab} ${tab === item.id ? styles.tabActive : ''}`} onClick={() => setTab(item.id)}>
                <span className={styles.tabMain}>{item.icon}{item.label}</span>
                {item.badge ? <span className={styles.tabBadge}>{item.badge}</span> : null}
              </button>
            ))}
          </div>

          {tab === 'cart' && (
            items.length === 0 ? (
              <EmptyState icon="🛒" title={t.emptyCart} message={t.emptyCartMsg} />
            ) : (
              <div className={styles.cartLayout}>
                <div>
                  <div className={styles.secTitle}><ShoppingCart size={18} />{t.cartTitle(count)}</div>
                  <div className={styles.cartItems}>
                    {items.map((item) => (
                      <div key={item.id} className={styles.cartCard}>
                        <div className={styles.cartThumb}>
                          {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <span>{item.emoji || '🎁'}</span>}
                        </div>
                        <div className={styles.cartInfo}>
                          <div className={styles.cartName}>{item.name}</div>
                          <div className={styles.cartPrice}>{(item.price * item.qty).toLocaleString()} FCFA</div>
                          <div className={styles.cartActions}>
                            <div className={styles.qtyBox}>
                              <button className={styles.qtyBtn} onClick={() => updateQty(item.id, -1)}><Minus size={16} /></button>
                              <span className={styles.qtyNum}>{item.qty}</span>
                              <button className={styles.qtyBtn} onClick={() => updateQty(item.id, +1)}><Plus size={16} /></button>
                            </div>
                            <button className={styles.rmBtn} onClick={() => removeItem(item.id)}><Trash2 size={16} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.summary}>
                  <div className={styles.summaryTitle}>{t.summary}</div>
                  <div className={styles.summaryRow}><span>{t.subtotal}</span><span>{subtotal.toLocaleString()} FCFA</span></div>
                  <div className={styles.summaryRow}><span>{t.shipping}</span><span>{shipping === 0 ? t.freeShipping : `${shipping.toLocaleString()} FCFA`}</span></div>
                  {shipping > 0 && <p className={styles.freeHint}>{t.freeHint}</p>}
                  <div className={styles.summaryTotal}><span>{t.total}</span><span>{total.toLocaleString()} FCFA</span></div>
                  {user ? (
                    <button className={styles.orderBtn} onClick={() => setCheckoutOpen(true)}>{t.checkout}</button>
                  ) : (
                    <div className={styles.loginPrompt}>
                      <p>{t.loginPrompt}</p>
                      <Link to="/" className={styles.loginPromptBtn} onClick={() => sessionStorage.setItem('openLogin', '1')}>
                        {t.loginBtn}
                      </Link>
                    </div>
                  )}
                  <p className={styles.orderNote}>{t.note}</p>
                </div>
              </div>
            )
          )}

          {tab === 'wishlist' && <WishlistTab t={t} toast={toast} addItem={addItem} setTab={setTab} />}
          {tab === 'orders' && <OrdersTab t={t} orders={ordersData?.orders || []} loading={!ordersData} onSelect={setSelectedOrder} />}
          {tab === 'profil' && <ProfilTab t={t} user={user} toast={toast} updateUser={updateUser} />}
        </div>
      </section>

      {checkoutOpen && (
        <CheckoutModal
          t={t}
          items={items}
          total={total}
          shipping={shipping}
          subtotal={subtotal}
          user={user}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={(order) => {
            setLastOrder(order)
            clearCart()
            setCheckoutOpen(false)
            setSuccessOpen(true)
            refetchOrders()
          }}
          toast={toast}
        />
      )}

      <Modal
        isOpen={successOpen}
        onClose={() => {
          setSuccessOpen(false)
          setTab('orders')
        }}
        footer={<Button variant="primary" onClick={() => { setSuccessOpen(false); setTab('orders') }}>{t.trackOrder}</Button>}
      >
        <div className={styles.successModal}>
          <ShieldCheck size={44} className={styles.successIcon} />
          <h2 className={styles.successTitle}>{t.orderSent}</h2>
          <p className={styles.successText}>
            {lastOrder && <><strong>{lastOrder.orderNumber}</strong><br /></>}
            {t.orderSentText}
          </p>
        </div>
      </Modal>

      {selectedOrder && <OrderDetailModal t={t} order={selectedOrder} onClose={() => setSelectedOrder(null)} />}

      <Footer />
    </div>
  )
}

function CheckoutModal({ t, items, total, user, onClose, onSuccess, toast }) {
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || user?.phone || '')
  const [city, setCity] = useState(user?.city || 'Yaoundé')
  const [quartier, setQuartier] = useState(user?.quartier || '')
  const [paying, setPaying] = useState(false)

  const quartiersForCity = QUARTIERS[city] || []

  const handleOrder = async () => {
    if (!whatsapp.trim()) {
      toast.error(t.whatsappRequired)
      return
    }
    if (!quartier.trim()) {
      toast.error(t.quartierRequired)
      return
    }

    setPaying(true)
    try {
      const result = await ordersApi.create({
        items: items.map((item) => ({ productId: item.id, quantity: item.qty })),
        paymentMethod: 'mtn_money',
        whatsappNumber: whatsapp,
        quartier,
        city,
      })
      onSuccess(result?.order)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPaying(false)
    }
  }

  return (
    <Modal
      isOpen
      title={t.checkoutTitle}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t.cancel}</Button>
          <Button variant="primary" loading={paying} onClick={handleOrder}>{t.confirmOrder}</Button>
        </>
      }
    >
      <div className={styles.checkoutSummary}>
        {items.map((item) => (
          <div key={item.id} className={styles.checkoutRow}>
            <span>{item.emoji || '🎁'} {item.name} ×{item.qty}</span>
            <strong>{(item.price * item.qty).toLocaleString()} F</strong>
          </div>
        ))}
        <div className={styles.checkoutTotal}><span>{t.total}</span><strong>{total.toLocaleString()} FCFA</strong></div>
      </div>

      <div className={styles.formGridCompact}>
        <div>
          <label className={styles.pLabel}>WhatsApp *</label>
          <input className={styles.pInput} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+237 6XX XXX XXX" />
        </div>
        <div>
          <label className={styles.pLabel}>{t.city}</label>
          <select className={styles.pInput} value={city} onChange={(e) => { setCity(e.target.value); setQuartier('') }}>
            {['Yaoundé', 'Douala', 'Bafoussam', 'Autre'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className={styles.pLabel}>{t.quartier}</label>
          {quartiersForCity.length ? (
            <select className={styles.pInput} value={quartier} onChange={(e) => setQuartier(e.target.value)}>
              <option value="">-- {t.quartier} --</option>
              {quartiersForCity.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          ) : (
            <input className={styles.pInput} value={quartier} onChange={(e) => setQuartier(e.target.value)} placeholder="Ex: Akwa Nord" />
          )}
        </div>
      </div>

      <div className={styles.checkoutNote}>
        <MessageCircle size={18} />
        <p>{t.paymentInfo}</p>
      </div>
    </Modal>
  )
}

function WishlistTab({ t, toast, addItem, setTab }) {
  const { data, loading, execute } = useApi(() => usersApi.getWishlist(), [], true)
  const wishlist = data?.wishlist || []

  const addProduct = (product) => {
    addItem(product)
    toast.success(t.added)
    setTab('cart')
  }

  const removeProduct = async (productId) => {
    try {
      await usersApi.toggleWishlist(productId)
      execute()
      toast.info(t.removedWishlist)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading) return <PageLoader />
  if (!wishlist.length) return <EmptyState icon="❤️" title={t.emptyWishlist} message={t.emptyWishlistMsg} />

  return (
    <>
      <div className={styles.secTitle}><Heart size={18} />{t.wishlistTitle(wishlist.length)}</div>
      <div className={styles.itemsGrid}>
        {wishlist.map((product) => (
          <div key={product.id} className={styles.itemCard}>
            <div className={styles.itemImg}>{product.emoji || '🎁'}</div>
            <div className={styles.itemBody}>
              <div className={styles.itemName}>{product.nameF}</div>
              <div className={styles.itemPrice}>{product.price?.toLocaleString()} FCFA</div>
              <div className={styles.itemBtns}>
                <Button variant="primary" size="sm" onClick={() => addProduct(product)}>{t.addToCart}</Button>
                <Button variant="danger" size="sm" onClick={() => removeProduct(product.id)}>{t.remove}</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function OrdersTab({ t, orders, loading, onSelect }) {
  if (loading) return <PageLoader />
  if (!orders.length) return <EmptyState icon="📦" title={t.emptyOrders} message={t.emptyOrdersMsg} />

  return (
    <>
      <div className={styles.secTitle}><Package size={18} />{t.ordersTitle(orders.length)}</div>
      <div className={styles.ordersList}>
        {orders.map((order) => {
          const currentStep = STEP_ORDER.indexOf(order.status)
          const activeTrack = !['cancelled', 'refunded'].includes(order.status)
          return (
            <div key={order.id} className={styles.orderCard} onClick={() => onSelect(order)}>
              <div className={styles.orderTop}>
                <span className={styles.orderNum}>{order.orderNumber}</span>
                <Badge variant={statusVariant(order.status)}>{t.status[order.status] || order.status}</Badge>
              </div>

              {activeTrack && (
                <div className={styles.progressWrap}>
                  <div className={styles.progressLine}><div className={styles.progressFill} style={{ width: `${Math.max(0, (currentStep / (STEP_ORDER.length - 1)) * 100)}%` }} /></div>
                  {STEP_ORDER.map((status, index) => (
                    <div key={status} className={styles.progressStep}>
                      <div className={`${styles.progressDot} ${index <= currentStep ? styles.progressDotActive : ''}`}>{index <= currentStep ? <Check size={12} /> : index + 1}</div>
                      <span>{t.status[status]}</span>
                    </div>
                  ))}
                </div>
              )}

              <p className={styles.orderDesc}>{t.statusDesc[order.status]}</p>
              <div className={styles.orderItems}>
                {(order.items || []).map((item, index) => (
                  <span key={index} className={styles.orderChip}>{item.emoji || '🎁'} {item.nameF || item.name} ×{item.quantity}</span>
                ))}
              </div>
              <div className={styles.orderBottom}>
                <div>
                  <div className={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                  {order.quartier && <div className={styles.orderMeta}><MapPin size={14} />{order.quartier}, {order.city}</div>}
                </div>
                <span className={styles.orderTotal}>{order.total?.toLocaleString()} FCFA</span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function OrderDetailModal({ t, order, onClose }) {
  const currentStep = STEP_ORDER.indexOf(order.status)
  const activeTrack = !['cancelled', 'refunded'].includes(order.status)

  return (
    <Modal isOpen title={order.orderNumber} onClose={onClose}>
      {activeTrack && (
        <div className={styles.detailProgress}>
          <div className={styles.progressLine}><div className={styles.progressFill} style={{ width: `${Math.max(0, (currentStep / (STEP_ORDER.length - 1)) * 100)}%` }} /></div>
          {STEP_ORDER.map((status, index) => (
            <div key={status} className={styles.progressStep}>
              <div className={`${styles.progressDot} ${index <= currentStep ? styles.progressDotActive : ''}`}>{index <= currentStep ? <Check size={12} /> : index + 1}</div>
              <span>{t.status[status]}</span>
            </div>
          ))}
        </div>
      )}

      <p className={styles.orderDesc}>{t.statusDesc[order.status]}</p>

      <div className={styles.detailBox}>
        <div className={styles.detailTitle}>{t.orderedItems}</div>
        {(order.items || []).map((item, index) => (
          <div key={index} className={styles.checkoutRow}>
            <span>{item.emoji || '🎁'} {item.nameF || item.name} ×{item.quantity}</span>
            <strong>{item.lineTotal?.toLocaleString()} F</strong>
          </div>
        ))}
        <div className={styles.checkoutTotal}><span>{t.total}</span><strong>{order.total?.toLocaleString()} FCFA</strong></div>
      </div>

      <div className={styles.detailBox}>
        <div className={styles.detailTitle}>{t.deliveryDetails}</div>
        <div className={styles.checkoutRow}><span>WhatsApp</span><strong>{order.whatsappNumber || '—'}</strong></div>
        <div className={styles.checkoutRow}><span>{t.quartier}</span><strong>{order.quartier || '—'}</strong></div>
        <div className={styles.checkoutRow}><span>{t.city}</span><strong>{order.city || '—'}</strong></div>
      </div>

      {order.statusHistory?.length > 0 && (
        <div className={styles.detailBox}>
          <div className={styles.detailTitle}>{t.orderHistory}</div>
          {order.statusHistory.map((entry, index) => (
            <div key={index} className={styles.historyRow}>
              <div className={styles.historyDot} />
              <div>
                <div className={styles.historyStatus}>{t.status[entry.status] || entry.status}</div>
                <div className={styles.historyMeta}>{new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

function ProfilTab({ t, user, toast, updateUser }) {
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || user?.phone || '',
    city: user?.city || 'Yaoundé',
    quartier: user?.quartier || '',
  })
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const { mutate: saveProfil, loading: savingProfile } = useMutation(usersApi.updateProfile)
  const { mutate: changePwd, loading: changingPwd } = useMutation(usersApi.changePassword)

  const save = async () => {
    const { data, error } = await saveProfil(form)
    if (error) {
      toast.error(error)
      return
    }
    updateUser(data?.user || form)
    toast.success(t.profileUpdated)
  }

  const updatePassword = async () => {
    if (newPwd.length < 8) {
      toast.error(t.passwordShort)
      return
    }
    const { error } = await changePwd({ currentPassword: oldPwd, newPassword: newPwd })
    if (error) {
      toast.error(error)
      return
    }
    setOldPwd('')
    setNewPwd('')
    toast.success(t.passwordUpdated)
  }

  return (
    <div className={styles.profileForms}>
      <div className={styles.formCard}>
        <div className={styles.secTitle}><UserRound size={18} />{t.profileTab}</div>
        <div className={styles.formGrid}>
          <div><label className={styles.pLabel}>{t.firstName}</label><input className={styles.pInput} value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} /></div>
          <div><label className={styles.pLabel}>{t.lastName}</label><input className={styles.pInput} value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} /></div>
          <div><label className={styles.pLabel}>{t.phone}</label><input className={styles.pInput} value={form.phone} onChange={(e) => setField('phone', e.target.value)} /></div>
          <div><label className={styles.pLabel}>{t.whatsapp}</label><input className={styles.pInput} value={form.whatsapp} onChange={(e) => setField('whatsapp', e.target.value)} /></div>
          <div>
            <label className={styles.pLabel}>{t.city}</label>
            <select className={styles.pInput} value={form.city} onChange={(e) => setField('city', e.target.value)}>
              {['Yaoundé', 'Douala', 'Bafoussam', 'Autre'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.pLabel}>{t.quartier}</label>
            <select className={styles.pInput} value={form.quartier} onChange={(e) => setField('quartier', e.target.value)}>
              <option value="">-- {t.quartier} --</option>
              {(QUARTIERS[form.city] || []).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>
        <Button variant="primary" loading={savingProfile} onClick={save}>{t.save}</Button>
      </div>

      <div className={styles.formCard}>
        <div className={styles.secTitle}><ShieldCheck size={18} />{t.password}</div>
        <div className={styles.formGrid}>
          <div><label className={styles.pLabel}>{t.currentPwd}</label><input type="password" className={styles.pInput} value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} /></div>
          <div><label className={styles.pLabel}>{t.newPwd}</label><input type="password" className={styles.pInput} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} /></div>
        </div>
        <Button variant="ghost" loading={changingPwd} onClick={updatePassword}>{t.changePwd}</Button>
      </div>
    </div>
  )
}
