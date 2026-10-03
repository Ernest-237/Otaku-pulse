import { useEffect, useRef, useState } from 'react'
import { usersApi } from '../api'
import { useAuth } from '../contexts/AuthContext'

function guestIds() {
  try {
    const saved = JSON.parse(localStorage.getItem('op_wishlist') || '[]')
    return Array.isArray(saved)
      ? saved.filter((id) => typeof id === 'string').slice(0, 100)
      : []
  } catch {
    return []
  }
}
export function useWishlist() {
  const { user } = useAuth()
  const [ids, setIds] = useState(guestIds)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(!!user)
  const [error, setError] = useState(null)
  const [revision, setRevision] = useState(0)
  const pending = useRef(new Set())
  useEffect(() => {
    let active = true
    if (!user) {
      setIds(guestIds())
      setProducts([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    ;(async () => {
      let result = await usersApi.getWishlist()
      const missing = guestIds().filter(
        (id) => !result.wishlist?.some((p) => p.id === id)
      )
      const failed = []
      for (const id of missing) {
        try {
          await usersApi.setWishlist(id, true)
        } catch (err) {
          if (err.status !== 404) failed.push(id)
        }
      }
      if (missing.length) result = await usersApi.getWishlist()
      try {
        localStorage.setItem('op_wishlist', JSON.stringify(failed))
      } catch {}
      if (active) {
        setIds((result.wishlist || []).map((p) => p.id))
        setProducts(result.wishlist || [])
      }
    })()
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user?.id, revision])
  async function toggle(id) {
    if (loading || pending.current.has(id)) return null
    pending.current.add(id)
    const enabled = !ids.includes(id)
    try {
      if (user) await usersApi.setWishlist(id, enabled)
      setIds((previous) => {
        const next = enabled
          ? [...new Set([...previous, id])]
          : previous.filter((x) => x !== id)
        if (!user) {
          try {
            localStorage.setItem('op_wishlist', JSON.stringify(next))
          } catch {}
        }
        return next
      })
      if (!enabled) setProducts((prev) => prev.filter((p) => p.id !== id))
      return enabled
    } finally {
      pending.current.delete(id)
    }
  }
  return {
    ids,
    products,
    loading,
    error,
    toggle,
    refresh: () => setRevision((r) => r + 1),
  }
}
