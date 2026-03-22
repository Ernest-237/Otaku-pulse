// src/components/ui/Button.jsx
import { Spinner } from './Spinner'

export default function Button({
  children, variant = 'primary', size = 'md',
  disabled = false, loading = false,
  onClick, type = 'button', style = {}, className = '',
}) {
  const base = {
    display:'inline-flex', alignItems:'center', gap:8,
    borderRadius:10, border:'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    fontFamily:"'Rajdhani', sans-serif", fontWeight:700, letterSpacing:'1px',
    transition:'all .25s', textDecoration:'none',
    opacity: disabled || loading ? 0.55 : 1,
  }
  const sizes = {
    sm: { padding:'6px 14px',  fontSize:'.8rem'  },
    md: { padding:'10px 20px', fontSize:'.9rem'  },
    lg: { padding:'14px 28px', fontSize:'1rem'   },
  }
  const variants = {
    primary: {
      background:'linear-gradient(135deg,#22c55e,#16a34a)',
      color:'#0c1a2e',
      boxShadow:'0 0 15px rgba(34,197,94,0.2)',
    },
    ghost: {
      background:'rgba(255,255,255,0.04)',
      border:'1px solid rgba(255,255,255,0.1)',
      color:'rgba(240,253,244,0.6)',
    },
    danger: {
      background:'rgba(220,38,38,0.08)',
      border:'1px solid rgba(220,38,38,0.2)',
      color:'#f87171',
    },
  }
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {loading ? <Spinner size={16} /> : null}
      {children}
    </button>
  )
}