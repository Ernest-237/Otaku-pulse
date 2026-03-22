// src/components/ui/Modal.jsx
import { useEffect } from 'react'
import styles from './Modal.module.css'

export default function Modal({ isOpen, onClose, title, children, footer, wide = false }) {
  // Bloquer scroll quand modal ouverte
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Fermer sur Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`${styles.modal} ${wide ? styles.wide : ''}`}>
        {title && (
          <div className={styles.header}>
            <span className={styles.title}>{title}</span>
            <button className={styles.close} onClick={onClose}>✕</button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}