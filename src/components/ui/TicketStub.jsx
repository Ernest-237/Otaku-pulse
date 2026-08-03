// src/components/ui/TicketStub.jsx — billet façon cinéma/événement (habillage visuel)
import styles from './TicketStub.module.css'

export default function TicketStub({
  color = '#22c55e',
  icon = '🎫',
  statusLabel,
  statusActive = false,
  title,
  subtitle,
  meta = [], // [{ label, value }]
  code,
  footer,
}) {
  return (
    <div className={styles.ticket} style={{ '--tc': color }}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <span className={styles.icon}>{icon}</span>
          <span className={styles.brandName}>OTAKU PULSE</span>
        </div>
        {statusLabel && (
          <span className={`${styles.status} ${statusActive ? styles.statusActive : ''}`}>
            <span className={styles.statusDot} />
            {statusLabel}
          </span>
        )}
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>

      {meta.length > 0 && (
        <div className={styles.meta}>
          {meta.map((m, i) => (
            <div key={i} className={styles.metaItem}>
              <span className={styles.metaLabel}>{m.label}</span>
              <span className={styles.metaValue}>{m.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.perforation}>
        <span className={styles.notch} data-side="left" />
        <span className={styles.dashes} />
        <span className={styles.notch} data-side="right" />
      </div>

      <div className={styles.stub}>
        <span className={styles.barcode} aria-hidden="true" />
        {code && <span className={styles.code}>{code}</span>}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}
