// src/components/ui/ImageUploader.jsx
// Composant upload image universel : FICHIER (→base64) OU LIEN URL
// Preview, validation taille/format, drag&drop, gestion d'erreur robuste
import { useState, useRef, useEffect } from 'react'
import { fileToBase64 } from '../../api'

export default function ImageUploader({
  currentUrl,        // URL actuelle (preview initiale)
  onUpload,          // async (imageData, imageMime) => void  — pour un fichier
  onUrlChange,       // (url) => void                          — pour un lien (optionnel)
  allowUrl = true,   // autoriser l'onglet "Lien URL"
  placeholder = 'Cliquer ou glisser une image',
  accept = 'image/*',
  maxSizeMB = 5,
  style = {},
}) {
  const [mode, setMode]       = useState('file')  // 'file' | 'url'
  const [preview, setPreview] = useState(currentUrl || null)
  const [urlValue, setUrlValue] = useState(currentUrl && currentUrl.startsWith('http') ? currentUrl : '')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef(null)
  const objectUrlRef = useRef(null)

  // Nettoyer les object URLs pour éviter les fuites mémoire
  useEffect(() => {
    return () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current) }
  }, [])

  const resetFeedback = () => { setError(null); setSuccess(false) }

  const processFile = async (file) => {
    resetFeedback()
    if (!file) return

    // Validations
    if (!file.type || !file.type.startsWith('image/')) {
      setError('Format invalide (JPG, PNG, WebP, GIF)')
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image trop lourde (max ${maxSizeMB}MB). Compresse-la d'abord.`)
      return
    }

    // Preview immédiate
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const objectUrl = URL.createObjectURL(file)
    objectUrlRef.current = objectUrl
    setPreview(objectUrl)

    // Conversion base64 + envoi
    setLoading(true)
    try {
      const { data, mime } = await fileToBase64(file)
      if (!data) throw new Error('Conversion échouée')
      await onUpload?.(data, mime)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Erreur lors de l\'upload')
      setPreview(currentUrl || null)
    } finally {
      setLoading(false)
    }
  }

  const handleFileInput = (e) => {
    const file = e.target.files?.[0]
    processFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.currentTarget.style.borderColor = ''
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const applyUrl = () => {
    resetFeedback()
    const u = urlValue.trim()
    if (!u) { setError('Entre une URL d\'image'); return }
    if (!u.startsWith('http')) { setError('L\'URL doit commencer par http(s)://'); return }
    setPreview(u)
    onUrlChange?.(u)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div style={{ ...style }}>
      {/* Onglets Fichier / Lien */}
      {allowUrl && onUrlChange && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <button type="button" onClick={() => setMode('file')}
            style={tabStyle(mode === 'file')}>📁 Fichier</button>
          <button type="button" onClick={() => setMode('url')}
            style={tabStyle(mode === 'url')}>🔗 Lien URL</button>
        </div>
      )}

      {/* MODE FICHIER */}
      {mode === 'file' && (
        <div
          onClick={() => !loading && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#33ff33' }}
          onDragLeave={e => { e.currentTarget.style.borderColor = '' }}
          onDrop={handleDrop}
          style={{
            width: '100%', minHeight: 130, borderRadius: 12,
            border: `2px dashed ${error ? '#ef4444' : success ? '#22c55e' : 'rgba(120,200,140,.25)'}`,
            background: 'rgba(255,255,255,0.03)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
            overflow: 'hidden', position: 'relative', transition: 'border-color .2s',
          }}
        >
          {preview ? (
            <>
              <img src={preview} alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                onError={() => { setError('Image illisible'); setPreview(null) }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: loading ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                opacity: loading ? 1 : 0, transition: 'opacity .2s',
              }}>
                {loading && <Spinner />}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9aa6c0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>{loading ? '⏳' : '📸'}</div>
              <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{loading ? 'Upload en cours...' : placeholder}</div>
              <div style={{ fontSize: '.72rem', marginTop: '.3rem', opacity: .6 }}>
                JPG, PNG, WebP, GIF — max {maxSizeMB}MB — glisser-déposer OK
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE URL */}
      {mode === 'url' && (
        <div>
          {preview && (
            <div style={{ width: '100%', height: 130, borderRadius: 12, overflow: 'hidden', marginBottom: 10, border: '1px solid rgba(120,200,140,.18)' }}>
              <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setError('URL d\'image invalide ou inaccessible')} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="url"
              value={urlValue}
              onChange={e => setUrlValue(e.target.value)}
              placeholder="https://exemple.com/image.jpg"
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 10,
                background: 'var(--ad-bg, #0a0c16)', border: '1px solid rgba(120,200,140,.2)',
                color: '#e8eef5', fontSize: '.88rem', outline: 'none',
              }}
            />
            <button type="button" onClick={applyUrl}
              style={{
                padding: '9px 16px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#22c55e,#15803d)', color: '#fff',
                fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
              ✓ Appliquer
            </button>
          </div>
        </div>
      )}

      {/* Feedback */}
      {error   && <div style={{ color: '#fca5a5', fontSize: '.78rem', marginTop: 8 }}>⚠️ {error}</div>}
      {success && <div style={{ color: '#4ade80', fontSize: '.78rem', marginTop: 8 }}>✅ Image mise à jour !</div>}

      {/* Bouton changer (mode fichier avec preview) */}
      {mode === 'file' && preview && !loading && (
        <button type="button" onClick={() => inputRef.current?.click()}
          style={{
            marginTop: 8, padding: '6px 14px', borderRadius: 8,
            background: 'rgba(255,255,255,.06)', border: '1px solid rgba(120,200,140,.18)',
            color: '#9aa6c0', cursor: 'pointer', fontSize: '.8rem', fontFamily: 'var(--font-body)',
          }}>
          📸 Changer l'image
        </button>
      )}

      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={handleFileInput} />
    </div>
  )
}

function tabStyle(active) {
  return {
    flex: 1, padding: '7px 12px', borderRadius: 9,
    border: `1px solid ${active ? 'rgba(51,255,51,.4)' : 'rgba(120,200,140,.18)'}`,
    background: active ? 'rgba(51,255,51,.12)' : 'transparent',
    color: active ? '#33ff33' : '#9aa6c0',
    fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', transition: 'all .15s',
  }
}

function Spinner() {
  return (
    <div style={{
      width: 30, height: 30,
      border: '3px solid rgba(51,255,51,.25)', borderTopColor: '#33ff33',
      borderRadius: '50%', animation: 'spin .8s linear infinite',
    }} />
  )
}