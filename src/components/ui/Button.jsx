// src/components/ui/Button.jsx
import { Spinner } from './Spinner'

export default function Button({
  children, variant = 'primary', size = 'md',
  disabled = false, loading = false,
  onClick, type = 'button', style = {}, className = '', ...props
}) {
  const base = {
    display:'inline-flex', alignItems:'center', gap:8,
    borderRadius:10, border:'none',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    fontFamily:'var(--font-body)', fontWeight:600,
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
      background:'var(--green-700)',
      color:'#fffef9',
    },
    ghost: {
      background:'var(--bg-card)',
      border:'1px solid var(--border)',
      color:'var(--text)',
    },
    danger: {
      background:'rgba(220,38,38,0.08)',
      border:'1px solid rgba(220,38,38,0.2)',
      color:'#b13737',
    },
  }
  return (
    <button
      {...props}
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
