export default function IconCart({ size = 20, className, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M2.5 3.5h2l.6 2.2M5.1 5.7l1.8 8.6a2.1 2.1 0 0 0 2.1 1.7h7a2.1 2.1 0 0 0 2.1-1.7L20 6.7H5.1Z"
        fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1.5" fill="currentColor" />
      <circle cx="17" cy="20" r="1.5" fill="currentColor" />
    </svg>
  )
}
