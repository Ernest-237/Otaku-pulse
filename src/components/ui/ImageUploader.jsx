import { useEffect, useRef, useState } from 'react'
import { prepareImage } from '../../utils/media'
import { resolveMediaUrl } from '../../api'
import MediaImage from './MediaImage'
import styles from './ImageUploader.module.css'

export default function ImageUploader({
  currentUrl,
  onUpload,
  onUrlChange,
  onBusyChange,
  allowUrl = true,
  placeholder = 'Choisir ou déposer une image',
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  maxSizeMB = 5,
  style = {},
}) {
  const [mode, setMode] = useState('file')
  const [preview, setPreview] = useState(currentUrl || '')
  const [url, setUrl] = useState(currentUrl || '')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const input = useRef(null)
  const locked = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    if (!locked.current) {
      setPreview(currentUrl || '')
      setUrl(currentUrl || '')
    }
  }, [currentUrl])
  const run = async (action) => {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    setFeedback(null)
    onBusyChange?.(true)
    try {
      await action()
      if (mounted.current)
        setFeedback({
          ok: true,
          text: 'Image prête. Enregistre le formulaire pour valider tes changements.',
        })
    } catch (e) {
      if (mounted.current) {
        setFeedback({
          ok: false,
          text: e.message || 'Envoi impossible. Réessaie.',
        })
        setPreview(currentUrl || '')
      }
    } finally {
      locked.current = false
      onBusyChange?.(false)
      if (mounted.current) setBusy(false)
    }
  }
  const processFile = (file) =>
    file &&
    run(async () => {
      if (!onUpload)
        throw new Error('Le chargement de fichier n’est pas disponible ici.')
      const image = await prepareImage(file, { maxSizeMB })
      await onUpload(image.data, image.mime)
      if (mounted.current) setPreview(`data:${image.mime};base64,${image.data}`)
    })
  const applyUrl = () =>
    run(async () => {
      if (!/^https?:\/\//i.test(url.trim()))
        throw new Error('Utilise une adresse complète https://…')
      const image = new Image()
      image.src = url.trim()
      let timer
      try {
        await Promise.race([
          image.decode(),
          new Promise((_, reject) => {
            timer = setTimeout(
              () =>
                reject(
                  new Error('Cette image ne répond pas. Vérifie le lien.')
                ),
              10000
            )
          }),
        ])
      } finally {
        clearTimeout(timer)
      }
      await onUrlChange(url.trim())
      if (mounted.current) setPreview(url.trim())
    })
  return (
    <div className={styles.wrap} style={style} aria-busy={busy}>
      {allowUrl && onUrlChange && (
        <div className={styles.tabs}>
          <button
            type="button"
            aria-pressed={mode === 'file'}
            disabled={busy}
            onClick={() => setMode('file')}
          >
            🖼️ Depuis mon appareil
          </button>
          <button
            type="button"
            aria-pressed={mode === 'url'}
            disabled={busy}
            onClick={() => setMode('url')}
          >
            Lien d’image
          </button>
        </div>
      )}
      {mode === 'file' ? (
        <button
          type="button"
          className={styles.drop}
          disabled={busy}
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            processFile(e.dataTransfer.files?.[0])
          }}
        >
          {preview && (
            <MediaImage
              src={resolveMediaUrl(preview)}
              alt="Aperçu de l’image"
            />
          )}
          <span className={preview ? styles.caption : ''}>
            {busy ? 'Optimisation et chargement…' : placeholder}
          </span>
        </button>
      ) : (
        <div className={styles.link}>
          {preview && <MediaImage src={preview} alt="Aperçu de l’image" />}
          <label>
            Adresse de l’image
            <input
              type="url"
              value={url}
              disabled={busy}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
          </label>
          <button type="button" onClick={applyUrl} disabled={busy}>
            {busy ? 'Vérification…' : 'Utiliser cette image'}
          </button>
        </div>
      )}
      <p className={styles.hint}>
        JPG, PNG, WebP, GIF · jusqu’à 20 Mo avant optimisation · {maxSizeMB} Mo
        maximum après optimisation.
      </p>
      {feedback && (
        <p
          className={feedback.ok ? styles.success : styles.error}
          role={feedback.ok ? 'status' : 'alert'}
        >
          {feedback.text}
        </p>
      )}
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          processFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
