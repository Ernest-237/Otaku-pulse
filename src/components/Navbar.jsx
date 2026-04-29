// src/components/Navbar.jsx — Fandom + Boutique page
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth }  from '../contexts/AuthContext'
import { useCart }  from '../contexts/CartContext'
import { useLang }  from '../contexts/LangContext'
import { useToast } from '../contexts/ToastContext'
import Modal  from './ui/Modal'
import Button from './ui/Button'
import { Spinner } from './ui/Spinner'
import styles from './Navbar.module.css'

const i18n = {
  fr: {
    shop:'Boutique', events:'Événements', fandom:'Fandom', about:'À Propos', blog:'Blog & Actus',
    manga:'📚 Manga',
    login:'Connexion', signup:"S'inscrire", logout:'Déconnexion',
    profile:'Mon Profil', admin:'Admin',
    announce:'⚡ OTAKU PULSE — Goodies Anime livrés au Cameroun\u00a0•\u00a0 🎌 Mangas, Posters, Accessoires\u00a0•\u00a0 🚚 Livraison Yaoundé · Douala · Bafoussam\u00a0•\u00a0',
    loginTitle:'CONNEXION', signupTitle:'INSCRIPTION',
    email:'Email', password:'Mot de passe', pseudo:'Pseudo Otaku',
    confirmPwd:'Confirmer le mot de passe', pseudoHint:'3-20 caractères, lettres/chiffres/_/-',
    noAccount:'Pas encore membre ?', hasAccount:'Déjà membre ?',
    connecting:'Connexion...', joining:'Rejoindre',
  },
  en: {
    shop:'Shop', events:'Events', fandom:'Fandom', about:'About', blog:'Blog & News',
    manga:'📚 Manga',
    login:'Login', signup:'Sign Up', logout:'Logout',
    profile:'My Profile', admin:'Admin',
    announce:'⚡ OTAKU PULSE — Anime Goods Delivered in Cameroon\u00a0•\u00a0 🎌 Manga, Posters, Accessories\u00a0•\u00a0 🚚 Delivery Yaoundé · Douala · Bafoussam\u00a0•\u00a0',
    loginTitle:'LOGIN', signupTitle:'SIGN UP',
    email:'Email', password:'Password', pseudo:'Otaku Username',
    confirmPwd:'Confirm password', pseudoHint:'3-20 chars, letters/numbers/_/-',
    noAccount:'Not a member yet?', hasAccount:'Already a member?',
    connecting:'Connecting...', joining:'Join',
  },
}

