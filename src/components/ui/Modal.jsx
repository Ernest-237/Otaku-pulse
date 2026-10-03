// src/components/ui/Modal.jsx — Light (site) + mode dark néon (admin)
import { useEffect, useId, useRef } from 'react'
import styles from './Modal.module.css'
const openDialogs = []
let originalOverflow = ''

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  wide = false,
  dark = false,
  dismissible = true,
}) {
  const ref = useRef(null)
  const titleId = useId()
  const callbacks = useRef({ onClose, dismissible })
  callbacks.current = { onClose, dismissible }
  useEffect(() => {
    if (!isOpen) return
    const element = ref.current
    const previousFocus = document.activeElement
    if (!openDialogs.length) originalOverflow = document.body.style.overflow
    openDialogs.push(element)
    document.body.style.overflow = 'hidden'
    element?.focus()
    const onKey = (e) => {
      if (openDialogs.at(-1) !== element) return
      if (e.key === 'Escape' && callbacks.current.dismissible) {
        e.stopPropagation()
        callbacks.current.onClose()
      }
      if (e.key !== 'Tab') return
      const focusable = [
        ...element.querySelectorAll(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]'
        ),
      ].filter((el) => el.getClientRects().length)
      const first = focusable[0],
        last = focusable.at(-1)
      if (!first) {
        e.preventDefault()
        element.focus()
      } else if (
        e.shiftKey &&
        (document.activeElement === first || document.activeElement === element)
      ) {
        e.preventDefault()
        last.focus()
      } else if (
        !e.shiftKey &&
        (document.activeElement === last || document.activeElement === element)
      ) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      const idx = openDialogs.indexOf(element)
      if (idx >= 0) openDialogs.splice(idx, 1)
      if (!openDialogs.length) document.body.style.overflow = originalOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className={`${styles.overlay} ${dark ? styles.overlayDark : ''}`}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : 'Fenêtre de dialogue'}
        tabIndex={-1}
        className={`${styles.modal} ${wide ? styles.wide : ''} ${dark ? styles.modalDark : ''}`}
      >
        {title ? (
          <div className={styles.header}>
            <span id={titleId} className={styles.title}>
              {title}
            </span>
            {dismissible && (
              <button
                className={styles.close}
                onClick={onClose}
                aria-label="Fermer"
                type="button"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ) : dismissible ? (
          <button
            className={`${styles.close} ${styles.closeFloat}`}
            onClick={onClose}
            aria-label="Fermer"
            type="button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        ) : null}

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}
