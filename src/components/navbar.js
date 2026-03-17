// src/components/navbar.js
// ═══════════════════════════════════════════════════════
// OTAKU PULSE — Navbar Component
// Prêt pour intégration backend (auth JWT, panier API)
// ═══════════════════════════════════════════════════════

// État global de la navbar (sera remplacé par store/context plus tard)
export const navState = {
  lang: 'fr',
  cartCount: 0,
  user: null, // null = non connecté | { name, avatar, role } = connecté
  menuOpen: false,
};

// ── Traductions ──────────────────────────────────────
const i18n = {
  fr: {
    home: 'Accueil',
    packs: 'Nos Packs',
    shop: 'Boutique',
    events: 'Événements',
    about: 'À Propos',
    contact: 'Contact',
    login: 'Connexion',
    signup: "S'inscrire",
    logout: 'Déconnexion',
    profile: 'Mon Profil',
    admin: 'Admin',
    cart: 'Panier',
    announce: '⚡ OTAKU PULSE — Premier service événementiel Otaku au Cameroun &nbsp;•&nbsp; 🎌 Pack Genin dès 85 000 FCFA &nbsp;•&nbsp; ✨ Vivez l\'expérience au-delà de l\'écran &nbsp;•&nbsp;',
    loginTitle: 'CONNEXION',
    signupTitle: 'INSCRIPTION',
    loginSub: 'Rejoins l\'univers Otaku Pulse ⚡',
    signupSub: 'Crée ton compte Otaku ⚡',
    pseudo: 'Pseudo Otaku',
    email: 'Email',
    password: 'Mot de passe',
    confirmPwd: 'Confirmer le mot de passe',
    forgotPwd: 'Mot de passe oublié ?',
    noAccount: 'Pas encore membre ?',
    hasAccount: 'Déjà membre ?',
    orWith: 'ou continuer avec',
    joining: 'Rejoindre',
    connecting: 'Connexion...',
    pseudoPlaceholder: 'SaiyanDuCameroun',
    emailPlaceholder: 'ton@email.com',
  },
  en: {
    home: 'Home',
    packs: 'Our Packs',
    shop: 'Shop',
    events: 'Events',
    about: 'About',
    contact: 'Contact',
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    profile: 'My Profile',
    admin: 'Admin',
    cart: 'Cart',
    announce: '⚡ OTAKU PULSE — First Otaku event service in Cameroon &nbsp;•&nbsp; 🎌 Genin Pack from 85,000 FCFA &nbsp;•&nbsp; ✨ Live the experience beyond the screen &nbsp;•&nbsp;',
    loginTitle: 'LOGIN',
    signupTitle: 'SIGN UP',
    loginSub: 'Welcome back to Otaku Pulse ⚡',
    signupSub: 'Create your Otaku account ⚡',
    pseudo: 'Otaku Username',
    email: 'Email',
    password: 'Password',
    confirmPwd: 'Confirm Password',
    forgotPwd: 'Forgot password?',
    noAccount: 'Not a member yet?',
    hasAccount: 'Already a member?',
    orWith: 'or continue with',
    joining: 'Join',
    connecting: 'Connecting...',
    pseudoPlaceholder: 'SaiyanOfCameroon',
    emailPlaceholder: 'your@email.com',
  }
};

