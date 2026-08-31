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
// Tailwind AVANT le CSS du site, et c'est délibéré.
// Tailwind génère une utilitaire `.container` (max-width jusqu'à 1536px)
// qui entrait en collision avec le `.container` de main.css (1200px). En
// chargeant Tailwind en premier, la définition du site gagne à spécificité
// égale. Les seules classes globales de main.css sont `.container` et
// `.section-tag` ; tout le reste sont des sélecteurs d'éléments, de
// spécificité inférieure à n'importe quelle classe Tailwind.
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