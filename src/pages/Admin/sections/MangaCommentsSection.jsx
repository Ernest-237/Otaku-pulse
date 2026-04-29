// src/pages/Admin/sections/MangaCommentsSection.jsx — Modération commentaires
import { useState } from 'react'
import { adminMangaApi } from '../../../api'
import { useApi } from '../../../hooks/useApi'
import Button from '../../../components/ui/Button'
import Badge from '../../../components/ui/Badge'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
import styles from '../Admin.module.css'

export default function MangaCommentsSection({ toast }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { data, loading, execute } = useApi(
    () => adminMangaApi.getComments({
      hidden: filter === 'hidden' ? 'true' : filter === 'visible' ? 'false' : undefined,
      search: search || undefined,
      limit: 100,
    }),
    [filter, search],
    true
  )

  const comments = data?.comments || []

  const toggleHide = async (c) => {
    try {
      await adminMangaApi.hideComment(c.id, !c.isHidden)
      toast.success(c.isHidden ? '👁️ Commentaire visible' : '🙈 Commentaire masqué')
      execute()
    } catch (err) { toast.error(err.message) }
  }

  const remove = async (c) => {
    if (!confirm('Supprimer définitivement ce commentaire ?')) return
    try {
      await adminMangaApi.deleteComment(c.id)
      toast.success('🗑️ Commentaire supprimé')
      execute()
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div>
      <div className={styles.filters}>
        {[
          ['all','Tous'],
          ['visible','👁️ Visibles'],
          ['hidden','🙈 Masqués'],
        ].map(([v,l]) => (
          <button key={v}
            className={`${styles.filterBtn} ${filter === v ? styles.filterActive : ''}`}
            onClick={() => setFilter(v)}>{l}</button>
        ))}
        <input className={styles.searchBox} placeholder="🔍 Rechercher dans le contenu..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>💬 Commentaires ({comments.length})</span>
        </div>
        {loading ? <PageLoader /> : !comments.length ? <EmptyState icon="💬" title="Aucun commentaire" /> : (
          <div style={{ padding:'1rem' }}>
            {comments.map(c => (
              <div key={c.id} style={{
                display:'flex', gap:12, padding:'1rem',
                background: c.isHidden ? 'rgba(239,68,68,.04)' : 'rgba(255,255,255,.02)',
                border: `1px solid ${c.isHidden ? 'rgba(239,68,68,.15)' : 'rgba(255,255,255,.06)'}`,
                borderRadius:10, marginBottom:8,
              }}>
                <div style={{
                  width:38, height:38, borderRadius:'50%',
                  background:'rgba(34,197,94,.1)', border:'1.5px solid rgba(34,197,94,.2)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem',
                  flexShrink:0,
                }}>
                  {c.user?.avatar || '🎌'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                    <strong style={{ color:'#e2e8f0', fontSize:'.88rem' }}>{c.user?.pseudo || 'Anonyme'}</strong>
                    <span style={{ fontSize:'.72rem', color:'rgba(180,190,220,.5)' }}>
                      sur <a href={`/manga/${c.manga?.slug}`} target="_blank" rel="noreferrer"
                        style={{ color:'#a78bfa', textDecoration:'none' }}>📖 {c.manga?.titleF}</a>
                    </span>
                    <span style={{ fontSize:'.72rem', color:'rgba(180,190,220,.4)' }}>
                      · {new Date(c.createdAt).toLocaleDateString('fr-FR', { dateStyle:'short' })}
                    </span>
                    {c.isHidden && <Badge variant="red" style={{ fontSize:'.6rem' }}>🙈 MASQUÉ</Badge>}
                  </div>
                  <p style={{
                    color: c.isHidden ? 'rgba(180,190,220,.4)' : '#cbd5e1',
                    fontSize:'.9rem', lineHeight:1.6, margin:'4px 0 8px',
                    wordBreak:'break-word',
                  }}>
                    {c.content}
                  </p>
                  <div style={{ display:'flex', gap:6 }}>
                    <Button variant="ghost" size="sm" onClick={() => toggleHide(c)}>
                      {c.isHidden ? '👁️ Démasquer' : '🙈 Masquer'}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => remove(c)}>🗑️ Supprimer</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}