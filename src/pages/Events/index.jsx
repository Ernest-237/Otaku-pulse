import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { eventsApi } from '../../api'
import { useApi } from '../../hooks/useApi'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import Navbar from '../../components/Navbar'
import Footer from '../Home/sections/Footer'
import MediaImage from '../../components/ui/MediaImage'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import styles from '../PublicContent.module.css'

import { EventCard, eventDate, eventPrice } from '../../components/EventCard'

export default function EventsPage() {
  const [params, setParams] = useSearchParams()
  const [city, setCity] = useState('')
  const [period, setPeriod] = useState('upcoming')
  const [page, setPage] = useState(1)
  const id = params.get('event')
  const { data, loading, error, refresh } = useApi(
    () => eventsApi.getAll({ city, period, page, limit: 9 }),
    [city, period, page]
  )
  const detail = useApi(
    () => (id ? eventsApi.getById(id) : Promise.resolve(null)),
    [id]
  )
  useEffect(() => {
    document.title = 'Événements otaku au Cameroun — Otaku Pulse'
  }, [])
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <header className={styles.hero}>
          <div>
            <p className={styles.kicker}>🎌 Rencontrons-nous au Cameroun</p>
            <h1>
              Des rencontres,
              <br />
              <em>des souvenirs de nakama.</em>
            </h1>
            <p>
              Conventions, cosplay, projections et créations locales. Toutes les
              informations pour préparer ta prochaine sortie.
            </p>
            <div className={styles.links}>
              <Link to="/profil?tab=tickets">Mes billets ↗</Link>
              <Link to="/reservation">Organiser mon événement ↗</Link>
            </div>
          </div>
          <span className={styles.heroSeal} aria-hidden="true">
            🎐
          </span>
        </header>
        <div className={styles.filters}>
          <label>
            Quand ?
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value)
                setPage(1)
              }}
            >
              <option value="upcoming">À venir</option>
              <option value="past">Événements passés</option>
            </select>
          </label>
          <label>
            Ville
            <input
              placeholder="Toutes les villes"
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                setPage(1)
              }}
              list="event-cities"
            />
            <datalist id="event-cities">
              <option>Yaoundé</option>
              <option>Douala</option>
              <option>Bafoussam</option>
              <option>Buea</option>
              <option>Garoua</option>
            </datalist>
          </label>
          <span>{data?.total || 0} rencontre(s)</span>
        </div>
        {loading ? (
          <p className={styles.empty} role="status">
            Chargement de l’agenda…
          </p>
        ) : error ? (
          <div className={styles.empty} role="alert">
            {error}
            <Button onClick={refresh}>Réessayer</Button>
          </div>
        ) : data?.events?.length ? (
          <div className={styles.grid}>
            {data.events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <span aria-hidden="true">🍵</span>
            <h2>Le prochain rendez-vous se prépare</h2>
            <p>
              Aucun événement pour ces filtres. Retrouve aussi les annonces dans
              le journal.
            </p>
            <Link to="/blog">Lire les actualités ↗</Link>
          </div>
        )}
        <div className="editorial-pagination">
          <Button
            variant="ghost"
            disabled={page === 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            Précédent
          </Button>
          <span>Page {page}</span>
          <Button
            variant="ghost"
            disabled={loading || page * 9 >= (data?.total || 0)}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
        </div>
        {id && (
          <Modal
            isOpen
            wide
            title={detail.data?.event?.titleF || 'Événement'}
            onClose={() => setParams({})}
          >
            {detail.loading ? (
              <p>Chargement…</p>
            ) : detail.error ? (
              <p role="alert">
                {detail.error}{' '}
                <button onClick={detail.refresh}>Réessayer</button>
              </p>
            ) : (
              detail.data?.event && (
                <EventDetails
                  key={id}
                  event={detail.data.event}
                  onRegistered={refresh}
                />
              )
            )}
          </Modal>
        )}
      </main>
      <Footer />
    </>
  )
}

function EventDetails({ event, onRegistered }) {
  const { user } = useAuth()
  const toast = useToast()
  const [guests, setGuests] = useState(1)
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || user?.phone || '')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Douala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const open =
    ['upcoming', 'ongoing'].includes(event.status) && event.date >= today
  const remaining = Math.max(0, event.capacity - (event.registered || 0))
  return (
    <div className={styles.detail}>
      <MediaImage
        src={event.imageUrl}
        alt={event.titleF}
        className={styles.detailCover}
      />
      <div className={styles.facts}>
        <div>
          <small>Quand</small>
          <strong>
            {eventDate(event.date)} {event.timeStart?.slice(0, 5)}
          </strong>
          <span>Heure du Cameroun</span>
        </div>
        <div>
          <small>Où</small>
          <strong>{event.city}</strong>
          <span>{event.venue || 'Lieu à préciser'}</span>
        </div>
        <div>
          <small>Tarif</small>
          <strong>{eventPrice(event)}</strong>
          <span>{remaining} place(s) disponible(s)</span>
        </div>
      </div>
      <p className={styles.prose}>
        {event.descF || 'Le programme sera précisé prochainement.'}
      </p>
      {!open ? (
        <p className="editorial-notice">
          {event.status === 'cancelled'
            ? 'Cet événement est annulé. Contacte l’équipe pour ton billet.'
            : 'Les inscriptions sont fermées.'}
        </p>
      ) : result ? (
        <div role="status" className="editorial-notice">
          <p>{result.message}</p>
          <Link to="/profil?tab=tickets">Retrouver mes billets ↗</Link>
        </div>
      ) : user ? (
        <form
          className="editorial-form"
          onSubmit={async (e) => {
            e.preventDefault()
            if (busy) return
            setBusy(true)
            try {
              const r = await eventsApi.register(event.id, guests, whatsapp)
              setResult(r)
              onRegistered()
            } catch (err) {
              toast.error(err.message)
            } finally {
              setBusy(false)
            }
          }}
        >
          <div className="editorial-grid">
            <label className="editorial-field">
              Places, toi compris
              <input
                type="number"
                min="1"
                max="10"
                required
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
              />
            </label>
            <label className="editorial-field">
              WhatsApp
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+237…"
              />
            </label>
          </div>
          <p>
            {event.isFree
              ? 'Réservation gratuite.'
              : `Total pour ton groupe : ${(Number(event.price) * guests).toLocaleString('fr-FR')} FCFA. Le billet sera émis après confirmation du paiement par l’équipe.`}
          </p>
          <Button type="submit" disabled={busy}>
            {busy
              ? 'Inscription…'
              : guests > remaining
                ? 'Rejoindre la liste d’attente'
                : 'Réserver mes places'}
          </Button>
        </form>
      ) : (
        <div className="editorial-notice">
          <p>Connecte-toi pour réserver et retrouver tes billets.</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('op:login'))}
          >
            Se connecter
          </button>
        </div>
      )}
    </div>
  )
}