// ── HTML Template ─────────────────────────────────────
export function renderNavbar() {
  return `
  <!-- ANNOUNCE BAR -->
  <div class="announce-bar" id="announceBar">
    <div class="announce-track">
      <span class="announce-text" id="announceText"></span>
      <span class="announce-text" id="announceText2"></span>
    </div>
  </div>

  <!-- NAVBAR -->
  <nav class="navbar" id="navbar">

    <!-- LOGO -->
    <a href="#accueil" class="nav-logo" id="navLogo">
      <div class="nav-logo-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" 
                   fill="#0c1a2e" stroke="#0c1a2e" stroke-width="1"/>
          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" 
                   fill="#22c55e"/>
        </svg>
      </div>
      <div class="nav-logo-text">
        <span class="nav-logo-main">OTAKU PULSE</span>
        <span class="nav-logo-sub" id="logoSub">Vivez l'expérience</span>
      </div>
    </a>

    <!-- NAV LINKS -->
    <ul class="nav-links" id="navLinks">
      <li><a href="#accueil" class="nav-link active" data-key="home"></a></li>
      <li><a href="#services" class="nav-link" data-key="packs"></a></li>
      <li><a href="#boutique" class="nav-link" data-key="shop"></a></li>
      <li><a href="#events" class="nav-link" data-key="events"></a></li>
      <li><a href="#apropos" class="nav-link" data-key="about"></a></li>
      <li><a href="#contact" class="nav-link" data-key="contact"></a></li>
    </ul>

    <!-- ACTIONS -->
    <div class="nav-actions">

      <!-- Language Toggle -->
      <div class="lang-toggle">
        <button class="lang-btn active" id="langFR" onclick="window.navSetLang('fr')">FR</button>
        <button class="lang-btn" id="langEN" onclick="window.navSetLang('en')">EN</button>
      </div>

      <!-- Cart -->
      <button class="nav-cart" id="navCart" title="Panier" onclick="window.openCart()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        <span class="cart-badge" id="cartBadge">0</span>
      </button>

      <!-- Auth Buttons (non connecté) -->
      <div id="authButtons">
        <button class="btn-login" onclick="window.openModal('login')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span id="btnLoginText"></span>
        </button>
        <button class="btn-signup" onclick="window.openModal('signup')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
          </svg>
          <span id="btnSignupText"></span>
        </button>
      </div>

      <!-- User Menu (connecté) — caché par défaut -->
      <div id="userMenu" class="user-menu" style="display:none">
        <button class="user-avatar-btn" onclick="window.toggleUserDropdown()">
          <div class="user-avatar" id="userAvatar">🎌</div>
          <span id="userName" class="user-name"></span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div class="user-dropdown" id="userDropdown">
          <a href="#profile" class="dropdown-item">
            <span>👤</span> <span data-key="profile"></span>
          </a>
          <a href="#admin" class="dropdown-item admin-only" id="adminLink" style="display:none">
            <span>⚙️</span> <span data-key="admin"></span>
          </a>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item logout" onclick="window.logout()">
            <span>🚪</span> <span data-key="logout"></span>
          </button>
        </div>
      </div>

      <!-- Burger -->
      <button class="burger" id="burger" onclick="window.toggleMobileMenu()">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>

  <!-- MOBILE MENU -->
  <div class="mobile-menu" id="mobileMenu">
    <a href="#accueil" class="mobile-link" onclick="window.closeMobileMenu()">
      <span class="mobile-link-icon">🏠</span>
      <span data-key="home"></span>
    </a>
    <a href="#services" class="mobile-link" onclick="window.closeMobileMenu()">
      <span class="mobile-link-icon">⚔️</span>
      <span data-key="packs"></span>
    </a>
    <a href="#boutique" class="mobile-link" onclick="window.closeMobileMenu()">
      <span class="mobile-link-icon">🛍️</span>
      <span data-key="shop"></span>
    </a>
    <a href="#events" class="mobile-link" onclick="window.closeMobileMenu()">
      <span class="mobile-link-icon">🎌</span>
      <span data-key="events"></span>
    </a>
    <a href="#apropos" class="mobile-link" onclick="window.closeMobileMenu()">
      <span class="mobile-link-icon">📖</span>
      <span data-key="about"></span>
    </a>
    <a href="#contact" class="mobile-link" onclick="window.closeMobileMenu()">
      <span class="mobile-link-icon">📬</span>
      <span data-key="contact"></span>
    </a>
    <div class="mobile-actions">
      <div class="lang-toggle">
        <button class="lang-btn active" onclick="window.navSetLang('fr')">FR</button>
        <button class="lang-btn" onclick="window.navSetLang('en')">EN</button>
      </div>
      <button class="btn-signup" onclick="window.openModal('signup'); window.closeMobileMenu()">
        ⚡ <span data-key="signup"></span>
      </button>
    </div>
  </div>

  <!-- ══════════════════════════════════
       MODAL AUTH
  ══════════════════════════════════ -->
  <div class="modal-overlay" id="modalOverlay" onclick="window.closeModalOutside(event)">
    <div class="modal" id="modal">

      <button class="modal-close" onclick="window.closeModal()">✕</button>

      <!-- Header -->
      <div class="modal-header">
        <div class="modal-logo">⚡</div>
        <h3 id="modalTitle">CONNEXION</h3>
        <p id="modalSub" class="modal-sub"></p>
      </div>

      <!-- Tabs -->
      <div class="modal-tabs">
        <button class="modal-tab active" id="tabLogin" onclick="window.switchAuthTab('login')">
          <span data-key="login"></span>
        </button>
        <button class="modal-tab" id="tabSignup" onclick="window.switchAuthTab('signup')">
          <span data-key="signup"></span>
        </button>
      </div>

      <!-- LOGIN FORM -->
      <form id="loginForm" onsubmit="window.handleLogin(event)">
        <div class="form-group">
          <label>📧 <span data-key="email"></span></label>
          <input type="email" id="loginEmail" 
                 placeholder="ton@email.com" required
                 autocomplete="email">
        </div>
        <div class="form-group">
          <label>🔒 <span data-key="password"></span></label>
          <div class="input-wrap">
            <input type="password" id="loginPassword" 
                   placeholder="••••••••" required
                   autocomplete="current-password">
            <button type="button" class="pwd-toggle" onclick="window.togglePwd('loginPassword', this)">👁</button>
          </div>
        </div>
        <div class="form-forgot">
          <a href="#" id="forgotLink"></a>
        </div>
        <div class="form-error" id="loginError"></div>
        <button type="submit" class="btn-submit" id="loginSubmit">
          <span id="loginBtnText"></span>
        </button>
        <div class="social-divider"><span id="orWithLogin"></span></div>
        <button type="button" class="social-btn" onclick="window.googleAuth()">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>
        <p class="modal-footer-text">
          <span id="noAccountText"></span>
          <a onclick="window.switchAuthTab('signup')" id="switchToSignup"></a>
        </p>
      </form>

      <!-- SIGNUP FORM -->
      <form id="signupForm" style="display:none" onsubmit="window.handleSignup(event)">
        <div class="form-group">
          <label>🎌 <span data-key="pseudo"></span></label>
          <input type="text" id="signupPseudo" 
                 placeholder="SaiyanDuCameroun" required
                 minlength="3" maxlength="20"
                 autocomplete="username">
          <span class="form-hint">3-20 caractères, sans espaces</span>
        </div>
        <div class="form-group">
          <label>📧 <span data-key="email"></span></label>
          <input type="email" id="signupEmail" 
                 placeholder="ton@email.com" required
                 autocomplete="email">
        </div>
        <div class="form-group">
          <label>🔒 <span data-key="password"></span></label>
          <div class="input-wrap">
            <input type="password" id="signupPassword" 
                   placeholder="••••••••" required minlength="8"
                   autocomplete="new-password"
                   oninput="window.checkPwdStrength(this.value)">
            <button type="button" class="pwd-toggle" onclick="window.togglePwd('signupPassword', this)">👁</button>
          </div>
          <div class="pwd-strength" id="pwdStrength">
            <div class="pwd-bar" id="pwdBar"></div>
          </div>
          <span class="pwd-label" id="pwdLabel"></span>
        </div>
        <div class="form-group">
          <label>🔒 <span data-key="confirmPwd"></span></label>
          <div class="input-wrap">
            <input type="password" id="signupConfirm" 
                   placeholder="••••••••" required
                   autocomplete="new-password">
            <button type="button" class="pwd-toggle" onclick="window.togglePwd('signupConfirm', this)">👁</button>
          </div>
        </div>
        <div class="form-error" id="signupError"></div>
        <button type="submit" class="btn-submit" id="signupSubmit">
          ⚡ <span id="signupBtnText"></span>
        </button>
        <div class="social-divider"><span id="orWithSignup"></span></div>
        <button type="button" class="social-btn" onclick="window.googleAuth()">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>
        <p class="modal-footer-text">
          <span id="hasAccountText"></span>
          <a onclick="window.switchAuthTab('login')" id="switchToLogin"></a>
        </p>
      </form>

    </div>
  </div>
  `;
}

