// src/components/ui/Badge.jsx
const VARIANTS = {
  green:  { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e',  border: 'rgba(34,197,94,0.25)' },
  red:    { bg: 'rgba(220,38,38,0.12)',  color: '#f87171',  border: 'rgba(220,38,38,0.25)' },
  blue:   { bg: 'rgba(59,130,246,0.12)', color: '#93c5fd',  border: 'rgba(59,130,246,0.25)' },
  amber:  { bg: 'rgba(245,158,11,0.12)', color: '#fcd34d',  border: 'rgba(245,158,11,0.25)' },
  purple: { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa',  border: 'rgba(139,92,246,0.25)' },
  gray:   { bg: 'rgba(255,255,255,0.06)',color: 'rgba(240,253,244,0.45)', border:'rgba(255,255,255,0.1)' },
  teal:   { bg: 'rgba(20,184,166,0.12)', color: '#2dd4bf',  border: 'rgba(20,184,166,0.25)' },
  pink:   { bg: 'rgba(236,72,153,0.12)', color: '#f472b6',  border: 'rgba(236,72,153,0.25)' },
  orange: { bg: 'rgba(249,115,22,0.12)', color: '#fb923c',  border: 'rgba(249,115,22,0.25)' },
  indigo: { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc',  border: 'rgba(99,102,241,0.25)' },
}

export default function Badge({ variant = 'gray', children, style = {} }) {
  const v = VARIANTS[variant] || VARIANTS.gray
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: '.68rem',
      fontWeight: 700,
      letterSpacing: '1px',
      background: v.bg,
      color: v.color,
      border: `1px solid ${v.border}`,
      ...style,
    }}>
      {children}
    </span>
  )
}

// Status → variant mapper
// Chaque groupe de statuts affiché dans un même tableau (commandes, réservations,
// événements, planning anime...) doit garder des couleurs toutes différentes entre elles —
// voir la répartition par groupe ci-dessous avant de modifier une valeur.
export function statusVariant(status) {
  const map = {
    // Réservations/contacts : new, contacted, quoted, confirmed, cancelled, completed
    new:'blue', contacted:'amber', quoted:'orange',
    confirmed:'green', completed:'purple', cancelled:'red',
    // Commandes : pending, confirmed, preparing, shipped, delivered, cancelled, refunded
    pending:'amber', processing:'blue', preparing:'indigo',
    shipped:'blue', delivered:'teal', refunded:'pink',
    // Événements : upcoming, ongoing, past, cancelled, draft
    upcoming:'green', ongoing:'blue', past:'gray', draft:'purple',
    // Planning anime : upcoming, airing, ended
    airing:'orange', ended:'gray',
    // Catégories blog
    blog:'purple', event:'green', promo:'red', partner:'amber',
  }
  return map[status] || 'gray'
}

export const STATUS_LABELS = {
  new:'Nouveau', contacted:'Contacté', quoted:'Devis envoyé',
  confirmed:'Confirmé', completed:'Terminé', cancelled:'Annulé',
  pending:'En attente', processing:'En cours', preparing:'Préparation',
  shipped:'Expédié', delivered:'Livré', refunded:'Remboursé',
  upcoming:'À venir', ongoing:'En cours', past:'Passé', draft:'Brouillon',
  airing:'En cours', ended:'Terminé',
  blog:'Blog', event:'Événement', promo:'Promo', partner:'Partenaire',
}