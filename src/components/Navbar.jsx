// src/components/Navbar.jsx — Version complète avec icône user néon
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { User } from 'lucide-react'
import { useAuth }  from '../contexts/AuthContext'
import { useCart }  from '../contexts/CartContext'
import { useLang }  from '../contexts/LangContext'
import { useToast } from '../contexts/ToastContext'
import { authApi }  from '../api'
import Modal  from './ui/Modal'
import { Spinner } from './ui/Spinner'
import styles from './Navbar.module.css'

const i18n = {
  fr: {
    shop:'Boutique', events:'Événements', fandom:'Fandom', about:'À Propos', blog:'Blog & Actus',
    manga:'📚 Manga',
    login:'Connexion', signup:"S'inscrire", logout:'Déconnexion',
    profile:'Mon Profil', admin:'Admin',
    library:'Ma Bibliothèque', publisher:'Espace Éditeur', subscription:'Mon Abonnement',
    accountAccess:'Mon compte',
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
    library:'My Library', publisher:'Publisher Space', subscription:'My Subscription',
    accountAccess:'My account',
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
  const [authLoading,  setAuthLoading]  = useState(false)
  const [authError,    setAuthError]    = useState('')

  // Forgot password states
  const [resetEmail, setResetEmail] = useState('')
  const [resetCode,  setResetCode]  = useState('')
  const [resetPwd,   setResetPwd]   = useState('')
  const [resetSent,  setResetSent]  = useState(false)

  const dropdownRef = useRef(null)

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setUserDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // Auto-open login modal if sessionStorage flag set (from other pages)
  useEffect(() => {
    if (sessionStorage.getItem('openLogin') === '1') {
      sessionStorage.removeItem('openLogin')
      setAuthTab('login')
      setAuthError('')
      setAuthModal(true)
    }
  }, [location.pathname])

  // Reset auth states when modal closes
  const closeAuthModal = () => {
    setAuthModal(false)
    setAuthError('')
    setResetSent(false)
    setResetEmail('')
    setResetCode('')
    setResetPwd('')
  }

  const handleLogin = async e => {
    e.preventDefault(); setAuthError('')
    const fd = new FormData(e.target)
    setLoginLoading(true)
    try {
      const u = await login(fd.get('email'), fd.get('password'))
      closeAuthModal()
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
      closeAuthModal()
      toast.success(`Bienvenue ${u.pseudo} ⚡`)
    } catch(err) { setAuthError(err.message) }
    finally { setSignupLoading(false) }
  }

  const handleForgot = async () => {
    setAuthError('')
    if (!resetEmail || !resetEmail.includes('@')) {
      setAuthError('Email invalide'); return
    }
    setAuthLoading(true)
    try {
      if (authApi?.forgotPassword) {
        await authApi.forgotPassword(resetEmail)
      }
      setResetSent(true)
      toast.success('📧 Code envoyé !')
    } catch(err) { setAuthError(err.message || 'Erreur d\'envoi') }
    finally { setAuthLoading(false) }
  }

  const handleReset = async () => {
    setAuthError('')
    if (!resetCode || resetCode.length !== 6) {
      setAuthError('Code à 6 chiffres requis'); return
    }
    if (!resetPwd || resetPwd.length < 8) {
      setAuthError('Mot de passe trop court (min 8 caractères)'); return
    }
    setAuthLoading(true)
    try {
      if (authApi?.resetPassword) {
        await authApi.resetPassword(resetEmail, resetCode, resetPwd)
      }
      toast.success('✅ Mot de passe modifié, connecte-toi')
      setAuthTab('login')
      setResetSent(false)
      setResetCode(''); setResetPwd('')
    } catch(err) { setAuthError(err.message || 'Code invalide ou expiré') }
    finally { setAuthLoading(false) }
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

  const openAuthModal = (tab = 'login') => {
    setAuthTab(tab); setAuthModal(true); setAuthError(''); setResetSent(false)
  }

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
                  : <button className={styles.link} onClick={l.action}>{l.label}</button>
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

            {/* User — toujours bouton circulaire néon (logged in OU non) */}
            {user ? (
              <div className={styles.userMenu} ref={dropdownRef}>
                <button
                  className={`${styles.iconBtn} ${userDropdown ? styles.iconBtnActive : ''}`}
                  onClick={() => setUserDropdown(p => !p)}
                  aria-label={T.profile}
                  title={user.pseudo}
                >
                  <span className={styles.iconUserAvatar}>{user.avatar || '🎌'}</span>
                  {user.membershipStatus === 'active' && (
                    <span className={styles.iconBadge} title="Carte Membre active">🎴</span>
                  )}
                </button>
                {userDropdown && (
                  <div className={styles.dropdown}>
                    {/* Header user */}
                    <div className={styles.dropHead}>
                      <div className={styles.dropHeadAvatar}>{user.avatar || '🎌'}</div>
                      <div className={styles.dropHeadInfo}>
                        <div className={styles.dropHeadName}>
                          {user.pseudo}
                          {user.membershipStatus === 'active' && ' 🎴'}
                        </div>
                        <div className={styles.dropHeadEmail}>{user.email}</div>
                      </div>
                    </div>

                    <div className={styles.dropDivider} />

                    <Link to="/profil" className={styles.dropItem} onClick={() => setUserDropdown(false)}>
                      <span className={styles.dropIcon}>👤</span> {T.profile}
                    </Link>

                    <Link to="/manga/library" className={styles.dropItem} onClick={() => setUserDropdown(false)}>
                      <span className={styles.dropIcon}>📚</span> {T.library}
                    </Link>

                    <Link to="/manga/plans" className={styles.dropItem} onClick={() => setUserDropdown(false)}>
                      <span className={styles.dropIcon}>👑</span> {T.subscription}
                    </Link>

                    {(user.isPublisher || ['admin','superadmin'].includes(user.role)) && (
                      <Link to="/manga/publisher" className={styles.dropItem} onClick={() => setUserDropdown(false)}>
                        <span className={styles.dropIcon}>✍️</span> {T.publisher}
                      </Link>
                    )}

                    {user.membershipStatus === 'active' && (
                      <Link to="/membership" className={styles.dropItem} onClick={() => setUserDropdown(false)}>
                        <span className={styles.dropIcon}>🎴</span> Ma Carte Membre
                      </Link>
                    )}

                    {isAdmin && (
                      <>
                        <div className={styles.dropDivider} />
                        <Link to="/admin" className={`${styles.dropItem} ${styles.dropAdmin}`}
                          onClick={() => setUserDropdown(false)}>
                          <span className={styles.dropIcon}>⚙️</span> {T.admin}
                        </Link>
                      </>
                    )}

                    <div className={styles.dropDivider} />
                    <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={handleLogout}>
                      <span className={styles.dropIcon}>🚪</span> {T.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // ── Pas connecté : icône user néon clean ──
              <button
                className={`${styles.iconBtn} ${styles.iconBtnGuest}`}
                onClick={() => openAuthModal('login')}
                aria-label={T.accountAccess}
                title={T.accountAccess}
              >
                <User size={18} strokeWidth={2.2} />
              </button>
            )}

            {/* Burger mobile */}
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

            {/* Liens user supplémentaires en mobile */}
            {user && (
              <>
                <div className={styles.mobileDivider} />
                <Link to="/profil" className={styles.mobileLink}
                  onClick={() => setMenuOpen(false)}>👤 {T.profile}</Link>
                <Link to="/manga/library" className={styles.mobileLink}
                  onClick={() => setMenuOpen(false)}>📚 {T.library}</Link>
                <Link to="/manga/plans" className={styles.mobileLink}
                  onClick={() => setMenuOpen(false)}>👑 {T.subscription}</Link>
                {(user.isPublisher || ['admin','superadmin'].includes(user.role)) && (
                  <Link to="/manga/publisher" className={styles.mobileLink}
                    onClick={() => setMenuOpen(false)}>✍️ {T.publisher}</Link>
                )}
                {isAdmin && (
                  <Link to="/admin" className={`${styles.mobileLink} ${styles.mobileLinkAdmin}`}
                    onClick={() => setMenuOpen(false)}>⚙️ {T.admin}</Link>
                )}
              </>
            )}

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
                  onClick={() => { openAuthModal('login'); setMenuOpen(false) }}>
                  🔐 Se connecter
                </button>
                <button className={`${styles.mobileAuthBtn} ${styles.mobileAuthSecondary}`}
                  onClick={() => { openAuthModal('signup'); setMenuOpen(false) }}>
                  ✨ Créer un compte
                </button>
              </div>
            ) : (
              <button className={styles.mobileLogout}
                onClick={async () => { await logout(); navigate('/'); setMenuOpen(false) }}>
                🚪 Déconnexion
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      <Modal isOpen={authModal} onClose={closeAuthModal}>
        <div className={styles.authModal}>
          {authTab !== 'forgot' && (
            <div className={styles.authTabs}>
              <button className={`${styles.authTab} ${authTab==='login'?styles.authTabActive:''}`}
                onClick={() => { setAuthTab('login'); setAuthError('') }}>{T.loginTitle}</button>
              <button className={`${styles.authTab} ${authTab==='signup'?styles.authTabActive:''}`}
                onClick={() => { setAuthTab('signup'); setAuthError('') }}>{T.signupTitle}</button>
            </div>
          )}

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
                    <p className={styles.authSub}>Vérifie ton email <strong>{resetEmail}</strong></p>
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