// ── CSS ───────────────────────────────────────────────
export const navbarCSS = `
/* ══ ANNOUNCE BAR ══ */
.announce-bar {
  background: linear-gradient(90deg, #0c1a2e, rgba(34,197,94,0.12), #0c1a2e);
  border-bottom: 1px solid rgba(34,197,94,0.2);
  height: 36px;
  overflow: hidden;
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1001;
  display: flex;
  align-items: center;
}
.announce-track {
  display: flex;
  white-space: nowrap;
  animation: marquee 25s linear infinite;
}
.announce-text {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.75rem;
  letter-spacing: 1.5px;
  color: #86efac;
  padding-right: 60px;
  flex-shrink: 0;
}
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

/* ══ NAVBAR ══ */
.navbar {
  position: fixed;
  top: 36px; left: 0; right: 0;
  z-index: 1000;
  padding: 0 2.5rem;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  transition: all 0.35s ease;
  border-bottom: 1px solid transparent;
}
.navbar.scrolled {
  background: rgba(6,14,26,0.95);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom-color: rgba(34,197,94,0.12);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  height: 60px;
}

/* ══ LOGO ══ */
.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
}
.nav-logo-icon {
  width: 42px; height: 42px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 16px rgba(34,197,94,0.45);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}
.nav-logo-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
  animation: logoShine 3s ease-in-out infinite;
}
@keyframes logoShine {
  0%,100% { opacity: 0; }
  50% { opacity: 1; }
}
.nav-logo:hover .nav-logo-icon {
  transform: scale(1.08) rotate(-3deg);
  box-shadow: 0 0 28px rgba(34,197,94,0.7);
}
.nav-logo-text { display: flex; flex-direction: column; line-height: 1.1; }
.nav-logo-main {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.45rem;
  letter-spacing: 3px;
  color: #f0fdf4;
}
.nav-logo-sub {
  font-size: 0.55rem;
  letter-spacing: 3px;
  color: #22c55e;
  text-transform: uppercase;
}

/* ══ NAV LINKS ══ */
.nav-links {
  display: flex;
  align-items: center;
  list-style: none;
  gap: 0;
}
.nav-link {
  text-decoration: none;
  color: rgba(240,253,244,0.55);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 8px 13px;
  border-radius: 8px;
  position: relative;
  transition: color 0.25s;
  white-space: nowrap;
}
.nav-link::after {
  content: '';
  position: absolute;
  bottom: 2px; left: 50%;
  width: 0; height: 2px;
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
  border-radius: 2px;
  transform: translateX(-50%);
  transition: width 0.3s ease;
}
.nav-link:hover { color: #f0fdf4; }
.nav-link:hover::after,
.nav-link.active::after { width: 55%; }
.nav-link.active { color: #22c55e; }

/* ══ ACTIONS ══ */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* Language Toggle */
.lang-toggle {
  display: flex;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(34,197,94,0.18);
  border-radius: 20px;
  padding: 3px;
}
.lang-btn {
  background: none; border: none;
  cursor: pointer;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1px;
  color: rgba(240,253,244,0.4);
  padding: 4px 11px;
  border-radius: 16px;
  transition: all 0.22s;
}
.lang-btn.active {
  background: #22c55e;
  color: #0c1a2e;
  box-shadow: 0 0 10px rgba(34,197,94,0.35);
}

/* Cart */
.nav-cart {
  position: relative;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(34,197,94,0.18);
  border-radius: 10px;
  width: 42px; height: 42px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: rgba(240,253,244,0.5);
  transition: all 0.3s;
}
.nav-cart:hover {
  border-color: #22c55e;
  color: #22c55e;
  box-shadow: 0 0 15px rgba(34,197,94,0.2);
  background: rgba(34,197,94,0.08);
}
.cart-badge {
  position: absolute;
  top: -7px; right: -7px;
  min-width: 18px; height: 18px;
  padding: 0 4px;
  background: #dc2626;
  border-radius: 9px;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  color: white;
  border: 2px solid #060e1a;
  box-shadow: 0 0 8px rgba(220,38,38,0.5);
}

/* Login / Signup Buttons */
.btn-login {
  background: transparent;
  border: 1px solid rgba(34,197,94,0.25);
  border-radius: 9px;
  padding: 8px 15px;
  color: #86efac;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  transition: all 0.25s;
  white-space: nowrap;
}
.btn-login:hover {
  background: rgba(34,197,94,0.08);
  border-color: #22c55e;
}
.btn-signup {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none;
  border-radius: 9px;
  padding: 9px 16px;
  color: #0c1a2e;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  box-shadow: 0 0 16px rgba(34,197,94,0.3);
  transition: all 0.25s;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}
.btn-signup::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transition: left 0.4s;
}
.btn-signup:hover::before { left: 100%; }
.btn-signup:hover { transform: translateY(-1px); box-shadow: 0 5px 22px rgba(34,197,94,0.5); }

/* User Menu */
.user-menu { position: relative; }
.user-avatar-btn {
  display: flex; align-items: center; gap: 8px;
  background: rgba(34,197,94,0.08);
  border: 1px solid rgba(34,197,94,0.25);
  border-radius: 10px;
  padding: 6px 12px;
  cursor: pointer;
  color: #f0fdf4;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.25s;
}
.user-avatar-btn:hover {
  background: rgba(34,197,94,0.15);
  border-color: #22c55e;
}
.user-avatar {
  width: 28px; height: 28px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
}
.user-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: #0d1f35;
  border: 1px solid rgba(34,197,94,0.2);
  border-radius: 12px;
  min-width: 180px;
  padding: 6px;
  display: none;
  animation: dropIn 0.2s ease;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
}
.user-dropdown.open { display: block; }
@keyframes dropIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.dropdown-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: rgba(240,253,244,0.7);
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  background: none; border: none;
  width: 100%;
  text-align: left;
  transition: all 0.2s;
}
.dropdown-item:hover {
  background: rgba(34,197,94,0.1);
  color: #22c55e;
}
.dropdown-item.logout:hover {
  background: rgba(220,38,38,0.1);
  color: #dc2626;
}
.dropdown-divider {
  height: 1px;
  background: rgba(255,255,255,0.07);
  margin: 4px 0;
}

/* ══ BURGER ══ */
.burger {
  display: none;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
  padding: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(34,197,94,0.18);
  border-radius: 8px;
}
.burger span {
  display: block;
  width: 22px; height: 2px;
  background: #22c55e;
  border-radius: 2px;
  transition: all 0.3s;
}
.burger.open span:nth-child(1) { transform: rotate(45deg) translate(5px, 5px); }
.burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
.burger.open span:nth-child(3) { transform: rotate(-45deg) translate(5px, -5px); }

/* ══ MOBILE MENU ══ */
.mobile-menu {
  position: fixed;
  top: 104px; left: 0; right: 0;
  background: rgba(6,14,26,0.98);
  backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(34,197,94,0.1);
  padding: 1rem 2rem 1.5rem;
  flex-direction: column;
  gap: 4px;
  z-index: 998;
  display: none;
  transform: translateY(-10px);
  opacity: 0;
  transition: all 0.3s ease;
}
.mobile-menu.open {
  display: flex;
  transform: translateY(0);
  opacity: 1;
}
.mobile-link {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 8px;
  border-bottom: 1px solid rgba(34,197,94,0.06);
  color: rgba(240,253,244,0.6);
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  text-decoration: none;
  transition: color 0.2s;
}
.mobile-link:hover { color: #22c55e; }
.mobile-link-icon { font-size: 1.1rem; }
.mobile-actions {
  display: flex;
  gap: 10px;
  padding-top: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

/* ══ MODAL ══ */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(10px);
  z-index: 2000;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.modal-overlay.open { display: flex; }
.modal {
  background: linear-gradient(160deg, #0d1f35 0%, #0a1628 100%);
  border: 1px solid rgba(34,197,94,0.25);
  border-radius: 20px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  position: relative;
  animation: modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
  box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,197,94,0.05);
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.88) translateY(20px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-close {
  position: absolute; top: 1rem; right: 1rem;
  background: rgba(255,255,255,0.05); border: none;
  width: 30px; height: 30px; border-radius: 50%;
  color: rgba(240,253,244,0.4);
  font-size: 0.9rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.modal-close:hover { background: rgba(220,38,38,0.2); color: #dc2626; }
.modal-header { text-align: center; margin-bottom: 1.2rem; }
.modal-logo {
  width: 50px; height: 50px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px;
  margin: 0 auto 0.7rem;
  box-shadow: 0 0 20px rgba(34,197,94,0.4);
}
.modal h3 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.8rem;
  letter-spacing: 3px;
  background: linear-gradient(135deg, #f0fdf4, #22c55e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.modal-sub { font-size: 0.8rem; color: rgba(240,253,244,0.4); margin-top: 3px; }
.modal-tabs {
  display: flex; gap: 4px;
  background: rgba(255,255,255,0.04);
  border-radius: 10px; padding: 4px;
  margin-bottom: 1.3rem;
}
.modal-tab {
  flex: 1; background: none; border: none;
  padding: 8px;
  border-radius: 8px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.88rem; font-weight: 700; letter-spacing: 1px;
  color: rgba(240,253,244,0.4);
  cursor: pointer; transition: all 0.22s;
}
.modal-tab.active { background: #22c55e; color: #0c1a2e; }

/* Forms */
.form-group { margin-bottom: 0.9rem; }
.form-group label {
  display: block;
  font-size: 0.75rem; font-weight: 700;
  letter-spacing: 1px; color: #86efac;
  text-transform: uppercase; margin-bottom: 5px;
}
.input-wrap { position: relative; }
.form-group input {
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(34,197,94,0.18);
  border-radius: 10px;
  padding: 11px 14px;
  color: #f0fdf4;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.25s;
}
.form-group input:focus {
  border-color: #22c55e;
  background: rgba(34,197,94,0.05);
  box-shadow: 0 0 0 3px rgba(34,197,94,0.1);
}
.form-group input::placeholder { color: rgba(240,253,244,0.25); }
.input-wrap input { padding-right: 42px; }
.pwd-toggle {
  position: absolute; right: 10px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none;
  cursor: pointer; font-size: 0.9rem; opacity: 0.5;
  transition: opacity 0.2s;
}
.pwd-toggle:hover { opacity: 1; }
.form-hint { font-size: 0.72rem; color: rgba(240,253,244,0.3); margin-top: 4px; display: block; }
.form-forgot { text-align: right; margin-bottom: 0.8rem; }
.form-forgot a { font-size: 0.75rem; color: #22c55e; cursor: pointer; text-decoration: none; }
.form-error {
  background: rgba(220,38,38,0.1);
  border: 1px solid rgba(220,38,38,0.3);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.8rem;
  color: #f87171;
  margin-bottom: 0.8rem;
  display: none;
}
.form-error.visible { display: block; }
.pwd-strength {
  height: 4px; background: rgba(255,255,255,0.08);
  border-radius: 4px; margin-top: 6px; overflow: hidden;
}
.pwd-bar {
  height: 100%; border-radius: 4px;
  width: 0%; transition: all 0.3s;
}
.pwd-label { font-size: 0.72rem; margin-top: 4px; display: block; }
.btn-submit {
  width: 100%;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none; border-radius: 10px;
  padding: 13px;
  color: #0c1a2e;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.15rem; letter-spacing: 2px;
  cursor: pointer; transition: all 0.25s;
  box-shadow: 0 0 20px rgba(34,197,94,0.3);
}
.btn-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(34,197,94,0.5);
}
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.social-divider {
  display: flex; align-items: center; gap: 1rem;
  margin: 0.9rem 0;
  font-size: 0.72rem; color: rgba(240,253,244,0.3);
}
.social-divider::before, .social-divider::after {
  content: ''; flex: 1; height: 1px;
  background: rgba(255,255,255,0.07);
}
.social-btn {
  width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px; padding: 10px;
  color: #f0fdf4;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.9rem; font-weight: 600;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all 0.25s;
}
.social-btn:hover { background: rgba(255,255,255,0.08); }
.modal-footer-text {
  text-align: center; margin-top: 0.9rem;
  font-size: 0.78rem; color: rgba(240,253,244,0.35);
}
.modal-footer-text a { color: #22c55e; cursor: pointer; }

/* ══ RESPONSIVE ══ */
@media (max-width: 1024px) {
  .nav-links { display: none; }
  .btn-login, .btn-signup { display: none; }
  .burger { display: flex; }
}
@media (max-width: 480px) {
  .navbar { padding: 0 1rem; }
  .lang-toggle { display: none; }
  .nav-logo-main { font-size: 1.1rem; }
}
`;

