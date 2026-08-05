// src/components/PolicyGate.jsx — popup obligatoire de validation de la politique
// de confidentialité / d'utilisation. S'affiche pour tout utilisateur connecté
// n'ayant pas encore `hasAcceptedPolicy` (nouveaux comptes ET comptes de test déjà créés).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../api'
import Modal from './ui/Modal'
import { IconShieldCheck, IconCheck } from './icons'
import styles from './PolicyGate.module.css'

export default function PolicyGate() {
  const { user, loading, updateUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const mustAccept = !loading && !!user && !user.hasAcceptedPolicy

  const accept = async () => {
    setSaving(true)
    setError('')
    try {
      const data = await authApi.acceptPolicy()
      updateUser(data.user)
    } catch (err) {
      setError(err.message || "Une erreur est survenue, réessaie.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={mustAccept}
      onClose={() => {}}
      dismissible={false}
      title={<span className={styles.titleRow}><IconShieldCheck size={18} /> Politique de confidentialité</span>}
      footer={
        <button className={styles.acceptBtn} onClick={accept} disabled={saving}>
          <IconCheck size={16} /> {saving ? 'Validation…' : "J'accepte et je continue"}
        </button>
      }
    >
      <div className={styles.body}>
        <p>Avant de continuer, prends un instant pour valider notre politique de confidentialité et nos conditions d'utilisation. Voici l'essentiel :</p>
        <ul>
          <li>Tes données (nom, email, téléphone) servent uniquement à gérer ton compte, tes commandes et tes réservations.</li>
          <li>Elles ne sont jamais vendues à des tiers.</li>
          <li>Si tu ouvres une boutique partenaire, tes coordonnées mobile money servent exclusivement à te reverser tes commissions.</li>
          <li>Tu peux demander la suppression de tes données à tout moment en nous contactant.</li>
        </ul>
        <Link to="/legal" target="_blank" className={styles.link}>Lire la politique complète →</Link>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </Modal>
  )
}
