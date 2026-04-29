// src/pages/Admin/sections/SubscriptionsSection.jsx — Gestion abonnements
import { useState } from 'react'
import { adminMangaApi } from '../../../api'
import { useApi } from '../../../hooks/useApi'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
import styles from '../Admin.module.css'

const PLAN_LABELS = {
  daily:   'Day Pass',
  weekly:  'Hebdomadaire',
  monthly: 'Mensuel',
  yearly:  'Annuel',
}

const PLAN_COLORS = {
  daily:   '#06b6d4',
  weekly:  '#22c55e',
  monthly: '#a78bfa',
  yearly:  '#eab308',
}

const STATUS_VARIANT = {
  pending:   'amber',
  active:    'green',
  expired:   'gray',
  cancelled: 'red',
}

export default function SubscriptionsSection({ toast }) {
  const [filter, setFilter] = useState('pending')
  const [selected, setSelected] = useState(null)

  const { data, loading, execute } = useApi(
    () => adminMangaApi.getSubscriptions({
      status: filter !== 'all' ? filter : undefined,
      limit: 200,
    }),
    [filter],
    true
  )

  const subs = data?.subscriptions || []

  const activate = async (sub, paymentReference = '', adminNotes = '') => {
    try {
      await adminMangaApi.activateSub(sub.id, { paymentReference, adminNotes })
      toast.success(`✅ Abonnement ${PLAN_LABELS[sub.planType]} activé`)
      execute()
      if (selected?.id === sub.id) setSelected(null)
    } catch (err) { toast.error(err.message) }
  }

  const cancel = async (sub) => {
    if (!confirm(`Annuler l'abonnement de ${sub.user?.pseudo} ?`)) return
    try {
      await adminMangaApi.updateSub(sub.id, { status: 'cancelled' })
      toast.success('Abonnement annulé')
      execute()
    } catch (err) { toast.error(err.message) }
  }

  // Stats rapides
  const totalRevenue = subs.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.amount || 0), 0)
  const counts = {
    pending:   subs.filter(s => s.status === 'pending').length,
    active:    subs.filter(s => s.status === 'active').length,
    expired:   subs.filter(s => s.status === 'expired').length,
    cancelled: subs.filter(s => s.status === 'cancelled').length,
  }

  return (
    <div>
      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:'1.5rem' }}>
        <div className={styles.statCard} style={{ borderLeft:`3px solid #f59e0b`, paddingLeft:'1rem' }}>
          <div style={{ fontFamily:'var(--font-title)', fontSize:'2rem', letterSpacing:2, color:'#f59e0b', lineHeight:1 }}>{counts.pending}</div>
          <div style={{ fontSize:'.7rem', color:'rgba(180,190,220,.5)', letterSpacing:1, textTransform:'uppercase', marginTop:4 }}>⏳ En attente</div>
        </div>
        <div className={styles.statCard} style={{ borderLeft:`3px solid #22c55e`, paddingLeft:'1rem' }}>
          <div style={{ fontFamily:'var(--font-title)', fontSize:'2rem', letterSpacing:2, color:'#22c55e', lineHeight:1 }}>{counts.active}</div>
          <div style={{ fontSize:'.7rem', color:'rgba(180,190,220,.5)', letterSpacing:1, textTransform:'uppercase', marginTop:4 }}>✅ Actifs</div>
        </div>
        <div className={styles.statCard} style={{ borderLeft:`3px solid #6b7280`, paddingLeft:'1rem' }}>
          <div style={{ fontFamily:'var(--font-title)', fontSize:'2rem', letterSpacing:2, color:'#6b7280', lineHeight:1 }}>{counts.expired}</div>
          <div style={{ fontSize:'.7rem', color:'rgba(180,190,220,.5)', letterSpacing:1, textTransform:'uppercase', marginTop:4 }}>⏰ Expirés</div>
        </div>
        <div className={styles.statCard} style={{ borderLeft:`3px solid #22c55e`, paddingLeft:'1rem' }}>
          <div style={{ fontFamily:'var(--font-title)', fontSize:'1.6rem', letterSpacing:1, color:'#22c55e', lineHeight:1 }}>{totalRevenue.toLocaleString()}</div>
          <div style={{ fontSize:'.7rem', color:'rgba(180,190,220,.5)', letterSpacing:1, textTransform:'uppercase', marginTop:4 }}>💰 FCFA actif</div>
        </div>
      </div>

      <div className={styles.filters}>
        {[
          ['all','Tous'],
          ['pending','⏳ En attente'],
          ['active','✅ Actifs'],
          ['expired','⏰ Expirés'],
          ['cancelled','❌ Annulés'],
        ].map(([v,l]) => (
          <button key={v}
            className={`${styles.filterBtn} ${filter === v ? styles.filterActive : ''}`}
            onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>📚 Abonnements ({subs.length})</span>
        </div>
        {loading ? <PageLoader /> : !subs.length ? <EmptyState icon="📚" title="Aucun abonnement" /> : (
          <div style={{ overflowX:'auto' }}>
            <table className={styles.table}>
              <thead><tr>
                <th>Utilisateur</th><th>Plan</th><th>Montant</th>
                <th>WhatsApp</th><th>Statut</th><th>Expire</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {subs.map(s => (
                  <tr key={s.id} className={styles.tr} style={{ cursor:'pointer' }} onClick={() => setSelected(s)}>
                    <td>
                      <strong style={{ color:'#e2e8f0' }}>{s.user?.pseudo || '—'}</strong>
                      <div style={{ fontSize:'.72rem', color:'rgba(180,190,220,.5)' }}>{s.user?.email}</div>
                    </td>
                    <td>
                      <span style={{ padding:'3px 9px', borderRadius:50, background:`${PLAN_COLORS[s.planType]}22`, color:PLAN_COLORS[s.planType], border:`1px solid ${PLAN_COLORS[s.planType]}40`, fontSize:'.72rem', fontWeight:800 }}>
                        {PLAN_LABELS[s.planType]}
                      </span>
                    </td>
                    <td style={{ fontFamily:'var(--font-title)', color:'#22c55e', fontSize:'.95rem' }}>
                      {s.amount?.toLocaleString()} F
                    </td>
                    <td>
                      {s.whatsappNumber || s.user?.whatsapp ? (
                        <a href={`https://wa.me/${(s.whatsappNumber || s.user?.whatsapp)?.replace(/[\s+]/g,'')}`}
                          target="_blank" rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ color:'#22c55e', fontSize:'.82rem', textDecoration:'none' }}>
                          💬 {s.whatsappNumber || s.user?.whatsapp}
                        </a>
                      ) : <span style={{ color:'rgba(180,190,220,.4)', fontSize:'.82rem' }}>—</span>}
                    </td>
                    <td><Badge variant={STATUS_VARIANT[s.status]} style={{ fontSize:'.65rem' }}>{s.status}</Badge></td>
                    <td style={{ fontSize:'.78rem', color:'rgba(180,190,220,.6)' }}>
                      {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'2-digit' }) : '—'}
                    </td>
                    <td onClick={e => e.stopPropagation()} style={{ display:'flex', gap:4 }}>
                      {s.status === 'pending' && (
                        <Button variant="primary" size="sm" onClick={() => activate(s)}>✅ Activer</Button>
                      )}
                      {['active'].includes(s.status) && (
                        <Button variant="danger" size="sm" onClick={() => cancel(s)}>❌</Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setSelected(s)}>👁️</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <SubscriptionDetail
          sub={selected}
          onClose={() => setSelected(null)}
          onActivate={activate}
          onCancel={cancel}
        />
      )}
    </div>
  )
}

function SubscriptionDetail({ sub, onClose, onActivate, onCancel }) {
  const [paymentRef, setPaymentRef] = useState(sub.paymentReference || '')
  const [notes, setNotes] = useState(sub.adminNotes || '')

  return (
    <Modal isOpen title={`📚 Abonnement ${PLAN_LABELS[sub.planType]}`} onClose={onClose} wide>
      <div className={styles.detailGrid} style={{ marginBottom:'1.2rem' }}>
        <div className={styles.detailItem}>
          <div className={styles.detailLbl}>Utilisateur</div>
          <strong style={{ color:'#e2e8f0' }}>{sub.user?.pseudo}</strong>
          <div style={{ fontSize:'.72rem', color:'rgba(180,190,220,.5)' }}>{sub.user?.email}</div>
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLbl}>WhatsApp</div>
          {sub.whatsappNumber ? (
            <a href={`https://wa.me/${sub.whatsappNumber.replace(/[\s+]/g,'')}`}
              target="_blank" rel="noreferrer"
              style={{ color:'#22c55e', fontSize:'.85rem', textDecoration:'none' }}>
              💬 {sub.whatsappNumber}
            </a>
          ) : <strong>—</strong>}
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLbl}>Plan</div>
          <strong style={{ fontSize:'.9rem', color:PLAN_COLORS[sub.planType] }}>{PLAN_LABELS[sub.planType]}</strong>
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLbl}>Montant</div>
          <strong style={{ fontSize:'1rem', color:'#22c55e', fontFamily:'var(--font-title)' }}>{sub.amount?.toLocaleString()} FCFA</strong>
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLbl}>Méthode paiement</div>
          <strong style={{ fontSize:'.85rem' }}>{sub.paymentMethod?.replace('_',' ').toUpperCase()}</strong>
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLbl}>Statut</div>
          <Badge variant={STATUS_VARIANT[sub.status]} style={{ fontSize:'.65rem' }}>{sub.status}</Badge>
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLbl}>Demande</div>
          <strong style={{ fontSize:'.85rem' }}>{new Date(sub.createdAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</strong>
        </div>
        {sub.expiresAt && (
          <div className={styles.detailItem}>
            <div className={styles.detailLbl}>Expire le</div>
            <strong style={{ fontSize:'.85rem', color:new Date(sub.expiresAt) > new Date() ? '#22c55e' : '#f87171' }}>
              {new Date(sub.expiresAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
            </strong>
          </div>
        )}
      </div>

      {sub.adminNotes && (
        <div style={{ background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)', borderRadius:10, padding:'.9rem 1.1rem', marginBottom:'1rem' }}>
          <div style={{ fontSize:'.68rem', color:'#fcd34d', fontWeight:800, letterSpacing:1, textTransform:'uppercase', marginBottom:5 }}>📝 Notes admin</div>
          <p style={{ color:'rgba(252,211,77,.9)', fontSize:'.85rem', margin:0, lineHeight:1.6 }}>{sub.adminNotes}</p>
        </div>
      )}

      {/* Actions */}
      {sub.status === 'pending' && (
        <div style={{ background:'rgba(34,197,94,.05)', border:'1px solid rgba(34,197,94,.15)', borderRadius:12, padding:'1rem' }}>
          <div style={{ fontSize:'.68rem', color:'#4ade80', fontWeight:800, letterSpacing:1.5, textTransform:'uppercase', marginBottom:'.8rem' }}>⚡ Activation manuelle</div>

          <p style={{ fontSize:'.82rem', color:'rgba(180,190,220,.7)', marginBottom:'1rem', lineHeight:1.6 }}>
            Vérifiez le paiement (MTN Money / Orange Money) puis activez l'abonnement. L'utilisateur recevra un email de confirmation.
          </p>

          <div style={{ marginBottom:'.8rem' }}>
            <label style={{ display:'block', fontSize:'.7rem', color:'rgba(180,190,220,.5)', fontWeight:700, marginBottom:5, letterSpacing:1, textTransform:'uppercase' }}>Référence transaction</label>
            <input value={paymentRef} onChange={e => setPaymentRef(e.target.value)}
              placeholder="Ex: MTN-123456789"
              style={{ width:'100%', padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'#e2e8f0', fontSize:'.85rem', outline:'none' }} />
          </div>

          <div style={{ marginBottom:'1rem' }}>
            <label style={{ display:'block', fontSize:'.7rem', color:'rgba(180,190,220,.5)', fontWeight:700, marginBottom:5, letterSpacing:1, textTransform:'uppercase' }}>Notes admin</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Note interne (optionnel)..."
              style={{ width:'100%', padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'#e2e8f0', fontSize:'.85rem', outline:'none', resize:'vertical', fontFamily:'var(--font-body)', lineHeight:1.5 }} />
          </div>

          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <Button variant="primary" onClick={() => onActivate(sub, paymentRef, notes)}>
              ✅ Activer l'abonnement
            </Button>
            <Button variant="danger" onClick={() => onCancel(sub)}>
              ❌ Refuser
            </Button>
          </div>
        </div>
      )}

      {sub.status === 'active' && (
        <div style={{ display:'flex', gap:8 }}>
          <Button variant="danger" onClick={() => onCancel(sub)}>❌ Annuler l'abonnement</Button>
        </div>
      )}
    </Modal>
  )
}