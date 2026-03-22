// src/pages/Admin/sections/OrdersSection.jsx — Suivi dynamique commandes
import { useState } from 'react'
import { adminApi, ordersApi } from '../../../api'
import { useApi } from '../../../hooks/useApi'
import Modal  from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge, { statusVariant, STATUS_LABELS } from '../../../components/ui/Badge'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
import styles from '../Admin.module.css'

const STATUSES = [
  { key:'pending',   label:'⏳ En attente',      desc:'Commande reçue, pas encore traitée',  color:'#f59e0b' },
  { key:'confirmed', label:'✅ Confirmée',        desc:'Commande confirmée, paiement reçu',   color:'#22c55e' },
  { key:'preparing', label:'📦 Préparation',     desc:'Articles en cours de préparation',    color:'#3b82f6' },
  { key:'shipped',   label:'🚚 Expédiée',         desc:'Commande en route vers le client',    color:'#8b5cf6' },
  { key:'delivered', label:'✅ Livrée',           desc:'Commande livrée avec succès',         color:'#22c55e' },
  { key:'cancelled', label:'❌ Annulée',          desc:'Commande annulée',                   color:'#dc2626' },
  { key:'refunded',  label:'💸 Remboursée',       desc:'Remboursement effectué',             color:'#6b7280' },
]

export default function OrdersSection({ toast }) {
  const [filter,   setFilter]   = useState('all')
  const [selected, setSelected] = useState(null)
  const { data, loading, execute } = useApi(() => adminApi.getOrders({ limit:100 }), [], true)
  const orders  = data?.orders || []
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const updateStatus = async (id, status, note) => {
    try {
      await ordersApi.updateStatus(id, status, note)
      toast.success(`✅ Commande → ${STATUS_LABELS[status] || status}`)
      execute()
      // Update selected si ouvert
      if (selected?.id === id) setSelected(prev => ({
        ...prev,
        status,
        statusHistory: [...(prev.statusHistory || []), { status, date: new Date().toISOString(), note: note || '' }]
      }))
    } catch(err) { toast.error(err.message) }
  }

  if (loading) return <PageLoader />

  // Résumé par statut
  const statusCounts = {}
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1 })

  return (
    <div>
      {/* Mini kanban statuts */}
      <div style={{ display:'flex', gap:8, overflow:'auto', marginBottom:'1.5rem', paddingBottom:4 }}>
        {[{ key:'all', label:'Toutes', color:'var(--green)' }, ...STATUSES].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)} style={{
            padding:'8px 14px', borderRadius:50, whiteSpace:'nowrap', cursor:'pointer',
            background: filter===s.key ? `${s.color}22` : 'rgba(255,255,255,.04)',
            border: `1px solid ${filter===s.key ? s.color : 'rgba(255,255,255,.08)'}`,
            color: filter===s.key ? s.color : 'var(--muted)',
            fontFamily:'var(--font-body)', fontSize:'.82rem', fontWeight:700, letterSpacing:'.5px',
            display:'flex', alignItems:'center', gap:6,
          }}>
            {s.label}
            <span style={{ background:'rgba(255,255,255,.1)', borderRadius:10, padding:'2px 7px', fontSize:'.68rem' }}>
              {s.key === 'all' ? orders.length : (statusCounts[s.key] || 0)}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>🛒 Commandes ({filtered.length})</span>
          <span style={{ fontSize:'.78rem', color:'var(--muted)' }}>
            Total : {filtered.reduce((s,o) => s+(o.total||0), 0).toLocaleString()} FCFA
          </span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className={styles.table}>
            <thead><tr>
              <th>Commande</th><th>Client</th><th>Quartier</th><th>WhatsApp</th>
              <th>Total</th><th>Paiement</th><th>Statut</th><th>Date</th><th>Action</th>
            </tr></thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className={styles.tr} style={{ cursor:'pointer' }} onClick={() => setSelected(o)}>
                  <td><span style={{ fontFamily:'var(--font-title)', color:'var(--green)', fontSize:'.95rem' }}>{o.orderNumber}</span></td>
                  <td>
                    <strong>{o.user?.pseudo || '—'}</strong>
                    {o.user?.email && <div style={{ fontSize:'.75rem', color:'var(--muted)' }}>{o.user.email}</div>}
                  </td>
                  <td style={{ fontSize:'.82rem' }}>
                    {o.quartier ? <><strong>{o.quartier}</strong><div style={{ fontSize:'.72rem', color:'var(--muted)' }}>{o.city}</div></> : '—'}
                  </td>
                  <td>
                    {o.whatsappNumber
                      ? <a href={`https://wa.me/${o.whatsappNumber?.replace(/\s+/g,'')}`} target="_blank" rel="noreferrer"
                          style={{ color:'var(--green)', fontSize:'.82rem', textDecoration:'none' }}
                          onClick={e => e.stopPropagation()}>
                          💬 {o.whatsappNumber}
                        </a>
                      : <span style={{ color:'var(--muted)', fontSize:'.82rem' }}>—</span>}
                  </td>
                  <td style={{ fontFamily:'var(--font-title)', color:'var(--green)', fontSize:'.95rem' }}>{o.total?.toLocaleString()} F</td>
                  <td><Badge variant={o.paymentStatus==='paid'?'green':o.paymentStatus==='failed'?'red':'amber'} style={{ fontSize:'.65rem' }}>{o.paymentStatus}</Badge></td>
                  <td><Badge variant={statusVariant(o.status)} style={{ fontSize:'.65rem' }}>{STATUS_LABELS[o.status]||o.status}</Badge></td>
                  <td style={{ fontSize:'.75rem', color:'var(--muted)' }}>{new Date(o.createdAt).toLocaleDateString('fr-FR',{ day:'2-digit', month:'short' })}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <select className={styles.inlineSelect} value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}>
                      {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <EmptyState icon="🛒" title="Aucune commande" />}
        </div>
      </div>

      {/* Détail commande */}
      {selected && (
        <OrderDetail
          order={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={(status, note) => updateStatus(selected.id, status, note)}
        />
      )}
    </div>
  )
}