// ── JavaScript Logic ──────────────────────────────────
export function initNavbar() {
  // Mettre le CSS dans le head
  const style = document.createElement('style');
  style.textContent = navbarCSS;
  document.head.appendChild(style);

  // Init traduction
  updateTranslations();

  // Scroll effect
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    navbar?.classList.toggle('scrolled', window.scrollY > 20);
  });

  // Active link on scroll
  window.addEventListener('scroll', updateActiveLink);

  // Fermer dropdown user au clic extérieur
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('userDropdown');
    const userMenu = document.querySelector('.user-menu');
    if (dropdown?.classList.contains('open') && !userMenu?.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  // Announce bar — dupliquer le texte pour le loop
  const t1 = document.getElementById('announceText');
  const t2 = document.getElementById('announceText2');
  if (t1 && t2) {
    const txt = i18n[navState.lang].announce;
    t1.innerHTML = txt;
    t2.innerHTML = txt;
  }

  // Restore session depuis localStorage (sera remplacé par JWT API call)
  const savedUser = localStorage.getItem('op_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      setLoggedIn(user);
    } catch(e) {
      localStorage.removeItem('op_user');
    }
  }
}

// ── Traductions ───────────────────────────────────────
function updateTranslations() {
  const t = i18n[navState.lang];
  document.querySelectorAll('[data-key]').forEach(el => {
    const key = el.dataset.key;
    if (t[key]) el.textContent = t[key];
  });
  const loginBtn = document.getElementById('btnLoginText');
  const signupBtn = document.getElementById('btnSignupText');
  if (loginBtn) loginBtn.textContent = t.login;
  if (signupBtn) signupBtn.textContent = t.signup;
  const forgotLink = document.getElementById('forgotLink');
  if (forgotLink) forgotLink.textContent = t.forgotPwd;
  const noAcc = document.getElementById('noAccountText');
  if (noAcc) noAcc.textContent = t.noAccount + ' ';
  const switchS = document.getElementById('switchToSignup');
  if (switchS) switchS.textContent = t.signup;
  const hasAcc = document.getElementById('hasAccountText');
  if (hasAcc) hasAcc.textContent = t.hasAccount + ' ';
  const switchL = document.getElementById('switchToLogin');
  if (switchL) switchL.textContent = t.login;
  const orL = document.getElementById('orWithLogin');
  if (orL) orL.textContent = t.orWith;
  const orS = document.getElementById('orWithSignup');
  if (orS) orS.textContent = t.orWith;

  // Placeholders
  const lEmail = document.getElementById('loginEmail');
  if (lEmail) lEmail.placeholder = t.emailPlaceholder;
  const sEmail = document.getElementById('signupEmail');
  if (sEmail) sEmail.placeholder = t.emailPlaceholder;
  const sPseudo = document.getElementById('signupPseudo');
  if (sPseudo) sPseudo.placeholder = t.pseudoPlaceholder;
}

