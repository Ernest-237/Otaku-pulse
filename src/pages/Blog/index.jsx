// src/pages/Blog/index.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useToast }  from '../../contexts/ToastContext'
import { useApi }    from '../../hooks/useApi'
import { blogApi, newsletterApi } from '../../api'
import Modal from '../../components/ui/Modal'
import { PageLoader, EmptyState } from '../../components/ui/Spinner'
import Badge, { statusVariant, STATUS_LABELS } from '../../components/ui/Badge'
import styles from './Blog.module.css'

const CAT_LABELS = { blog:'📝 Blog', event:'🎌 Événement', promo:'🔥 Promo', partner:'🤝 Partenaire' }

// Fallback posts si API pas encore dispo
const SAMPLE = [
  { id:1, category:'event', emoji:'🎌', isFeatured:true, title:'Grand Lancement — 30 Juin 2026', excerpt:'Le premier événement officiel Otaku Pulse à Yaoundé. Zone Hokage, mixologie narrative, mapping vidéo !', content:'Le premier événement officiel Otaku Pulse aura lieu le 30 Juin 2026 à la Salle Prestige de Bastos, Yaoundé.\n\nAu programme :\n• Décoration Zone Hokage complète\n• Cocktails narratifs\n• Mapping vidéo\n• Playlist anime', createdAt:'2026-03-01' },
  { id:2, category:'promo', emoji:'🔥', title:'Offre Lancement — 15% sur Pack Chūnin', excerpt:'Jusqu\'au 30 Avril 2026, -15% avec le code NAKAMA.', content:'Profite de 15% de réduction sur le Pack Chūnin avec le code NAKAMA jusqu\'au 30 Avril 2026.', createdAt:'2026-03-10', promoCode:'NAKAMA' },
  { id:3, category:'blog', emoji:'📝', title:'Comment choisir son thème anime ?', excerpt:'Nos conseils pour trouver le thème parfait parmi 50+ options.', content:'Avec 50+ thèmes disponibles, voici nos conseils :\n\n1. Pensez à vos invités\n2. Considérez l\'ambiance souhaitée\n3. Naruto et One Piece sont toujours des valeurs sûres', createdAt:'2026-03-15' },
]

