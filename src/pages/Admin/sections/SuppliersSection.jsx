// src/pages/Admin/sections/SuppliersSection.jsx
import { useState } from 'react'
import { suppliersApi, API_BASE } from '../../../api'
import { useApi } from '../../../hooks/useApi'
import ImageUploader from '../../../components/ui/ImageUploader'
import Modal   from '../../../components/ui/Modal'
import Button  from '../../../components/ui/Button'
import Badge   from '../../../components/ui/Badge'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
import styles from '../Admin.module.css'

export default function SuppliersSection({ toast }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [statsId,   setStatsId]   = useState(null)
  const { data, loading, execute } = useApi(() => suppliersApi.getAll(), [], true)
  const suppliers = data?.suppliers || []

  const save = async (payload) => {
    try {
      editing ? await suppliersApi.update(editing.id, payload) : await suppliersApi.create(payload)
      toast.success(editing ? '✅ Fournisseur mis à jour' : '✅ Fournisseur créé')
      execute(); setModalOpen(false); setEditing(null)
    } catch(err) { toast.error(err.message) }
  }

  const del = async (id, name) => {
    if (!confirm(`Désactiver "${name}" ?`)) return
    try { await suppliersApi.delete(id); execute(); toast.success('🗑️ Désactivé') }
    catch(err) { toast.error(err.message) }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      {/* Stats globales */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12, marginBottom:'1.5rem' }}>
        {[
          { ico:'🤝', val:suppliers.length, lbl:'Fournisseurs' },
          { ico:'✅', val:suppliers.filter(s=>s.isActive).length, lbl:'Actifs' },
          { ico:'💰', val:'25%', lbl:'Commission moy.' },
        ].map((c,i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statTop}><span style={{ fontSize:'1.5rem' }}>{c.ico}</span></div>
            <div className={styles.statVal}>{c.val}</div>
            <div className={styles.statLbl}>{c.lbl}</div>
          </div>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>🤝 Fournisseurs partenaires</span>
          <Button variant="primary" size="sm" onClick={() => { setEditing(null); setModalOpen(true) }}>+ Ajouter</Button>
        </div>

        {suppliers.length === 0 && <EmptyState icon="🤝" title="Aucun fournisseur" message="Ajoutez votre premier partenaire fournisseur." />}

        <div style={{ padding:'1rem', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
          {suppliers.map(s => (
            <div key={s.id} style={{
              background:'rgba(255,255,255,.03)', border:'1px solid var(--border)',
              borderRadius:14, padding:'1.2rem', transition:'all .3s',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1rem' }}>
                {/* Logo */}
                <div style={{ width:48, height:48, borderRadius:10, background:'rgba(255,255,255,.06)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
                  <img src={`${API_BASE}/api/upload/supplier/${s.id}/logo`} alt={s.name}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML='🤝' }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:'.9rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
                  <div style={{ fontSize:'.75rem', color:'var(--muted)' }}>{s.city || '—'}</div>
                </div>
                <Badge variant={s.isActive ? 'green' : 'gray'} style={{ fontSize:'.65rem' }}>
                  {s.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:'1rem' }}>
                {[
                  ['📧', s.email || '—'],
                  ['📱', s.whatsapp || s.phone || '—'],
                  ['💰', `${s.commission || 25}% commission`],
                  ['🏦', s.bankName || 'Non renseigné'],
                ].map(([ico, val], i) => (
                  <div key={i} style={{ background:'rgba(255,255,255,.03)', borderRadius:8, padding:'6px 10px', fontSize:'.78rem' }}>
                    <span style={{ marginRight:5 }}>{ico}</span>{val}
                  </div>
                ))}
              </div>

              {s.description && <p style={{ fontSize:'.78rem', color:'var(--muted)', lineHeight:1.5, marginBottom:'1rem' }}>{s.description}</p>}

              <div style={{ display:'flex', gap:6 }}>
                <Button variant="ghost" size="sm" style={{ flex:1 }} onClick={() => { setEditing(s); setModalOpen(true) }}>✏️ Modifier</Button>
                <Button variant="ghost" size="sm" onClick={() => setStatsId(statsId === s.id ? null : s.id)}>📊</Button>
                <Button variant="danger" size="sm" onClick={() => del(s.id, s.name)}>🗑️</Button>
              </div>

              {/* Stats inline */}
              {statsId === s.id && <SupplierStats id={s.id} />}
            </div>
          ))}
        </div>
      </div>

      {modalOpen && <SupplierModal supplier={editing} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={save} toast={toast} />}
    </div>
  )
}

function SupplierStats({ id }) {
  const { data, loading } = useApi(() => suppliersApi.getStats(id), [id], true)
  if (loading) return <div style={{ textAlign:'center', padding:'1rem', fontSize:'.8rem', color:'var(--muted)' }}>Chargement stats...</div>
  if (!data) return null
  return (
    <div style={{ marginTop:'1rem', padding:'1rem', background:'rgba(34,197,94,.06)', border:'1px solid rgba(34,197,94,.15)', borderRadius:10 }}>
      <div style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:1, color:'var(--green)', marginBottom:8, textTransform:'uppercase' }}>📊 Statistiques de ventes</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
        {[
          ['Produits', data.productCount],
          ['Unités vendues', data.unitsSold],
          ['CA Total', `${data.totalSales?.toLocaleString()} FCFA`],
          ['Commission OP', `${data.totalCommission?.toLocaleString()} FCFA`],
        ].map(([l,v]) => (
          <div key={l} style={{ background:'rgba(255,255,255,.04)', borderRadius:8, padding:'8px 10px' }}>
            <div style={{ fontSize:'.65rem', color:'var(--muted)', marginBottom:2 }}>{l}</div>
            <div style={{ fontFamily:'var(--font-title)', fontSize:'.95rem', color:'var(--green)' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SupplierModal({ supplier:s, onClose, onSave, toast }) {
  const [form, setForm] = useState({
    name:       s?.name        || '',
    email:      s?.email       || '',
    phone:      s?.phone       || '',
    whatsapp:   s?.whatsapp    || '',
    city:       s?.city        || 'Yaoundé',
    address:    s?.address     || '',
    description:s?.description || '',
    commission: s?.commission  ?? 25,
    bankName:   s?.bankName    || '',
    bankAccount:s?.bankAccount || '',
    notes:      s?.notes       || '',
    isActive:   s?.isActive    !== false,
  })
  const f = (k,v) => setForm(p => ({ ...p, [k]:v }))

  const handleLogoUpload = async (imageData, imageMime) => {
    if (!s?.id) { toast.info('Sauvegardez d\'abord le fournisseur, puis uploadez le logo.'); throw new Error('Pas encore créé') }
    await suppliersApi.uploadLogo(s.id, imageData, imageMime)
  }

  return (
    <Modal isOpen title={s ? `✏️ ${s.name}` : '🤝 Nouveau fournisseur'} onClose={onClose} wide
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button variant="primary" onClick={() => onSave(form)}>💾 Enregistrer</Button></>}
    >
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <HIn label="Nom *"     value={form.name}    onChange={v => f('name',v)} />
        <HIn label="Email"     value={form.email}   onChange={v => f('email',v)} type="email" />
        <HIn label="Téléphone" value={form.phone}   onChange={v => f('phone',v)} />
        <HIn label="WhatsApp"  value={form.whatsapp}onChange={v => f('whatsapp',v)} />
        <HIn label="Ville"     value={form.city}    onChange={v => f('city',v)} />
        <HIn label="Commission Otaku Pulse (%)" value={form.commission} onChange={v => f('commission',parseFloat(v)||25)} type="number" />
        <HIn label="Banque"         value={form.bankName}    onChange={v => f('bankName',v)} />
        <HIn label="N° Compte"      value={form.bankAccount} onChange={v => f('bankAccount',v)} />
      </div>
      <HIn label="Adresse" value={form.address} onChange={v => f('address',v)} />
      <HTa label="Description" value={form.description} onChange={v => f('description',v)} rows={2} />
      <HTa label="Notes internes" value={form.notes} onChange={v => f('notes',v)} rows={2} />

      {s?.id && (
        <div style={{ marginTop:'1rem' }}>
          <div style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:6, textTransform:'uppercase' }}>Logo fournisseur</div>
          <ImageUploader
            currentUrl={`${API_BASE}/api/upload/supplier/${s.id}/logo`}
            onUpload={handleLogoUpload}
            placeholder="📸 Logo du fournisseur"
            maxSizeMB={2}
          />
        </div>
      )}

      <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'.88rem', marginTop:'1rem' }}>
        <input type="checkbox" checked={form.isActive} onChange={e => f('isActive',e.target.checked)} style={{ accentColor:'var(--green)' }} />
        <span>✅ Fournisseur actif</span>
      </label>
    </Modal>
  )
}

function HIn({ label, value, onChange, type='text' }) {
  return (
    <div style={{ marginBottom:'.9rem' }}>
      <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:4, textTransform:'uppercase' }}>{label}</label>
      <input type={type} value={value??''} onChange={e => onChange(e.target.value)}
        style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.88rem', outline:'none' }}
        onFocus={e=>e.target.style.borderColor='#22c55e'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'} />
    </div>
  )
}
function HTa({ label, value, onChange, rows=3 }) {
  return (
    <div style={{ marginBottom:'.9rem' }}>
      <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:4, textTransform:'uppercase' }}>{label}</label>
      <textarea value={value??''} onChange={e => onChange(e.target.value)} rows={rows}
        style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.88rem', outline:'none', resize:'vertical', lineHeight:1.5 }}
        onFocus={e=>e.target.style.borderColor='#22c55e'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'} />
    </div>
  )
}