// ── Active Link ───────────────────────────────────────
function updateActiveLink() {
  const sections = ['accueil','services','boutique','events','apropos','contact'];
  const scrollY = window.scrollY + 100;
  sections.forEach(id => {
    const section = document.getElementById(id);
    const link = document.querySelector(`.nav-link[href="#${id}"]`);
    if (section && link) {
      const inView = scrollY >= section.offsetTop && 
                     scrollY < section.offsetTop + section.offsetHeight;
      link.classList.toggle('active', inView);
    }
  });
}

// ── Exposed to window (accessible depuis HTML onclick) ─
window.navSetLang = function(lang) {
  navState.lang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.toLowerCase() === lang);
  });
  updateTranslations();
  // Announce bar
  const t1 = document.getElementById('announceText');
  const t2 = document.getElementById('announceText2');
  if (t1 && t2) {
    t1.innerHTML = i18n[lang].announce;
    t2.innerHTML = i18n[lang].announce;
  }
};

window.toggleMobileMenu = function() {
  navState.menuOpen = !navState.menuOpen;
  document.getElementById('burger')?.classList.toggle('open', navState.menuOpen);
  document.getElementById('mobileMenu')?.classList.toggle('open', navState.menuOpen);
  document.body.style.overflow = navState.menuOpen ? 'hidden' : '';
};

