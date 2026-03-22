// src/components/ui/ImageUploader.jsx
// Composant upload image → base64, prévisualisation, envoi API
import { useState, useRef } from 'react'
import { fileToBase64 } from '../../api'

export default function ImageUploader({
  currentUrl,       // URL actuelle (pour preview)
  onUpload,         // fonction async (imageData, imageMime) => void
  placeholder = '📸 Cliquer pour choisir une image',
  accept = 'image/*',
  maxSizeMB = 5,
  style = {},
}) {
  const [preview,  setPreview]  = useState(currentUrl || null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [success,  setSuccess]  = useState(false)
  const inputRef = useRef(null)

  const handleFile = async e => {
    const file = e.target.files[0]
    if (!file) return
    setError(null); setSuccess(false)

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image trop grande (max ${maxSizeMB}MB)`); return
    }
    if (!file.type.startsWith('image/')) {
      setError('Format invalide (JPG, PNG, WebP uniquement)'); return
    }

    // Preview immédiate
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    // Convertir en base64
    setLoading(true)
    try {
      const { data, mime } = await fileToBase64(file)
      await onUpload(data, mime)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch(err) {
      setError(err.message || 'Erreur upload')
      setPreview(currentUrl || null)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ ...style }}>
      <div
        onClick={() => !loading && inputRef.current?.click()}
        style={{
          width: '100%', minHeight: 120, borderRadius: 12,
          border: `2px dashed ${error ? '#dc2626' : success ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,
          background: 'rgba(255,255,255,0.03)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: loading ? 'not-allowed' : 'pointer',
          overflow: 'hidden', position: 'relative', transition: 'border-color .2s',
        }}
        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#22c55e' }}
        onDragLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
        onDrop={async e => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file) { inputRef.current.files = e.dataTransfer.files; handleFile({ target: inputRef.current }) }
        }}
      >
        {preview ? (
          <>
            <img src={preview} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0 }} />
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', opacity: loading ? 1 : 0, transition:'opacity .2s' }}>
              {loading && <div style={{ width:28, height:28, border:'3px solid rgba(34,197,94,.3)', borderTopColor:'#22c55e', borderRadius:'50%', animation:'spin .8s linear infinite' }} />}
            </div>
          </>
        ) : (
          <div style={{ textAlign:'center', padding:'1.5rem', color:'var(--muted)' }}>
            <div style={{ fontSize:'2rem', marginBottom:'.5rem' }}>{loading ? '⏳' : '📸'}</div>
            <div style={{ fontSize:'.82rem' }}>{loading ? 'Upload en cours...' : placeholder}</div>
            <div style={{ fontSize:'.72rem', marginTop:'.3rem', opacity:.6 }}>JPG, PNG, WebP — max {maxSizeMB}MB — glisser-déposer OK</div>
          </div>
        )}
      </div>

      {error   && <div style={{ color:'#f87171', fontSize:'.78rem', marginTop:6 }}>⚠️ {error}</div>}
      {success && <div style={{ color:'#22c55e', fontSize:'.78rem', marginTop:6 }}>✅ Image mise à jour !</div>}
      {preview && !loading && (
        <button
          onClick={() => inputRef.current?.click()}
          style={{ marginTop:8, padding:'6px 14px', borderRadius:8, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', color:'var(--muted)', cursor:'pointer', fontSize:'.8rem', fontFamily:'var(--font-body)' }}
        >
          📸 Changer l'image
        </button>
      )}
      <input ref={inputRef} type="file" accept={accept} style={{ display:'none' }} onChange={handleFile} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}