export default function Blog() {
  const toast   = useToast()
  const [cat,   setCat]    = useState('all')
  const [search,setSearch] = useState('')
  const [post,  setPost]   = useState(null)
  const [email, setEmail]  = useState('')
  const [popup, setPopup]  = useState(null)

  useEffect(() => { document.title = 'Blog & Actus — Otaku Pulse' }, [])

  const { data: postsData, loading: lP } = useApi(() => blogApi.getPosts({ limit:50 }), [], true)
  const { data: partData                } = useApi(() => blogApi.getPartners(), [], true)
  const { data: popupData               } = useApi(() => blogApi.getPopup(), [], true)

  const posts    = postsData?.posts    || SAMPLE
  const partners = partData?.partners  || []

  useEffect(() => {
    if (popupData?.popup?.isActive) {
      setTimeout(() => setPopup(popupData.popup), 4000)
    } else if (!popupData && posts.length) {
      setTimeout(() => setPopup({ emoji:'🔥', title:'OFFRE LANCEMENT', text:'Utilise NAKAMA pour -15% sur le Pack Chūnin', code:'NAKAMA', isActive:true }), 5000)
    }
  }, [popupData, posts.length]) // eslint-disable-line

  const filtered = posts.filter(p => {
    const matchC = cat==='all' || p.category===cat
    const matchS = !search || `${p.title} ${p.excerpt} ${p.content}`.toLowerCase().includes(search.toLowerCase())
    return matchC && matchS
  })

  const subscribe = async (e) => {
    e.preventDefault()
    try { await newsletterApi.subscribe(email, 'fr'); setEmail(''); toast.success('✅ Abonné !') }
    catch(err) { toast.error(err.message) }
  }

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code)
    toast.success('✅ Code copié !')
  }

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={styles.nav}>
        <Link to="/" className={styles.navLogo}><span>⚡</span><span className={styles.navBrand}>OTAKU PULSE</span></Link>
        <div className={styles.navLinks}>
          <Link to="/">Accueil</Link>
          <Link to="/blog" className={styles.navActive}>Blog</Link>
          <Link to="/profil">Profil</Link>
        </div>
        <input className={styles.navSearch} placeholder="🔍 Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} />
      </nav>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroBadge}><span className={styles.heroDot}/>Blog & Actualités</div>
        <h1 className={styles.heroTitle}>ACTUS <span className={styles.heroGreen}>OTAKU PULSE</span></h1>
        <p className={styles.heroSub}>Annonces, événements, promotions exclusives et actualités de la communauté Otaku Cameroun.</p>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Cats */}
        <div className={styles.cats}>
          {['all','blog','event','promo','partner'].map(c => (
            <button key={c} className={`${styles.catBtn} ${cat===c?styles.catActive:''}`} onClick={()=>setCat(c)}>
              {c==='all'?'✨ Tous':CAT_LABELS[c]}
            </button>
          ))}
        </div>

        <div className={styles.layout}>
          {/* Posts */}
          <div>
            {lP && <PageLoader />}
            {!lP && filtered.length === 0 && <EmptyState icon="📭" title="Aucun article" />}
            {!lP && filtered.map((p,i) => (
              <div key={p.id} className={`${styles.postCard} ${i===0&&cat==='all'?styles.featured:''}`} onClick={() => setPost(p)}>
                <div className={styles.postThumb}>
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.title} loading="lazy" /> : <span>{p.emoji||'📰'}</span>}
                </div>
                <div className={styles.postBody}>
                  <div className={styles.postMeta}>
                    <Badge variant={statusVariant(p.category)} style={{fontSize:'.65rem'}}>{CAT_LABELS[p.category]||p.category}</Badge>
                    <span className={styles.postDate}>{new Date(p.createdAt||Date.now()).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</span>
                    {p.isFeatured && <span className={styles.featBadge}>⭐ À la une</span>}
                  </div>
                  <div className={styles.postTitle}>{p.title}</div>
                  <div className={styles.postExcerpt}>{p.excerpt||p.content?.slice(0,150)||''}</div>
                  <div className={styles.postFooter}>
                    <span>✍️ Otaku Pulse</span>
                    <span className={styles.readMore}>Lire →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <aside>
            <div className={styles.sideBox}>
              <h4 className={styles.sideTitle}>🤝 Partenaires</h4>
              {partners.length ? partners.map(p => (
                <a key={p.id} href={p.url||'#'} target="_blank" rel="noreferrer" className={styles.partnerLink}>
                  <span className={styles.partLogo}>{p.logo||'🤝'}</span>
                  <div><span className={styles.partName}>{p.name}</span><span className={styles.partDesc}>{p.description||''}</span></div>
                </a>
              )) : <p style={{fontSize:'.8rem',color:'var(--muted)'}}>Partenariats en cours...</p>}
            </div>
            <div className={styles.sideBox}>
              <h4 className={styles.sideTitle}>📧 Newsletter</h4>
              <p style={{fontSize:'.8rem',color:'var(--muted)',marginBottom:'.8rem',lineHeight:1.5}}>Reçois actus et promos en avant-première.</p>
              <form onSubmit={subscribe}>
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="ton@email.com" className={styles.nlInput} />
                <button type="submit" className={styles.nlBtn}>⚡ S'ABONNER</button>
              </form>
            </div>
          </aside>
        </div>
      </div>

      {/* Post modal */}
      <Modal isOpen={!!post} onClose={() => setPost(null)} title={post?.title}>
        {post && (
          <div>
            {post.imageUrl && <img src={post.imageUrl} alt={post.title} style={{width:'100%',borderRadius:10,marginBottom:'1rem'}} />}
            <div style={{display:'flex',gap:8,marginBottom:'1rem'}}>
              <Badge variant={statusVariant(post.category)} style={{fontSize:'.65rem'}}>{CAT_LABELS[post.category]||post.category}</Badge>
              {post.promoCode && (
                <span onClick={()=>copyCode(post.promoCode)} style={{background:'rgba(34,197,94,.1)',border:'1px solid rgba(34,197,94,.2)',borderRadius:20,padding:'3px 12px',fontSize:'.72rem',fontWeight:700,color:'var(--green)',cursor:'pointer',letterSpacing:'1.5px'}}>
                  Code : {post.promoCode} 📋
                </span>
              )}
            </div>
            <div style={{fontSize:'.92rem',color:'rgba(240,253,244,.7)',lineHeight:1.8}}>
              {(post.content||'').split('\n').map((line,i) => line ? <p key={i} style={{marginBottom:'.8rem'}}>{line}</p> : <br key={i}/>)}
            </div>
          </div>
        )}
      </Modal>

      {/* Promo popup */}
      {popup && (
        <div className={styles.promoPopup}>
          <button className={styles.popupClose} onClick={() => setPopup(null)}>✕</button>
          <span className={styles.popupEmoji}>{popup.emoji||'🔥'}</span>
          <div className={styles.popupTitle}>{popup.title}</div>
          <div className={styles.popupText}>{popup.text}</div>
          {popup.code && (
            <div className={styles.popupCode} onClick={() => copyCode(popup.code)}>{popup.code}</div>
          )}
          <Link to="/#contact" className={styles.popupCta} onClick={() => setPopup(null)}>⚡ En profiter</Link>
        </div>
      )}
    </div>
  )
}