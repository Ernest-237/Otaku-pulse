// src/components/MyTickets.jsx — "Mes billets" partagé (Carte Membre + Profil)
// Affiche les inscriptions de l'utilisateur à trois états : liste d'attente,
// réservé (paiement en attente), ou billet confirmé (paiement validé par l'admin).
import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { eventsApi } from '../api'
import TicketStub from './ui/TicketStub'
import { IconTicket } from './icons'
import styles from './MyTickets.module.css'

function statusMeta(reg) {
  if (reg.status === 'waitlist') {
    return { color: '#f59e0b', label: "🕒 LISTE D'ATTENTE", active: false }
  }
  if (reg.paymentStatus === 'paid') {
    return { color: '#22c55e', label: '✅ BILLET CONFIRMÉ', active: true }
  }
  return { color: '#fb923c', label: '🟠 PAIEMENT EN ATTENTE', active: false }
}

export default function MyTickets({ title = 'Mes billets', showEmptyState = false, className = '' }) {
  const { user } = useAuth()
  const toast = useToast()
  const { data, execute: refetch } = useApi(
    () => user ? eventsApi.getMine() : Promise.resolve({ registrations: [] }),
    [user?.id], true
  )
  const [busyId, setBusyId] = useState(null)

  const registrations = data?.registrations || []

  const cancel = async (registrationId) => {
    setBusyId(registrationId)
    try {
      await eventsApi.cancel(registrationId)
      toast.success('Inscription annulée')
      refetch()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  if (registrations.length === 0) {
    if (!showEmptyState) return null
    return (
      <div className={`${styles.empty} ${className}`}>
        <IconTicket size={32} />
        <p>Tu n'as pas encore réservé de billet.</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {title && <h3 className={styles.title}><IconTicket size={18} /> {title}</h3>}
      <div className={styles.grid}>
        {registrations.map(reg => {
          const s = statusMeta(reg)
          return (
            <TicketStub
              key={reg.id}
              color={s.color}
              icon="🎟️"
              statusLabel={s.label}
              statusActive={s.active}
              title={reg.event?.titleF || 'Événement'}
              subtitle={reg.event?.date ? new Date(reg.event.date).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : ''}
              meta={[
                { label: 'Lieu', value: reg.event?.venue || reg.event?.city || '—' },
                { label: 'Invités', value: reg.guests || 1 },
              ]}
              code={reg.ticketCode || reg.id.slice(0, 8).toUpperCase()}
              footer={
                <button className={styles.cancelBtn} disabled={busyId === reg.id} onClick={() => cancel(reg.id)}>
                  Annuler
                </button>
              }
            />
          )
        })}
      </div>
    </div>
  )
}
