import { useEffect, useRef, useState } from 'react'
import { chaptersApi } from '../../../api'
import { prepareImage, validateImageFile } from '../../../utils/media'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import MediaImage from '../../../components/ui/MediaImage'

export default function CreateChapterModal({
  manga,
  onClose,
  onSuccess,
  toast,
}) {
  const [form, setForm] = useState({
    chapterNumber: '',
    title: '',
    accessTier: 'free',
    coinCost: 5,
    isPublished: false,
  })
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const lock = useRef(false)
  const input = useRef(null)
  useEffect(() => {
    let active = true
    chaptersApi
      .getByManga(manga.id)
      .then((r) => {
        if (active)
          setForm((f) => ({
            ...f,
            chapterNumber:
              Math.floor(
                Math.max(0, ...r.chapters.map((c) => Number(c.chapterNumber)))
              ) + 1,
          }))
      })
      .catch((e) => {
        if (active) toast.error(e.message)
      })
    return () => {
      active = false
    }
  }, [manga.id])
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))
  function addFiles(list) {
    if (lock.current) return
    try {
      const added = [...list].sort((a, b) =>
        a.name.localeCompare(b.name, 'fr', { numeric: true })
      )
      added.forEach((file) => validateImageFile(file))
      const unique = new Map(
        [...files, ...added].map((f) => [
          `${f.name}:${f.size}:${f.lastModified}`,
          f,
        ])
      )
      if (unique.size > 200) throw new Error('Maximum 200 pages par chapitre.')
      setFiles([...unique.values()])
    } catch (err) {
      toast.error(err.message)
    }
  }
  async function submit(e) {
    e.preventDefault()
    if (lock.current) return
    if (!files.length) return toast.error('Ajoute au moins une page.')
    lock.current = true
    setBusy(true)
    try {
      const pages = []
      let bytes = 0
      for (const [i, file] of files.entries()) {
        setProgress(`Optimisation de la page ${i + 1} sur ${files.length}…`)
        const image = await prepareImage(file, { page: true, maxSizeMB: 10 })
        bytes += image.bytes
        if (bytes > 40 * 1024 * 1024)
          throw new Error(
            'Le chapitre dépasse 40 Mo après optimisation. Divise-le en plusieurs parties.'
          )
        pages.push({
          data: image.data,
          mime: image.mime,
          width: image.width,
          height: image.height,
          order: i,
        })
      }
      setProgress(
        `Envoi de ${pages.length} pages (${(bytes / 1048576).toFixed(1)} Mo)…`
      )
      await chaptersApi.create(manga.id, {
        ...form,
        chapterNumber: Number(form.chapterNumber),
        pages,
      })
      onSuccess()
    } catch (err) {
      toast.error(err.message)
    } finally {
      lock.current = false
      setBusy(false)
      setProgress('')
    }
  }
  function move(index, offset) {
    const next = [...files],
      other = index + offset
    if (busy || other < 0 || other >= files.length) return
    ;[next[index], next[other]] = [next[other], next[index]]
    setFiles(next)
  }
  return (
    <Modal
      isOpen
      wide
      dismissible={!busy}
      title={`Nouveau chapitre · ${manga.titleF}`}
      onClose={onClose}
    >
      <form className="editorial-form" onSubmit={submit}>
        <div className="editorial-grid">
          <label className="editorial-field">
            Numéro du chapitre *
            <input
              type="number"
              min="0"
              step="0.1"
              required
              value={form.chapterNumber}
              onChange={(e) => set('chapterNumber', e.target.value)}
            />
          </label>
          <label className="editorial-field">
            Titre
            <input
              value={form.title}
              maxLength="150"
              onChange={(e) => set('title', e.target.value)}
            />
          </label>
        </div>
        <label className="editorial-field">
          Accès au chapitre
          <select
            value={form.accessTier}
            onChange={(e) => set('accessTier', e.target.value)}
          >
            <option value="free">Gratuit — accessible à tous</option>
            <option value="premium">Premium — coins ou abonnement actif</option>
          </select>
        </label>
        {form.accessTier === 'premium' && (
          <label className="editorial-field">
            Prix du chapitre en coins
            <input
              type="number"
              min="1"
              max="10000"
              required
              value={form.coinCost}
              onChange={(e) => set('coinCost', Number(e.target.value))}
            />
          </label>
        )}
        <p className="editorial-notice">
          Pour une série freemium, publie les premiers chapitres gratuitement,
          puis choisis Premium pour les suivants. Chaque chapitre conserve son
          propre accès.
        </p>
        <button
          type="button"
          className="chapter-drop"
          disabled={busy}
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            addFiles(e.dataTransfer.files)
          }}
        >
          📚 Ajouter ou déposer les pages
          <br />
          <small>
            JPG, PNG, WebP, GIF · 20 Mo par fichier avant optimisation · 40 Mo
            par chapitre après optimisation
          </small>
        </button>
        <input
          ref={input}
          type="file"
          hidden
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <p>
          {files.length} page(s) · tri naturel des nouveaux fichiers (1, 2, 10).
          Vérifie l’ordre avant d’enregistrer.
        </p>
        <ol className="chapter-pages">
          {files.map((file, index) => (
            <li key={`${file.name}:${file.size}:${file.lastModified}`}>
              <FilePreview file={file} />
              <span>
                <strong>{index + 1}.</strong> {file.name}
              </span>
              <div>
                <button
                  type="button"
                  aria-label={`Monter page ${index + 1}`}
                  disabled={busy || index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Descendre page ${index + 1}`}
                  disabled={busy || index === files.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label={`Retirer page ${index + 1}`}
                  disabled={busy}
                  onClick={() =>
                    setFiles((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ol>
        <label className="editorial-check">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => set('isPublished', e.target.checked)}
            disabled={busy}
          />
          Publier ce chapitre maintenant
        </label>
        <p>
          {form.isPublished
            ? 'Le chapitre sera lisible lorsque la série sera approuvée.'
            : 'Le chapitre sera enregistré en brouillon dans Gérer les chapitres.'}
        </p>
        {progress && <p role="status">{progress}</p>}
        <div className="editorial-actions">
          <Button variant="ghost" disabled={busy} onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={busy}>
            {busy
              ? 'Traitement…'
              : form.isPublished
                ? 'Publier le chapitre'
                : 'Enregistrer le brouillon'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
function FilePreview({ file }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    const value = URL.createObjectURL(file)
    setUrl(value)
    return () => URL.revokeObjectURL(value)
  }, [file])
  return <MediaImage src={url} alt="" loading="lazy" />
}
