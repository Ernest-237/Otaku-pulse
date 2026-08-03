// src/pages/Admin/sections/FandomSection.jsx
// Gestion de la page Fandom : titraille, activités, questions de quizz
import { useState, useEffect } from 'react'
import { fandomApi, API_BASE } from '../../../api'
import { useApi } from '../../../hooks/useApi'
import ImageUploader from '../../../components/ui/ImageUploader'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
import styles from '../Admin.module.css'

const LINK_TABS = [
  { v:'cosplay',    l:'🎭 Onglet Cosplay' },
  { v:'quizz',      l:'🧠 Onglet Quizz' },
  { v:'classement', l:'🏆 Onglet Classements' },
  { v:'custom',     l:'🔗 Lien externe' },
]

export default function FandomSection({ toast }) {
  const [tab, setTab] = useState('config') // config | activities | quiz

  return (
    <div>
      <div style={{ display:'flex', gap:4, background:'var(--navy-mid)', border:'1px solid var(--border)', borderRadius:12, padding:4, marginBottom:'1.5rem' }}>
        {[['config','⚙️ Titraille'],['activities','🎮 Activités'],['quiz','🧠 Questions Quizz']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            flex:1, padding:'9px 8px', borderRadius:8, border:'none', cursor:'pointer',
            background: tab===k ? 'rgba(34,197,94,.12)' : 'none',
            color: tab===k ? '#22c55e' : 'var(--muted)',
            fontFamily:'var(--font-body)', fontSize:'.82rem', fontWeight:700, letterSpacing:'.5px',
            borderBottom: tab===k ? '2px solid #22c55e' : '2px solid transparent',
          }}>{l}</button>
        ))}
      </div>

      {tab === 'config'     && <ConfigTab toast={toast} />}
      {tab === 'activities' && <ActivitiesTab toast={toast} />}
      {tab === 'quiz'       && <QuizTab toast={toast} />}
    </div>
  )
}

/* ══ TITRAILLE ══ */
function ConfigTab({ toast }) {
  const { data, loading, execute } = useApi(() => fandomApi.getConfig(), [], true)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const s = (k,v) => setForm(f => ({ ...f, [k]:v }))

  useEffect(() => { if (data?.config) setForm({ ...data.config }) }, [data])

  const save = async () => {
    setSaving(true)
    try {
      const { id, createdAt, updatedAt, ...rest } = form
      await fandomApi.adminUpdateConfig(rest)
      await execute()
      toast.success('✅ Titraille Fandom mise à jour !')
    } catch(err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  if (loading || !form) return <PageLoader />

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}><span className={styles.cardTitle}>⚙️ Titraille de la page Fandom</span></div>
      <div style={{ padding:'1.5rem' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          <div>
            <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--green)', letterSpacing:1, marginBottom:8, textTransform:'uppercase' }}>🇫🇷 Français</div>
            <HInput label="Badge FR" value={form.badgeF} onChange={v => s('badgeF',v)} placeholder="ESPACE FANDOM" />
            <HInput label="Titre FR" value={form.titleF} onChange={v => s('titleF',v)} placeholder="FANDOM ARENA" />
            <HTextarea label="Sous-titre FR" value={form.subtitleF} onChange={v => s('subtitleF',v)} rows={3} />
          </div>
          <div>
            <div style={{ fontSize:'.72rem', fontWeight:700, color:'#60a5fa', letterSpacing:1, marginBottom:8, textTransform:'uppercase' }}>🇬🇧 English</div>
            <HInput label="Badge EN" value={form.badgeE} onChange={v => s('badgeE',v)} placeholder="FANDOM SPACE" />
            <HInput label="Titre EN" value={form.titleE} onChange={v => s('titleE',v)} placeholder="FANDOM ARENA" />
            <HTextarea label="Subtitle EN" value={form.subtitleE} onChange={v => s('subtitleE',v)} rows={3} />
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginTop:'.5rem' }}>
          <HInput label="Début événement (optionnel)" type="date" value={form.eventDateStart} onChange={v => s('eventDateStart',v)} />
          <HInput label="Fin événement (optionnel)" type="date" value={form.eventDateEnd} onChange={v => s('eventDateEnd',v)} />
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'1rem' }}>
          <Button variant="primary" loading={saving} onClick={save}>💾 Sauvegarder</Button>
        </div>
      </div>
    </div>
  )
}

