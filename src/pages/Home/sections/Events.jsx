import { Link } from 'react-router-dom'
import { useApi } from '../../../hooks/useApi'
import { eventsApi } from '../../../api'
import { EventCard } from '../../../components/EventCard'
import styles from '../../PublicContent.module.css'

export default function Events() {
  const { data, loading, error } = useApi(() => eventsApi.getAll({ period: 'upcoming', limit: 3 }), [])
  return <section id="events" style={{padding:'60px 0'}}><div className="container"><div className="editorial-heading"><div><p className={styles.kicker}>🎌 L’agenda des nakama</p><h2>On se retrouve au Cameroun ?</h2><p>Les prochaines rencontres de la communauté.</p></div><Link to="/evenements">Tout l’agenda ↗</Link></div>{loading ? <p>Chargement des rencontres…</p> : data?.events?.length ? <div className={styles.grid}>{data.events.map(event => <EventCard key={event.id} event={event} />)}</div> : <p>{error ? 'L’agenda est momentanément indisponible.' : 'Les prochaines dates arrivent. Retrouve les annonces dans notre journal.'} <Link to="/blog">Lire les actualités ↗</Link></p>}</div></section>
}
