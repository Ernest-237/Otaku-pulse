// src/pages/Admin/sections/DashboardSection.jsx
import { useState } from 'react'
import { adminApi } from '../../../api'
import { useApi }   from '../../../hooks/useApi'
import { PageLoader, EmptyState } from '../../../components/ui/Spinner'
import Badge, { statusVariant, STATUS_LABELS } from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import styles from '../Admin.module.css'

const MONTHS_FR = { '01':'Jan','02':'Fév','03':'Mar','04':'Avr','05':'Mai','06':'Jun','07':'Jul','08':'Aoû','09':'Sep','10':'Oct','11':'Nov','12':'Déc' }
const STATUS_COLORS = { pending:'#f59e0b', confirmed:'#3b82f6', preparing:'#8b5cf6', shipped:'#06b6d4', delivered:'#22c55e', cancelled:'#ef4444', refunded:'#6b7280' }
const CAT_COLORS = ['#22c55e','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#f97316','#ec4899','#10b981','#6366f1']

const chartTheme = {
  background: 'transparent',
  text: 'rgba(200,230,255,0.6)',
  grid: 'rgba(255,255,255,0.06)',
  tooltip: { bg:'#0d1f35', border:'rgba(34,197,94,0.3)', text:'#f0fdf4' },
}

function CustomTooltip({ active, payload, label, unit='' }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:chartTheme.tooltip.bg, border:`1px solid ${chartTheme.tooltip.border}`, borderRadius:10, padding:'10px 14px', fontSize:'.82rem' }}>
      <div style={{ color:'rgba(200,230,255,.6)', marginBottom:5, fontWeight:700 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontFamily:'var(--font-title)', fontSize:'1rem' }}>{p.value?.toLocaleString()}{unit}</span>
          <span style={{ opacity:.7 }}>{p.name}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardSection({ toast, setSection }) {
  const { data, loading, execute } = useApi(() => adminApi.getDashboard(), [], true)

  if (loading) return <PageLoader />
  if (!data?.stats) return (
    <div style={{ textAlign:'center', padding:'4rem' }}>
      <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>⚠️</div>
      <div style={{ fontFamily:'var(--font-title)', fontSize:'1.2rem', letterSpacing:'2px', color:'var(--muted)', marginBottom:'1.5rem' }}>
        IMPOSSIBLE DE CHARGER LE DASHBOARD
      </div>
      <Button variant="primary" onClick={execute}>🔄 Réessayer</Button>
    </div>
  )

  const { stats, recentOrders=[], recentContacts=[], revenueByMonth=[], usersByMonth=[], ordersByStatus=[], productsByCategory=[] } = data

  // Alertes manga (intégrées au dashboard global)
  const mangaAlerts = []
  if (stats.manga?.pending > 0) {
    mangaAlerts.push({ icon:'📚', count: stats.manga.pending, label:'manga(s) en attente de modération', section:'manga' })
  }
  if (stats.subscriptions?.pending > 0) {
    mangaAlerts.push({ icon:'💎', count: stats.subscriptions.pending, label:'abonnement(s) à valider', section:'subs' })
  }
  if (stats.publishers?.pendingApps > 0) {
    mangaAlerts.push({ icon:'✍️', count: stats.publishers.pendingApps, label:'candidature(s) éditeur', section:'publishers' })
  }

  // Formater données graphiques
  const revenueData = revenueByMonth.map(d => ({
    name: MONTHS_FR[d.month?.split('-')[1]] || d.month,
    CA: parseInt(d.revenue) || 0,
    Commandes: parseInt(d.count) || 0,
  }))

  const usersData = usersByMonth.map(d => ({
    name: MONTHS_FR[d.month?.split('-')[1]] || d.month,
    Membres: parseInt(d.count) || 0,
  }))

  // Merge revenue + users par mois
  const allMonths = [...new Set([...revenueData.map(d=>d.name), ...usersData.map(d=>d.name)])]
  const mergedData = allMonths.map(m => ({
    name: m,
    CA: revenueData.find(d=>d.name===m)?.CA || 0,
    Commandes: revenueData.find(d=>d.name===m)?.Commandes || 0,
    Membres: usersData.find(d=>d.name===m)?.Membres || 0,
  }))

  const statusData = ordersByStatus.map(d => ({
    name: STATUS_LABELS[d.status] || d.status,
    value: parseInt(d.count) || 0,
    color: STATUS_COLORS[d.status] || '#6b7280',
  }))

  const catData = productsByCategory.map((d,i) => ({
    name: d.category?.charAt(0).toUpperCase()+d.category?.slice(1),
    value: parseInt(d.count) || 0,
    color: CAT_COLORS[i % CAT_COLORS.length],
  }))

  // KPI Cards
  const kpis = [
    { ico:'👥', val:stats.users.total,     lbl:'Membres',      sub:`+${stats.users.month} ce mois`,      color:'#22c55e', sec:'users'    },
    { ico:'🛒', val:stats.orders.total,    lbl:'Commandes',     sub:`${stats.orders.pending} en attente`,  color:'#3b82f6', sec:'orders'   },
    { ico:'💰', val:`${Math.round(stats.revenue.total/1000)}K`, lbl:'Revenus FCFA', sub:`${Math.round(stats.revenue.month/1000)}K ce mois`, color:'#f59e0b', sec:'orders' },
    { ico:'📦', val:stats.products.total,  lbl:'Produits actifs', sub:`${stats.products.lowStock} stock bas`, color:'#8b5cf6', sec:'products' },
    { ico:'📬', val:stats.contacts.total,  lbl:'Réservations', sub:`${stats.contacts.newMonth} nouvelles`, color:'#06b6d4', sec:'contacts' },
    { ico:'🎌', val:stats.events.upcoming, lbl:'Événements',   sub:'à venir',                             color:'#f97316', sec:'events'   },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

      {/* Alerte commandes en attente */}
      {stats.orders.pending > 0 && (
        <div style={{ background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)', borderRadius:12, padding:'1rem 1.3rem', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:'1.4rem' }}>⚠️</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, color:'#fcd34d', fontSize:'.9rem' }}>{stats.orders.pending} commande{stats.orders.pending>1?'s':''} en attente</div>
            <div style={{ fontSize:'.78rem', color:'var(--muted)' }}>Traitez-les rapidement pour satisfaire vos clients</div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSection('orders')}>Voir →</Button>
        </div>
      )}
      
      {/* Alertes Manga Platform */}
      {mangaAlerts.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {mangaAlerts.map((a, i) => (
            <div key={i} style={{
              background:'rgba(124,58,237,.08)',
              border:'1px solid rgba(124,58,237,.2)',
              borderRadius:12, padding:'1rem 1.3rem',
              display:'flex', alignItems:'center', gap:12,
            }}>
              <span style={{ fontSize:'1.4rem' }}>{a.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:'#a78bfa', fontSize:'.9rem' }}>
                  {a.count} {a.label}
                </div>
                <div style={{ fontSize:'.78rem', color:'var(--muted)' }}>Action requise dans la plateforme manga</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSection(a.section)}>Gérer →</Button>
            </div>
          ))}
        </div>
      )}

      
      {/* KPI Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {kpis.map((k,i) => (
          <div key={i} className={styles.statCard} onClick={() => setSection(k.sec)}
            style={{ cursor:'pointer', borderLeft:`3px solid ${k.color}`, paddingLeft:'1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'.6rem' }}>
              <span style={{ fontSize:'1.6rem' }}>{k.ico}</span>
              <span style={{ fontSize:'.68rem', color:k.color, background:`${k.color}15`, border:`1px solid ${k.color}30`, borderRadius:20, padding:'2px 8px', fontWeight:700 }}>{k.sub}</span>
            </div>
            <div style={{ fontFamily:'var(--font-title)', fontSize:'1.9rem', letterSpacing:'2px', color:k.color, lineHeight:1 }}>{k.val}</div>
            <div style={{ fontSize:'.72rem', color:'var(--muted)', letterSpacing:'1px', textTransform:'uppercase', marginTop:4 }}>{k.lbl}</div>
          </div>
        ))}
      </div>

      {/* Graphique CA + Commandes sur 6 mois */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>📈 Chiffre d'affaires & Commandes (6 mois)</span>
        </div>
        <div style={{ padding:'1rem', height:260, minHeight:260, minWidth:0 }}>
          {mergedData.length === 0 ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--muted)', fontSize:'.85rem' }}>
              Aucune donnée de vente pour l'instant
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={mergedData} margin={{ top:5, right:10, left:0, bottom:5 }}>
                <defs>
                  <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradCmd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="name" tick={{ fill:chartTheme.text, fontSize:12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:chartTheme.text, fontSize:11 }} axisLine={false} tickLine={false} width={50} tickFormatter={v => v >= 1000 ? `${v/1000}K` : v} />
                <Tooltip content={<CustomTooltip unit=" FCFA" />} />
                <Legend formatter={(v) => <span style={{ color:'rgba(200,230,255,.7)', fontSize:'.78rem' }}>{v}</span>} />
                <Area type="monotone" dataKey="CA" name="CA (FCFA)" stroke="#22c55e" strokeWidth={2} fill="url(#gradCA)" dot={{ fill:'#22c55e', r:3 }} />
                <Area type="monotone" dataKey="Commandes" stroke="#3b82f6" strokeWidth={2} fill="url(#gradCmd)" dot={{ fill:'#3b82f6', r:3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Graphiques secondaires : Statuts + Catégories + Membres */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>

        {/* Commandes par statut */}
        <div className={styles.card}>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>🛒 Statuts</span></div>
          <div style={{ padding:'1rem', height:220, minHeight:220, minWidth:0 }}>
            {statusData.length === 0 ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--muted)', fontSize:'.82rem' }}>Aucune commande</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusData.map((entry,i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v,n) => [v, n]} contentStyle={{ background:'#0d1f35', border:'1px solid rgba(34,197,94,.3)', borderRadius:8, fontSize:'.78rem' }} />
                  <Legend formatter={v => <span style={{ color:'rgba(200,230,255,.65)', fontSize:'.72rem' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Produits par catégorie */}
        <div className={styles.card}>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>📦 Catégories</span></div>
          <div style={{ padding:'1rem', height:220, minHeight:220, minWidth:0 }}>
            {catData.length === 0 ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--muted)', fontSize:'.82rem' }}>Aucun produit</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={catData} layout="vertical" margin={{ left:0, right:10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                  <XAxis type="number" tick={{ fill:chartTheme.text, fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill:chartTheme.text, fontSize:10 }} axisLine={false} tickLine={false} width={65} />
                  <Tooltip contentStyle={{ background:'#0d1f35', border:'1px solid rgba(34,197,94,.3)', borderRadius:8, fontSize:'.78rem' }} />
                  <Bar dataKey="value" name="Produits" radius={[0,6,6,0]}>
                    {catData.map((entry,i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Nouveaux membres */}
        <div className={styles.card}>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>👥 Membres</span></div>
          <div style={{ padding:'1rem', height:220, minHeight:220, minWidth:0 }}>
            {usersData.length === 0 ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--muted)', fontSize:'.82rem' }}>Aucun nouveau membre</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={usersData} margin={{ top:5, right:10, left:0, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="name" tick={{ fill:chartTheme.text, fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:chartTheme.text, fontSize:11 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                  <Tooltip contentStyle={{ background:'#0d1f35', border:'1px solid rgba(34,197,94,.3)', borderRadius:8, fontSize:'.78rem' }} />
                  <Bar dataKey="Membres" fill="#8b5cf6" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Activité récente */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className={styles.card}>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>🛒 Dernières commandes</span></div>
          {recentOrders.length === 0 && <div style={{ padding:'1rem', color:'var(--muted)', fontSize:'.85rem', textAlign:'center' }}>Aucune commande</div>}
          {recentOrders.map(o => (
            <div key={o.id} className={styles.listRow}>
              <div>
                <span style={{ fontFamily:'var(--font-title)', color:'var(--green)', fontSize:'.95rem' }}>{o.orderNumber}</span>
                {o.quartier && <div style={{ fontSize:'.7rem', color:'var(--muted)' }}>📍 {o.quartier}</div>}
              </div>
              <span style={{ fontSize:'.82rem' }}>{o.total?.toLocaleString()} F</span>
              <Badge variant={statusVariant(o.status)} style={{ fontSize:'.62rem' }}>{STATUS_LABELS[o.status]||o.status}</Badge>
            </div>
          ))}
        </div>
        <div className={styles.card}>
          <div className={styles.cardHeader}><span className={styles.cardTitle}>📬 Dernières réservations</span></div>
          {recentContacts.length === 0 && <div style={{ padding:'1rem', color:'var(--muted)', fontSize:'.85rem', textAlign:'center' }}>Aucune réservation</div>}
          {recentContacts.map(c => (
            <div key={c.id} className={styles.listRow}>
              <div>
                <span><strong>{c.prenom} {c.nom}</strong></span>
                <div style={{ fontSize:'.72rem', color:'var(--muted)' }}>{c.theme}</div>
              </div>
              <Badge variant={statusVariant(c.status)} style={{ fontSize:'.62rem' }}>{STATUS_LABELS[c.status]||c.status}</Badge>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}