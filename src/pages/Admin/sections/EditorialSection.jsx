import { useState } from 'react'
import { Link } from 'react-router-dom'
import { blogApi, eventsApi } from '../../../api'
import { useApi } from '../../../hooks/useApi'
import ImageUploader from '../../../components/ui/ImageUploader'
import MediaImage from '../../../components/ui/MediaImage'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'

const categories = {
  blog: 'Journal',
  event: 'Annonce événement',
  promo: 'Promotion',
  partner: 'Partenaire',
}
const states = {
  draft: 'Brouillon',
  upcoming: 'À venir',
  ongoing: 'En cours',
  past: 'Terminé',
  cancelled: 'Annulé',
}
const amount = (n) => `${Number(n || 0).toLocaleString('fr-FR')} FCFA`
export function Field({ label, children, ...props }) {
  return (
    <label className="editorial-field">
      <span>{label}</span>
      {children || <input {...props} />}
    </label>
  )
}

export default function EditorialSection({ events = false, toast }) {
  const [search, setSearch] = useState('')
  const [state, setState] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [registrations, setRegistrations] = useState(null)
  const [saving, setSaving] = useState(false)
  const { data, loading, error, refresh } = useApi(
    () =>
      events
        ? eventsApi.getAdmin({ search, status: state, page, limit: 15 })
        : blogApi.getAdminPosts({ search, state, page, limit: 15 }),
    [events, search, state, page]
  )
  const rows = data?.[events ? 'events' : 'posts'] || []
  async function save(form) {
    if (saving) return
    setSaving(true)
    try {
      if (events)
        editing.id
          ? await eventsApi.update(editing.id, form)
          : await eventsApi.create(form)
      else
        editing.id
          ? await blogApi.updatePost(editing.id, form)
          : await blogApi.createPost(form)
      toast.success('Publication enregistrée')
      setEditing(null)
      refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }
  return (
    <div className="editorial-admin">
      <div className="editorial-heading">
        <div>
          <p className="editorial-eyebrow">
            {events
              ? '🎌 Agenda du Cameroun'
              : '🍵 Le journal de la communauté'}
          </p>
          <h2>{events ? 'Nos événements' : 'Blog & actualités'}</h2>
          <p>
            {events
              ? 'Prépare les rencontres, ouvre les inscriptions et retrouve chaque billet.'
              : 'Rédige, conserve un brouillon ou programme ta prochaine publication.'}
          </p>
        </div>
        <Button variant="primary" onClick={() => setEditing({})}>
          + {events ? 'Créer un événement' : 'Écrire un article'}
        </Button>
      </div>
      <div className="editorial-toolbar">
        <Field label="Rechercher">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Titre de la publication…"
          />
        </Field>
        <Field label="État">
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Tous les états</option>
            {Object.entries(
              events
                ? states
                : { draft: 'Brouillons', published: 'Publiés / programmés' }
            ).map(([key, text]) => (
              <option key={key} value={key}>
                {text}
              </option>
            ))}
          </select>
        </Field>
        <Link to={events ? '/evenements' : '/blog'}>
          Voir la page publique ↗
        </Link>
      </div>
      {error && (
        <div role="alert" className="editorial-notice">
          {error} <button onClick={refresh}>Réessayer</button>
        </div>
      )}
      <div className="editorial-list" aria-busy={loading}>
        {loading ? (
          <p role="status">Chargement des publications…</p>
        ) : (
          rows.map((item) => (
            <article className="editorial-row" key={item.id}>
              <MediaImage src={item.imageUrl} alt="" loading="lazy" />
              <div>
                <span className="editorial-eyebrow">
                  {events
                    ? states[item.status]
                    : !item.isPublished
                      ? 'Brouillon'
                      : new Date(item.publishedAt) > new Date()
                        ? 'Programmé'
                        : 'Publié'}{' '}
                  · {events ? item.city : categories[item.category]}
                </span>
                <h3>{item.titleF || item.title}</h3>
                <p>
                  {events
                    ? `${item.date} · ${item.venue || 'Lieu à préciser'} · ${item.registered || 0}/${item.capacity} places · ${item.isFree ? 'Gratuit' : amount(item.price)}`
                    : item.excerpt || 'Aucun résumé'}
                </p>
              </div>
              <div className="editorial-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(item)}
                >
                  Modifier
                </Button>
                {events && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRegistrations(item)}
                  >
                    Inscriptions
                  </Button>
                )}
              </div>
            </article>
          ))
        )}
        {!loading && !error && !rows.length && (
          <p>Aucune publication ici. Commence par un brouillon.</p>
        )}
      </div>
      <div className="editorial-pagination">
        <Button
          variant="ghost"
          disabled={page === 1 || loading}
          onClick={() => setPage((p) => p - 1)}
        >
          Précédent
        </Button>
        <span>
          Page {page} · {data?.total || 0} résultats
        </span>
        <Button
          variant="ghost"
          disabled={page * 15 >= (data?.total || 0) || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Suivant
        </Button>
      </div>
      {!events && <Extras toast={toast} />}
      {editing && (
        <PublicationEditor
          key={editing.id || 'new'}
          item={editing}
          events={events}
          saving={saving}
          onSave={save}
          onClose={() => !saving && setEditing(null)}
        />
      )}
      {registrations && (
        <Registrations
          event={registrations}
          toast={toast}
          onClose={() => setRegistrations(null)}
          onChange={refresh}
        />
      )}
    </div>
  )
}

