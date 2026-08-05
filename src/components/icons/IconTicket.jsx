export default function IconTicket({ size = 20, className, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M3 9a2.6 2.6 0 0 1 0 6v1.5A1.5 1.5 0 0 0 4.5 18h15a1.5 1.5 0 0 0 1.5-1.5V15a2.6 2.6 0 0 1 0-6V7.5A1.5 1.5 0 0 0 19.5 6h-15A1.5 1.5 0 0 0 3 7.5V9Z"
        fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13 8v1.5M13 12v1.5M13 15.5v1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
