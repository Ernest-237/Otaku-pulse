// src/components/ui/Badge.jsx
const VARIANTS = {
  green:  { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e',  border: 'rgba(34,197,94,0.25)' },
  red:    { bg: 'rgba(220,38,38,0.12)',  color: '#f87171',  border: 'rgba(220,38,38,0.25)' },
  blue:   { bg: 'rgba(59,130,246,0.12)', color: '#93c5fd',  border: 'rgba(59,130,246,0.25)' },
  amber:  { bg: 'rgba(245,158,11,0.12)', color: '#fcd34d',  border: 'rgba(245,158,11,0.25)' },
  purple: { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa',  border: 'rgba(139,92,246,0.25)' },
  gray:   { bg: 'rgba(255,255,255,0.06)',color: 'rgba(240,253,244,0.45)', border:'rgba(255,255,255,0.1)' },
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
export function statusVariant(status) {
  const map = {
    new:'blue', contacted:'amber', quoted:'amber',
    confirmed:'green', completed:'green', cancelled:'red',
    pending:'amber', processing:'blue', shipped:'blue',
    delivered:'green', refunded:'red',
    upcoming:'green', past:'gray', draft:'gray',
    blog:'purple', event:'green', promo:'red', partner:'amber',
  }
  return map[status] || 'gray'
}

export const STATUS_LABELS = {
  new:'Nouveau', contacted:'Contacté', quoted:'Devis envoyé',
  confirmed:'Confirmé', completed:'Terminé', cancelled:'Annulé',
  pending:'En attente', processing:'En cours', shipped:'Expédié',
  delivered:'Livré', refunded:'Remboursé',
  upcoming:'À venir', past:'Passé', draft:'Brouillon',
  blog:'Blog', event:'Événement', promo:'Promo', partner:'Partenaire',
}