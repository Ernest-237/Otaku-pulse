// src/pages/Admin/sections/HeroSection.jsx
// Gestion complète du hero depuis l'admin
import { useState, useEffect } from 'react'
import { heroApi, API_BASE } from '../../../api'
import { useApi } from '../../../hooks/useApi'
import ImageUploader from '../../../components/ui/ImageUploader'
import Button from '../../../components/ui/Button'
import { PageLoader } from '../../../components/ui/Spinner'
import styles from '../Admin.module.css'

const ANIME_THEMES = [
  { name:'Naruto',         primary:'#f97316', second:'#fed7aa', glow:'rgba(249,115,22,0.4)',  emoji:'🍥' },
  { name:'One Piece',      primary:'#3b82f6', second:'#93c5fd', glow:'rgba(59,130,246,0.4)',  emoji:'⚓' },
  { name:'Jujutsu Kaisen', primary:'#8b5cf6', second:'#c4b5fd', glow:'rgba(139,92,246,0.4)', emoji:'💀' },
  { name:'Demon Slayer',   primary:'#ef4444', second:'#fca5a5', glow:'rgba(239,68,68,0.4)',   emoji:'🗡️' },
  { name:'Dragon Ball Z',  primary:'#eab308', second:'#fde68a', glow:'rgba(234,179,8,0.4)',   emoji:'🐉' },
  { name:'Attack on Titan',primary:'#64748b', second:'#94a3b8', glow:'rgba(100,116,139,0.4)',emoji:'⚔️' },
  { name:'Bleach',         primary:'#06b6d4', second:'#67e8f9', glow:'rgba(6,182,212,0.4)',   emoji:'⚡' },
  { name:'Personnalisé',   primary:'#22c55e', second:'#86efac', glow:'rgba(34,197,94,0.4)',   emoji:'⚡' },
]