window.closeMobileMenu = function() {
  navState.menuOpen = false;
  document.getElementById('burger')?.classList.remove('open');
  document.getElementById('mobileMenu')?.classList.remove('open');
  document.body.style.overflow = '';
};

window.openCart = function() {
  // TODO: connecter au composant panier
  console.log('🛒 Ouvrir le panier');
};

window.openModal = function(tab = 'login') {
  document.getElementById('modalOverlay')?.classList.add('open');
  window.switchAuthTab(tab);
  document.body.style.overflow = 'hidden';
};

window.closeModal = function() {
  document.getElementById('modalOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
  // Reset errors
  document.getElementById('loginError')?.classList.remove('visible');
  document.getElementById('signupError')?.classList.remove('visible');
};

window.closeModalOutside = function(e) {
  if (e.target.id === 'modalOverlay') window.closeModal();
};

window.switchAuthTab = function(tab) {
  const t = i18n[navState.lang];
  const isLogin = tab === 'login';
  document.getElementById('loginForm').style.display = isLogin ? 'block' : 'none';
  document.getElementById('signupForm').style.display = isLogin ? 'none' : 'block';
  document.getElementById('tabLogin')?.classList.toggle('active', isLogin);
  document.getElementById('tabSignup')?.classList.toggle('active', !isLogin);
  document.getElementById('modalTitle').textContent = isLogin ? t.loginTitle : t.signupTitle;
  document.getElementById('modalSub').textContent = isLogin ? t.loginSub : t.signupSub;
};

window.togglePwd = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btn.textContent = isText ? '👁' : '🙈';
};

