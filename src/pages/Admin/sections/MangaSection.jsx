// src/pages/Admin/sections/MangaSection.jsx — Modération mangas + chapitres + certification
import { useState } from 'react'
import { adminMangaApi, API_BASE } from '../../../api'
import { useApi } from '../../../hooks/useApi'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
import styles from '../Admin.module.css'

const MOD_STATUSES = [
  { v:'all',       l:'Tous',     c:'#a78bfa' },
  { v:'pending',   l:'⏳ En attente', c:'#f59e0b' },
  { v:'approved',  l:'✅ Approuvés',  c:'#22c55e' },
  { v:'rejected',  l:'❌ Rejetés',    c:'#ef4444' },
  { v:'suspended', l:'🚫 Suspendus',  c:'#6b7280' },
]

const STATUS_VARIANT = {
  pending: 'amber',
  approved: 'green',
  rejected: 'red',
  suspended: 'gray',
}

export default function MangaSection({ toast }) {
  const [filter, setFilter] = useState('pending')
  const [accessFilter, setAccessFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [chaptersModal, setChaptersModal] = useState(null)

  const { data, loading, execute } = useApi(
    () => adminMangaApi.getMangas({
      status: filter,
      accessTier: accessFilter,
      search,
      limit: 200,
    }),
    [filter, accessFilter, search],
    true
  )

  const mangas = data?.mangas || []

  const moderate = async (manga, status, notes = '') => {
    try {
      await adminMangaApi.moderateManga(manga.id, status, notes)
      toast.success(`✅ ${status === 'approved' ? 'Approuvé' : status === 'rejected' ? 'Rejeté' : 'Mis à jour'}`)
      execute()
      if (selected?.id === manga.id) setSelected(null)
    } catch (err) { toast.error(err.message) }
  }

  const toggleFeature = async (manga) => {
    try {
      await adminMangaApi.updateManga(manga.id, { isFeatured: !manga.isFeatured })
      toast.success(manga.isFeatured ? 'Retiré de la vedette' : '⭐ Ajouté en vedette')
      execute()
    } catch (err) { toast.error(err.message) }
  }

  const toggleOfficial = async (manga) => {
    try {
      const res = await adminMangaApi.toggleOfficial(manga.id)
      const nowOfficial = res?.manga?.isOfficial
      toast.success(nowOfficial ? '🏅 Certifié Officiel !' : 'Certification retirée')
      execute()
      // Mettre à jour le modal ouvert si concerné
      if (selected?.id === manga.id) {
        setSelected({ ...selected, isOfficial: nowOfficial })
      }
    } catch (err) { toast.error(err.message) }
  }

  const removeManga = async (manga) => {
    if (!confirm(`Supprimer définitivement "${manga.titleF}" ? Cette action est irréversible.`)) return
    try {
      await adminMangaApi.deleteManga(manga.id)
      toast.success('🗑️ Manga supprimé')
      execute()
    } catch (err) { toast.error(err.message) }
  }

  // Compteurs par statut
  const counts = {
    all: mangas.length,
    pending: mangas.filter(m => m.moderationStatus === 'pending').length,
    approved: mangas.filter(m => m.moderationStatus === 'approved').length,
    rejected: mangas.filter(m => m.moderationStatus === 'rejected').length,
    suspended: mangas.filter(m => m.moderationStatus === 'suspended').length,
  }

  return (
    <div>
      {/* Filtres statuts */}
      <div className={styles.filters}>
        {MOD_STATUSES.map(s => (
          <button key={s.v}
            className={`${styles.filterBtn} ${filter === s.v ? styles.filterActive : ''}`}
            onClick={() => setFilter(s.v)}>
            {s.l} {s.v !== 'all' && counts[s.v] !== undefined && (
              <span style={{ marginLeft:6, fontSize:'.7rem', opacity:.7 }}>({counts[s.v]})</span>
            )}
          </button>
        ))}
        <select className={styles.searchBox} value={accessFilter} onChange={e => setAccessFilter(e.target.value)}>
          <option value="all" style={{ background:'#11142a' }}>Tous accès</option>
          <option value="free" style={{ background:'#11142a' }}>🆓 Gratuit</option>
          <option value="premium" style={{ background:'#11142a' }}>👑 Premium</option>
        </select>
        <input className={styles.searchBox} placeholder="🔍 Titre, auteur, slug..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>📚 Mangas ({mangas.length})</span>
        </div>
        {loading ? <PageLoader /> : !mangas.length ? <EmptyState icon="📚" title="Aucun manga" /> : (
          <div style={{ overflowX:'auto' }}>
            <table className={styles.table}>
              <thead><tr>
                <th>Cover</th><th>Manga</th><th>Auteur</th>
                <th>Modération</th><th>Accès</th><th>Stats</th>
                <th>Actions</th>
              </tr></thead>
              <tbody>
                {mangas.map(m => (
                  <tr key={m.id} className={styles.tr} style={{ cursor:'pointer' }} onClick={() => setSelected(m)}>
                    <td>
                      {m.coverUrl ? (
                        <img
                          src={`${API_BASE}${m.coverUrl}`}
                          alt={m.titleF}
                          style={{ width:48, height:72, objectFit:'cover', borderRadius:6, border:'1px solid rgba(255,255,255,.1)' }}
                          onError={e => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div style={{ width:48, height:72, background:'rgba(34,197,94,.1)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem' }}>📖</div>
                      )}
                    </td>
                    <td>
                      <strong style={{ color:'#e2e8f0', display:'flex', alignItems:'center', gap:5 }}>
                        {m.titleF}
                        {m.isOfficial && <span title="Certifié Officiel" style={{ fontSize:'.85rem' }}>🏅</span>}
                      </strong>
                      {m.titleE && <div style={{ fontSize:'.72rem', color:'rgba(180,190,220,.45)' }}>{m.titleE}</div>}
                      <div style={{ fontSize:'.7rem', color:'rgba(180,190,220,.4)', marginTop:2 }}>
                        {m.totalChapters} chap. · {m.language?.toUpperCase()}
                      </div>
                    </td>
                    <td>
                      <strong>{m.author?.pseudo || m.authorName}</strong>
                      <div style={{ fontSize:'.72rem', color:'rgba(180,190,220,.5)' }}>{m.author?.email || ''}</div>
                    </td>
                    <td>
                      <Badge variant={STATUS_VARIANT[m.moderationStatus] || 'gray'} style={{ fontSize:'.65rem' }}>
                        {m.moderationStatus}
                      </Badge>
                      <div style={{ display:'flex', gap:3, marginTop:4, flexWrap:'wrap' }}>
                        {m.isFeatured && <Badge variant="amber" style={{ fontSize:'.6rem' }}>⭐ VEDETTE</Badge>}
                        {m.isOfficial && <Badge variant="blue" style={{ fontSize:'.6rem' }}>🏅 OFFICIEL</Badge>}
                      </div>
                    </td>
                    <td>
                      <Badge variant={m.accessTier === 'premium' ? 'purple' : 'green'} style={{ fontSize:'.65rem' }}>
                        {m.accessTier}
                      </Badge>
                    </td>
                    <td style={{ fontSize:'.78rem' }}>
                      👁️ {(m.viewCount || 0).toLocaleString()}<br/>
                      <span style={{ color:'rgba(180,190,220,.5)', fontSize:'.7rem' }}>
                        ⭐ {m.averageRating?.toFixed(1) || '—'} ({m.ratingCount})
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()} style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {m.moderationStatus === 'pending' && (
                        <>
                          <Button variant="primary" size="sm" onClick={() => moderate(m, 'approved')}>✅</Button>
                          <Button variant="danger" size="sm" onClick={() => {
                            const reason = prompt('Motif du rejet :')
                            if (reason) moderate(m, 'rejected', reason)
                          }}>❌</Button>
                        </>
                      )}
                      {m.moderationStatus === 'approved' && (
                        <Button variant="ghost" size="sm" title={m.isFeatured ? 'Retirer vedette' : 'Mettre en vedette'}
                          onClick={() => toggleFeature(m)}>
                          {m.isFeatured ? '⭐' : '☆'}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" title="Gérer les chapitres"
                        onClick={() => setChaptersModal(m)}>📚</Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelected(m)}>👁️</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <MangaDetailModal
          manga={selected}
          onClose={() => setSelected(null)}
          onModerate={moderate}
          onToggleFeature={toggleFeature}
          onToggleOfficial={toggleOfficial}
          onDelete={removeManga}
          onManageChapters={() => { setChaptersModal(selected); setSelected(null) }}
        />
      )}

      {chaptersModal && (
        <ChaptersManagerModal
          manga={chaptersModal}
          onClose={() => setChaptersModal(null)}
          toast={toast}
        />
      )}
    </div>
  )
}

function MangaDetailModal({ manga: m, onClose, onModerate, onToggleFeature, onToggleOfficial, onDelete, onManageChapters }) {
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  return (
    <Modal isOpen title={`📖 ${m.titleF}`} onClose={onClose} wide>
      <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
        <div>
          {m.coverUrl ? (
            <img src={`${API_BASE}${m.coverUrl}`} alt={m.titleF}
              style={{ width:'100%', aspectRatio:'2/3', objectFit:'cover', borderRadius:10, border:'1px solid rgba(255,255,255,.1)' }} />
          ) : (
            <div style={{ width:'100%', aspectRatio:'2/3', background:'rgba(34,197,94,.1)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem' }}>📖</div>
          )}
        </div>

        <div>
          <h3 style={{ fontFamily:'var(--font-title)', fontSize:'1.3rem', letterSpacing:2, color:'#e2e8f0', marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
            {m.titleF}
            {m.isOfficial && <span title="Certifié Officiel">🏅</span>}
          </h3>
          {m.titleE && <p style={{ color:'rgba(180,190,220,.6)', fontSize:'.85rem', marginBottom:12 }}>{m.titleE}</p>}

          <div className={styles.detailGrid} style={{ marginBottom:'1rem' }}>
            <div className={styles.detailItem}>
              <div className={styles.detailLbl}>Slug</div>
              <strong style={{ fontSize:'.78rem', color:'#a78bfa', fontFamily:'monospace' }}>{m.slug}</strong>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLbl}>Auteur</div>
              <strong style={{ fontSize:'.85rem', color:'#e2e8f0' }}>{m.author?.pseudo || m.authorName}</strong>
              {m.author?.email && <div style={{ fontSize:'.7rem', color:'rgba(180,190,220,.5)' }}>{m.author.email}</div>}
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLbl}>Langue</div>
              <strong style={{ fontSize:'.85rem' }}>{m.language?.toUpperCase()}</strong>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLbl}>Statut</div>
              <Badge variant={STATUS_VARIANT[m.moderationStatus]} style={{ fontSize:'.65rem' }}>{m.moderationStatus}</Badge>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLbl}>Accès</div>
              <Badge variant={m.accessTier === 'premium' ? 'purple' : 'green'} style={{ fontSize:'.65rem' }}>{m.accessTier}</Badge>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLbl}>Âge</div>
              <strong style={{ fontSize:'.85rem' }}>{m.ageRating}</strong>
            </div>
          </div>

          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <div className={styles.detailLbl}>👁️ Vues</div>
              <strong style={{ fontSize:'.95rem', color:'#22c55e', fontFamily:'var(--font-title)' }}>{(m.viewCount || 0).toLocaleString()}</strong>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLbl}>📖 Lectures</div>
              <strong style={{ fontSize:'.95rem', color:'#3b82f6', fontFamily:'var(--font-title)' }}>{(m.readCount || 0).toLocaleString()}</strong>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLbl}>📚 Chapitres</div>
              <strong style={{ fontSize:'.95rem', fontFamily:'var(--font-title)' }}>{m.totalChapters}</strong>
            </div>
            <div className={styles.detailItem}>
              <div className={styles.detailLbl}>⭐ Note</div>
              <strong style={{ fontSize:'.95rem', color:'#eab308', fontFamily:'var(--font-title)' }}>
                {m.averageRating?.toFixed(1) || '—'} <span style={{ fontSize:'.7rem', color:'rgba(180,190,220,.5)' }}>({m.ratingCount})</span>
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Genres / Tags */}
      {(m.genres?.length > 0 || m.tags?.length > 0) && (
        <div style={{ marginBottom:'1.2rem' }}>
          <div style={{ fontSize:'.68rem', color:'rgba(180,190,220,.5)', letterSpacing:1.5, textTransform:'uppercase', fontWeight:800, marginBottom:8 }}>Genres & Tags</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {m.genres?.map(g => (
              <span key={g} style={{ padding:'4px 10px', background:'rgba(34,197,94,.12)', color:'#4ade80', border:'1px solid rgba(34,197,94,.25)', borderRadius:50, fontSize:'.72rem', fontWeight:700 }}>{g}</span>
            ))}
            {m.tags?.map(t => (
              <span key={t} style={{ padding:'4px 10px', background:'rgba(255,255,255,.04)', color:'rgba(180,190,220,.6)', border:'1px solid rgba(255,255,255,.08)', borderRadius:50, fontSize:'.72rem' }}>#{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Notes modération */}
      {m.moderationNotes && (
        <div style={{ background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)', borderRadius:10, padding:'.9rem 1.1rem', marginBottom:'1rem' }}>
          <div style={{ fontSize:'.68rem', color:'#fcd34d', fontWeight:800, letterSpacing:1, textTransform:'uppercase', marginBottom:5 }}>📝 Notes admin</div>
          <p style={{ fontSize:'.85rem', color:'rgba(252,211,77,.85)', margin:0, lineHeight:1.6 }}>{m.moderationNotes}</p>
        </div>
      )}

      {m.rejectedReason && m.moderationStatus === 'rejected' && (
        <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', borderRadius:10, padding:'.9rem 1.1rem', marginBottom:'1rem' }}>
          <div style={{ fontSize:'.68rem', color:'#f87171', fontWeight:800, letterSpacing:1, textTransform:'uppercase', marginBottom:5 }}>❌ Motif du rejet</div>
          <p style={{ fontSize:'.85rem', color:'rgba(248,113,113,.9)', margin:0, lineHeight:1.6 }}>{m.rejectedReason}</p>
        </div>
      )}

      {/* Actions modération */}
      <div style={{ background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)', borderRadius:12, padding:'1rem' }}>
        <div style={{ fontSize:'.68rem', fontWeight:800, color:'rgba(180,190,220,.5)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:'.8rem' }}>⚡ Actions</div>

        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <a href={`/manga/${m.slug}`} target="_blank" rel="noreferrer">
            <Button variant="ghost" size="sm">🌐 Voir sur le site</Button>
          </a>

          <Button variant="ghost" size="sm" onClick={onManageChapters}>📚 Gérer les chapitres</Button>

          {m.moderationStatus !== 'approved' && (
            <Button variant="primary" size="sm" onClick={() => onModerate(m, 'approved')}>
              ✅ Approuver
            </Button>
          )}

          {m.moderationStatus === 'approved' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => onToggleFeature(m)}>
                {m.isFeatured ? '⭐ Retirer vedette' : '☆ Mettre en vedette'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onToggleOfficial(m)}>
                {m.isOfficial ? '🏅 Retirer certification' : '🏅 Certifier Officiel'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onModerate(m, 'suspended', 'Suspendu par admin')}>
                🚫 Suspendre
              </Button>
            </>
          )}

          {!showReject && m.moderationStatus !== 'rejected' && (
            <Button variant="danger" size="sm" onClick={() => setShowReject(true)}>❌ Rejeter</Button>
          )}

          <Button variant="danger" size="sm" onClick={() => onDelete(m)}>🗑️ Supprimer</Button>
        </div>

        {showReject && (
          <div style={{ marginTop:'1rem', padding:'1rem', background:'rgba(239,68,68,.05)', borderRadius:10, border:'1px solid rgba(239,68,68,.15)' }}>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              rows={3} placeholder="Motif du rejet (visible par l'auteur)..."
              style={{ width:'100%', padding:'9px 12px', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, color:'#e2e8f0', fontSize:'.85rem', resize:'vertical', outline:'none', marginBottom:8 }} />
            <div style={{ display:'flex', gap:8 }}>
              <Button variant="ghost" size="sm" onClick={() => { setShowReject(false); setRejectReason('') }}>Annuler</Button>
              <Button variant="danger" size="sm" onClick={() => {
                if (!rejectReason.trim()) return alert('Motif obligatoire')
                onModerate(m, 'rejected', rejectReason)
              }}>❌ Confirmer le rejet</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

/* ══ GESTIONNAIRE DE CHAPITRES ════════════════════════ */
function ChaptersManagerModal({ manga: m, onClose, toast }) {
  const { data, loading, execute } = useApi(
    () => adminMangaApi.getChapters(m.id),
    [m.id],
    true
  )
  const chapters = data?.chapters || []

  const togglePublish = async (ch) => {
    try {
      await adminMangaApi.moderateChapter(ch.id, { isPublished: !ch.isPublished })
      toast.success(ch.isPublished ? 'Chapitre dépublié' : '✅ Chapitre publié')
      execute()
    } catch (err) { toast.error(err.message) }
  }

  const toggleAccess = async (ch) => {
    const newTier = ch.accessTier === 'premium' ? 'free' : 'premium'
    try {
      await adminMangaApi.moderateChapter(ch.id, { accessTier: newTier })
      toast.success(newTier === 'premium' ? '👑 Passé en Premium' : '🆓 Passé en Gratuit')
      execute()
    } catch (err) { toast.error(err.message) }
  }

  const changeCost = async (ch) => {
    const val = prompt('Coût en coins pour débloquer ce chapitre :', ch.coinCost ?? 5)
    if (val === null) return
    const cost = parseInt(val)
    if (isNaN(cost) || cost < 0) return toast.error('Valeur invalide')
    try {
      await adminMangaApi.moderateChapter(ch.id, { coinCost: cost })
      toast.success(`Coût mis à jour : ${cost} coins`)
      execute()
    } catch (err) { toast.error(err.message) }
  }

  const removeChapter = async (ch) => {
    if (!confirm(`Supprimer le chapitre ${ch.chapterNumber} ? Action irréversible.`)) return
    try {
      await adminMangaApi.deleteChapter(ch.id)
      toast.success('🗑️ Chapitre supprimé')
      execute()
    } catch (err) { toast.error(err.message) }
  }

  return (
    <Modal isOpen title={`📚 Chapitres — ${m.titleF}`} onClose={onClose} wide>
      {loading ? <PageLoader /> : !chapters.length ? (
        <EmptyState icon="📚" title="Aucun chapitre" message="Cet éditeur n'a pas encore ajouté de chapitres." />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {chapters.map(ch => (
            <div key={ch.id} style={{
              display:'flex', alignItems:'center', gap:12,
              background:'rgba(255,255,255,.02)', border:'1px solid rgba(255,255,255,.06)',
              borderRadius:10, padding:'.8rem 1rem',
            }}>
              {/* Numéro */}
              <div style={{
                width:44, height:44, flexShrink:0, borderRadius:9,
                background:'rgba(167,139,250,.12)', color:'#a78bfa',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              }}>
                <span style={{ fontSize:'.55rem', fontWeight:700, opacity:.7 }}>CH</span>
                <span style={{ fontSize:'.95rem', fontWeight:800, lineHeight:1 }}>{Number(ch.chapterNumber)}</span>
              </div>

              {/* Infos */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'.9rem', fontWeight:700, color:'#e2e8f0' }}>
                  {ch.title || `Chapitre ${Number(ch.chapterNumber)}`}
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4, alignItems:'center' }}>
                  <span style={{ fontSize:'.72rem', color:'rgba(180,190,220,.5)' }}>{ch.pageCount} pages</span>
                  <Badge variant={ch.isPublished ? 'green' : 'gray'} style={{ fontSize:'.6rem' }}>
                    {ch.isPublished ? '✅ Publié' : '🔴 Brouillon'}
                  </Badge>
                  <Badge variant={ch.accessTier === 'premium' ? 'purple' : 'green'} style={{ fontSize:'.6rem' }}>
                    {ch.accessTier === 'premium' ? `👑 ${ch.coinCost ?? 5} coins` : '🆓 Gratuit'}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:5, flexShrink:0, flexWrap:'wrap' }}>
                <Button variant="ghost" size="sm" title={ch.isPublished ? 'Dépublier' : 'Publier'}
                  onClick={() => togglePublish(ch)}>
                  {ch.isPublished ? '🔴' : '✅'}
                </Button>
                <Button variant="ghost" size="sm" title="Changer accès free/premium"
                  onClick={() => toggleAccess(ch)}>
                  {ch.accessTier === 'premium' ? '🆓' : '👑'}
                </Button>
                {ch.accessTier === 'premium' && (
                  <Button variant="ghost" size="sm" title="Modifier le coût en coins"
                    onClick={() => changeCost(ch)}>🪙</Button>
                )}
                <Button variant="danger" size="sm" title="Supprimer"
                  onClick={() => removeChapter(ch)}>🗑️</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}