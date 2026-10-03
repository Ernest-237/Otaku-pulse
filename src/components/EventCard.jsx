import { Link } from 'react-router-dom'
import MediaImage from './ui/MediaImage'
import styles from '../pages/PublicContent.module.css'
export const eventDate = (date) =>
  date
    ? new Date(`${String(date).slice(0, 10)}T12:00:00`).toLocaleDateString(
        'fr-FR',
        { day: 'numeric', month: 'long', year: 'numeric' }
      )
    : 'Date à annoncer'
export const eventPrice = (event) =>
  event.isFree || Number(event.price) === 0
    ? 'Entrée gratuite'
    : `${Number(event.price).toLocaleString('fr-FR')} FCFA / personne`
export function EventCard({ event }) {
  return (
    <article className={styles.card}>
      <Link
        to={`/evenements?event=${event.id}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        <MediaImage
          src={event.imageUrl}
          alt=""
          loading="lazy"
          className={styles.cover}
        />
      </Link>
      <div className={styles.cardBody}>
        <p className={styles.kicker}>
          {event.city} · {eventDate(event.date)}
        </p>
        <h3>
          <Link to={`/evenements?event=${event.id}`}>{event.titleF}</Link>
        </h3>
        <p>
          {event.venue || 'Lieu à préciser'}
          {event.timeStart ? ` · ${event.timeStart.slice(0, 5)}` : ''}
        </p>
        <div className={styles.cardFoot}>
          <strong>{eventPrice(event)}</strong>
          <span>
            {event.status === 'cancelled' ? 'Annulé' : 'Voir les détails ↗'}
          </span>
        </div>
      </div>
    </article>
  )
}
