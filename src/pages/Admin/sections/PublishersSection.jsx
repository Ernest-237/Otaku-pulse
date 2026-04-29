// src/pages/Admin/sections/PublishersSection.jsx — Gestion éditeurs manga
import { useState } from 'react'
import { adminMangaApi } from '../../../api'
import { useApi } from '../../../hooks/useApi'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
import styles from '../Admin.module.css'

export default function PublishersSection({ toast }) {
  const [tab, setTab] = useState('applications') // applications | active

  return (
    <div>
      {/* Tabs interne */}
      <div style={{ display:'flex', gap:6, marginBottom:'1.2rem', background:'rgba(255,255,255,.03)', padding:4, borderRadius:10, border:'1px solid rgba(255,255,255,.06)', maxWidth:'fit-content' }}>
        <button
          onClick={() => setTab('applications')}
          style={{
            padding:'9px 18px', borderRadius:8,
            background: tab === 'applications' ? 'rgba(124,58,237,.18)' : 'none',
            border: tab === 'applications' ? '1px solid rgba(124,58,237,.3)' : '1px solid transparent',
            color: tab === 'applications' ? '#a78bfa' : 'rgba(180,190,220,.5)',
            cursor:'pointer', fontFamily:'var(--font-body)', fontSize:'.84rem', fontWeight:700, letterSpacing:'.5px',
          }}>
          📋 Candidatures
        </button>
        <button
          onClick={() => setTab('active')}
          style={{
            padding:'9px 18px', borderRadius:8,
            background: tab === 'active' ? 'rgba(124,58,237,.18)' : 'none',
            border: tab === 'active' ? '1px solid rgba(124,58,237,.3)' : '1px solid transparent',
            color: tab === 'active' ? '#a78bfa' : 'rgba(180,190,220,.5)',
            cursor:'pointer', fontFamily:'var(--font-body)', fontSize:'.84rem', fontWeight:700, letterSpacing:'.5px',
          }}>
          ✍️ Éditeurs actifs
        </button>
      </div>

      {tab === 'applications' && <ApplicationsList toast={toast} />}
      {tab === 'active' && <ActivePublishersList toast={toast} />}
    </div>
  )
}

