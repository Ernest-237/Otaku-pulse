export default function IconShieldCheck({ size = 20, className, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M12 3.5 19 6.3v5.4c0 4.6-3 7.9-7 8.8-4-.9-7-4.2-7-8.8V6.3L12 3.5Z"
        fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12.3l2.1 2.1L15.5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
