// src/pages/Admin/sections/MembershipSection.jsx — v2
import { useState } from 'react'
import { API_BASE } from '../../../api'
import { useApi } from '../../../hooks/useApi'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
import Badge from '../../../components/ui/Badge'
import Modal  from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import styles from '../Admin.module.css'

// Palette unifiée — pas d'orange
const PLAN_META = {
  basic: { color:'#16a34a', bg:'rgba(22,163,74,.12)',  emoji:'⚡', label:'GENIN'  },
  plus:  { color:'#7c3aed', bg:'rgba(124,58,237,.12)', emoji:'🔥', label:'CHŪNIN' },
  elite: { color:'#0d9488', bg:'rgba(13,148,136,.12)', emoji:'👑', label:'HOKAGE' },
}
const STATUS_LABELS = {
  pending:'En attente', contacted:'Contacté', active:'Actif',
  cancelled:'Annulé', expired:'Expiré'
}
const STATUS_VARIANTS = {
  pending:'amber', contacted:'blue', active:'green', cancelled:'red', expired:'gray'
}

// Helper — jours restants
function daysLeft(expiresAt) {
  if (!expiresAt) return null
  return Math.max(0, Math.ceil((new Date(expiresAt) - new Date()) / (1000*60*60*24)))
}

export default function MembershipSection({ toast }) {
  const [filter,   setFilter]   = useState('all')
  const [selected, setSelected] = useState(null)
  const [search,   setSearch]   = useState('')

  const { data, loading, execute } = useApi(
    () => fetch(`${API_BASE}/api/membership${filter !== 'all' ? `?status=${filter}` : ''}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('op_token')}` }
    }).then(r => r.json()),
    [filter], true
  )
  const allRequests = data?.requests || []
  const requests = allRequests.filter(r => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return `${r.nom} ${r.email} ${r.phone} ${r.ville} ${r.cardId||''}`.toLowerCase().includes(q)
  })

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

  // Stats
  const stats = [
    { ico:'⏳', val:allRequests.filter(r=>r.status==='pending').length,   lbl:'En attente', v:'amber' },
    { ico:'✅', val:allRequests.filter(r=>r.status==='active').length,    lbl:'Actifs',     v:'green' },
    { ico:'⚡', val:allRequests.filter(r=>r.plan==='basic').length,       lbl:'Genin',      v:'green' },
    { ico:'🔥', val:allRequests.filter(r=>r.plan==='plus').length,        lbl:'Chūnin',     v:'blue'  },
    { ico:'👑', val:allRequests.filter(r=>r.plan==='elite').length,       lbl:'Hokage',     v:'blue'  },
    { ico:'💀', val:allRequests.filter(r=>r.status==='expired').length,   lbl:'Expirés',    v:'red'   },
  ]

  return (
    <div>
      {/* Stats */}
      <div className={styles.statsGrid} style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:'1.5rem' }}>
        {stats.map((c,i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statTop}>
              <span style={{ fontSize:'1.4rem' }}>{c.ico}</span>
              <Badge variant={c.v} style={{ fontSize:'.6rem' }}>{c.lbl}</Badge>
            </div>
            <div className={styles.statVal}>{c.val}</div>
            <div className={styles.statLbl}>{c.lbl}</div>
          </div>
        ))}
      </div>

      {/* Filtres + recherche */}
      <div className={styles.filters}>
        {[['all','Tous'],['pending','En attente'],['contacted','Contactés'],
          ['active','Actifs'],['cancelled','Annulés'],['expired','Expirés']].map(([f,l]) => (
          <button key={f}
            className={`${styles.filterBtn} ${filter===f?styles.filterActive:''}`}
            onClick={() => setFilter(f)}>{l}</button>
        ))}
        <input className={styles.searchBox} placeholder="🔍 Nom, email, ID carte..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>🎴 Demandes Carte Membre ({requests.length})</span>
          <span style={{ fontSize:'.75rem', color:'rgba(180,190,220,.4)' }}>
            {allRequests.filter(r=>r.status==='active').length} actives sur {allRequests.length} total
          </span>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Membre</th><th>Plan</th><th>Contact</th>
                <th>ID Carte</th><th>Expiration</th><th>Temps restant</th>
                <th>Statut</th><th>Demande</th><th></th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => {
                const meta = PLAN_META[r.plan] || PLAN_META.basic
                const days = daysLeft(r.expiresAt)
                const daysColor = days === null ? 'rgba(180,190,220,.4)'
                  : days <= 30 ? '#f87171'
                  : days <= 90 ? '#fbbf24'
                  : '#4ade80'
                return (
                  <tr key={r.id} className={styles.tr}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background:meta.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.9rem', flexShrink:0 }}>
                          {meta.emoji}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:'.85rem', color:'#e2e8f0' }}>{r.nom}</div>
                          <div style={{ fontSize:'.7rem', color:'rgba(180,190,220,.5)' }}>{r.user?.pseudo}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ color:meta.color, fontFamily:'var(--font-title)', fontSize:'.85rem', letterSpacing:1 }}>
                        {meta.emoji} {meta.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize:'.78rem', color:'#cbd5e1' }}>{r.email}</div>
                      <div style={{ fontSize:'.73rem', color:'rgba(180,190,220,.5)' }}>{r.phone}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily:'monospace', fontSize:'.8rem', letterSpacing:1, color: r.cardId ? meta.color : 'rgba(180,190,220,.35)' }}>
                        {r.cardId || '—'}
                      </span>
                    </td>
                    <td style={{ fontSize:'.78rem', color:'rgba(180,190,220,.6)' }}>
                      {r.expiresAt ? new Date(r.expiresAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td>
                      {days !== null ? (
                        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                          <span style={{ color:daysColor, fontWeight:800, fontSize:'.78rem' }}>{days}j</span>
                          <div style={{ width:60, height:4, background:'rgba(255,255,255,.08)', borderRadius:99, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${Math.min(100,(days/365)*100)}%`, background:daysColor, borderRadius:99 }} />
                          </div>
                        </div>
                      ) : (
                        <span style={{ color:'rgba(180,190,220,.3)', fontSize:'.75rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <Badge variant={STATUS_VARIANTS[r.status]||'gray'} style={{ fontSize:'.62rem' }}>
                        {STATUS_LABELS[r.status]||r.status}
                      </Badge>
                    </td>
                    <td style={{ fontSize:'.75rem', color:'rgba(180,190,220,.5)' }}>
                      {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:5 }}>
                        <Button variant="ghost" size="sm" onClick={() => setSelected(r)}>✏️</Button>
                        {r.status === 'pending' && (
                          <Button variant="primary" size="sm"
                            onClick={() => updateMembership(r.id, {
                              status:'active',
                              cardId: `OP-${Date.now().toString(36).toUpperCase().slice(-6)}`,
                              expiresAt: new Date(Date.now()+365*24*60*60*1000).toISOString(),
                            })}>⚡</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
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
  const meta = PLAN_META[r.plan] || PLAN_META.basic
  const days = daysLeft(r.expiresAt)

  const defaultExpiry = r.expiresAt
    ? new Date(r.expiresAt).toISOString().slice(0,10)
    : new Date(Date.now()+365*24*60*60*1000).toISOString().slice(0,10)

  const [status,    setStatus]    = useState(r.status)
  const [notes,     setNotes]     = useState(r.adminNotes || '')
  const [cardId,    setCardId]    = useState(r.cardId || `OP-${Date.now().toString(36).toUpperCase().slice(-6)}`)
  const [expiresAt, setExpiresAt] = useState(defaultExpiry)

  // Prolonger rapidement
  const extend = (months) => {
    const base = expiresAt ? new Date(expiresAt) : new Date()
    if (base < new Date()) base.setTime(Date.now()) // si déjà expiré, partir d'aujourd'hui
    base.setMonth(base.getMonth() + months)
    setExpiresAt(base.toISOString().slice(0,10))
  }

  const inputStyle = {
    width:'100%', padding:'9px 12px', borderRadius:10,
    background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)',
    color:'#e2e8f0', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none'
  }
  const labelStyle = {
    display:'block', fontSize:'.68rem', fontWeight:800,
    letterSpacing:1, color:'rgba(180,190,220,.45)',
    marginBottom:4, textTransform:'uppercase'
  }

  return (
    <Modal isOpen title={`🎴 ${r.nom} — ${meta.label}`} onClose={onClose} wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          {r.status !== 'active' && (
            <Button variant="primary"
              onClick={() => onSave(r.id, { status:'active', adminNotes:notes, cardId, expiresAt })}>
              ✅ Activer la carte
            </Button>
          )}
          <Button variant="primary"
            onClick={() => onSave(r.id, { status, adminNotes:notes, cardId, expiresAt })}>
            💾 Sauvegarder
          </Button>
        </>
      }>

      {/* Infos membre */}
      <div className={styles.detailGrid} style={{ marginBottom:'1.2rem' }}>
        {[
          ['Nom',       r.nom],
          ['Email',     r.email],
          ['Téléphone', r.phone],
          ['Ville',     r.ville],
          ['Plan',      `${meta.emoji} ${meta.label}`],
          ['Demande',   new Date(r.createdAt).toLocaleDateString('fr-FR')],
        ].map(([l,v]) => (
          <div key={l} className={styles.detailItem}>
            <div className={styles.detailLbl}>{l}</div>
            <strong style={{ fontSize:'.88rem', color: l==='Plan' ? meta.color : '#e2e8f0' }}>{v}</strong>
          </div>
        ))}
      </div>

      {/* Bloc carte */}
      <div style={{ background:`${meta.bg}`, border:`1px solid ${meta.color}30`, borderRadius:14, padding:'1.2rem', marginBottom:'1.2rem' }}>
        <div style={{ fontSize:'.72rem', fontWeight:800, letterSpacing:1, color:meta.color, textTransform:'uppercase', marginBottom:'1rem' }}>
          🎴 Paramètres de la Carte Membre
        </div>

        {/* ID + Expiration */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:'1rem' }}>
          <div>
            <label style={labelStyle}>ID Carte *</label>
            <input value={cardId} onChange={e=>setCardId(e.target.value)} style={{ ...inputStyle, fontFamily:'monospace', letterSpacing:2 }} />
          </div>
          <div>
            <label style={labelStyle}>Date d'expiration *</label>
            <input type="date" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} style={inputStyle} />
          </div>
        </div>

        {/* Boutons prolongation rapide */}
        <div>
          <label style={labelStyle}>Prolonger rapidement</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[[1,'+ 1 mois'],[3,'+ 3 mois'],[6,'+ 6 mois'],[12,'+ 1 an']].map(([m,lbl]) => (
              <button key={m} onClick={() => extend(m)}
                style={{ padding:'6px 14px', borderRadius:99, background:'rgba(255,255,255,.06)', border:`1px solid ${meta.color}40`, color:meta.color, fontFamily:'var(--font-body)', fontSize:'.78rem', fontWeight:800, cursor:'pointer', transition:'all .2s' }}
                onMouseEnter={e=>e.currentTarget.style.background=`${meta.color}22`}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.06)'}>
                {lbl}
              </button>
            ))}
            {r.status === 'active' && (
              <button onClick={() => { extend(12); setStatus('active') }}
                style={{ padding:'6px 14px', borderRadius:99, background:'rgba(22,163,74,.15)', border:'1px solid rgba(22,163,74,.4)', color:'#4ade80', fontFamily:'var(--font-body)', fontSize:'.78rem', fontWeight:800, cursor:'pointer' }}>
                🔄 Renouveler 1 an
              </button>
            )}
          </div>
          {expiresAt && (
            <div style={{ marginTop:8, fontSize:'.75rem', color:'rgba(180,190,220,.5)' }}>
              Nouvelle date : <span style={{ color:meta.color, fontWeight:700 }}>
                {new Date(expiresAt).toLocaleDateString('fr-FR', { dateStyle:'long' })}
              </span>
              {' '}({Math.ceil((new Date(expiresAt)-new Date())/(1000*60*60*24))} jours)
            </div>
          )}
        </div>
      </div>

      {/* Statut actuel avec barre si actif */}
      {r.status === 'active' && days !== null && (
        <div style={{ marginBottom:'1rem', padding:'12px 14px', background:'rgba(22,163,74,.06)', border:'1px solid rgba(22,163,74,.2)', borderRadius:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'.75rem', fontWeight:700, marginBottom:6 }}>
            <span style={{ color:'rgba(180,190,220,.5)' }}>Validité restante</span>
            <span style={{ color: days<=30?'#f87171':days<=90?'#fbbf24':'#4ade80' }}>{days} jours</span>
          </div>
          <div style={{ height:6, background:'rgba(255,255,255,.08)', borderRadius:99, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.min(100,(days/365)*100)}%`, background:'linear-gradient(90deg,#22c55e,#4ade80)', borderRadius:99, transition:'width .5s' }} />
          </div>
        </div>
      )}

      {/* Statut select */}
      <div style={{ marginBottom:'1rem' }}>
        <label style={labelStyle}>Statut de la demande</label>
        <select value={status} onChange={e=>setStatus(e.target.value)} style={inputStyle}>
          {Object.entries(STATUS_LABELS).map(([v,l]) => (
            <option key={v} value={v} style={{ background:'#11142a' }}>{l}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>Notes admin (internes)</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
          placeholder="Suivi, contact effectué, paiement reçu, remarques..."
          style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }} />
      </div>
    </Modal>
  )
}