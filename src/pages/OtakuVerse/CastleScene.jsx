import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { createCastleEngine } from './castleEngine'
import styles from './CastleScene.module.css'

const CastleScene = forwardRef(function CastleScene(props, ref) {
  const host = useRef(null)
  const engine = useRef(null)
  const latest = useRef(props)
  latest.current = props

  useImperativeHandle(ref, () => ({
    move: (direction, isPressed) => engine.current?.move(direction, isPressed),
    look: (dx, dy) => engine.current?.look(dx, dy),
    resetView: () => engine.current?.resetView(),
  }), [])

  useEffect(() => {
    if (!host.current) return undefined
    try {
      engine.current = createCastleEngine(host.current, {
        ...latest.current,
        onReady: () => latest.current.onReady?.(),
        onUnavailable: error => latest.current.onUnavailable?.(error),
        onPortal: destination => latest.current.onPortal?.(destination),
        onInteract: object => latest.current.onInteract?.(object),
      })
    } catch (error) {
      latest.current.onUnavailable?.(error)
    }
    return () => {
      engine.current?.dispose()
      engine.current = null
    }
  }, [])

  useEffect(() => {
    engine.current?.setState(props)
  }, [props.roomId, props.active, props.paused, props.comfort, props.shift, props.lanternsOn])

  return <div ref={host} className={styles.scene} aria-label="Vue du Château de l’Infini" />
})

export default CastleScene
