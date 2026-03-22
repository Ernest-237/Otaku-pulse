// src/pages/Profil/index.jsx — Flow WhatsApp + Quartier + Suivi commande
import { useState, useEffect } from 'react'
import { Link, useNavigate }   from 'react-router-dom'
import { useAuth }   from '../../contexts/AuthContext'
import { useCart }   from '../../contexts/CartContext'
import { useToast }  from '../../contexts/ToastContext'
import { useApi, useMutation } from '../../hooks/useApi'
import { usersApi, ordersApi } from '../../api'
import QUARTIERS from '../../data/quartiers'
import Modal   from '../../components/ui/Modal'
import Button  from '../../components/ui/Button'
import Badge, { statusVariant, STATUS_LABELS } from '../../components/ui/Badge'
import { PageLoader, EmptyState } from '../../components/ui/Spinner'
import styles from './Profil.module.css'

const STATUSES_STEPS = ['pending','confirmed','preparing','shipped','delivered']
const STATUS_FR = {
  pending:'⏳ En attente', confirmed:'✅ Confirmée', preparing:'📦 En préparation',
  shipped:'🚚 En livraison', delivered:'🎉 Livrée', cancelled:'❌ Annulée', refunded:'💸 Remboursée',
}
const STATUS_DESC = {
  pending:"Commande reçue, notre équipe va vous contacter sous peu.",
  confirmed:"Votre commande est confirmée et le paiement validé.",
  preparing:"Vos articles sont en cours de préparation.",
  shipped:"Votre commande est en route vers vous !",
  delivered:"Commande livrée ! Profite de tes goodies Otaku 🎌",
  cancelled:"Cette commande a été annulée.",
  refunded:"Remboursement effectué.",
}

