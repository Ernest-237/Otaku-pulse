// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App           from './App'
import { AuthProvider }  from './contexts/AuthContext'
import { CartProvider }  from './contexts/CartContext'
import { LangProvider }  from './contexts/LangContext'
import { ToastProvider } from './contexts/ToastContext'
import './styles/main.css'

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