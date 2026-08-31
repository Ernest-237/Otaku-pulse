// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App           from './App'
import { AuthProvider }  from './contexts/AuthContext'
import { CartProvider }  from './contexts/CartContext'
import { LangProvider }  from './contexts/LangContext'
import { ToastProvider } from './contexts/ToastContext'
import { checkHealth } from './api'
// Tailwind est chargé avant le CSS du site : en cas de conflit à spécificité
// égale, la règle du site l'emporte.
//
// Ce n'est qu'une sécurité secondaire. La vraie protection est le périmètre de
// scan restreint dans admin.css : Tailwind ne voit jamais les fichiers du site
// public, donc il ne génère aucune classe susceptible d'entrer en conflit.
// L'ordre seul ne suffisait pas — le plugin Tailwind réinjecte sa feuille à
// chaque recompilation en développement, et repassait alors en dernier.
import './styles/admin.css'
import './styles/main.css'

// Réveille le backend (Render, plan gratuit) dès l'ouverture du site, avant
// même que l'utilisateur interagisse — réduit le risque d'échec sur une
// connexion lente pendant que le serveur est encore en train de démarrer.
checkHealth()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition:   true,
        v7_relativeSplatPath: true,
      }}
    >
      <ToastProvider>
        <AuthProvider>
          <LangProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </LangProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
)