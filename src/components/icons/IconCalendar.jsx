export default function IconCalendar({ size = 20, className, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M4.5 5.5h15A1.5 1.5 0 0 1 21 7v12a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19V7a1.5 1.5 0 0 1 1.5-1.5Z"
        fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3 9.5h18M8 3.5v4M16 3.5v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8.3" cy="14" r="1" fill="currentColor" />
      <circle cx="12" cy="14" r="1" fill="currentColor" />
      <circle cx="15.7" cy="14" r="1" fill="currentColor" />
    </svg>
  )
}
