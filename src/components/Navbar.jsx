import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  LogOut,
  Menu,
  ShieldCheck,
  ShoppingCart,
  UserRound,
  X,
  Zap,
} from 'lucide-react'
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
    shop: 'Boutique',
    events: 'Événements',
    fandom: 'Fandom',
    about: 'À Propos',
    blog: 'Blog & Actus',
    membership: 'Carte membre',
    login: 'Connexion',
    signup: "S'inscrire",
    logout: 'Déconnexion',
    profile: 'Mon Profil',
    admin: 'Admin',
    loginTitle: 'CONNEXION',
    signupTitle: 'INSCRIPTION',
    email: 'Email',
    password: 'Mot de passe',
    pseudo: 'Pseudo Otaku',
    confirmPwd: 'Confirmer le mot de passe',
    pseudoHint: '3-20 caractères, lettres/chiffres/_/-',
    noAccount: 'Pas encore membre ?',
    hasAccount: 'Déjà membre ?',
    connecting: 'Connexion...',
    joining: 'Rejoindre',
    authJoin: "Rejoins l'univers Otaku Pulse",
    authCreate: 'Crée ton compte Otaku',
    bye: 'À bientôt',
    welcome: 'Bienvenue',
    minChars: 'Min 8 caractères',
  },
  en: {
    shop: 'Shop',
    events: 'Events',
    fandom: 'Fandom',
    about: 'About',
    blog: 'Blog & News',
    membership: 'Membership',
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    profile: 'My Profile',
    admin: 'Admin',
    loginTitle: 'LOGIN',
    signupTitle: 'SIGN UP',
    email: 'Email',
    password: 'Password',
    pseudo: 'Otaku Username',
    confirmPwd: 'Confirm password',
    pseudoHint: '3-20 chars, letters/numbers/_/-',
    noAccount: 'Not a member yet?',
    hasAccount: 'Already a member?',
    connecting: 'Connecting...',
    joining: 'Join',
    authJoin: 'Join the Otaku Pulse universe',
    authCreate: 'Create your Otaku account',
    bye: 'See you soon',
    welcome: 'Welcome',
    minChars: 'Min 8 characters',
  },
}

