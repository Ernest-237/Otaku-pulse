// src/contexts/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('op_cart') || '[]') }
    catch { return [] }
  })

  // Persister dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem('op_cart', JSON.stringify(items))
  }, [items])

  // ── Totaux calculés ─────────────────────────────────
  const count    = items.reduce((s, i) => s + i.qty, 0)
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const shipping = subtotal > 0 && subtotal < 15000 ? 2000 : 0
  const total    = subtotal + shipping

  // ── Actions ─────────────────────────────────────────
  const addItem = useCallback((product) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === product.id)
      if (exists) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, {
        id:    product.id,
        name:  product.nameF || product.name,
        price: product.price,
        emoji: product.emoji || '🎁',
        qty:   1,
      }]
    })
  }, [])

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const updateQty = useCallback((id, delta) => {
    setItems(prev => prev
      .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0)
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  return (
    <CartContext.Provider value={{
      items, count, subtotal, shipping, total,
      addItem, removeItem, updateQty, clearCart,
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