/* ══ ACTIVITÉS ══ */
function ActivitiesTab({ toast }) {
  const { data, loading, execute } = useApi(() => fandomApi.adminGetActivities(), [], true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const activities = data?.activities || []

  const save = async (form) => {
    try {
      editing ? await fandomApi.adminUpdateActivity(editing.id, form) : await fandomApi.adminCreateActivity(form)
      toast.success('✅ Activité enregistrée'); execute(); setModal(false); setEditing(null)
    } catch(err) { toast.error(err.message) }
  }
  const remove = async (id) => {
    if (!confirm('Supprimer cette activité ?')) return
    try { await fandomApi.adminDeleteActivity(id); execute(); toast.success('🗑️ Supprimée') }
    catch(err) { toast.error(err.message) }
  }

  if (loading) return <PageLoader />

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>🎮 Activités ({activities.length})</span>
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setModal(true) }}>+ Activité</Button>
      </div>
      <div style={{ padding:'1rem', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:10 }}>
        {activities.map(a => (
          <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:10, background:'rgba(255,255,255,.03)', border:'1px solid var(--ad-border,rgba(51,255,51,.12))', borderRadius:10 }}>
            {a.imageUrl
              ? <img src={`${API_BASE}${a.imageUrl}`} alt="" style={{ width:36, height:36, borderRadius:8, objectFit:'cover', flexShrink:0 }} />
              : <span style={{ fontSize:'1.5rem', width:36, textAlign:'center', flexShrink:0 }}>{a.icon}</span>}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'.85rem', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--ad-text,#e8ffe8)' }}>{a.titleF}</div>
              <div style={{ fontSize:'.72rem', color: a.isActive ? '#4ade80' : '#f87171' }}>{a.isActive ? '✅ Active' : '🔴 Masquée'}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setEditing(a); setModal(true) }}>✏️</Button>
            <Button variant="danger" size="sm" onClick={() => remove(a.id)}>🗑️</Button>
          </div>
        ))}
        {!activities.length && <EmptyState icon="🎮" title="Aucune activité" />}
      </div>
      {modal && <ActivityModal activity={editing} onClose={() => { setModal(false); setEditing(null) }} onSave={save} toast={toast} />}
    </div>
  )
}

function ActivityModal({ activity:a, onClose, onSave, toast }) {
  const [form, setForm] = useState({
    titleF: a?.titleF||'', titleE: a?.titleE||'', descF: a?.descF||'', descE: a?.descE||'',
    icon: a?.icon||'🎮', linkTab: a?.linkTab||'custom', externalUrl: a?.externalUrl||'',
    imageData: null, imageMime: null, order: a?.order??0, isActive: a?.isActive!==false,
  })
  const s = (k,v) => setForm(f => ({ ...f, [k]:v }))

  const submit = () => {
    if (!form.titleF.trim()) return toast.error('Titre FR requis')
    const payload = { ...form }
    if (!payload.imageData) { delete payload.imageData; delete payload.imageMime }
    onSave(payload)
  }

  return (
    <Modal isOpen dark title={a ? '✏️ Modifier activité' : '🎮 Nouvelle activité'} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button variant="primary" onClick={submit}>💾 Enregistrer</Button></>}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <HInput label="Titre FR *" value={form.titleF} onChange={v => s('titleF',v)} />
        <HInput label="Titre EN" value={form.titleE} onChange={v => s('titleE',v)} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <HTextarea label="Description FR" value={form.descF} onChange={v => s('descF',v)} rows={2} />
        <HTextarea label="Description EN" value={form.descE} onChange={v => s('descE',v)} rows={2} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem' }}>
        <HInput label="Icône (emoji)" value={form.icon} onChange={v => s('icon',v)} />
        <HSelect label="Lien vers" value={form.linkTab} onChange={v => s('linkTab',v)} options={LINK_TABS} />
        <HInput label="Ordre" type="number" value={form.order} onChange={v => s('order', Number(v))} />
      </div>
      {form.linkTab === 'custom' && (
        <HInput label="URL externe (optionnel)" value={form.externalUrl} onChange={v => s('externalUrl',v)} placeholder="https://..." />
      )}
      <div style={{ marginBottom:'1rem' }}>
        <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:6, textTransform:'uppercase' }}>Image (optionnel, sinon icône)</label>
        <ImageUploader
          currentUrl={a?.imageUrl ? `${API_BASE}${a.imageUrl}` : null}
          onUpload={async (data, mime) => { s('imageData', data); s('imageMime', mime) }}
          allowUrl={false}
          placeholder="Cliquer pour choisir une image"
        />
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'.88rem', color:'#cbd5e1' }}>
        <input type="checkbox" checked={form.isActive} onChange={e => s('isActive', e.target.checked)} style={{ accentColor:'#33ff33' }} /> ✅ Visible sur le site
      </label>
    </Modal>
  )
}

