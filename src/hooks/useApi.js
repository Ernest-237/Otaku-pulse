// src/hooks/useApi.js
import { useState, useEffect, useCallback, useRef } from 'react'

// Cache simple pour éviter les refetch inutiles
const cache = new Map()

export function useApi(apiFn, deps = [], immediate = true) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error,   setError]   = useState(null)
  const fnRef = useRef(apiFn)
  fnRef.current = apiFn

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fnRef.current(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (immediate) execute()
  }, deps) // eslint-disable-line

  const refresh = useCallback(() => execute(), [execute])

  return { data, loading, error, execute, refresh, setData }
}

export function useMutation(apiFn) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const fnRef = useRef(apiFn)
  fnRef.current = apiFn

  const mutate = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fnRef.current(...args)
      return { data: result, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  return { mutate, loading, error }
}