window.checkPwdStrength = function(val) {
  const bar = document.getElementById('pwdBar');
  const label = document.getElementById('pwdLabel');
  if (!bar || !label) return;
  let strength = 0;
  if (val.length >= 8) strength++;
  if (/[A-Z]/.test(val)) strength++;
  if (/[0-9]/.test(val)) strength++;
  if (/[^A-Za-z0-9]/.test(val)) strength++;
  const colors = ['#dc2626','#f97316','#eab308','#22c55e'];
  const labels = ['Faible','Moyen','Bon','Fort'];
  const pct = (strength / 4) * 100;
  bar.style.width = pct + '%';
  bar.style.background = colors[strength - 1] || '#dc2626';
  label.textContent = val.length ? labels[strength - 1] || 'Faible' : '';
  label.style.color = colors[strength - 1] || '#dc2626';
};

// ── AUTH HANDLERS (prêts pour API backend) ────────────
window.handleLogin = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('loginSubmit');
  const errorEl = document.getElementById('loginError');
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  btn.disabled = true;
  btn.textContent = i18n[navState.lang].connecting;
  errorEl?.classList.remove('visible');

  try {
    // 🔌 À REMPLACER PAR : const res = await fetch('/api/auth/login', {...})
    // Simulation pour le moment
    await new Promise(r => setTimeout(r, 1000));
    
    // Simuler une réponse backend
    const fakeUser = { 
      id: 1, 
      name: email.split('@')[0], 
      email, 
      role: 'user',
      avatar: '🎌'
    };
    
    localStorage.setItem('op_user', JSON.stringify(fakeUser));
    setLoggedIn(fakeUser);
    window.closeModal();
    showToast(`Bienvenue ${fakeUser.name} ⚡`, 'success');
    
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = err.message || 'Erreur de connexion';
      errorEl.classList.add('visible');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = i18n[navState.lang].loginTitle;
  }
};

