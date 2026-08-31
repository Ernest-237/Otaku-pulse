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

// `coverUrl` vaut soit un chemin relatif servi par notre API (image
// téléversée à la main), soit une URL absolue vers le CDN AniList (image
// importée). Préfixer aveuglément par API_BASE casserait la seconde.
const resolveCover = (url) =>
  !url ? null : url.startsWith('http') ? url : `${API_BASE}${url}`


const STATUS_OPTS = [
  { v:'upcoming', l:'🔜 À venir' },
  { v:'airing',   l:'📡 En cours' },
  { v:'ended',    l:'⏹️ Terminé' },
]
const currentMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01` }

/* ══ BOT DE SYNCHRONISATION ══
   Le planning se remplit tout seul depuis AniList (voir server/jobs/animeCron.js).
   Ce panneau ne sert qu'au pilotage : voir l'état, forcer un rafraîchissement. */
function SyncPanel({ toast, onSynced }) {
  const { data, refresh } = useApi(() => animeApi.syncStatus(), [])
  const [busy, setBusy] = useState(false)

  const counts = data?.counts || {}
  const last   = data?.lastSyncAt

  const run = async () => {
    setBusy(true)
    try {
      const r = await animeApi.syncNow({ perPage: 25, prune: true })
      toast.success(r.message)
      if (r.errors?.length) toast.error(`Avertissements : ${r.errors[0]}`)
      refresh(); onSynced()
    } catch (err) { toast.error(err.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="adm-card mb-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[0.9rem] font-bold">
            <span className={`inline-block h-2 w-2 rounded-full ${data?.enabled ? 'bg-brand' : 'bg-fg-faint'}`} />
            Bot AniList
          </div>
          <p className="mt-1 mb-0 max-w-xl text-[0.79rem] leading-relaxed text-fg-muted">
            Importe automatiquement les animés en cours, à venir et tendances, avec
            affiches, synopsis et jour de diffusion. Passage complet à 04h00, calendrier
            rafraîchi toutes les 6 heures.
          </p>
        </div>
        <button className="adm-btn adm-btn-primary" onClick={run} disabled={busy}>
          {busy ? 'Synchronisation…' : 'Synchroniser maintenant'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          ['Importés',   counts.auto     ?? '—', 'text-brand'],
          ['Manuels',    counts.manual   ?? '—', 'text-info'],
          ['Verrouillés',counts.locked   ?? '—', 'text-warn'],
          ['En cours',   counts.airing   ?? '—', 'text-fg'],
          ['À venir',    counts.upcoming ?? '—', 'text-violet'],
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-lg border border-line bg-ink-800/50 px-3 py-2">
            <div className="text-[0.64rem] uppercase tracking-wider text-fg-faint">{label}</div>
            <div className={`text-[1.05rem] font-extrabold ${tone}`}>{value}</div>
          </div>
        ))}
      </div>

      <p className="mb-0 mt-3 text-[0.74rem] text-fg-faint">
        {last
          ? `Dernière synchronisation : ${new Date(last).toLocaleString('fr-FR')}`
          : 'Aucune synchronisation enregistrée pour le moment.'}
        {' · '}
        Une fiche que tu modifies se <strong className="text-warn">verrouille</strong> automatiquement :
        le bot ne l'écrasera plus jamais.
      </p>
    </div>
  )
}

export default function AnimeSection({ toast }) {
  const { data, loading, execute } = useApi(() => animeApi.getAll({ limit:100 }), [], true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const animes = data?.animes || []

  const toggleLock = async (a) => {
    try {
      const r = await animeApi.setLock(a.id, !a.isLocked)
      toast.success(r.message); execute()
    } catch (err) { toast.error(err.message) }
  }

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
    <div>
      <SyncPanel toast={toast} onSynced={execute} />

      <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>📺 Planning Anime ({animes.length})</span>
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setModal(true) }}>+ Anime</Button>
      </div>
      <div className="grid gap-2.5 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {animes.map(a => (
          <div key={a.id} className="flex gap-2.5 rounded-xl border border-line bg-ink-800/40 p-2.5">
            {a.coverUrl
              ? <img src={resolveCover(a.coverUrl)} alt="" loading="lazy"
                  className="h-[76px] w-[56px] shrink-0 rounded-lg object-cover" />
              : <div className="flex h-[76px] w-[56px] shrink-0 items-center justify-center rounded-lg bg-ink-800 text-xl">📺</div>}

            <div className="min-w-0 flex-1">
              <div className="truncate text-[0.85rem] font-bold text-fg" title={a.titleF}>{a.titleF}</div>

              <div className="my-1 flex flex-wrap items-center gap-1.5">
                <Badge variant={statusVariant(a.status)} style={{ fontSize:'.62rem' }}>
                  {STATUS_OPTS.find(s => s.v === a.status)?.l || a.status}
                </Badge>
                {/* Origine de la fiche : l'admin doit savoir d'un coup d'œil
                    ce que le bot peut écraser et ce qui est protégé. */}
                {a.source === 'auto' && (
                  <span className="adm-chip text-info">AniList</span>
                )}
                {a.isLocked && <span className="adm-chip text-warn" title="Le bot n'écrasera pas cette fiche">Verrouillée</span>}
              </div>

              <div className="text-[0.72rem] text-fg-faint">
                {new Date(a.month).toLocaleDateString('fr-FR', { month:'long', year:'numeric' })}
                {a.studio && ` · ${a.studio}`}
              </div>

              {/* Prochain épisode : c'est l'information « ça sort cette semaine ». */}
              {a.nextEpisodeAt && (
                <div className="mt-0.5 text-[0.72rem] font-semibold text-brand">
                  Ép. {a.nextEpisodeNumber} — {a.weekday} {new Date(a.nextEpisodeAt).toLocaleDateString('fr-FR')}
                </div>
              )}
              {a.openingTitle && <div className="text-[0.72rem] text-fg-faint">🎵 {a.openingTitle}</div>}

              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Button variant="ghost" size="sm" onClick={() => { setEditing(a); setModal(true) }}>✏️</Button>
                {a.source === 'auto' && (
                  <Button variant="ghost" size="sm" onClick={() => toggleLock(a)}
                    title={a.isLocked ? 'Rendre la fiche au bot' : 'Protéger de la synchro'}>
                    {a.isLocked ? '🔓' : '🔒'}
                  </Button>
                )}
                <Button variant="danger" size="sm" onClick={() => remove(a.id)}>🗑️</Button>
              </div>
            </div>
          </div>
        ))}
        {!animes.length && <EmptyState icon="📺" title="Aucun anime au planning" />}
      </div>
      {modal && <AnimeModal anime={editing} onClose={() => { setModal(false); setEditing(null) }} onSave={save} toast={toast} />}
      </div>
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
        {form.characters.length > 0 && (
          <div style={{ display:'flex', gap:8, marginBottom:4, padding:'0 2px' }}>
            <span style={{ flex:1.2, fontSize:'.62rem', fontWeight:700, letterSpacing:1, color:'#22c55e', textTransform:'uppercase' }}>Nom</span>
            <span style={{ flex:1, fontSize:'.62rem', fontWeight:700, letterSpacing:1, color:'#60a5fa', textTransform:'uppercase' }}>Rôle</span>
            <span style={{ flex:1.5, fontSize:'.62rem', fontWeight:700, letterSpacing:1, color:'#a78bfa', textTransform:'uppercase' }}>Image (URL)</span>
            <span style={{ width:22, flexShrink:0 }} />
          </div>
        )}
        {form.characters.map((c,i) => (
          <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
            <input value={c.name} onChange={e => setChar(i,'name',e.target.value)} placeholder="Ex: Naruto Uzumaki"
              style={{ ...fieldBaseStyle, flex:1.2, padding:'8px 10px', fontSize:'.85rem' }} onFocus={onFocusField} onBlur={onBlurField} />
            <input value={c.role} onChange={e => setChar(i,'role',e.target.value)} placeholder="Ex: Héros"
              style={{ ...fieldBaseStyle, flex:1, padding:'8px 10px', fontSize:'.85rem' }} onFocus={onFocusField} onBlur={onBlurField} />
            <input value={c.imageUrl} onChange={e => setChar(i,'imageUrl',e.target.value)} placeholder="https:// (optionnel)"
              style={{ ...fieldBaseStyle, flex:1.5, padding:'8px 10px', fontSize:'.85rem' }} onFocus={onFocusField} onBlur={onBlurField} />
            <button type="button" onClick={() => delChar(i)} style={{ background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:'1rem', flexShrink:0, width:22 }}>✕</button>
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
const fieldBaseStyle = { width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1.5px solid rgba(255,255,255,.12)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.88rem', outline:'none', transition:'border-color .15s, background .15s' }
const onFocusField = e => { e.target.style.borderColor = '#22c55e'; e.target.style.background = 'rgba(34,197,94,.06)' }
const onBlurField  = e => { e.target.style.borderColor = 'rgba(255,255,255,.12)'; e.target.style.background = 'rgba(255,255,255,.04)' }

function HInput({ label, value, onChange, type='text', placeholder }) {
  return (
    <div style={{ marginBottom:'.9rem' }}>
      <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:4, textTransform:'uppercase' }}>{label}</label>
      <input type={type} value={value??''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={fieldBaseStyle} onFocus={onFocusField} onBlur={onBlurField} />
    </div>
  )
}
function HTextarea({ label, value, onChange, rows=3 }) {
  return (
    <div style={{ marginBottom:'.9rem' }}>
      <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:4, textTransform:'uppercase' }}>{label}</label>
      <textarea value={value??''} onChange={e => onChange(e.target.value)} rows={rows}
        style={{ ...fieldBaseStyle, resize:'vertical', lineHeight:1.5 }} onFocus={onFocusField} onBlur={onBlurField} />
    </div>
  )
}
function HSelect({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom:'.9rem' }}>
      <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:4, textTransform:'uppercase' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={fieldBaseStyle} onFocus={onFocusField} onBlur={onBlurField}>
        {options.map(o => <option key={o.v} value={o.v} style={{ background:'#0f140f' }}>{o.l}</option>)}
      </select>
    </div>
  )
}
