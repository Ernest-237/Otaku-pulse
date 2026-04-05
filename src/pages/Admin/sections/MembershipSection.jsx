// src/pages/Admin/sections/MembershipSection.jsx
import { useState } from 'react'
import { adminApi, API_BASE } from '../../../api'
import { useApi } from '../../../hooks/useApi'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
import Badge, { statusVariant } from '../../../components/ui/Badge'
import Modal  from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import styles from '../Admin.module.css'

const PLAN_COLORS = { basic:'#22c55e', plus:'#3b82f6', elite:'#f59e0b' }
const PLAN_EMOJIS = { basic:'⚡', plus:'🔥', elite:'👑' }
const STATUS_M = { pending:'En attente', contacted:'Contacté', active:'Actif', cancelled:'Annulé', expired:'Expiré' }
const STATUS_V = { pending:'amber', contacted:'blue', active:'green', cancelled:'red', expired:'gray' }

export default function MembershipSection({ toast }) {
  const [filter,   setFilter]   = useState('all')
  const [selected, setSelected] = useState(null)
  const { data, loading, execute } = useApi(
    () => fetch(`${API_BASE}/api/membership${filter!=='all'?`?status=${filter}`:''}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('op_token')}` }
    }).then(r => r.json()),
    [filter], true
  )
  const requests = data?.requests || []

  const updateMembership = async (id, payload) => {
    try {
      const res = await fetch(`${API_BASE}/api/membership/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('op_token')}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('✅ Mis à jour')
      execute()
      setSelected(null)
    } catch(err) { toast.error(err.message) }
  }

  if (loading) return <PageLoader />

  // Stats rapides
  const stats = {
    total:     requests.length,
    pending:   requests.filter(r => r.status==='pending').length,
    active:    requests.filter(r => r.status==='active').length,
    elite:     requests.filter(r => r.plan==='elite').length,
    plus:      requests.filter(r => r.plan==='plus').length,
    basic:     requests.filter(r => r.plan==='basic').length,
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:'1.5rem' }}>
        {[
          { ico:'⏳', val:stats.pending, lbl:'En attente',  v:'amber' },
          { ico:'✅', val:stats.active,  lbl:'Actifs',      v:'green' },
          { ico:'👑', val:stats.elite,   lbl:'Elite',       v:'amber' },
        ].map((c,i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statTop}><span style={{ fontSize:'1.5rem' }}>{c.ico}</span><Badge variant={c.v} style={{ fontSize:'.6rem' }}>{c.val} membres</Badge></div>
            <div className={styles.statVal}>{c.val}</div>
            <div className={styles.statLbl}>{c.lbl}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className={styles.filters}>
        {[['all','Tous'],['pending','En attente'],['contacted','Contactés'],['active','Actifs'],['cancelled','Annulés'],['expired','Expirés']].map(([f,l]) => (
          <button key={f} className={`${styles.filterBtn} ${filter===f?styles.filterActive:''}`} onClick={() => setFilter(f)}>{l}</button>
        ))}
      </div>

      {/* Table */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>🎴 Demandes Carte Membre ({requests.length})</span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr><th>Membre</th><th>Plan</th><th>Contact</th><th>Ville</th><th>Date</th><th>Statut</th><th>Carte ID</th><th>Expiration</th><th></th></tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} className={styles.tr}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {r.user?.avatar
                        ? <img src={r.user.avatar.startsWith('data:')?r.user.avatar:`${API_BASE}${r.user.avatar}`} style={{ width:30,height:30,borderRadius:'50%',objectFit:'cover' }} />
                        : <div style={{ width:30,height:30,borderRadius:'50%',background:'rgba(34,197,94,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.85rem' }}>🧑</div>}
                      <div>
                        <div style={{ fontWeight:700, fontSize:'.85rem' }}>{r.nom}</div>
                        <div style={{ fontSize:'.7rem', color:'var(--muted)' }}>{r.user?.pseudo}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ color:PLAN_COLORS[r.plan], fontFamily:'var(--font-title)', fontSize:'.9rem' }}>
                      {PLAN_EMOJIS[r.plan]} {r.plan?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize:'.78rem' }}>{r.email}</div>
                    <div style={{ fontSize:'.75rem', color:'var(--muted)' }}>{r.phone}</div>
                  </td>
                  <td style={{ fontSize:'.82rem' }}>{r.ville}</td>
                  <td style={{ fontSize:'.78rem' }}>{new Date(r.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td><Badge variant={STATUS_V[r.status]||'gray'} style={{ fontSize:'.62rem' }}>{STATUS_M[r.status]||r.status}</Badge></td>
                  <td style={{ fontFamily:'var(--font-title)', fontSize:'.8rem', color:PLAN_COLORS[r.plan] }}>{r.cardId||'—'}</td>
                  <td style={{ fontSize:'.78rem', color:'var(--muted)' }}>
                    {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td><Button variant="ghost" size="sm" onClick={() => setSelected(r)}>✏️</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!requests.length && <EmptyState icon="🎴" title="Aucune demande de carte membre" />}
        </div>
      </div>

      {selected && (
        <MembershipModal
          request={selected}
          onClose={() => setSelected(null)}
          onSave={updateMembership}
        />
      )}
    </div>
  )
}

function MembershipModal({ request:r, onClose, onSave }) {
  const [status,    setStatus]    = useState(r.status)
  const [notes,     setNotes]     = useState(r.adminNotes||'')
  const [cardId,    setCardId]    = useState(r.cardId||`OP-${Date.now().toString(36).toUpperCase().slice(-6)}`)
  const [expiresAt, setExpiresAt] = useState(
    r.expiresAt ? new Date(r.expiresAt).toISOString().slice(0,10)
    : new Date(Date.now()+365*24*60*60*1000).toISOString().slice(0,10)
  )

  return (
    <Modal isOpen title={`🎴 Demande ${r.nom} — ${r.plan?.toUpperCase()}`} onClose={onClose} wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          {status !== 'active' && <Button variant="primary" onClick={() => onSave(r.id, { status:'active', adminNotes:notes, cardId, expiresAt })}>✅ Activer la carte</Button>}
          <Button variant="primary" onClick={() => onSave(r.id, { status, adminNotes:notes, cardId, expiresAt })}>💾 Sauvegarder</Button>
        </>
      }>
      {/* Infos */}
      <div className={styles.detailGrid} style={{ marginBottom:'1.2rem' }}>
        {[
          ['Nom',      r.nom],
          ['Email',    r.email],
          ['Téléphone',r.phone],
          ['Ville',    r.ville],
          ['Plan',     `${PLAN_EMOJIS[r.plan]} ${r.plan?.toUpperCase()}`],
          ['Demande',  new Date(r.createdAt).toLocaleDateString('fr-FR')],
        ].map(([l,v]) => (
          <div key={l} className={styles.detailItem}>
            <div className={styles.detailLbl}>{l}</div>
            <strong style={{ fontSize:'.88rem', color: l==='Plan'?PLAN_COLORS[r.plan]:'var(--text)' }}>{v}</strong>
          </div>
        ))}
      </div>
      {r.message && (
        <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'1rem', marginBottom:'1.2rem', fontSize:'.85rem', color:'var(--muted)', lineHeight:1.7 }}>
          💬 <em>{r.message}</em>
        </div>
      )}

      {/* Carte */}
      <div style={{ background:'rgba(34,197,94,.05)', border:'1px solid rgba(34,197,94,.15)', borderRadius:14, padding:'1.2rem', marginBottom:'1.2rem' }}>
        <div style={{ fontSize:'.75rem', fontWeight:700, letterSpacing:1, color:'var(--green)', textTransform:'uppercase', marginBottom:'.8rem' }}>🎴 Paramètres Carte Membre</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={{ display:'block', fontSize:'.7rem', fontWeight:700, color:'var(--muted)', marginBottom:4, textTransform:'uppercase' }}>ID Carte *</label>
            <input value={cardId} onChange={e=>setCardId(e.target.value)}
              style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'monospace', fontSize:'.9rem', outline:'none' }} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'.7rem', fontWeight:700, color:'var(--muted)', marginBottom:4, textTransform:'uppercase' }}>Expiration *</label>
            <input type="date" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)}
              style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none' }} />
          </div>
        </div>
      </div>

      {/* Statut + Notes */}
      <div style={{ marginBottom:'1rem' }}>
        <label style={{ display:'block', fontSize:'.7rem', fontWeight:700, color:'var(--muted)', marginBottom:5, textTransform:'uppercase', letterSpacing:1 }}>Statut</label>
        <select value={status} onChange={e=>setStatus(e.target.value)}
          style={{ width:'100%', padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none' }}>
          {Object.entries(STATUS_M).map(([v,l]) => <option key={v} value={v} style={{ background:'#0c1a2e' }}>{l}</option>)}
        </select>
      </div>
      <div>
        <label style={{ display:'block', fontSize:'.7rem', fontWeight:700, color:'var(--muted)', marginBottom:5, textTransform:'uppercase', letterSpacing:1 }}>Notes Admin</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
          placeholder="Notes internes, suivi, contact effectué..."
          style={{ width:'100%', padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.88rem', outline:'none', resize:'vertical', lineHeight:1.6 }} />
      </div>
    </Modal>
  )
}