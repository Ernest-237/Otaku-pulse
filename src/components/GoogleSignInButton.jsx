// src/components/GoogleSignInButton.jsx — bouton « Continuer avec Google »
//
// Le SDK Google Identity Services est chargé paresseusement, au premier affichage
// du bouton : l'immense majorité des visiteurs ne se connecte jamais, inutile de
// leur faire télécharger 50 Ko et une résolution DNS au démarrage (3G, mobiles
// d'entrée de gamme).
//
// Le Client ID vient du backend (/api/auth/google/config) et non d'une variable
// VITE_ : celles-ci sont inlinées au build, changer la clé imposerait un
// redéploiement complet du frontend au lieu d'une variable d'environnement Render.
import { useEffect, useRef, useState } from 'react'
import { API_BASE } from '../api'

const GSI_SRC = 'https://accounts.google.com/gsi/client'

// Le « G » officiel, en SVG inline. Sert uniquement à l'aperçu désactivé
// affiché en développement — quand le SDK fonctionne, c'est Google qui rend
// son propre bouton, et il impose son logo.
function GoogleGlyph({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2.1 5-4.4 6.6v5.5h7.1c4.1-3.8 6.6-9.5 6.6-16.1z" />
      <path fill="#34A853" d="M24 46c6 0 11-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.6-3.9-12.3-9.1H4.4v5.7C7.9 40.9 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.7 28.1c-.4-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1v-5.7H4.4C2.9 17.1 2 20.4 2 24s.9 6.9 2.4 9.8l7.3-5.7z" />
      <path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 30 2 24 2 15.4 2 7.9 7.1 4.4 14.2l7.3 5.7c1.7-5.2 6.6-9.1 12.3-9.1z" />
    </svg>
  )
}

// Promesse mémorisée : le script n'est injecté qu'une fois, même si plusieurs
// boutons sont montés (modale de connexion + page profil, par exemple).
let gsiPromise = null
function loadGsi() {
  if (gsiPromise) return gsiPromise
  gsiPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google)
    const el = document.createElement('script')
    el.src = GSI_SRC
    el.async = true
    el.defer = true
    el.onload  = () => window.google?.accounts?.id
      ? resolve(window.google)
      : reject(new Error('SDK Google chargé mais incomplet.'))
    el.onerror = () => { gsiPromise = null; reject(new Error('Impossible de charger Google.')) }
    document.head.appendChild(el)
  })
  return gsiPromise
}

// Configuration serveur, récupérée une seule fois par session.
let configPromise = null
function loadConfig() {
  if (configPromise) return configPromise
  configPromise = fetch(`${API_BASE}/api/auth/google/config`)
    .then(r => r.ok ? r.json() : { enabled: false })
    .catch(() => ({ enabled: false }))
  return configPromise
}

export default function GoogleSignInButton({ onCredential, onError, text = 'continue_with', disabled }) {
  const holder = useRef(null)
  const [state, setState] = useState('loading') // loading | ready | disabled | error
  // onCredential change à chaque rendu du parent ; on le garde dans une ref pour
  // que le callback passé à Google reste toujours à jour sans re-render le bouton.
  const cb = useRef(onCredential)
  useEffect(() => { cb.current = onCredential }, [onCredential])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const cfg = await loadConfig()
        if (cancelled) return
        if (!cfg.enabled || !cfg.clientId) { setState('disabled'); return }

        const google = await loadGsi()
        if (cancelled || !holder.current) return

        google.accounts.id.initialize({
          client_id: cfg.clientId,
          callback: (resp) => { if (resp?.credential) cb.current?.(resp.credential) },
          // Pas de One Tap automatique : il s'affiche par-dessus le contenu sans
          // que l'utilisateur l'ait demandé, ce qui est intrusif sur mobile.
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: 'popup',
        })

        // Google rend son bouton dans une iframe de largeur fixe. On la cale sur
        // la largeur réelle du conteneur pour qu'il suive le responsive de la
        // modale, en respectant le maximum de 400px imposé par le SDK.
        const w = Math.min(400, Math.max(200, Math.round(holder.current.offsetWidth || 320)))
        holder.current.innerHTML = ''
        google.accounts.id.renderButton(holder.current, {
          type: 'standard', theme: 'outline', size: 'large',
          text, shape: 'pill', logo_alignment: 'center', width: w,
        })
        setState('ready')
      } catch (err) {
        if (!cancelled) { setState('error'); onError?.(err.message) }
      }
    })()

    return () => { cancelled = true }
    // `text` seul : les callbacks passent par des refs, inutile de re-rendre.
  }, [text]) // eslint-disable-line react-hooks/exhaustive-deps

  // Serveur sans GOOGLE_CLIENT_ID.
  //
  // En production : on n'affiche rien. Un bouton mort déroute le visiteur, et
  // le formulaire email/mot de passe reste pleinement fonctionnel.
  //
  // En développement : on affiche au contraire un bouton désactivé qui dit ce
  // qui manque. Sans ça, l'intégration est invisible tant que la clé n'est pas
  // posée, et on croit qu'elle n'a pas été faite.
  if (state === 'disabled') {
    if (!import.meta.env.DEV) return null
    return (
      <div style={{ width: '100%', marginTop: 14 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '11px 16px', borderRadius: 999,
          border: '1.5px dashed rgba(128,128,128,.45)',
          opacity: .75, fontSize: '.85rem', fontWeight: 700,
        }}>
          <GoogleGlyph /> Continuer avec Google
        </div>
        <p style={{ textAlign: 'center', fontSize: '.72rem', opacity: .7, margin: '6px 0 0' }}>
          Inactif : ajoute <code>GOOGLE_CLIENT_ID</code> dans <code>server/.env</code>.
          <br />Ce message n'apparaît qu'en développement.
        </p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        margin: '14px 0 12px', opacity: .55,
      }}>
        <span style={{ flex: 1, height: 1, background: 'currentColor' }} />
        <span style={{ fontSize: '.7rem', letterSpacing: 1, fontWeight: 700 }}>OU</span>
        <span style={{ flex: 1, height: 1, background: 'currentColor' }} />
      </div>

      <div
        ref={holder}
        style={{
          display: 'flex', justifyContent: 'center', minHeight: 44,
          // Le bouton Google ne se désactive pas : on neutralise les clics
          // pendant qu'une connexion est déjà en cours.
          pointerEvents: disabled ? 'none' : 'auto',
          opacity: disabled ? .5 : 1,
        }}
      />

      {state === 'loading' && (
        <p style={{ textAlign:'center', fontSize:'.75rem', opacity:.6, margin:'8px 0 0' }}>
          Chargement de Google…
        </p>
      )}
      {state === 'error' && (
        <p style={{ textAlign:'center', fontSize:'.75rem', color:'#ef4444', margin:'8px 0 0' }}>
          Connexion Google indisponible. Utilise ton email et ton mot de passe.
        </p>
      )}
    </div>
  )
}
