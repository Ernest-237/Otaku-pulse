export default function IconSearch({ size = 20, className, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="m20 20-4.3-4.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