window.handleSignup = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('signupSubmit');
  const errorEl = document.getElementById('signupError');
  const pseudo = document.getElementById('signupPseudo').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('signupConfirm').value;

  if (password !== confirm) {
    if (errorEl) {
      errorEl.textContent = 'Les mots de passe ne correspondent pas';
      errorEl.classList.add('visible');
    }
    return;
  }

  btn.disabled = true;
  btn.textContent = i18n[navState.lang].joining + '...';
  errorEl?.classList.remove('visible');

  try {
    // 🔌 À REMPLACER PAR : const res = await fetch('/api/auth/register', {...})
    await new Promise(r => setTimeout(r, 1200));
    
    const fakeUser = { id: 2, name: pseudo, email, role: 'user', avatar: '⚡' };
    localStorage.setItem('op_user', JSON.stringify(fakeUser));
    setLoggedIn(fakeUser);
    window.closeModal();
    showToast(`Bienvenue dans l'univers Otaku, ${pseudo} ⚡`, 'success');
    
  } catch(err) {
    if (errorEl) {
      errorEl.textContent = err.message || 'Erreur lors de l\'inscription';
      errorEl.classList.add('visible');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = '⚡ ' + i18n[navState.lang].joining;
  }
};

window.googleAuth = function() {
  // 🔌 À REMPLACER PAR : window.location.href = '/api/auth/google'
  showToast('Google Auth — bientôt disponible !', 'info');
};

window.logout = function() {
  localStorage.removeItem('op_user');
  navState.user = null;
  document.getElementById('authButtons').style.display = 'flex';
  document.getElementById('userMenu').style.display = 'none';
  showToast('À bientôt ! 👋', 'info');
};

window.toggleUserDropdown = function() {
  document.getElementById('userDropdown')?.classList.toggle('open');
};

// ── Helpers ───────────────────────────────────────────
function setLoggedIn(user) {
  navState.user = user;
  document.getElementById('authButtons').style.display = 'none';
  document.getElementById('userMenu').style.display = 'flex';
  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = user.name;
  const avatarEl = document.getElementById('userAvatar');
  if (avatarEl) avatarEl.textContent = user.avatar || '🎌';
  // Afficher lien admin si role admin
  if (user.role === 'admin') {
    document.getElementById('adminLink').style.display = 'flex';
  }
}

export function updateCartBadge(count) {
  navState.cartCount = count;
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = count;
}

// ── Toast Notification ────────────────────────────────
function showToast(msg, type = 'success') {
  const existing = document.getElementById('op-toast');
  existing?.remove();
  
  const colors = {
    success: '#22c55e',
    error: '#dc2626', 
    info: '#3b82f6'
  };
  
  const toast = document.createElement('div');
  toast.id = 'op-toast';
  toast.style.cssText = `
    position: fixed; bottom: 2rem; right: 2rem;
    background: #0d1f35; border: 1px solid ${colors[type]};
    border-radius: 12px; padding: 1rem 1.4rem;
    color: #f0fdf4; font-family: 'Rajdhani', sans-serif;
    font-size: 0.95rem; font-weight: 600;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4), 0 0 0 1px ${colors[type]}33;
    z-index: 9999; display: flex; align-items: center; gap: 10px;
    animation: toastIn 0.3s ease;
    max-width: 320px;
  `;
  toast.innerHTML = `
    <span style="color:${colors[type]};font-size:1.2rem">
      ${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
    </span>
    ${msg}
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes toastIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  `;
  document.head.appendChild(style);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}