export default function Navbar() {
  const { user, login, register, logout, isAdmin } = useAuth()
  const { count: cartCount } = useCart()
  const { lang, setLang } = useLang()
  const toast    = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const T = i18n[lang]

  const [menuOpen,     setMenuOpen]     = useState(false)
  const [authModal,    setAuthModal]    = useState(false)
  const [authTab,      setAuthTab]      = useState('login')
  const [userDropdown, setUserDropdown] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [signupLoading,setSignupLoading]= useState(false)
  const [authError,    setAuthError]    = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setUserDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Fermer menu mobile au changement de route
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const handleLogin = async e => {
    e.preventDefault(); setAuthError('')
    const fd = new FormData(e.target)
    setLoginLoading(true)
    try {
      const u = await login(fd.get('email'), fd.get('password'))
      setAuthModal(false)
      toast.success(`Bienvenue ${u.pseudo} ⚡`)
      if (['admin','superadmin'].includes(u.role)) setTimeout(() => navigate('/admin'), 600)
    } catch(err) { setAuthError(err.message) }
    finally { setLoginLoading(false) }
  }

  const handleSignup = async e => {
    e.preventDefault(); setAuthError('')
    const fd = new FormData(e.target)
    if (fd.get('password') !== fd.get('confirm')) {
      setAuthError('Les mots de passe ne correspondent pas'); return
    }
    setSignupLoading(true)
    try {
      const u = await register(fd.get('pseudo'), fd.get('email'), fd.get('password'))
      setAuthModal(false); toast.success(`Bienvenue ${u.pseudo} ⚡`)
    } catch(err) { setAuthError(err.message) }
    finally { setSignupLoading(false) }
  }

  const handleLogout = async () => {
    await logout(); setUserDropdown(false); toast.info('À bientôt ! 👋'); navigate('/')
  }

  const scrollTo = id => {
    if (location.pathname !== '/') {
      navigate('/'); setTimeout(() => document.getElementById(id)?.scrollIntoView({behavior:'smooth'}), 400)
      return
    }
    document.getElementById(id)?.scrollIntoView({behavior:'smooth'})
    setMenuOpen(false)
  }

  const navLinks = [
    { label: T.shop,   action: () => navigate('/boutique') },
    { label: T.events, action: () => navigate('/reservation') },
    { label: T.fandom, href: '/fandom' },
    { label: T.manga,  href: '/manga' },   
    { label: T.about,  action: () => scrollTo('apropos')  },
    { label: T.blog,   href: '/blog' },
    { label: lang==='fr'?'🎴 Carte Membre':'🎴 Membership', href: '/membership' },
  ]

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          {/* Logo */}
          <Link to="/" className={styles.logo}>
            <span className={styles.logoBolt}>⚡</span>
            <div>
              <div className={styles.logoName}>OTAKU PULSE</div>
              <div className={styles.logoSub}>VIVEZ L'EXPÉRIENCE</div>
            </div>
          </Link>

          {/* Desktop links */}
          <ul className={styles.links}>
            {navLinks.map((l,i) => (
              <li key={i}>
                {l.href
                  ? <Link to={l.href}
                      className={`${styles.link} ${location.pathname===l.href?styles.linkActive:''}`}>
                      {l.label}
                    </Link>
                  : <button className={`${styles.link} ${location.pathname===l.path?styles.linkActive:''}`}
                      onClick={l.action}>{l.label}</button>
                }
              </li>
            ))}
          </ul>

          {/* Right */}
          <div className={styles.right}>
            {/* Lang toggle */}
            <div className={styles.langToggle}>
              <button className={`${styles.langBtn} ${lang==='fr'?styles.langActive:''}`}
                onClick={() => setLang('fr')}>FR</button>
              <button className={`${styles.langBtn} ${lang==='en'?styles.langActive:''}`}
                onClick={() => setLang('en')}>EN</button>
            </div>

            {/* Cart */}
            <button className={styles.cartBtn} onClick={() => navigate('/profil')} title='Mon panier'>
              🛒{cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </button>

            {/* User */}
            {user ? (
              <div className={styles.userMenu} ref={dropdownRef}>
                <button className={styles.userBtn} onClick={() => setUserDropdown(p => !p)}>
                  <span className={styles.userAvatar}>{user.avatar || '🎌'}</span>
                  <span className={styles.userName}>{user.pseudo}</span>
                  {user.membershipStatus === 'active' && (
                    <span title="Carte Membre active" style={{ fontSize:'.7rem', flexShrink:0 }}>🎴</span>
                  )}
                  <span style={{ fontSize:'.65rem', color:'rgba(200,230,255,.4)', flexShrink:0 }}>▾</span>
                </button>
                {userDropdown && (
                  <div className={styles.dropdown}>
                    <Link to="/profil" className={styles.dropItem} onClick={() => setUserDropdown(false)}>
                      <span>👤</span> {T.profile}
                    </Link>
                    {user.membershipStatus === 'active' && (
                      <Link to="/membership" className={styles.dropItem}
                        onClick={() => setUserDropdown(false)}>
                        <span>🎴</span> Ma Carte Membre
                      </Link>
                    )}
                    {isAdmin && (
                      <Link to="/admin" className={`${styles.dropItem} ${styles.dropAdmin}`}
                        onClick={() => setUserDropdown(false)}>
                        <span>⚙️</span> {T.admin}
                      </Link>
                    )}
                    <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={handleLogout}>
                      <span>🚪</span> {T.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.authBtns}>
                <button className={styles.loginBtn}
                  onClick={() => { setAuthTab('login'); setAuthModal(true); setAuthError('') }}>
                  {T.login}
                </button>
                <button className={styles.signupBtn}
                  onClick={() => { setAuthTab('signup'); setAuthModal(true); setAuthError('') }}>
                  {T.signup}
                </button>
              </div>
            )}

            {/* Burger */}
            <button className={`${styles.burger} ${menuOpen?styles.burgerOpen:''}`}
              onClick={() => setMenuOpen(p => !p)} aria-label="Menu">
              <span/><span/><span/>
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {menuOpen && (
          <div className={styles.mobileMenu}>
            {/* User connecté */}
            {user && (
              <div className={styles.mobileUserInfo}>
                <div className={styles.mobileAvatar}>{user.avatar || '🎌'}</div>
                <div>
                  <div className={styles.mobilePseudo}>
                    {user.pseudo}
                    {user.membershipStatus === 'active' && ' 🎴'}
                  </div>
                  <div className={styles.mobileEmail}>{user.email}</div>
                </div>
              </div>
            )}

            {/* Liens nav */}
            {navLinks.map((link, i) => (
              link.href ? (
                <Link key={i} to={link.href}
                  className={`${styles.mobileLink} ${location.pathname === link.href ? styles.mobileLinkActive : ''}`}
                  onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              ) : (
                <button key={i} className={styles.mobileLink}
                  onClick={() => { link.action?.(); setMenuOpen(false) }}>
                  {link.label}
                </button>
              )
            ))}

            <div className={styles.mobileDivider} />

            {/* Langue */}
            <div className={styles.mobileLang}>
              {['fr','en'].map(l => (
                <button key={l} className={`${styles.mobileLangBtn} ${lang===l?styles.mobileLangActive:''}`}
                  onClick={() => { setLang(l); setMenuOpen(false) }}>
                  {l === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}
                </button>
              ))}
            </div>

            {/* Auth */}
            {!user ? (
              <div className={styles.mobileAuth}>
                <button className={`${styles.mobileAuthBtn} ${styles.mobileAuthPrimary}`}
                  onClick={() => { setAuthTab('login'); setAuthModal(true); setMenuOpen(false) }}>
                  🔐 Se connecter
                </button>
                <button className={`${styles.mobileAuthBtn} ${styles.mobileAuthSecondary}`}
                  onClick={() => { setAuthTab('signup'); setAuthModal(true); setMenuOpen(false) }}>
                  ✨ Créer un compte
                </button>
              </div>
            ) : (
              <>
                <button className={styles.mobileLogout}
                  onClick={async () => { await logout(); navigate('/'); setMenuOpen(false) }}>
                  🚪 Déconnexion
                </button>
              </>
            )}
          </div>
        )}

      </nav>

      {/* Auth Modal */}
      <Modal isOpen={authModal} onClose={() => setAuthModal(false)}>
        <div className={styles.authModal}>
          <div className={styles.authTabs}>
            <button className={`${styles.authTab} ${authTab==='login'?styles.authTabActive:''}`}
              onClick={() => { setAuthTab('login'); setAuthError('') }}>{T.loginTitle}</button>
            <button className={`${styles.authTab} ${authTab==='signup'?styles.authTabActive:''}`}
              onClick={() => { setAuthTab('signup'); setAuthError('') }}>{T.signupTitle}</button>
          </div>

          {authTab === 'login' && (
            <form onSubmit={handleLogin} className={styles.authForm}>
              <div className={styles.authHeader}>
                <div className={styles.authBolt}>⚡</div>
                <h2 className={styles.authTitle}>{T.loginTitle}</h2>
                <p className={styles.authSub}>Rejoins l'univers Otaku Pulse</p>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{T.email}</label>
                <input name="email" type="email" required className={styles.formInput} placeholder="ton@email.com"/>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{T.password}</label>
                <input name="password" type="password" required className={styles.formInput} placeholder="••••••••"/>
              </div>
              {authError && <div className={styles.authError}>{authError}</div>}
              <button type="submit" className={styles.authSubmit} disabled={loginLoading}>
                {loginLoading ? <><Spinner size={16} color="#0c1a2e"/> {T.connecting}</> : `⚡ ${T.loginTitle}`}
              </button>
              <p className={styles.authSwitch}>{T.noAccount}{' '}
                <button type="button" onClick={() => { setAuthTab('signup'); setAuthError('') }}>
                  {T.signup} →
                </button>
              </p>
              <p className={styles.authSwitch} style={{ marginTop:4 }}>
                <button type="button" style={{ color:'var(--text-light)', fontSize:'.78rem' }}
                  onClick={() => { setAuthTab('forgot'); setAuthError('') }}>
                  🔑 Mot de passe oublié ?
                </button>
              </p>
            </form>
          )}

          {authTab === 'signup' && (
            <form onSubmit={handleSignup} className={styles.authForm}>
              <div className={styles.authHeader}>
                <div className={styles.authBolt}>⚡</div>
                <h2 className={styles.authTitle}>{T.signupTitle}</h2>
                <p className={styles.authSub}>Crée ton compte Otaku</p>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{T.pseudo}</label>
                <input name="pseudo" type="text" required minLength={3} maxLength={20}
                  pattern="[a-zA-Z0-9_-]+" className={styles.formInput} placeholder="SaiyanDuCameroun"/>
                <span className={styles.formHint}>{T.pseudoHint}</span>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{T.email}</label>
                <input name="email" type="email" required className={styles.formInput} placeholder="ton@email.com"/>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{T.password}</label>
                <input name="password" type="password" required minLength={8} className={styles.formInput} placeholder="Min 8 caractères"/>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{T.confirmPwd}</label>
                <input name="confirm" type="password" required className={styles.formInput} placeholder="••••••••"/>
              </div>
              {authError && <div className={styles.authError}>{authError}</div>}
              <button type="submit" className={styles.authSubmit} disabled={signupLoading}>
                {signupLoading ? <><Spinner size={16} color="#0c1a2e"/> {T.joining}...</> : `⚡ ${T.joining}`}
              </button>
              <p className={styles.authSwitch}>{T.hasAccount}{' '}
                <button type="button" onClick={() => { setAuthTab('login'); setAuthError('') }}>
                  {T.login} →
                </button>
              </p>
            </form>
          )}

          {/* ── Forgot Password ── */}
          {authTab === 'forgot' && (
            <div className={styles.authForm}>
              {!resetSent ? (
                <>
                  <div className={styles.authHeader}>
                    <div className={styles.authBolt}>🔑</div>
                    <h3 className={styles.authTitle}>MOT DE PASSE OUBLIÉ</h3>
                    <p className={styles.authSub}>Entre ton email — on t'envoie un code à 6 chiffres</p>
                  </div>
                  {authError && <div className={styles.authError}>{authError}</div>}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>EMAIL</label>
                    <input type="email" className={styles.formInput}
                      value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                      placeholder="ton@email.com" />
                  </div>
                  <button className={styles.authSubmit} onClick={handleForgot} disabled={authLoading}>
                    {authLoading ? '⏳ Envoi...' : '📧 Envoyer le code'}
                  </button>
                </>
              ) : (
                <>
                  <div className={styles.authHeader}>
                    <div className={styles.authBolt}>📬</div>
                    <h3 className={styles.authTitle}>CODE ENVOYÉ</h3>
                    <p className={styles.authSub}>Vérifie ton email <strong>{resetEmail}</strong> — entre le code à 6 chiffres ci-dessous</p>
                  </div>
                  {authError && <div className={styles.authError}>{authError}</div>}
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>CODE À 6 CHIFFRES</label>
                    <input type="text" className={styles.formInput} maxLength={6}
                      value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g,''))}
                      placeholder="123456" style={{ letterSpacing:8, textAlign:'center', fontSize:'1.3rem' }} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>NOUVEAU MOT DE PASSE</label>
                    <input type="password" className={styles.formInput}
                      value={resetPwd} onChange={e => setResetPwd(e.target.value)}
                      placeholder="Minimum 8 caractères" />
                  </div>
                  <button className={styles.authSubmit} onClick={handleReset} disabled={authLoading}>
                    {authLoading ? '⏳...' : '✅ Modifier le mot de passe'}
                  </button>
                  <button type="button"
                    className={styles.authSubmit}
                    style={{ background:'var(--bg-soft)', color:'var(--text-muted)', boxShadow:'none', border:'1.5px solid var(--border)', marginTop:8 }}
                    onClick={() => setResetSent(false)}>
                    ← Changer d'email
                  </button>
                </>
              )}
              <p className={styles.authSwitch}>
                <button type="button" onClick={() => { setAuthTab('login'); setAuthError(''); setResetSent(false) }}>
                  ← Retour à la connexion
                </button>
              </p>
            </div>
          )}

        </div>
      </Modal>
    </>
  )
}