export default function Navbar() {
  const { user, login, register, logout, isAdmin } = useAuth()
  const { count: cartCount } = useCart()
  const { lang, setLang } = useLang()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const T = i18n[lang]

  const [menuOpen, setMenuOpen] = useState(false)
  const [authModal, setAuthModal] = useState(false)
  const [authTab, setAuthTab] = useState('login')
  const [userDropdown, setUserDropdown] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdown(false)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError('')
    const fd = new FormData(e.target)
    setLoginLoading(true)

    try {
      const u = await login(fd.get('email'), fd.get('password'))
      setAuthModal(false)
      toast.success(`${T.welcome} ${u.pseudo}`)
      if (['admin', 'superadmin'].includes(u.role)) {
        setTimeout(() => navigate('/admin'), 500)
      }
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setAuthError('')
    const fd = new FormData(e.target)

    if (fd.get('password') !== fd.get('confirm')) {
      setAuthError(lang === 'fr' ? 'Les mots de passe ne correspondent pas' : 'Passwords do not match')
      return
    }

    setSignupLoading(true)

    try {
      const u = await register(fd.get('pseudo'), fd.get('email'), fd.get('password'))
      setAuthModal(false)
      toast.success(`${T.welcome} ${u.pseudo}`)
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setSignupLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    setUserDropdown(false)
    toast.info(T.bye)
    navigate('/')
  }

  const scrollTo = (id) => {
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 400)
      return
    }

    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const navLinks = [
    { label: T.shop, action: () => navigate('/boutique') },
    { label: T.events, action: () => navigate('/reservation') },
    { label: T.fandom, href: '/fandom' },
    { label: T.about, action: () => scrollTo('apropos') },
    { label: T.blog, href: '/blog' },
    { label: T.membership, href: '/membership' },
  ]

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoBolt}>
              <Zap size={18} strokeWidth={2.4} />
            </span>
            <div>
              <div className={styles.logoName}>OTAKU PULSE</div>
              <div className={styles.logoSub}>VIVEZ L&apos;EXPÉRIENCE</div>
            </div>
          </Link>

          <ul className={styles.links}>
            {navLinks.map((l, i) => (
              <li key={i}>
                {l.href ? (
                  <Link
                    to={l.href}
                    className={`${styles.link} ${location.pathname === l.href ? styles.linkActive : ''}`}
                  >
                    {l.label}
                  </Link>
                ) : (
                  <button className={styles.link} onClick={l.action}>
                    {l.label}
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className={styles.right}>
            <div className={styles.langToggle}>
              <button
                className={`${styles.langBtn} ${lang === 'fr' ? styles.langActive : ''}`}
                onClick={() => setLang('fr')}
                type="button"
              >
                FR
              </button>
              <button
                className={`${styles.langBtn} ${lang === 'en' ? styles.langActive : ''}`}
                onClick={() => setLang('en')}
                type="button"
              >
                EN
              </button>
            </div>

            <button
              className={styles.cartBtn}
              onClick={() => navigate('/boutique')}
              type="button"
              aria-label="Cart"
            >
              <ShoppingCart size={18} strokeWidth={2.2} />
              {cartCount > 0 && <span className={styles.cartBadge}>{cartCount}</span>}
            </button>

            {user ? (
              <div className={styles.userMenu} ref={dropdownRef}>
                <button className={styles.userBtn} onClick={() => setUserDropdown((p) => !p)} type="button">
                  <span className={styles.userAvatar}>
                    {user.avatar || <UserRound size={16} strokeWidth={2.2} />}
                  </span>
                  <span className={styles.userName}>{user.pseudo}</span>
                  <ChevronDown size={15} strokeWidth={2.4} className={styles.chevron} />
                </button>

                {userDropdown && (
                  <div className={styles.dropdown}>
                    <Link to="/profil" className={styles.dropItem} onClick={() => setUserDropdown(false)}>
                      <UserRound size={16} strokeWidth={2.2} />
                      {T.profile}
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className={`${styles.dropItem} ${styles.dropAdmin}`}
                        onClick={() => setUserDropdown(false)}
                      >
                        <ShieldCheck size={16} strokeWidth={2.2} />
                        {T.admin}
                      </Link>
                    )}

                    <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={handleLogout} type="button">
                      <LogOut size={16} strokeWidth={2.2} />
                      {T.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.authBtns}>
                <button
                  className={styles.loginBtn}
                  onClick={() => {
                    setAuthTab('login')
                    setAuthModal(true)
                    setAuthError('')
                  }}
                  type="button"
                >
                  {T.login}
                </button>

                <button
                  className={styles.signupBtn}
                  onClick={() => {
                    setAuthTab('signup')
                    setAuthModal(true)
                    setAuthError('')
                  }}
                  type="button"
                >
                  {T.signup}
                </button>
              </div>
            )}

            <button
              className={styles.burger}
              onClick={() => setMenuOpen((p) => !p)}
              aria-label="Menu"
              type="button"
            >
              {menuOpen ? <X size={20} strokeWidth={2.3} /> : <Menu size={20} strokeWidth={2.3} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className={styles.mobileMenu}>
            {navLinks.map((l, i) =>
              l.href ? (
                <Link key={i} to={l.href} className={styles.mobileLink}>
                  {l.label}
                </Link>
              ) : (
                <button key={i} className={styles.mobileLink} onClick={l.action} type="button">
                  {l.label}
                </button>
              )
            )}

            <div className={styles.mobileLang}>
              <button
                className={`${styles.mobileLangBtn} ${lang === 'fr' ? styles.mobileLangActive : ''}`}
                onClick={() => setLang('fr')}
                type="button"
              >
                Français
              </button>
              <button
                className={`${styles.mobileLangBtn} ${lang === 'en' ? styles.mobileLangActive : ''}`}
                onClick={() => setLang('en')}
                type="button"
              >
                English
              </button>
            </div>

            {!user && (
              <div className={styles.mobileAuth}>
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setAuthTab('login')
                    setAuthModal(true)
                    setMenuOpen(false)
                  }}
                >
                  {T.login}
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setAuthTab('signup')
                    setAuthModal(true)
                    setMenuOpen(false)
                  }}
                >
                  {T.signup}
                </Button>
              </div>
            )}
          </div>
        )}
      </nav>

      <Modal isOpen={authModal} onClose={() => setAuthModal(false)}>
        <div className={styles.authModal}>
          <div className={styles.authTabs}>
            <button
              className={`${styles.authTab} ${authTab === 'login' ? styles.authTabActive : ''}`}
              onClick={() => {
                setAuthTab('login')
                setAuthError('')
              }}
              type="button"
            >
              {T.loginTitle}
            </button>

            <button
              className={`${styles.authTab} ${authTab === 'signup' ? styles.authTabActive : ''}`}
              onClick={() => {
                setAuthTab('signup')
                setAuthError('')
              }}
              type="button"
            >
              {T.signupTitle}
            </button>
          </div>

          {authTab === 'login' && (
            <form onSubmit={handleLogin} className={styles.authForm}>
              <div className={styles.authHeader}>
                <div className={styles.authBolt}>
                  <Zap size={28} strokeWidth={2.4} className={styles.authBoltIcon} />
                </div>
                <h2 className={styles.authTitle}>{T.loginTitle}</h2>
                <p className={styles.authSub}>{T.authJoin}</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{T.email}</label>
                <input name="email" type="email" required className={styles.formInput} placeholder="ton@email.com" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{T.password}</label>
                <input name="password" type="password" required className={styles.formInput} placeholder="••••••••" />
              </div>

              {authError && <div className={styles.authError}>{authError}</div>}

              <button type="submit" className={styles.authSubmit} disabled={loginLoading}>
                {loginLoading ? (
                  <>
                    <Spinner size={16} color="#0f172a" /> {T.connecting}
                  </>
                ) : (
                  T.loginTitle
                )}
              </button>

              <p className={styles.authSwitch}>
                {T.noAccount}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signup')
                    setAuthError('')
                  }}
                >
                  {T.signup} →
                </button>
              </p>
            </form>
          )}

          {authTab === 'signup' && (
            <form onSubmit={handleSignup} className={styles.authForm}>
              <div className={styles.authHeader}>
                <div className={styles.authBolt}>
                  <Zap size={28} strokeWidth={2.4} className={styles.authBoltIcon} />
                </div>
                <h2 className={styles.authTitle}>{T.signupTitle}</h2>
                <p className={styles.authSub}>{T.authCreate}</p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{T.pseudo}</label>
                <input
                  name="pseudo"
                  type="text"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_-]+"
                  className={styles.formInput}
                  placeholder="SaiyanDuCameroun"
                />
                <span className={styles.formHint}>{T.pseudoHint}</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{T.email}</label>
                <input name="email" type="email" required className={styles.formInput} placeholder="ton@email.com" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{T.password}</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className={styles.formInput}
                  placeholder={T.minChars}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{T.confirmPwd}</label>
                <input name="confirm" type="password" required className={styles.formInput} placeholder="••••••••" />
              </div>

              {authError && <div className={styles.authError}>{authError}</div>}

              <button type="submit" className={styles.authSubmit} disabled={signupLoading}>
                {signupLoading ? (
                  <>
                    <Spinner size={16} color="#0f172a" /> {T.joining}...
                  </>
                ) : (
                  T.joining
                )}
              </button>

              <p className={styles.authSwitch}>
                {T.hasAccount}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('login')
                    setAuthError('')
                  }}
                >
                  {T.login} →
                </button>
              </p>
            </form>
          )}
        </div>
      </Modal>
    </>
  )
}

