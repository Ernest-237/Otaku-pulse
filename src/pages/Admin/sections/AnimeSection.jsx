// src/pages/Admin/sections/AnimeSection.jsx
// Planning animés à venir/en cours : cover, opening, personnages — mis à jour chaque semaine
import { useState } from 'react'
import { animeApi, API_BASE } from '../../../api'
import { useApi } from '../../../hooks/useApi'
import ImageUploader from '../../../components/ui/ImageUploader'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Badge, { statusVariant } from '../../../components/ui/Badge'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
import styles from '../Admin.module.css'

const STATUS_OPTS = [
  { v:'upcoming', l:'🔜 À venir' },
  { v:'airing',   l:'📡 En cours' },
  { v:'ended',    l:'⏹️ Terminé' },
]
const currentMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` }

export default function AnimeSection({ toast }) {
  const { data, loading, execute } = useApi(() => animeApi.getAll({ limit:100 }), [], true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const animes = data?.animes || []

  const save = async (form) => {
    try {
      editing ? await animeApi.update(editing.id, form) : await animeApi.create(form)
      toast.success('✅ Anime enregistré'); execute(); setModal(false); setEditing(null)
    } catch(err) { toast.error(err.message) }
  }
  const remove = async (id) => {
    if (!confirm('Supprimer cet anime du planning ?')) return
    try { await animeApi.delete(id); execute(); toast.success('🗑️ Supprimé') }
    catch(err) { toast.error(err.message) }
  }

  if (loading) return <PageLoader />

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>📺 Planning Anime ({animes.length})</span>
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setModal(true) }}>+ Anime</Button>
      </div>
      <div style={{ padding:'1rem', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:10 }}>
        {animes.map(a => (
          <div key={a.id} style={{ display:'flex', gap:10, padding:10, background:'rgba(255,255,255,.03)', border:'1px solid var(--ad-border,rgba(51,255,51,.12))', borderRadius:10 }}>
            {a.coverUrl
              ? <img src={`${API_BASE}${a.coverUrl}`} alt="" style={{ width:56, height:76, borderRadius:8, objectFit:'cover', flexShrink:0 }} />
              : <div style={{ width:56, height:76, borderRadius:8, background:'rgba(255,255,255,.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem', flexShrink:0 }}>📺</div>}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'.85rem', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--ad-text,#e8ffe8)' }}>{a.titleF}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', margin:'4px 0' }}>
                <Badge variant={statusVariant(a.status)} style={{ fontSize:'.62rem' }}>{STATUS_OPTS.find(s=>s.v===a.status)?.l||a.status}</Badge>
                <span style={{ fontSize:'.72rem', color:'var(--ad-text-2,#8fa896)' }}>{new Date(a.month).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</span>
              </div>
              {a.openingTitle && <div style={{ fontSize:'.72rem', color:'var(--ad-text-2,#8fa896)' }}>🎵 {a.openingTitle}</div>}
              <div style={{ display:'flex', gap:6, marginTop:6 }}>
                <Button variant="ghost" size="sm" onClick={() => { setEditing(a); setModal(true) }}>✏️</Button>
                <Button variant="danger" size="sm" onClick={() => remove(a.id)}>🗑️</Button>
              </div>
            </div>
          </div>
        ))}
        {!animes.length && <EmptyState icon="📺" title="Aucun anime au planning" />}
      </div>
      {modal && <AnimeModal anime={editing} onClose={() => { setModal(false); setEditing(null) }} onSave={save} toast={toast} />}
    </div>
  )
}

function AnimeModal({ anime:a, onClose, onSave, toast }) {
  const [form, setForm] = useState({
    titleF: a?.titleF||'', titleE: a?.titleE||'', synopsisF: a?.synopsisF||'', synopsisE: a?.synopsisE||'',
    status: a?.status||'upcoming', month: a?.month||currentMonth(), weekday: a?.weekday||'',
    studio: a?.studio||'', openingTitle: a?.openingTitle||'', openingUrl: a?.openingUrl||'',
    characters: a?.characters?.length ? a.characters : [{ name:'', role:'', imageUrl:'' }],
    order: a?.order??0, isActive: a?.isActive!==false,
    coverImageData: null, coverImageMime: null,
  })
  const s = (k,v) => setForm(f => ({ ...f, [k]:v }))

  const setChar = (i, k, v) => {
    const next = [...form.characters]; next[i] = { ...next[i], [k]:v }; s('characters', next)
  }
  const addChar = () => s('characters', [...form.characters, { name:'', role:'', imageUrl:'' }])
  const delChar = (i) => s('characters', form.characters.filter((_,idx) => idx!==i))

  const submit = () => {
    if (!form.titleF.trim()) return toast.error('Titre FR requis')
    const payload = { ...form, characters: form.characters.filter(c => c.name?.trim()) }
    if (!payload.coverImageData) { delete payload.coverImageData; delete payload.coverImageMime }
    onSave(payload)
  }

  return (
    <Modal isOpen dark title={a ? '✏️ Modifier anime' : '📺 Nouvel anime au planning'} onClose={onClose} wide
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button variant="primary" onClick={submit}>💾 Enregistrer</Button></>}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <HInput label="Titre FR *" value={form.titleF} onChange={v => s('titleF',v)} />
        <HInput label="Titre EN" value={form.titleE} onChange={v => s('titleE',v)} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <HTextarea label="Synopsis FR" value={form.synopsisF} onChange={v => s('synopsisF',v)} rows={2} />
        <HTextarea label="Synopsis EN" value={form.synopsisE} onChange={v => s('synopsisE',v)} rows={2} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem' }}>
        <HSelect label="Statut" value={form.status} onChange={v => s('status',v)} options={STATUS_OPTS} />
        <HInput label="Mois concerné" type="date" value={form.month} onChange={v => s('month',v)} />
        <HInput label="Jour de diffusion" value={form.weekday} onChange={v => s('weekday',v)} placeholder="Samedi" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <HInput label="Studio" value={form.studio} onChange={v => s('studio',v)} />
        <HInput label="Ordre d'affichage" type="number" value={form.order} onChange={v => s('order', Number(v))} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <HInput label="Titre de l'opening" value={form.openingTitle} onChange={v => s('openingTitle',v)} />
        <HInput label="Lien opening (YouTube...)" value={form.openingUrl} onChange={v => s('openingUrl',v)} placeholder="https://..." />
      </div>

      <div style={{ marginBottom:'1rem' }}>
        <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:6, textTransform:'uppercase' }}>Cover</label>
        <ImageUploader
          currentUrl={a?.coverUrl ? `${API_BASE}${a.coverUrl}` : null}
          onUpload={async (data, mime) => { s('coverImageData', data); s('coverImageMime', mime) }}
          allowUrl={false}
          placeholder="Cliquer pour choisir la cover"
        />
      </div>

      <div style={{ marginBottom:'1rem' }}>
        <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:6, textTransform:'uppercase' }}>Personnages</label>
        {form.characters.map((c,i) => (
          <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
            <input value={c.name} onChange={e => setChar(i,'name',e.target.value)} placeholder="Nom"
              style={{ flex:1.2, padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontSize:'.85rem', outline:'none' }} />
            <input value={c.role} onChange={e => setChar(i,'role',e.target.value)} placeholder="Rôle"
              style={{ flex:1, padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontSize:'.85rem', outline:'none' }} />
            <input value={c.imageUrl} onChange={e => setChar(i,'imageUrl',e.target.value)} placeholder="URL image (optionnel)"
              style={{ flex:1.5, padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontSize:'.85rem', outline:'none' }} />
            <button type="button" onClick={() => delChar(i)} style={{ background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:'1rem', flexShrink:0 }}>✕</button>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={addChar}>+ Personnage</Button>
      </div>

      <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'.88rem', color:'#cbd5e1' }}>
        <input type="checkbox" checked={form.isActive} onChange={e => s('isActive', e.target.checked)} style={{ accentColor:'#33ff33' }} /> ✅ Visible sur le site
      </label>
    </Modal>
  )
}

/* ══ Helpers de formulaire ══ */
function HInput({ label, value, onChange, type='text', placeholder }) {
  return (
    <div style={{ marginBottom:'.9rem' }}>
      <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:4, textTransform:'uppercase' }}>{label}</label>
      <input type={type} value={value??''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.88rem', outline:'none' }} />
    </div>
  )
}
function HTextarea({ label, value, onChange, rows=3 }) {
  return (
    <div style={{ marginBottom:'.9rem' }}>
      <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:4, textTransform:'uppercase' }}>{label}</label>
      <textarea value={value??''} onChange={e => onChange(e.target.value)} rows={rows}
        style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.88rem', outline:'none', resize:'vertical', lineHeight:1.5 }} />
    </div>
  )
}
function HSelect({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom:'.9rem' }}>
      <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:4, textTransform:'uppercase' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.88rem', outline:'none' }}>
        {options.map(o => <option key={o.v} value={o.v} style={{ background:'#0f140f' }}>{o.l}</option>)}
      </select>
    </div>
  )
}