function OrderDetail({ order:o, onClose, onUpdateStatus }) {
  const [noteText, setNoteText] = useState('')

  const STEP_ORDER = ['pending','confirmed','preparing','shipped','delivered']
  const currentStep = STEP_ORDER.indexOf(o.status)

  return (
    <Modal isOpen title={`🛒 ${o.orderNumber}`} onClose={onClose} wide>
      {/* Progress bar */}
      {!['cancelled','refunded'].includes(o.status) && (
        <div style={{ marginBottom:'1.5rem' }}>
          <div style={{ display:'flex', position:'relative', justifyContent:'space-between', marginBottom:'.5rem' }}>
            {/* Ligne de progression */}
            <div style={{ position:'absolute', top:14, left:0, right:0, height:3, background:'rgba(255,255,255,.08)', borderRadius:2 }}>
              <div style={{ height:'100%', width:`${Math.max(0,(currentStep/(STEP_ORDER.length-1))*100)}%`, background:'#22c55e', borderRadius:2, transition:'width .5s' }} />
            </div>
            {STEP_ORDER.map((s,i) => {
              const done   = i <= currentStep
              const active = i === currentStep
              return (
                <div key={s} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, zIndex:1 }}>
                  <div style={{
                    width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.8rem',
                    background: done ? '#22c55e' : 'rgba(255,255,255,.1)',
                    border: `2px solid ${done ? '#22c55e' : 'rgba(255,255,255,.2)'}`,
                    boxShadow: active ? '0 0 12px rgba(34,197,94,.5)' : 'none',
                  }}>
                    {done ? '✓' : i+1}
                  </div>
                  <span style={{ fontSize:'.62rem', color: done?'var(--green)':'var(--muted)', fontWeight:700, whiteSpace:'nowrap' }}>
                    {STATUS_LABELS[s]||s}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
        <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem' }}>
          <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:'1rem' }}>📦 Détails commande</div>
          {(o.items||[]).map((item,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'.85rem', marginBottom:6, padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
              <span>{item.emoji||'🎁'} {item.nameF} ×{item.quantity}</span>
              <span style={{ color:'var(--green)', fontFamily:'var(--font-title)' }}>{item.lineTotal?.toLocaleString()} F</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.8rem', color:'var(--muted)', marginTop:8 }}>
            <span>Livraison</span><span>{o.shipping===0?'🎁 Gratuite':`${o.shipping?.toLocaleString()} F`}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--font-title)', fontSize:'1.1rem', borderTop:'1px solid var(--border)', paddingTop:8, marginTop:6 }}>
            <span>Total</span><span style={{ color:'var(--green)' }}>{o.total?.toLocaleString()} FCFA</span>
          </div>
        </div>

        <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem' }}>
          <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:'1rem' }}>🚚 Livraison client</div>
          {[
            ['Client',   o.user?.pseudo || '—'],
            ['Email',    o.user?.email  || '—'],
            ['WhatsApp', o.whatsappNumber || '—'],
            ['Quartier', o.quartier || '—'],
            ['Ville',    o.city || '—'],
            ['Paiement', o.paymentMethod || '—'],
          ].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:'.82rem', marginBottom:5 }}>
              <span style={{ color:'var(--muted)' }}>{l}</span>
              {l==='WhatsApp' && v !== '—'
                ? <a href={`https://wa.me/${v.replace(/\s+/g,'')}`} target="_blank" rel="noreferrer" style={{ color:'var(--green)', textDecoration:'none' }}>💬 {v}</a>
                : <strong>{v}</strong>}
            </div>
          ))}
        </div>
      </div>

      {/* Historique statuts */}
      <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:12, padding:'1rem', marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:1, textTransform:'uppercase', marginBottom:'1rem' }}>📋 Historique de suivi</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {(o.statusHistory||[]).map((h,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:'.82rem' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--green)', flexShrink:0 }} />
              <span style={{ color:'var(--muted)', fontSize:'.72rem', whiteSpace:'nowrap' }}>
                {new Date(h.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
              </span>
              <Badge variant={statusVariant(h.status)} style={{ fontSize:'.62rem' }}>{STATUS_LABELS[h.status]||h.status}</Badge>
              {h.note && <span style={{ color:'var(--muted)' }}>{h.note}</span>}
              {h.changedBy && <span style={{ color:'var(--muted)', fontSize:'.72rem' }}>— {h.changedBy}</span>}
            </div>
          ))}
          {!(o.statusHistory?.length) && <span style={{ color:'var(--muted)', fontSize:'.82rem' }}>Aucun historique</span>}
        </div>
      </div>

      {/* Action rapide */}
      {!['delivered','cancelled','refunded'].includes(o.status) && (
        <div style={{ background:'rgba(34,197,94,.05)', border:'1px solid rgba(34,197,94,.15)', borderRadius:12, padding:'1rem' }}>
          <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--green)', letterSpacing:1, textTransform:'uppercase', marginBottom:'1rem' }}>⚡ Changer le statut</div>
          <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} rows={2} placeholder="Note optionnelle (ex: Colis déposé à la boutique...)"
            style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.85rem', outline:'none', resize:'none', marginBottom:'1rem', lineHeight:1.5 }} />
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {STATUSES.filter(s => !['pending'].includes(s.key)).map(s => (
              <button key={s.key} onClick={() => { onUpdateStatus(s.key, noteText); setNoteText('') }}
                style={{
                  padding:'8px 14px', borderRadius:8, cursor:'pointer',
                  background: o.status===s.key ? `${s.color}22` : 'rgba(255,255,255,.04)',
                  border: `1px solid ${o.status===s.key ? s.color : 'rgba(255,255,255,.1)'}`,
                  color: o.status===s.key ? s.color : 'var(--muted)',
                  fontFamily:'var(--font-body)', fontSize:'.82rem', fontWeight:700, transition:'all .2s',
                }}>{s.label}</button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}