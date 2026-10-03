// src/contexts/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { sanitizeCart, addCartItem } from '../utils/cart'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return sanitizeCart(JSON.parse(localStorage.getItem('op_cart') || '[]')) }
    catch { return [] }
  })

  // Persister dans localStorage à chaque changement
  useEffect(() => {
    try { localStorage.setItem('op_cart', JSON.stringify(items)) } catch { /* The in-memory cart remains available in private browsing. */ }
  }, [items])

  // ── Totaux calculés ─────────────────────────────────
  const count    = items.reduce((s, i) => s + i.qty, 0)
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const shipping = subtotal > 0 && subtotal < 15000 ? 2000 : 0
  const total    = subtotal + shipping

  // ── Actions ─────────────────────────────────────────
  const addItem = useCallback((product) => {
    setItems(prev => addCartItem(prev, product))
  }, [])

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const updateQty = useCallback((id, delta) => {
    setItems(prev => prev
      .map(i => i.id === id ? { ...i, qty: Math.min(i.stock ?? 99, 99, i.qty + delta) } : i)
      .filter(i => i.qty > 0)
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])
  const replaceItems = useCallback(next => setItems(sanitizeCart(next)), [])

  return (
    <CartContext.Provider value={{
      items, count, subtotal, shipping, total,
      addItem, removeItem, updateQty, clearCart, replaceItems,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart doit être dans CartProvider')
  return ctx
}
