// Anneau de chargement — anime-toi en lui passant la même classe CSS `spinIcon`
// déjà utilisée partout dans le projet pour faire tourner Loader2 (Lucide).
export default function IconLoader({ size = 20, className, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
        strokeDasharray="34 100" opacity="0.9" />
    </svg>
  )
}
