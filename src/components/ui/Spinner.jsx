// src/components/ui/Spinner.jsx
// Spinner, PageLoader, EmptyState — tous exportés nommément

export function Spinner({ size = 28, color = '#22c55e' }) {
  return (
    <>
      <span style={{
        display:'inline-block',
        width:size, height:size,
        border:'3px solid rgba(34,197,94,0.2)',
        borderTopColor:color,
        borderRadius:'50%',
        animation:'spin .8s linear infinite',
        flexShrink:0,
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  )
}

export function PageLoader() {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:'60vh', flexDirection:'column', gap:'1rem',
    }}>
      <Spinner size={36} />
      <p style={{
        color:'rgba(240,253,244,0.4)',
        fontFamily:"'Rajdhani',sans-serif",
        fontSize:'.9rem',
      }}>
        Chargement...
      </p>
    </div>
  )
}

export function EmptyState({ icon = '📭', title = 'Aucun résultat', message = '' }) {
  return (
    <div style={{
      textAlign:'center', padding:'3rem',
      color:'rgba(240,253,244,0.45)',
      fontFamily:"'Rajdhani', sans-serif",
    }}>
      <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>{icon}</div>
      <div style={{
        fontFamily:"'Bebas Neue',sans-serif",
        fontSize:'1.2rem', letterSpacing:2,
        marginBottom:'.5rem', color:'#f0fdf4',
      }}>
        {title}
      </div>
      {message && <p style={{ fontSize:'.85rem' }}>{message}</p>}
    </div>
  )
}