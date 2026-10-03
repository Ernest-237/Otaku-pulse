import { useCallback, useEffect, useRef, useState } from 'react'

// An original, quiet soundscape. No audio file or third-party player is loaded.
export default function useCastleAudio(running) {
  const audio = useRef(null)
  const generation = useRef(0)
  const enabledRef = useRef(false)
  const runningRef = useRef(running)
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState('')
  runningRef.current = running

  const play = useCallback((kind = 'biwa') => {
    const context = audio.current?.context
    if (
      !context ||
      context.state !== 'running' ||
      !enabledRef.current ||
      !runningRef.current
    )
      return
    const notes =
      kind === 'seal' ? [196, 293.66, 392] : [146.83, 220, 293.66, 164.81]
    notes.forEach((frequency, index) => {
      const start = context.currentTime + index * 0.18
      const oscillator = context.createOscillator()
      const envelope = context.createGain()
      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(frequency, start)
      envelope.gain.setValueAtTime(0.0001, start)
      envelope.gain.exponentialRampToValueAtTime(0.12, start + 0.012)
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + 2.8)
      oscillator.connect(envelope)
      envelope.connect(audio.current.gain)
      oscillator.start(start)
      oscillator.stop(start + 3)
      oscillator.onended = () => {
        oscillator.disconnect()
        envelope.disconnect()
      }
    })
  }, [])

  const stop = useCallback(() => {
    generation.current += 1
    enabledRef.current = false
    setEnabled(false)
    audio.current?.context.suspend().catch(() => {})
  }, [])

  const toggle = useCallback(async () => {
    if (enabledRef.current) {
      stop()
      return
    }
    const request = ++generation.current
    try {
      if (!audio.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (!AudioContext)
          throw new Error('Le son n’est pas disponible dans ce navigateur.')
        const context = new AudioContext()
        const gain = context.createGain()
        gain.gain.value = 0.22
        gain.connect(context.destination)
        audio.current = { context, gain }
      }
      await audio.current.context.resume()
      if (
        request !== generation.current ||
        !runningRef.current ||
        !audio.current
      )
        return
      enabledRef.current = true
      setEnabled(true)
      setError('')
      play()
    } catch {
      if (request === generation.current)
        setError(
          'Le son n’a pas pu démarrer. Tu peux poursuivre la visite en silence.'
        )
    }
  }, [play, stop])

  useEffect(() => {
    const context = audio.current?.context
    if (!context || !enabled) return
    if (!running) {
      context.suspend().catch(() => {})
      return
    }
    context.resume().catch(() => {})
    const timer = window.setInterval(() => play('biwa'), 12000)
    return () => window.clearInterval(timer)
  }, [running, enabled, play])

  useEffect(
    () => () => {
      generation.current += 1
      enabledRef.current = false
      audio.current?.context.close().catch(() => {})
      audio.current = null
    },
    []
  )

  return { enabled, toggle, stop, play, error }
}