/* ══ APPLICATIONS ══════════════════════════════════════ */
function ApplicationsList({ toast }) {
  const [filter, setFilter] = useState('pending')
  const [selected, setSelected] = useState(null)

  const { data, loading, execute } = useApi(
    () => adminMangaApi.getPubApps({ status: filter !== 'all' ? filter : undefined, limit: 100 }),
    [filter],
    true
  )

  const apps = data?.applications || []

  const review = async (app, status, notes = '') => {
    try {
      await adminMangaApi.reviewPubApp(app.id, status, notes)
      toast.success(status === 'approved' ? '✅ Candidat promu éditeur' : '❌ Candidature rejetée')
      execute()
      if (selected?.id === app.id) setSelected(null)
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div>
      <div className={styles.filters}>
        {[
          ['all','Toutes'],
          ['pending','⏳ En attente'],
          ['approved','✅ Approuvées'],
          ['rejected','❌ Rejetées'],
        ].map(([v,l]) => (
          <button key={v}
            className={`${styles.filterBtn} ${filter === v ? styles.filterActive : ''}`}
            onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>📋 Candidatures éditeurs ({apps.length})</span>
        </div>
        {loading ? <PageLoader /> : !apps.length ? <EmptyState icon="📋" title="Aucune candidature" /> : (
          <div style={{ overflowX:'auto' }}>
            <table className={styles.table}>
              <thead><tr>
                <th>Candidat</th><th>Email</th><th>Bio</th>
                <th>Portfolio</th><th>Statut</th><th>Date</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {apps.map(a => (
                  <tr key={a.id} className={styles.tr}>
                    <td>
                      <strong style={{ color:'#e2e8f0' }}>{a.user?.pseudo || a.pseudo}</strong>
                      {a.realName && <div style={{ fontSize:'.72rem', color:'rgba(180,190,220,.5)' }}>{a.realName}</div>}
                    </td>
                    <td style={{ fontSize:'.82rem' }}>{a.email || a.user?.email}</td>
                    <td style={{ fontSize:'.78rem', maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {a.bio?.substring(0, 80)}{a.bio?.length > 80 ? '…' : ''}
                    </td>
                    <td style={{ fontSize:'.78rem' }}>
                      {a.portfolioLinks?.length > 0
                        ? <span style={{ color:'#4ade80' }}>{a.portfolioLinks.length} lien{a.portfolioLinks.length > 1 ? 's' : ''}</span>
                        : <span style={{ color:'rgba(180,190,220,.4)' }}>—</span>}
                    </td>
                    <td>
                      <Badge variant={a.status === 'approved' ? 'green' : a.status === 'rejected' ? 'red' : 'amber'} style={{ fontSize:'.65rem' }}>
                        {a.status}
                      </Badge>
                    </td>
                    <td style={{ fontSize:'.78rem', color:'rgba(180,190,220,.5)' }}>
                      {new Date(a.createdAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' })}
                    </td>
                    <td style={{ display:'flex', gap:4 }}>
                      <Button variant="ghost" size="sm" onClick={() => setSelected(a)}>👁️</Button>
                      {a.status === 'pending' && (
                        <>
                          <Button variant="primary" size="sm" onClick={() => review(a, 'approved')}>✅</Button>
                          <Button variant="danger" size="sm" onClick={() => {
                            const reason = prompt('Motif du rejet :')
                            if (reason) review(a, 'rejected', reason)
                          }}>❌</Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <ApplicationDetail
          app={selected}
          onClose={() => setSelected(null)}
          onReview={review}
        />
      )}
    </div>
  )
}

function ApplicationDetail({ app, onClose, onReview }) {
  const [notes, setNotes] = useState('')
  const [showReject, setShowReject] = useState(false)

  return (
    <Modal isOpen title={`✍️ Candidature de ${app.user?.pseudo || app.pseudo}`} onClose={onClose} wide>
      <div className={styles.detailGrid} style={{ marginBottom:'1.2rem' }}>
        <div className={styles.detailItem}>
          <div className={styles.detailLbl}>Pseudo</div>
          <strong style={{ color:'#e2e8f0' }}>{app.user?.pseudo || app.pseudo}</strong>
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLbl}>Email</div>
          <strong style={{ fontSize:'.85rem', color:'#e2e8f0' }}>{app.email || app.user?.email}</strong>
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLbl}>Nom réel</div>
          <strong style={{ fontSize:'.85rem' }}>{app.realName || '—'}</strong>
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLbl}>Téléphone</div>
          <strong style={{ fontSize:'.85rem' }}>{app.phone || '—'}</strong>
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLbl}>Statut</div>
          <Badge variant={app.status === 'approved' ? 'green' : app.status === 'rejected' ? 'red' : 'amber'} style={{ fontSize:'.65rem' }}>
            {app.status}
          </Badge>
        </div>
        <div className={styles.detailItem}>
          <div className={styles.detailLbl}>Soumise le</div>
          <strong style={{ fontSize:'.85rem' }}>
            {new Date(app.createdAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
          </strong>
        </div>
      </div>

      <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:10, padding:'1rem', marginBottom:'1rem' }}>
        <div style={{ fontSize:'.68rem', color:'rgba(180,190,220,.5)', fontWeight:800, letterSpacing:1.5, textTransform:'uppercase', marginBottom:8 }}>📝 Bio / Motivation</div>
        <p style={{ color:'#cbd5e1', fontSize:'.88rem', lineHeight:1.7, margin:0, whiteSpace:'pre-wrap' }}>{app.bio || '—'}</p>
      </div>

      {app.portfolioLinks?.length > 0 && (
        <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:10, padding:'1rem', marginBottom:'1rem' }}>
          <div style={{ fontSize:'.68rem', color:'rgba(180,190,220,.5)', fontWeight:800, letterSpacing:1.5, textTransform:'uppercase', marginBottom:8 }}>🔗 Portfolio</div>
          {app.portfolioLinks.map((link, i) => (
            <a key={i} href={link} target="_blank" rel="noreferrer"
              style={{ display:'block', color:'#4ade80', fontSize:'.85rem', padding:'4px 0', textDecoration:'none' }}>
              → {link}
            </a>
          ))}
        </div>
      )}

      {app.adminNotes && (
        <div style={{ background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)', borderRadius:10, padding:'1rem', marginBottom:'1rem' }}>
          <div style={{ fontSize:'.68rem', color:'#fcd34d', fontWeight:800, letterSpacing:1, textTransform:'uppercase', marginBottom:5 }}>Notes admin précédentes</div>
          <p style={{ color:'rgba(252,211,77,.85)', fontSize:'.85rem', margin:0, lineHeight:1.6 }}>{app.adminNotes}</p>
        </div>
      )}

      {/* Actions */}
      {app.status === 'pending' && (
        <div style={{ background:'rgba(34,197,94,.05)', border:'1px solid rgba(34,197,94,.15)', borderRadius:12, padding:'1rem' }}>
          <div style={{ fontSize:'.68rem', color:'#4ade80', fontWeight:800, letterSpacing:1.5, textTransform:'uppercase', marginBottom:'.8rem' }}>⚡ Décision</div>

          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Note (optionnelle pour approbation, conseillée pour rejet)..."
            style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, color:'#e2e8f0', fontSize:'.85rem', resize:'vertical', outline:'none', marginBottom:'1rem', fontFamily:'var(--font-body)', lineHeight:1.5 }} />

          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <Button variant="primary" onClick={() => onReview(app, 'approved', notes)}>
              ✅ Approuver et promouvoir éditeur
            </Button>
            <Button variant="danger" onClick={() => {
              if (!notes.trim()) return alert('Motif obligatoire pour le rejet')
              onReview(app, 'rejected', notes)
            }}>
              ❌ Rejeter
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ══ ACTIVE PUBLISHERS ═════════════════════════════════ */
function ActivePublishersList({ toast }) {
  const { data, loading, execute } = useApi(() => adminMangaApi.getPublishers(), [], true)
  const publishers = data?.publishers || []

  const revoke = async (p) => {
    if (!confirm(`Révoquer le statut éditeur de "${p.pseudo}" ? Ses mangas resteront mais il ne pourra plus en publier.`)) return
    try {
      await adminMangaApi.togglePublisher(p.id, true)
      toast.success('🔓 Statut éditeur révoqué')
      execute()
    } catch (err) { toast.error(err.message) }
  }

  if (loading) return <PageLoader />

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>✍️ Éditeurs actifs ({publishers.length})</span>
      </div>
      {!publishers.length ? <EmptyState icon="✍️" title="Aucun éditeur actif" /> : (
        <div style={{ overflowX:'auto' }}>
          <table className={styles.table}>
            <thead><tr>
              <th>Éditeur</th><th>Email</th><th>Mangas</th>
              <th>Vues</th><th>Lectures</th><th>Inscrit</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {publishers.map(p => (
                <tr key={p.id} className={styles.tr}>
                  <td>
                    <strong style={{ color:'#e2e8f0' }}>{p.pseudo}</strong>
                    <div style={{ fontSize:'.7rem', color:'rgba(180,190,220,.5)' }}>{p.role}</div>
                  </td>
                  <td style={{ fontSize:'.82rem' }}>{p.email}</td>
                  <td>
                    <Badge variant={p.stats?.mangaCount > 0 ? 'green' : 'gray'} style={{ fontSize:'.65rem' }}>
                      📚 {p.stats?.mangaCount || 0}
                    </Badge>
                  </td>
                  <td style={{ fontSize:'.85rem', color:'#22c55e', fontFamily:'var(--font-title)' }}>
                    {(p.stats?.totalViews || 0).toLocaleString()}
                  </td>
                  <td style={{ fontSize:'.85rem', color:'#3b82f6', fontFamily:'var(--font-title)' }}>
                    {(p.stats?.totalReads || 0).toLocaleString()}
                  </td>
                  <td style={{ fontSize:'.78rem', color:'rgba(180,190,220,.5)' }}>
                    {new Date(p.createdAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'2-digit' })}
                  </td>
                  <td>
                    {!['admin','superadmin'].includes(p.role) && (
                      <Button variant="danger" size="sm" onClick={() => revoke(p)}>🔓 Révoquer</Button>
                    )}
                    {['admin','superadmin'].includes(p.role) && (
                      <Badge variant="amber" style={{ fontSize:'.6rem' }}>👑 ADMIN</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}