export default function Profil() {
  const { user, logout, updateUser } = useAuth()
  const { items, count, total, shipping, subtotal, addItem, removeItem, updateQty, clearCart } = useCart()
  const toast    = useToast()
  const navigate = useNavigate()
  const [tab,         setTab]         = useState('cart')
  const [checkoutOpen,setCheckoutOpen]= useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [lastOrder,   setLastOrder]   = useState(null)
  const [ordering,    setOrdering]    = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => { document.title = 'Mon Profil — Otaku Pulse' }, [])

  if (!user) return (
    <div className={styles.notLogged}>
      <div className={styles.notLoggedInner}>
        <span style={{ fontSize:'4rem' }}>🔒</span>
        <h2 className={styles.notLoggedTitle}>Connexion requise</h2>
        <p style={{ color:'var(--muted)', marginBottom:'1.5rem' }}>Tu dois être connecté pour accéder à ton profil.</p>
        <Link to="/" className={styles.backBtn}>⚡ Se connecter</Link>
      </div>
    </div>
  )

  const handleLogout = async () => { await logout(); navigate('/') }

  const { data: ordersData, execute: refetchOrders } = useApi(() => ordersApi.getMy(), [], true)
  const ordersCount = ordersData?.orders?.length || 0

  const TABS = [
    { id:'cart',     icon:'🛒', label:'Panier'    },
    { id:'wishlist', icon:'❤️', label:'Favoris'   },
    { id:'orders',   icon:'📦', label:'Commandes' },
    { id:'profil',   icon:'👤', label:'Profil'    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <Link to="/" className={styles.logo}><span className={styles.bolt}>⚡</span><span className={styles.brand}>OTAKU PULSE</span></Link>
        <nav className={styles.topNav}><Link to="/">← Accueil</Link><Link to="/blog">Blog</Link></nav>
      </div>

      {/* Hero profil */}
      <div className={styles.profileHero}>
        <div className={styles.heroInner}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>{user.avatar || '🎌'}</div>
            <div className={styles.onlineDot} />
          </div>
          <div className={styles.heroInfo}>
            <div className={styles.heroPseudo}>{user.pseudo}</div>
            <div className={styles.heroEmail}>{user.email}</div>
            <div className={styles.heroBadges}>
              {user.role==='superadmin' && <Badge variant="red">👑 Super Admin</Badge>}
              {user.role==='admin'      && <Badge variant="amber">⚙️ Admin</Badge>}
              {user.role==='user'       && <Badge variant="gray">🎌 Otaku</Badge>}
              {user.isVerified          && <Badge variant="green">✅ Vérifié</Badge>}
              {user.city                && <Badge variant="blue">📍 {user.city}</Badge>}
            </div>
            <div className={styles.quickStats}>
              <div className={styles.qStat}><span className={styles.qStatVal}>{count}</span><span className={styles.qStatLbl}>Panier</span></div>
              <div className={styles.qStat}><span className={styles.qStatVal}>{ordersCount}</span><span className={styles.qStatLbl}>Commandes</span></div>
              <div className={styles.qStat}><span className={styles.qStatVal}>{total > 0 ? `${Math.round(total/1000)}K` : '0'}</span><span className={styles.qStatLbl}>FCFA</span></div>
            </div>
          </div>
          <div className={styles.heroActions}>
            <Button variant="primary" onClick={() => setTab('cart')}>
              🛒 Panier{count > 0 && <span className={styles.cartBadge}>{count}</span>}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setTab('profil')}>✏️ Modifier</Button>
            <Button variant="danger" size="sm" onClick={handleLogout}>🚪</Button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button key={t.id} className={`${styles.tab} ${tab===t.id?styles.tabActive:''}`} onClick={() => setTab(t.id)}>
              <span className={styles.tabIcon}>{t.icon}</span>{t.label}
              {t.id==='cart' && count > 0 && <span className={styles.tabBadge}>{count}</span>}
              {t.id==='orders' && ordersCount > 0 && <span className={styles.tabBadge}>{ordersCount}</span>}
            </button>
          ))}
        </div>

        {/* TAB PANIER */}
        {tab === 'cart' && (
          items.length === 0
            ? <EmptyState icon="🛒" title="Ton panier est vide" message="Explore la boutique et ajoute des goodies !" />
            : (
              <div className={styles.cartLayout}>
                <div>
                  <div className={styles.secTitle}>🛒 Articles ({count})</div>
                  <div className={styles.cartItems}>
                    {items.map(item => (
                      <div key={item.id} className={styles.cartCard}>
                        <div className={styles.cartThumb}>
                          {item.imageUrl
                            ? <img src={item.imageUrl} alt={item.name} />
                            : <span className={styles.cartEmoji}>{item.emoji||'🎁'}</span>}
                        </div>
                        <div className={styles.cartInfo}>
                          <div className={styles.cartName}>{item.name}</div>
                          <div className={styles.cartPrice}>{(item.price*item.qty).toLocaleString()} FCFA</div>
                          <div className={styles.cartActions}>
                            <div className={styles.qtyBox}>
                              <button className={styles.qtyBtn} onClick={() => updateQty(item.id,-1)}>−</button>
                              <span className={styles.qtyNum}>{item.qty}</span>
                              <button className={styles.qtyBtn} onClick={() => updateQty(item.id,+1)}>+</button>
                            </div>
                            <button className={styles.rmBtn} onClick={() => removeItem(item.id)}>🗑️</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.summary}>
                  <div className={styles.summaryTitle}>📋 Récapitulatif</div>
                  <div className={styles.summaryRow}><span>Sous-total</span><span>{subtotal.toLocaleString()} FCFA</span></div>
                  <div className={styles.summaryRow}>
                    <span>Livraison</span>
                    <span style={{ color:shipping===0?'var(--green)':undefined }}>{shipping===0?'🎁 Gratuite':`${shipping.toLocaleString()} FCFA`}</span>
                  </div>
                  {shipping > 0 && <p style={{ fontSize:'.72rem', color:'var(--green)', textAlign:'center', marginBottom:'.5rem' }}>Gratuite dès 15 000 FCFA 🎌</p>}
                  <div className={styles.summaryTotal}><span>Total</span><span>{total.toLocaleString()} FCFA</span></div>
                  <button className={styles.orderBtn} onClick={() => setCheckoutOpen(true)}>
                    ⚡ Finaliser l'achat
                  </button>
                  <p className={styles.orderNote}>
                    Livraison sur tout le Cameroun 🇨🇲<br/>
                    Paiement : MTN Money / Orange Money
                  </p>
                </div>
              </div>
            )
        )}

        {/* TAB FAVORIS */}
        {tab === 'wishlist' && <WishlistTab toast={toast} addItem={addItem} setTab={setTab} />}

        {/* TAB COMMANDES */}
        {tab === 'orders' && (
          <OrdersTab
            orders={ordersData?.orders || []}
            loading={!ordersData}
            onSelect={setSelectedOrder}
          />
        )}

        {/* TAB PROFIL */}
        {tab === 'profil' && <ProfilTab user={user} toast={toast} updateUser={updateUser} />}
      </div>

      {/* MODAL CHECKOUT — WhatsApp + Quartier */}
      {checkoutOpen && (
        <CheckoutModal
          items={items} total={total} shipping={shipping} subtotal={subtotal}
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

      {/* Modal succès */}
      <Modal isOpen={successOpen} onClose={() => { setSuccessOpen(false); setTab('orders') }}
        footer={<Button variant="primary" onClick={() => { setSuccessOpen(false); setTab('orders') }}>📦 Suivre ma commande</Button>}
      >
        <div style={{ textAlign:'center', padding:'2rem 0' }}>
          <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>✅</div>
          <h2 style={{ fontFamily:'var(--font-title)', fontSize:'1.8rem', letterSpacing:'3px', color:'var(--green)', marginBottom:'1rem' }}>COMMANDE ENVOYÉE !</h2>
          <p style={{ color:'var(--muted)', lineHeight:1.8, fontSize:'.92rem' }}>
            {lastOrder && <><strong style={{ color:'var(--green)', fontFamily:'var(--font-title)', fontSize:'1.1rem' }}>{lastOrder.orderNumber}</strong><br/></>}
            Notre équipe va vous contacter sur <strong>WhatsApp</strong> pour confirmer et organiser la livraison à <strong>{lastOrder?.quartier}</strong>. 🎌<br/><br/>
            Paiement : <strong>MTN Money / Orange Money</strong>
          </p>
        </div>
      </Modal>

      {/* Détail commande */}
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  )
}

// ── MODAL CHECKOUT ────────────────────────────────────
function CheckoutModal({ items, total, shipping, subtotal, user, onClose, onSuccess, toast }) {
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || user?.phone || '')
  const [city,     setCity]     = useState(user?.city || 'Yaoundé')
  const [quartier, setQuartier] = useState(user?.quartier || '')
  const [manualQ,  setManualQ]  = useState(false)
  const [paying,   setPaying]   = useState(false)

  const quartiersForCity = QUARTIERS[city] || []

  const handleOrder = async () => {
    if (!whatsapp.trim()) { toast.error('Numéro WhatsApp requis'); return }
    if (!quartier.trim())  { toast.error('Quartier de livraison requis'); return }

    setPaying(true)
    try {
      const result = await ordersApi.create({
        items: items.map(i => ({ productId:i.id, quantity:i.qty })),
        paymentMethod: 'mtn_money',
        whatsappNumber: whatsapp,
        quartier,
        city,
      })
      await ordersApi.notify({
        orderId:       result?.order?.id,
        orderNum:      result?.order?.orderNumber,
        userEmail:     user.email,
        userPhone:     user.phone,
        userName:      user.pseudo,
        whatsappNumber:whatsapp,
        quartier,
        city,
        total,
      }).catch(() => {})
      onSuccess(result?.order)
    } catch(err) { toast.error(err.message) }
    finally { setPaying(false) }
  }

  return (
    <Modal isOpen title="⚡ Finaliser l'achat" onClose={onClose} wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="primary" loading={paying} onClick={handleOrder}
            style={{ background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#0c1a2e', padding:'12px 28px' }}>
            ⚡ Confirmer la commande
          </Button>
        </>
      }
    >
      {/* Récap articles */}
      <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem', marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', textTransform:'uppercase', marginBottom:10 }}>📦 Récapitulatif</div>
        {items.map(i => (
          <div key={i.id} style={{ display:'flex', justifyContent:'space-between', fontSize:'.85rem', marginBottom:5 }}>
            <span>{i.emoji||'🎁'} {i.name} ×{i.qty}</span>
            <span style={{ color:'var(--green)', fontFamily:'var(--font-title)' }}>{(i.price*i.qty).toLocaleString()} F</span>
          </div>
        ))}
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:8, marginTop:8, display:'flex', justifyContent:'space-between', fontFamily:'var(--font-title)', fontSize:'1.1rem' }}>
          <span>Total</span><span style={{ color:'var(--green)' }}>{total.toLocaleString()} FCFA</span>
        </div>
      </div>

      {/* Livraison */}
      <div style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', textTransform:'uppercase', marginBottom:12 }}>🚚 Informations de livraison</div>

      {/* WhatsApp */}
      <div style={{ marginBottom:'1rem' }}>
        <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:5, textTransform:'uppercase' }}>
          📱 Numéro WhatsApp * <span style={{ color:'var(--green)', fontSize:'.7rem' }}>(pour suivi de commande)</span>
        </label>
        <input
          value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
          placeholder="+237 6XX XXX XXX"
          style={{ width:'100%', padding:'11px 14px', borderRadius:10, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.95rem', outline:'none', transition:'border-color .2s' }}
          onFocus={e=>e.target.style.borderColor='#22c55e'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}
        />
      </div>

      {/* Ville */}
      <div style={{ marginBottom:'1rem' }}>
        <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:5, textTransform:'uppercase' }}>Ville *</label>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {['Yaoundé','Douala','Bafoussam','Autre'].map(c => (
            <button key={c} onClick={() => { setCity(c); setQuartier(''); setManualQ(c==='Autre') }}
              style={{ padding:'8px 18px', borderRadius:50, cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:700, fontSize:'.85rem',
                background: city===c ? 'rgba(34,197,94,.15)' : 'rgba(255,255,255,.04)',
                border: `1px solid ${city===c ? '#22c55e' : 'rgba(255,255,255,.1)'}`,
                color: city===c ? '#22c55e' : 'var(--muted)', transition:'all .2s',
              }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Quartier */}
      <div style={{ marginBottom:'1.5rem' }}>
        <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:5, textTransform:'uppercase' }}>
          📍 Quartier de livraison *
        </label>
        {!manualQ && quartiersForCity.length > 0 ? (
          <>
            <select
              value={quartier} onChange={e => setQuartier(e.target.value)}
              style={{ width:'100%', padding:'11px 14px', borderRadius:10, background:'rgba(255,255,255,.04)', border:`1px solid ${quartier?'#22c55e':'rgba(255,255,255,.1)'}`, color: quartier?'var(--text)':'var(--muted)', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none' }}
            >
              <option value="">-- Choisir mon quartier --</option>
              {quartiersForCity.map(q => <option key={q} value={q} style={{ background:'#0c1a2e' }}>{q}</option>)}
              <option value="__manual__" style={{ background:'#0c1a2e' }}>Mon quartier n'est pas dans la liste...</option>
            </select>
            {quartier === '__manual__' && (
              <input
                autoFocus value="" onChange={e => setQuartier(e.target.value)}
                placeholder="Entrer votre quartier manuellement"
                style={{ width:'100%', padding:'11px 14px', borderRadius:10, background:'rgba(255,255,255,.04)', border:'1px solid #22c55e', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none', marginTop:8 }}
              />
            )}
          </>
        ) : (
          <input
            value={quartier} onChange={e => setQuartier(e.target.value)}
            placeholder="Entrer votre quartier (ex: Akwa Nord, Biyem-Assi...)"
            style={{ width:'100%', padding:'11px 14px', borderRadius:10, background:'rgba(255,255,255,.04)', border:`1px solid ${quartier?'#22c55e':'rgba(255,255,255,.1)'}`, color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none', transition:'border-color .2s' }}
            onFocus={e=>e.target.style.borderColor='#22c55e'} onBlur={e=>e.target.style.borderColor=quartier?'#22c55e':'rgba(255,255,255,.1)'}
          />
        )}
      </div>

      {/* Info paiement */}
      <div style={{ background:'rgba(34,197,94,.06)', border:'1px solid rgba(34,197,94,.15)', borderRadius:12, padding:'1rem', display:'flex', gap:12, alignItems:'flex-start' }}>
        <span style={{ fontSize:'1.5rem', flexShrink:0 }}>💬</span>
        <div style={{ fontSize:'.82rem', color:'var(--muted)', lineHeight:1.7 }}>
          Après confirmation, notre équipe vous contacte sur <strong style={{ color:'var(--text)' }}>WhatsApp</strong> pour le paiement via <strong style={{ color:'#f97316' }}>MTN Money</strong> ou <strong style={{ color:'#f59e0b' }}>Orange Money</strong>, puis organise la livraison dans votre quartier.
        </div>
      </div>
    </Modal>
  )
}

// ── WISHLIST TAB ──────────────────────────────────────
function WishlistTab({ toast, addItem, setTab }) {
  const { data, loading, execute } = useApi(() => usersApi.getWishlist(), [], true)
  const wishlist = data?.wishlist || []
  const handleAdd = p => { addItem(p); toast.success(`✅ ${p.nameF} ajouté !`); setTab('cart') }
  const handleRm  = async pid => {
    try { await usersApi.toggleWishlist(pid); execute(); toast.info('Retiré des favoris') }
    catch(err) { toast.error(err.message) }
  }
  if (loading) return <PageLoader />
  if (!wishlist.length) return <EmptyState icon="❤️" title="Aucun favori" message="Clique sur ❤️ dans la boutique." />
  return (
    <>
      <div className={styles.secTitle}>❤️ Mes Favoris ({wishlist.length})</div>
      <div className={styles.itemsGrid}>
        {wishlist.map(p => (
          <div key={p.id} className={styles.itemCard}>
            <div className={styles.itemImg}>{p.emoji||'🎁'}</div>
            <div className={styles.itemBody}>
              <div className={styles.itemName}>{p.nameF}</div>
              <div className={styles.itemPrice}>{p.price?.toLocaleString()} FCFA</div>
              <div className={styles.itemBtns}>
                <Button variant="primary" size="sm" onClick={() => handleAdd(p)}>🛒</Button>
                <Button variant="danger"  size="sm" onClick={() => handleRm(p.id)}>❌</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ── ORDERS TAB ────────────────────────────────────────
function OrdersTab({ orders, loading, onSelect }) {
  if (loading) return <PageLoader />
  if (!orders.length) return <EmptyState icon="📦" title="Aucune commande" message="Tes commandes apparaîtront ici." />

  return (
    <>
      <div className={styles.secTitle}>📦 Mes Commandes ({orders.length})</div>
      <div className={styles.ordersList}>
        {orders.map(o => {
          const step  = STATUSES_STEPS.indexOf(o.status)
          const isActive = !['cancelled','refunded'].includes(o.status)
          return (
            <div key={o.id} className={styles.orderCard} onClick={() => onSelect(o)} style={{ cursor:'pointer' }}>
              <div className={styles.orderTop}>
                <span className={styles.orderNum}>{o.orderNumber}</span>
                <Badge variant={statusVariant(o.status)} style={{ fontSize:'.72rem' }}>{STATUS_FR[o.status]||o.status}</Badge>
              </div>

              {/* Mini progress */}
              {isActive && (
                <div style={{ display:'flex', gap:0, marginBottom:'1rem', position:'relative' }}>
                  <div style={{ position:'absolute', top:9, left:0, right:0, height:2, background:'rgba(255,255,255,.08)', borderRadius:2 }}>
                    <div style={{ height:'100%', width:`${Math.max(0,(step/(STATUSES_STEPS.length-1))*100)}%`, background:'var(--green)', borderRadius:2, transition:'width .5s' }} />
                  </div>
                  {STATUSES_STEPS.map((s,i) => (
                    <div key={s} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, zIndex:1 }}>
                      <div style={{ width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.65rem', fontWeight:700, background:i<=step?'var(--green)':'rgba(255,255,255,.1)', border:`2px solid ${i<=step?'var(--green)':'rgba(255,255,255,.2)'}` }}>
                        {i<=step?'✓':i+1}
                      </div>
                      <span style={{ fontSize:'.55rem', color:i<=step?'var(--green)':'var(--muted)', fontWeight:700, textAlign:'center', whiteSpace:'nowrap' }}>
                        {STATUS_FR[s]?.replace(/^[^a-zA-Z]+/,'').split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <p style={{ fontSize:'.8rem', color:'var(--muted)', marginBottom:'.7rem', lineHeight:1.5 }}>{STATUS_DESC[o.status]}</p>

              <div className={styles.orderItems}>
                {(Array.isArray(o.items)?o.items:[]).map((item,i) => (
                  <span key={i} className={styles.orderChip}>{item.emoji||'🎁'} {item.nameF||item.name} ×{item.quantity}</span>
                ))}
              </div>
              <div className={styles.orderBottom}>
                <div>
                  <span className={styles.orderDate}>{new Date(o.createdAt).toLocaleDateString('fr-FR',{dateStyle:'medium'})}</span>
                  {o.quartier && <div style={{ fontSize:'.72rem', color:'var(--muted)' }}>📍 {o.quartier}, {o.city}</div>}
                </div>
                <span className={styles.orderTotal}>{o.total?.toLocaleString()} FCFA</span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ── ORDER DETAIL MODAL ────────────────────────────────
function OrderDetailModal({ order:o, onClose }) {
  const step = STATUSES_STEPS.indexOf(o.status)
  const isActive = !['cancelled','refunded'].includes(o.status)
  return (
    <Modal isOpen title={`📦 ${o.orderNumber}`} onClose={onClose}>
      {/* Progress */}
      {isActive && (
        <div style={{ marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', position:'relative', justifyContent:'space-between', marginBottom:'.5rem' }}>
            <div style={{ position:'absolute', top:14, left:0, right:0, height:3, background:'rgba(255,255,255,.08)', borderRadius:2 }}>
              <div style={{ height:'100%', width:`${Math.max(0,(step/(STATUSES_STEPS.length-1))*100)}%`, background:'var(--green)', borderRadius:2, transition:'width .6s' }} />
            </div>
            {STATUSES_STEPS.map((s,i) => (
              <div key={s} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, zIndex:1 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.8rem', fontWeight:700, background:i<=step?'var(--green)':'rgba(255,255,255,.1)', border:`2px solid ${i<=step?'var(--green)':'rgba(255,255,255,.2)'}`, boxShadow:i===step?'0 0 12px rgba(34,197,94,.5)':'none' }}>
                  {i<=step?'✓':i+1}
                </div>
                <span style={{ fontSize:'.65rem', color:i<=step?'var(--green)':'var(--muted)', fontWeight:700, whiteSpace:'nowrap' }}>{STATUS_FR[s]?.replace(/^[^a-zA-Z]/,'').split(' ').slice(0,2).join(' ')}</span>
              </div>
            ))}
          </div>
          <p style={{ textAlign:'center', fontSize:'.88rem', color:'var(--muted)', marginTop:'1rem', lineHeight:1.6 }}>{STATUS_DESC[o.status]}</p>
        </div>
      )}

      {/* Articles */}
      <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem', marginBottom:'1rem' }}>
        <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:10 }}>Articles commandés</div>
        {(o.items||[]).map((item,i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'.85rem', marginBottom:5, paddingBottom:5, borderBottom:'1px solid rgba(255,255,255,.05)' }}>
            <span>{item.emoji||'🎁'} {item.nameF} ×{item.quantity}</span>
            <span style={{ fontFamily:'var(--font-title)', color:'var(--green)' }}>{item.lineTotal?.toLocaleString()} F</span>
          </div>
        ))}
        <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--font-title)', fontSize:'1.1rem', paddingTop:8, borderTop:'1px solid var(--border)', marginTop:4 }}>
          <span>Total</span><span style={{ color:'var(--green)' }}>{o.total?.toLocaleString()} FCFA</span>
        </div>
      </div>

      {/* Livraison */}
      <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem', marginBottom:'1rem' }}>
        <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:10 }}>Informations de livraison</div>
        {[['WhatsApp',o.whatsappNumber||'—'],['Quartier',o.quartier||'—'],['Ville',o.city||'—'],['Paiement',o.paymentMethod]].map(([l,v])=>(
          <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:'.85rem', marginBottom:6 }}>
            <span style={{ color:'var(--muted)' }}>{l}</span><strong>{v}</strong>
          </div>
        ))}
      </div>

      {/* Historique */}
      {o.statusHistory?.length > 0 && (
        <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem' }}>
          <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:10 }}>📋 Historique</div>
          {o.statusHistory.map((h,i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:8 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--green)', flexShrink:0, marginTop:5 }} />
              <div>
                <div style={{ fontSize:'.82rem', fontWeight:700 }}>{STATUS_FR[h.status]||h.status}</div>
                <div style={{ fontSize:'.72rem', color:'var(--muted)' }}>
                  {new Date(h.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'})}
                  {h.note && ` — ${h.note}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

// ── PROFIL FORM ───────────────────────────────────────
function ProfilTab({ user, toast, updateUser }) {
  const [form, setForm] = useState({ firstName:user.firstName||'', lastName:user.lastName||'', phone:user.phone||'', whatsapp:user.whatsapp||user.phone||'', city:user.city||'Yaoundé', quartier:user.quartier||'' })
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const s = (k,v) => setForm(f=>({...f,[k]:v}))
  const { mutate:saveProfil, loading:lP } = useMutation(usersApi.updateProfile)
  const { mutate:changePwd,  loading:lC } = useMutation(usersApi.changePassword)

  const handleSave = async () => {
    const { data, error } = await saveProfil(form)
    if (error) { toast.error(error); return }
    updateUser(data?.user || form); toast.success('✅ Profil mis à jour !')
  }
  const handlePwd = async () => {
    if (newPwd.length < 8) { toast.error('Minimum 8 caractères'); return }
    const { error } = await changePwd({ currentPassword:oldPwd, newPassword:newPwd })
    if (error) { toast.error(error); return }
    setOldPwd(''); setNewPwd(''); toast.success('✅ Mot de passe modifié !')
  }

  return (
    <div className={styles.profilLayout}>
      <div className={styles.profilCard}>
        <h3 className={styles.profilCardTitle}>✏️ Mes informations</h3>
        <div className={styles.profilGrid}>
          {[['Prénom','firstName'],['Nom','lastName']].map(([l,k]) => (
            <div key={k}><label className={styles.pLabel}>{l}</label><input className={styles.pInput} value={form[k]} onChange={e=>s(k,e.target.value)} /></div>
          ))}
          <div><label className={styles.pLabel}>Téléphone</label><input className={styles.pInput} value={form.phone} onChange={e=>s('phone',e.target.value)} placeholder="+237 6XX XXX XXX" /></div>
          <div><label className={styles.pLabel}>WhatsApp</label><input className={styles.pInput} value={form.whatsapp} onChange={e=>s('whatsapp',e.target.value)} placeholder="+237 6XX XXX XXX" /></div>
          <div>
            <label className={styles.pLabel}>Ville</label>
            <select className={styles.pInput} value={form.city} onChange={e=>s('city',e.target.value)}>
              {['Yaoundé','Douala','Bafoussam','Autre'].map(c=><option key={c} value={c} style={{ background:'#0c1a2e' }}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.pLabel}>Quartier habituel</label>
            <select className={styles.pInput} value={form.quartier} onChange={e=>s('quartier',e.target.value)}>
              <option value="">-- Choisir --</option>
              {(QUARTIERS[form.city]||[]).map(q=><option key={q} value={q} style={{ background:'#0c1a2e' }}>{q}</option>)}
              <option value="" disabled>──────────</option>
            </select>
          </div>
        </div>
        <Button variant="primary" loading={lP} onClick={handleSave}>💾 Enregistrer</Button>
      </div>
      <div className={styles.profilCard}>
        <h3 className={styles.profilCardTitle}>🔒 Mot de passe</h3>
        <div className={styles.profilGrid}>
          <div><label className={styles.pLabel}>Actuel</label><input type="password" className={styles.pInput} value={oldPwd} onChange={e=>setOldPwd(e.target.value)} /></div>
          <div><label className={styles.pLabel}>Nouveau (min 8)</label><input type="password" className={styles.pInput} value={newPwd} onChange={e=>setNewPwd(e.target.value)} /></div>
        </div>
        <Button variant="ghost" loading={lC} onClick={handlePwd}>🔒 Modifier</Button>
      </div>
    </div>
  )
}