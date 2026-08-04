// src/components/ShopPolicyModal.jsx — Politique boutique partenaire & commissions
import { Link } from 'react-router-dom'
import Modal from './ui/Modal'

const TIERS = [
  { icon: '🌱', name: 'Découverte', cond: '3 premiers mois, ou 50 premières ventes (le premier atteint)', rate: '5%' },
  { icon: '🚀', name: 'Standard', cond: 'En rythme de croisière ensuite', rate: '7,5%' },
  { icon: '🏆', name: 'Fidélité', cond: 'Après 1 an d\'ancienneté ou 200 ventes cumulées', rate: '5%' },
  { icon: '💎', name: 'Abonnement (optionnel)', cond: '500 FCFA/mois — taux fixe, quel que soit le volume', rate: '4%' },
]

export default function ShopPolicyModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📜 Politique boutique & commissions" wide>
      <p style={{ fontSize: '.88rem', color: 'var(--text-muted, #6b7280)', lineHeight: 1.6, marginBottom: '1.2rem' }}>
        En ouvrant une boutique partenaire, tu gères ton propre catalogue (produits, prix, promotions, logo).
        Otaku Pulse reste responsable de la gestion des commandes et des livraisons.
      </p>

      <h3 style={{ fontSize: '.85rem', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: '.8rem', color: 'var(--green, #16a34a)' }}>
        Barème de commission (indicatif)
      </h3>
      <div style={{ display: 'grid', gap: 8, marginBottom: '1.2rem' }}>
        {TIERS.map((t, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
            background: 'var(--bg-soft, #f4f4f2)', border: '1px solid var(--border, #e7e5e4)', borderRadius: 12,
          }}>
            <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{t.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '.85rem' }}>{t.name}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-muted, #6b7280)' }}>{t.cond}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--green, #16a34a)', flexShrink: 0 }}>{t.rate}</div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '.8rem', color: 'var(--text-muted, #6b7280)', lineHeight: 1.6, marginBottom: '1rem' }}>
        Garde-fous : la commission sur un article ne descend jamais sous <strong>25 FCFA</strong> ni ne dépasse{' '}
        <strong>250 FCFA</strong>, quel que soit son prix.
      </p>

      <ul style={{ fontSize: '.82rem', color: 'var(--text, #171717)', lineHeight: 1.8, paddingLeft: '1.1rem', marginBottom: '1rem' }}>
        <li><strong>Reversement</strong> — ta part est reversée sous 48h après confirmation de livraison.</li>
        <li><strong>Révision</strong> — ce barème peut évoluer, avec un préavis d'au moins 30 jours.</li>
        <li><strong>Sur-mesure</strong> — un taux personnalisé peut être convenu selon les accords ; il est toujours visible dans ton espace boutique.</li>
        <li><strong>Données</strong> — tes coordonnées mobile money servent uniquement au reversement de tes ventes, jamais partagées avec d'autres partenaires.</li>
      </ul>

      <Link to="/legal#shop-policy" target="_blank" style={{ fontSize: '.8rem', color: 'var(--green, #16a34a)', fontWeight: 700 }}>
        Voir la politique complète (Droits & Politique) →
      </Link>
    </Modal>
  )
}
