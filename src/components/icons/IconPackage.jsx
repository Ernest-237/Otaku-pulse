export default function IconPackage({ size = 20, className, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path d="M3.5 8.2 12 4l8.5 4.2v8.6L12 21l-8.5-4.2V8.2Z"
        fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3.7 8.3 12 12.3l8.3-4M12 12.3V21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