/* ══ QUESTIONS QUIZZ ══ */
function QuizTab({ toast }) {
  const { data, loading, execute } = useApi(() => fandomApi.adminGetQuestions(), [], true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const questions = data?.questions || []

  const save = async (form) => {
    try {
      editing ? await fandomApi.adminUpdateQuestion(editing.id, form) : await fandomApi.adminCreateQuestion(form)
      toast.success('✅ Question enregistrée'); execute(); setModal(false); setEditing(null)
    } catch(err) { toast.error(err.message) }
  }
  const remove = async (id) => {
    if (!confirm('Supprimer cette question ?')) return
    try { await fandomApi.adminDeleteQuestion(id); execute(); toast.success('🗑️ Supprimée') }
    catch(err) { toast.error(err.message) }
  }

  if (loading) return <PageLoader />

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>🧠 Questions ({questions.length})</span>
        <Button variant="primary" size="sm" onClick={() => { setEditing(null); setModal(true) }}>+ Question</Button>
      </div>
      <div style={{ padding:'1rem' }}>
        {questions.map(q => (
          <div key={q.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--ad-border,rgba(51,255,51,.12))' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'.85rem', fontWeight:700, color:'var(--ad-text,#e8ffe8)' }}>{q.question}</div>
              <div style={{ fontSize:'.72rem', color:'var(--ad-text-2,#8fa896)' }}>{q.category} · {q.difficulty} · {q.points} pts · {q.isActive ? '✅ Active' : '🔴 Inactive'}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setEditing(q); setModal(true) }}>✏️</Button>
            <Button variant="danger" size="sm" onClick={() => remove(q.id)}>🗑️</Button>
          </div>
        ))}
        {!questions.length && <EmptyState icon="🧠" title="Aucune question" />}
      </div>
      {modal && <QuestionModal question={editing} onClose={() => { setModal(false); setEditing(null) }} onSave={save} toast={toast} />}
    </div>
  )
}

function QuestionModal({ question:q, onClose, onSave, toast }) {
  const [form, setForm] = useState({
    question: q?.question||'', options: q?.options||['','','',''],
    correctIndex: q?.correctIndex??0, category: q?.category||'general',
    difficulty: q?.difficulty||'moyen', points: q?.points??10, isActive: q?.isActive!==false,
  })
  const s = (k,v) => setForm(f => ({ ...f, [k]:v }))
  const setOption = (i,v) => { const next = [...form.options]; next[i] = v; s('options', next) }

  const submit = () => {
    if (!form.question.trim()) return toast.error('Question requise')
    if (form.options.some(o => !o.trim())) return toast.error('Les 4 options sont requises')
    onSave(form)
  }

  return (
    <Modal isOpen dark title={q ? '✏️ Modifier question' : '🧠 Nouvelle question'} onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button variant="primary" onClick={submit}>💾 Enregistrer</Button></>}>
      <HTextarea label="Question *" value={form.question} onChange={v => s('question',v)} rows={2} />
      {form.options.map((opt,i) => {
        const isCorrect = form.correctIndex === i
        return (
          <div key={i} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:'.6rem' }}>
            <input type="radio" name="correct" checked={isCorrect} onChange={() => s('correctIndex',i)}
              style={{ accentColor:'#33ff33', flexShrink:0 }} title="Bonne réponse" />
            <span style={{ width:22, textAlign:'center', fontWeight:800, fontSize:'.8rem', color: isCorrect ? '#22c55e' : 'var(--muted)', flexShrink:0 }}>{['A','B','C','D'][i]}</span>
            <input value={opt} onChange={e => setOption(i, e.target.value)} placeholder={`Option ${['A','B','C','D'][i]}`}
              style={{ ...fieldBaseStyle, flex:1, padding:'8px 10px',
                borderColor: isCorrect ? 'rgba(34,197,94,.5)' : 'rgba(255,255,255,.12)',
                background: isCorrect ? 'rgba(34,197,94,.06)' : 'rgba(255,255,255,.04)' }}
              onFocus={onFocusField} onBlur={e => { if (!isCorrect) onBlurField(e) }} />
          </div>
        )
      })}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', marginTop:'.6rem' }}>
        <HInput label="Catégorie" value={form.category} onChange={v => s('category',v)} placeholder="naruto, onepiece..." />
        <HSelect label="Difficulté" value={form.difficulty} onChange={v => s('difficulty',v)}
          options={[{v:'facile',l:'Facile'},{v:'moyen',l:'Moyen'},{v:'difficile',l:'Difficile'}]} />
        <HInput label="Points" type="number" value={form.points} onChange={v => s('points', Number(v))} />
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'.88rem', color:'#cbd5e1', marginTop:'.6rem' }}>
        <input type="checkbox" checked={form.isActive} onChange={e => s('isActive', e.target.checked)} style={{ accentColor:'#33ff33' }} /> ✅ Active (jouable)
      </label>
    </Modal>
  )
}

/* ══ Helpers de formulaire (mêmes styles que HeroSection) ══ */
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