function PublicationEditor({ item, events, saving, onSave, onClose }) {
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState(
    events
      ? {
          titleF: '',
          titleE: '',
          descF: '',
          descE: '',
          date: '',
          timeStart: '',
          timeEnd: '',
          city: 'Yaoundé',
          venue: '',
          type: 'custom',
          status: 'draft',
          capacity: 50,
          price: 0,
          isFree: true,
          featured: false,
          imageUrl: '',
          img: '🎌',
          ...item,
        }
      : {
          title: '',
          category: 'blog',
          excerpt: '',
          content: '',
          imageUrl: '',
          emoji: '🍵',
          isPublished: false,
          isFeatured: false,
          promoCode: '',
          promoExpiry: '',
          publishedAt: '',
          eventDate: '',
          eventCity: '',
          eventVenue: '',
          eventPrice: 0,
          eventUrl: '',
          ...item,
        }
  )
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  const input = (key, label, type = 'text', extra = {}) => (
    <Field label={label}>
      <input
        type={type}
        value={form[key] ?? ''}
        onChange={(e) =>
          set(key, type === 'number' ? Number(e.target.value) : e.target.value)
        }
        {...extra}
      />
    </Field>
  )
  const textarea = (key, label, rows = 3) => (
    <Field label={label}>
      <textarea
        rows={rows}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
      />
    </Field>
  )
  const check = (key, label) => (
    <label className="editorial-check">
      <input
        type="checkbox"
        checked={!!form[key]}
        onChange={(e) => set(key, e.target.checked)}
      />
      {label}
    </label>
  )
  const dateTime = (key) =>
    form[key]
      ? new Date(
          new Date(form[key]).getTime() -
            new Date(form[key]).getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16)
      : ''
  return (
    <Modal
      isOpen
      wide
      dismissible={!saving && !uploading}
      title={
        item.id
          ? 'Modifier la publication'
          : events
            ? 'Nouvel événement'
            : 'Nouvel article'
      }
      onClose={onClose}
    >
      <form
        className="editorial-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!saving && !uploading) onSave(form)
        }}
      >
        {input(events ? 'titleF' : 'title', 'Titre *', 'text', {
          required: true,
          minLength: 2,
          maxLength: 200,
        })}
        {!events && (
          <Field label="Catégorie">
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
            >
              {Object.entries(categories).map(([k, v]) => (
                <option value={k} key={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Affiche ou couverture">
          <ImageUploader
            currentUrl={form.imageUrl}
            onBusyChange={setUploading}
            onUpload={async (data, mime) =>
              set('imageUrl', `data:${mime};base64,${data}`)
            }
            onUrlChange={(url) => set('imageUrl', url)}
          />
        </Field>
        {events ? (
          <>
            {textarea('descF', 'Description / programme', 5)}
            <div className="editorial-grid">
              {input('date', 'Date *', 'date', { required: true })}
              {input('city', 'Ville *', 'text', { required: true })}
              {input('venue', 'Lieu précis / adresse')}
              {input('capacity', 'Nombre de places *', 'number', {
                min: Math.max(1, item.registered || 1),
                required: true,
              })}
              {input('timeStart', 'Début (heure du Cameroun)', 'time')}
              {input('timeEnd', 'Fin', 'time')}
            </div>
            {check('isFree', 'Entrée gratuite')}
            {!form.isFree &&
              input('price', 'Prix par personne (FCFA)', 'number', {
                min: 0,
                required: true,
              })}
            <Field label="Visibilité / état">
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
              >
                {Object.entries(states).map(([k, v]) => (
                  <option value={k} key={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <details>
              <summary>Traduction anglaise</summary>
              {input('titleE', 'Titre en anglais')}
              {textarea('descE', 'Description en anglais')}
            </details>
            {check('featured', 'Mettre en avant')}
          </>
        ) : (
          <>
            {textarea('excerpt', 'Résumé visible dans la liste')}
            {textarea('content', 'Article *', 10)}
            {form.category === 'event' && (
              <fieldset>
                <legend>Informations de l’événement</legend>
                <div className="editorial-grid">
                  {input('eventDate', 'Date *', 'date', {
                    required: form.isPublished,
                  })}
                  {input('eventCity', 'Ville *', 'text', {
                    required: form.isPublished,
                  })}
                  {input('eventVenue', 'Lieu')}
                  {input('eventPrice', 'Entrée (FCFA)', 'number', { min: 0 })}
                </div>
                {input('eventUrl', 'Lien des inscriptions', 'text', {
                  placeholder: '/evenements ou https://…',
                })}
                <p>
                  Les réservations et les billets se gèrent dans la rubrique
                  Événements.
                </p>
              </fieldset>
            )}
            {form.category === 'promo' && (
              <>
                {input('promoCode', 'Code promotionnel')}
                <Field label="Expiration">
                  <input
                    type="datetime-local"
                    value={dateTime('promoExpiry')}
                    onChange={(e) =>
                      set(
                        'promoExpiry',
                        e.target.value
                          ? new Date(e.target.value).toISOString()
                          : ''
                      )
                    }
                  />
                </Field>
              </>
            )}
            {check('isFeatured', 'Mettre à la une')}
            {check('isPublished', 'Rendre public')}
            {form.isPublished && (
              <Field label="Date de publication (vide = maintenant)">
                <input
                  type="datetime-local"
                  value={dateTime('publishedAt')}
                  onChange={(e) =>
                    set(
                      'publishedAt',
                      e.target.value
                        ? new Date(e.target.value).toISOString()
                        : ''
                    )
                  }
                />
              </Field>
            )}
            <p className="editorial-notice">
              {form.isPublished
                ? 'L’article sera visible à la date choisie. Relis le titre, le texte et les informations pratiques.'
                : 'Ce brouillon reste dans ton administration. Tu peux le compléter avant de le publier.'}
            </p>
          </>
        )}
        <div className="editorial-actions">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving || uploading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving || uploading}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function Registrations({ event, toast, onClose, onChange }) {
  const { data, loading, error, refresh } = useApi(
    () => eventsApi.getRegistrations(event.id),
    [event.id]
  )
  const [busy, setBusy] = useState(null)
  async function action(reg, cancel) {
    if (
      busy ||
      (cancel &&
        !confirm(
          'Annuler cette inscription ? Le remboursement éventuel est à traiter séparément.'
        ))
    )
      return
    setBusy(reg.id)
    try {
      cancel
        ? await eventsApi.cancel(reg.id)
        : ['waitlist', 'pending'].includes(reg.status)
          ? await eventsApi.confirmRegistration(reg.id)
          : await eventsApi.confirmPayment(reg.id)
      refresh()
      onChange()
      toast.success(cancel ? 'Inscription annulée' : 'Inscription mise à jour')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(null)
    }
  }
  return (
    <Modal
      isOpen
      wide
      title={`Inscriptions · ${event.titleF}`}
      onClose={onClose}
    >
      {loading ? (
        <p>Chargement…</p>
      ) : error ? (
        <p role="alert">
          {error} <button onClick={refresh}>Réessayer</button>
        </p>
      ) : (
        <div className="editorial-list">
          {data?.registrations?.length ? (
            data.registrations.map((r) => (
              <article key={r.id} className="editorial-row">
                <div>
                  <h3>{r.name || r.user?.pseudo}</h3>
                  <p>
                    {r.email} · {r.phone || 'Pas de téléphone'}
                  </p>
                  <p>
                    {r.guests} place(s) ·{' '}
                    {r.status === 'waitlist'
                      ? 'Liste d’attente'
                      : r.status === 'cancelled'
                        ? 'Annulé'
                        : 'Confirmé'}{' '}
                    · {r.paymentStatus === 'paid' ? 'Payé' : 'À régler'}
                  </p>
                  <small>{r.ticketCode}</small>
                </div>
                <div className="editorial-actions">
                  {['waitlist', 'pending'].includes(r.status) && (
                    <Button disabled={!!busy} onClick={() => action(r, false)}>
                      Attribuer les places
                    </Button>
                  )}
                  {r.status === 'confirmed' && r.paymentStatus !== 'paid' && (
                    <Button disabled={!!busy} onClick={() => action(r, false)}>
                      Confirmer le paiement
                    </Button>
                  )}
                  {r.status !== 'cancelled' && (
                    <Button
                      variant="danger"
                      disabled={!!busy}
                      onClick={() => action(r, true)}
                    >
                      Annuler
                    </Button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <p>Aucune inscription pour le moment.</p>
          )}
        </div>
      )}
    </Modal>
  )
}

function Extras({ toast }) {
  const { data, refresh } = useApi(() => blogApi.getPartners(), [])
  const { data: popupData } = useApi(() => blogApi.getPopup(), [])
  const [partner, setPartner] = useState({
    name: '',
    description: '',
    url: '',
    logo: '🍡',
  })
  const [busy, setBusy] = useState(false)
  const [popup, setPopup] = useState(null)
  const form = popup ||
    popupData?.popup || {
      title: '',
      text: '',
      code: '',
      url: '',
      emoji: '🍡',
      isActive: false,
    }
  return (
    <div className="editorial-grid editorial-extras">
      <details className="adm-card">
        <summary>
          Partenaires du journal ({data?.partners?.length || 0})
        </summary>
        {data?.partners?.map((p) => (
          <div className="editorial-actions" key={p.id}>
            <span>
              {p.logo} {p.name}
            </span>
            <Button
              size="sm"
              variant="danger"
              disabled={busy}
              onClick={async () => {
                if (!confirm(`Retirer ${p.name} ?`)) return
                setBusy(true)
                try {
                  await blogApi.deletePartner(p.id)
                  refresh()
                } catch (err) {
                  toast.error(err.message)
                } finally {
                  setBusy(false)
                }
              }}
            >
              Retirer
            </Button>
          </div>
        ))}
        <form
          className="editorial-form"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            try {
              await blogApi.createPartner(partner)
              setPartner({ name: '', description: '', url: '', logo: '🍡' })
              refresh()
            } catch (err) {
              toast.error(err.message)
            } finally {
              setBusy(false)
            }
          }}
        >
          {['name', 'description', 'url'].map((k, i) => (
            <Field label={['Nom *', 'Description', 'Site web'][i]} key={k}>
              <input
                value={partner[k]}
                required={k === 'name'}
                type={k === 'url' ? 'url' : 'text'}
                onChange={(e) =>
                  setPartner((p) => ({ ...p, [k]: e.target.value }))
                }
              />
            </Field>
          ))}
          <Button type="submit" disabled={busy}>
            Ajouter le partenaire
          </Button>
        </form>
      </details>
      <details className="adm-card">
        <summary>Annonce promotionnelle</summary>
        <form
          className="editorial-form"
          onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            try {
              await blogApi.savePopup(form)
              toast.success(
                form.isActive ? 'Annonce activée' : 'Annonce désactivée'
              )
            } catch (err) {
              toast.error(err.message)
            } finally {
              setBusy(false)
            }
          }}
        >
          {['title', 'text', 'code', 'url'].map((k, i) => (
            <Field
              label={['Titre', 'Texte', 'Code', 'Lien de destination'][i]}
              key={k}
            >
              <input
                value={form[k] || ''}
                required={form.isActive && k === 'title'}
                onChange={(e) => setPopup({ ...form, [k]: e.target.value })}
              />
            </Field>
          ))}
          <label className="editorial-check">
            <input
              type="checkbox"
              checked={!!form.isActive}
              onChange={(e) =>
                setPopup({ ...form, isActive: e.target.checked })
              }
            />
            Afficher cette annonce
          </label>
          <Button type="submit" disabled={busy}>
            Enregistrer
          </Button>
        </form>
      </details>
    </div>
  )
}