export default function HeroSection({ toast }) {
  const { data, loading, execute } = useApi(() => heroApi.get(), [], true)
  const [form,    setForm]    = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [tab,     setTab]     = useState('content') // content | style | stats | preview

  useEffect(() => {
    if (data?.hero) setForm({ ...data.hero })
  }, [data])

  const s = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const applyTheme = (theme) => {
    s('primaryColor', theme.primary)
    s('secondColor',  theme.second)
    s('glowColor',    theme.glow)
    s('animeName',    theme.name)
  }

  const save = async () => {
    setSaving(true)
    try {
      const { bgImageData, bgImageMime, ...rest } = form
      await heroApi.update(rest)
      await execute()
      toast.success('✅ Hero mis à jour ! Visible sur le site immédiatement.')
    } catch(err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleBgUpload = async (imageData, imageMime) => {
    try {
      await heroApi.uploadBg(imageData, imageMime)
      await execute()
      toast.success('✅ Image de fond mise à jour !')
    } catch(err) { toast.error(err.message) }
  }

  if (loading || !form) return <PageLoader />

  const primary = form.primaryColor || '#22c55e'
  const second  = form.secondColor  || '#86efac'

  return (
    <div>
      {/* Preview mini */}
      <div style={{
        background: `linear-gradient(135deg, rgba(0,0,0,.7), rgba(0,0,0,.5)), url(${form.bgImageUrl || '/img/deku.jpg'}) center/cover`,
        borderRadius: 16, padding: '2rem', marginBottom: '1.5rem',
        border: `1px solid ${primary}33`, position: 'relative', overflow: 'hidden',
        minHeight: 160,
      }}>
        <div style={{ position:'absolute', top:12, right:12 }}>
          <span style={{ background:`${primary}22`, border:`1px solid ${primary}44`, borderRadius:20, padding:'4px 12px', fontSize:'.72rem', color:second, fontWeight:700, letterSpacing:2 }}>
            🎌 {form.animeName || 'Naruto'} · LIVE PREVIEW
          </span>
        </div>
        <div style={{ fontSize:'.8rem', color:second, letterSpacing:2, marginBottom:8, fontWeight:700 }}>{form.taglineF}</div>
        <div style={{ fontFamily:'var(--font-title)', fontSize:'clamp(1.2rem,3vw,2rem)', letterSpacing:3, color:'#f0fdf4', lineHeight:1.1 }}>
          {form.line1F}<br/>{form.line2F}<br/>
          <span style={{ background:`linear-gradient(135deg,${primary},${second})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontSize:'clamp(1.5rem,4vw,2.5rem)' }}>{form.accentF}</span>
        </div>
        <p style={{ fontSize:'.82rem', color:'rgba(240,253,244,.6)', marginTop:8, maxWidth:500 }}>{form.subtitleF}</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'var(--navy-mid)', border:'1px solid var(--border)', borderRadius:12, padding:4, marginBottom:'1.5rem' }}>
        {[['content','📝 Contenus'],['style','🎨 Thème'],['stats','📊 Stats'],['bg','🖼️ Image fond']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            flex:1, padding:'9px 8px', borderRadius:8, border:'none', cursor:'pointer',
            background: tab===k ? 'rgba(34,197,94,.12)' : 'none',
            color: tab===k ? '#22c55e' : 'var(--muted)',
            fontFamily:'var(--font-body)', fontSize:'.82rem', fontWeight:700, letterSpacing:'.5px',
            borderBottom: tab===k ? '2px solid #22c55e' : '2px solid transparent',
          }}>{l}</button>
        ))}
      </div>

      {/* TAB CONTENUS */}
      {tab === 'content' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>📝 Textes FR & EN</span></div>
          <div style={{ padding:'1.5rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div>
                <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--green)', letterSpacing:1, marginBottom:8, textTransform:'uppercase' }}>🇫🇷 Français</div>
                <HInput label="Badge / Tagline FR" value={form.taglineF} onChange={v => s('taglineF',v)} />
                <HInput label="Ligne 1 FR" value={form.line1F} onChange={v => s('line1F',v)} />
                <HInput label="Ligne 2 FR" value={form.line2F} onChange={v => s('line2F',v)} />
                <HInput label="Accent (mot vert) FR" value={form.accentF} onChange={v => s('accentF',v)} />
                <HTextarea label="Sous-titre FR" value={form.subtitleF} onChange={v => s('subtitleF',v)} rows={3} />
                <HInput label="Bouton principal FR" value={form.ctaPrimaryF} onChange={v => s('ctaPrimaryF',v)} />
                <HInput label="Bouton secondaire FR" value={form.ctaSecondaryF} onChange={v => s('ctaSecondaryF',v)} />
              </div>
              <div>
                <div style={{ fontSize:'.72rem', fontWeight:700, color:'#60a5fa', letterSpacing:1, marginBottom:8, textTransform:'uppercase' }}>🇬🇧 English</div>
                <HInput label="Badge / Tagline EN" value={form.taglineE} onChange={v => s('taglineE',v)} />
                <HInput label="Line 1 EN" value={form.line1E} onChange={v => s('line1E',v)} />
                <HInput label="Line 2 EN" value={form.line2E} onChange={v => s('line2E',v)} />
                <HInput label="Accent word EN" value={form.accentE} onChange={v => s('accentE',v)} />
                <HTextarea label="Subtitle EN" value={form.subtitleE} onChange={v => s('subtitleE',v)} rows={3} />
                <HInput label="Primary button EN" value={form.ctaPrimaryE} onChange={v => s('ctaPrimaryE',v)} />
                <HInput label="Secondary button EN" value={form.ctaSecondaryE} onChange={v => s('ctaSecondaryE',v)} />
              </div>
            </div>
            <div style={{ marginTop:'1rem' }}>
              <HInput label="📅 Date de lancement (countdown)" value={form.launchDate} onChange={v => s('launchDate',v)} type="date" />
            </div>
          </div>
        </div>
      )}

      {/* TAB THÈME */}
      {tab === 'style' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>🎨 Thème Anime & Couleurs</span></div>
          <div style={{ padding:'1.5rem' }}>
            <div style={{ fontSize:'.8rem', color:'var(--muted)', marginBottom:'1.2rem', lineHeight:1.6 }}>
              Choisis un thème prédéfini ou personnalise les couleurs manuellement. Les changements s'appliquent immédiatement sur le site après sauvegarde.
            </div>

            {/* Thèmes prédéfinis */}
            <div style={{ marginBottom:'1.5rem' }}>
              <div style={{ fontSize:'.72rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', textTransform:'uppercase', marginBottom:10 }}>Thèmes prédéfinis</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:8 }}>
                {ANIME_THEMES.map(t => (
                  <button key={t.name} onClick={() => applyTheme(t)} style={{
                    padding:'10px 12px', borderRadius:10, cursor:'pointer',
                    background: form.animeName===t.name ? `${t.primary}22` : 'rgba(255,255,255,.04)',
                    border: `2px solid ${form.animeName===t.name ? t.primary : 'rgba(255,255,255,.08)'}`,
                    color: form.animeName===t.name ? t.primary : 'var(--muted)',
                    fontFamily:'var(--font-body)', fontSize:'.82rem', fontWeight:700,
                    textAlign:'center', transition:'all .2s',
                  }}>
                    <div style={{ fontSize:'1.4rem', marginBottom:4 }}>{t.emoji}</div>
                    <div>{t.name}</div>
                    <div style={{ width:'100%', height:4, borderRadius:2, background:t.primary, marginTop:6 }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Couleurs custom */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem' }}>
              <div>
                <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:6, textTransform:'uppercase' }}>Couleur principale</label>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input type="color" value={form.primaryColor} onChange={e => s('primaryColor',e.target.value)}
                    style={{ width:44, height:44, borderRadius:8, border:'none', cursor:'pointer', background:'none' }} />
                  <input value={form.primaryColor} onChange={e => s('primaryColor',e.target.value)}
                    style={{ flex:1, padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'monospace', fontSize:'.85rem', outline:'none' }} />
                </div>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:6, textTransform:'uppercase' }}>Couleur secondaire</label>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input type="color" value={form.secondColor} onChange={e => s('secondColor',e.target.value)}
                    style={{ width:44, height:44, borderRadius:8, border:'none', cursor:'pointer' }} />
                  <input value={form.secondColor} onChange={e => s('secondColor',e.target.value)}
                    style={{ flex:1, padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'monospace', fontSize:'.85rem', outline:'none' }} />
                </div>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:6, textTransform:'uppercase' }}>Nom de l'anime</label>
                <input value={form.animeName} onChange={e => s('animeName',e.target.value)}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none' }} />
              </div>
            </div>

            {/* Preview couleurs */}
            <div style={{ marginTop:'1.5rem', padding:'1.2rem', borderRadius:12, background:`${primary}11`, border:`1px solid ${primary}33` }}>
              <div style={{ fontSize:'.75rem', color:'var(--muted)', marginBottom:8 }}>Preview palette :</div>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ width:40, height:40, borderRadius:8, background:primary, boxShadow:`0 0 15px ${primary}` }} />
                <div style={{ width:40, height:40, borderRadius:8, background:second }} />
                <div style={{ fontFamily:'var(--font-title)', fontSize:'1.5rem', color:primary, letterSpacing:2 }}>OTAKU PULSE</div>
                <div style={{ padding:'6px 16px', borderRadius:8, background:`linear-gradient(135deg,${primary},${primary}cc)`, color:'#0c1a2e', fontFamily:'var(--font-title)', letterSpacing:1.5, fontSize:'.9rem' }}>CTA Button</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB STATS */}
      {tab === 'stats' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>📊 Statistiques affichées sur le hero</span></div>
          <div style={{ padding:'1.5rem' }}>
            <p style={{ fontSize:'.82rem', color:'var(--muted)', marginBottom:'1.2rem' }}>Ces 4 stats s'affichent en bas du hero. Mets à jour les chiffres régulièrement !</p>
            {(form.statsJson || []).map((stat, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1.5fr 1.5fr', gap:'1rem', marginBottom:'1rem', padding:'1rem', background:'rgba(255,255,255,.03)', border:'1px solid var(--border)', borderRadius:10 }}>
                <div>
                  <label style={{ display:'block', fontSize:'.65rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:4, textTransform:'uppercase' }}>Valeur FR</label>
                  <input value={stat.valueFr} onChange={e => {
                    const next = [...form.statsJson]
                    next[i] = { ...next[i], valueFr: e.target.value }
                    s('statsJson', next)
                  }} style={{ width:'100%', padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'.65rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:4, textTransform:'uppercase' }}>Value EN</label>
                  <input value={stat.valueEn} onChange={e => {
                    const next = [...form.statsJson]; next[i] = { ...next[i], valueEn: e.target.value }; s('statsJson', next)
                  }} style={{ width:'100%', padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'.65rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:4, textTransform:'uppercase' }}>Label FR</label>
                  <input value={stat.labelFr} onChange={e => {
                    const next = [...form.statsJson]; next[i] = { ...next[i], labelFr: e.target.value }; s('statsJson', next)
                  }} style={{ width:'100%', padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'.65rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:4, textTransform:'uppercase' }}>Label EN</label>
                  <input value={stat.labelEn} onChange={e => {
                    const next = [...form.statsJson]; next[i] = { ...next[i], labelEn: e.target.value }; s('statsJson', next)
                  }} style={{ width:'100%', padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB IMAGE FOND */}
      {tab === 'bg' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>🖼️ Image de fond du Hero</span></div>
          <div style={{ padding:'1.5rem' }}>
            <p style={{ fontSize:'.82rem', color:'var(--muted)', marginBottom:'1.2rem', lineHeight:1.6 }}>
              L'image s'affiche en arrière-plan du hero avec un overlay sombre. Idéalement une image en paysage 1920×1080px.
            </p>
            <ImageUploader
              currentUrl={form.bgImageUrl || '/img/deku.jpg'}
              onUpload={handleBgUpload}
              placeholder="📸 Choisir une image de fond (PNG, JPG, WebP)"
              maxSizeMB={5}
              style={{ marginBottom:'1rem' }}
            />
            <div style={{ marginTop:'1rem' }}>
              <label style={{ display:'block', fontSize:'.72rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:6, textTransform:'uppercase' }}>Ou entrer une URL d'image</label>
              <input value={form.bgImageUrl || ''} onChange={e => s('bgImageUrl', e.target.value)}
                placeholder="https://...image.jpg"
                style={{ width:'100%', padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.9rem', outline:'none' }} />
            </div>
          </div>
        </div>
      )}

      {/* Save button */}
      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'1.5rem' }}>
        <Button variant="primary" loading={saving} onClick={save} style={{ padding:'12px 32px', fontSize:'1rem' }}>
          💾 Sauvegarder le Hero
        </Button>
      </div>
    </div>
  )
}

// Form helpers
function HInput({ label, value, onChange, type='text', placeholder }) {
  return (
    <div style={{ marginBottom:'.9rem' }}>
      <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:4, textTransform:'uppercase' }}>{label}</label>
      <input type={type} value={value||''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.88rem', outline:'none', transition:'border-color .2s' }}
        onFocus={e => e.target.style.borderColor='#22c55e'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,.1)'} />
    </div>
  )
}
function HTextarea({ label, value, onChange, rows=3 }) {
  return (
    <div style={{ marginBottom:'.9rem' }}>
      <label style={{ display:'block', fontSize:'.68rem', fontWeight:700, letterSpacing:1, color:'var(--muted)', marginBottom:4, textTransform:'uppercase' }}>{label}</label>
      <textarea value={value||''} onChange={e => onChange(e.target.value)} rows={rows}
        style={{ width:'100%', padding:'9px 12px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text)', fontFamily:'var(--font-body)', fontSize:'.88rem', outline:'none', resize:'vertical', lineHeight:1.5, transition:'border-color .2s' }}
        onFocus={e => e.target.style.borderColor='#22c55e'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,.1)'} />
    </div>
  )
}