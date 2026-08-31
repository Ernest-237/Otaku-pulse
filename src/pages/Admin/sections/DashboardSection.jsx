// src/pages/Admin/sections/DashboardSection.jsx — vue d'ensemble
//
// Entièrement en Tailwind. Les anciens styles en ligne posaient deux problèmes :
//   · `color: var(--muted)` valait #525252 — un gris SOMBRE conçu pour le site
//     public clair, donc quasi illisible sur le fond sombre du panneau ;
//   · les grilles étaient figées en `repeat(3,1fr)`, sans aucune adaptation,
//     ce qui écrasait les cartes sur un écran étroit.
import { adminApi } from '../../../api'
import { useApi }   from '../../../hooks/useApi'
import { PageLoader } from '../../../components/ui/Spinner'
import Badge, { statusVariant, STATUS_LABELS } from '../../../components/ui/Badge'
import {
  Users, ShoppingCart, Wallet, Package, Inbox, CalendarDays,
  TriangleAlert, ArrowRight, RefreshCw, BookOpen, Gem, PenLine,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const MONTHS_FR = {
  '01':'Jan','02':'Fév','03':'Mar','04':'Avr','05':'Mai','06':'Jun',
  '07':'Jul','08':'Aoû','09':'Sep','10':'Oct','11':'Nov','12':'Déc',
}

const STATUS_COLORS = {
  pending:'#f59e0b', confirmed:'#3b82f6', preparing:'#8b5cf6',
  shipped:'#06b6d4', delivered:'#10b981', cancelled:'#ef4444', refunded:'#64748b',
}

// Palette catégorielle : teintes distinctes mais de saturation comparable, pour
// qu'aucune ne domine visuellement les autres dans un camembert.
const CAT_COLORS = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#f97316','#ec4899','#14b8a6','#6366f1']

// Aligné sur la palette du panneau (voir src/styles/admin.css).
const CHART = {
  text: '#8996a8',
  grid: 'rgba(255,255,255,.05)',
  tooltipBg: '#161d27',
  tooltipBorder: '#26313f',
}

const tooltipStyle = {
  background: CHART.tooltipBg,
  border: `1px solid ${CHART.tooltipBorder}`,
  borderRadius: 10,
  fontSize: '.78rem',
  color: '#e6ebf2',
}

function ChartTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-850 px-3.5 py-2.5 text-[0.8rem] shadow-lg">
      <div className="mb-1 font-bold text-fg-muted">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="text-[0.95rem] font-bold">{p.value?.toLocaleString('fr-FR')}{unit}</span>
          <span className="text-fg-muted">{p.name}</span>
        </div>
      ))}
    </div>
  )
}

/** Carte de graphique : titre + zone de tracé à hauteur fixe. */
function ChartCard({ title, height = 220, empty, children }) {
  return (
    <div className="adm-card !p-0">
      <div className="border-b border-line px-4 py-3 text-[0.85rem] font-bold">{title}</div>
      <div className="min-w-0 p-3" style={{ height }}>
        {empty
          ? <div className="flex h-full items-center justify-center text-center text-[0.82rem] text-fg-faint">{empty}</div>
          : <ResponsiveContainer width="100%" height="100%" minWidth={0}>{children}</ResponsiveContainer>}
      </div>
    </div>
  )
}

/** Bandeau d'alerte cliquable, décliné en ambre (urgent) ou violet (manga). */
function AlertBar({ icon: Icon, tone, title, detail, action, onAction }) {
  const tones = {
    warn:   'border-warn/25 bg-warn/8 text-warn',
    violet: 'border-violet/25 bg-violet/8 text-violet',
  }
  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${tones[tone]}`}>
      <Icon size={19} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[0.88rem] font-bold">{title}</div>
        <div className="text-[0.76rem] text-fg-muted">{detail}</div>
      </div>
      <button
        onClick={onAction}
        className="flex items-center gap-1.5 rounded-full border border-current px-3 py-1.5 text-[0.78rem] font-semibold transition-opacity hover:opacity-75"
      >
        {action} <ArrowRight size={13} />
      </button>
    </div>
  )
}

export default function DashboardSection({ setSection }) {
  const { data, loading, execute } = useApi(() => adminApi.getDashboard(), [], true)

  if (loading) return <PageLoader />

  if (!data?.stats) return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <TriangleAlert size={40} className="text-warn" />
      <div>
        <div className="text-[1.05rem] font-bold">Impossible de charger le tableau de bord</div>
        <p className="mt-1 mb-0 max-w-md text-[0.84rem] text-fg-muted">
          Le serveur n'a pas répondu, ou ton compte n'a plus les droits d'administration.
        </p>
      </div>
      <button className="adm-btn adm-btn-primary" onClick={execute}>
        <RefreshCw size={15} /> Réessayer
      </button>
    </div>
  )

  const {
    stats, recentOrders = [], recentContacts = [],
    revenueByMonth = [], usersByMonth = [], ordersByStatus = [], productsByCategory = [],
  } = data

  // ── Alertes de la plateforme manga ──
  const mangaAlerts = []
  if (stats.manga?.pending > 0)
    mangaAlerts.push({ icon: BookOpen, count: stats.manga.pending, label: 'manga(s) en attente de modération', section: 'manga' })
  if (stats.subscriptions?.pending > 0)
    mangaAlerts.push({ icon: Gem, count: stats.subscriptions.pending, label: 'abonnement(s) à valider', section: 'subs' })
  if (stats.publishers?.pendingApps > 0)
    mangaAlerts.push({ icon: PenLine, count: stats.publishers.pendingApps, label: 'candidature(s) éditeur', section: 'publishers' })

  // ── Données des graphiques ──
  const revenueData = revenueByMonth.map(d => ({
    name: MONTHS_FR[d.month?.split('-')[1]] || d.month,
    CA: parseInt(d.revenue) || 0,
    Commandes: parseInt(d.count) || 0,
  }))
  const usersData = usersByMonth.map(d => ({
    name: MONTHS_FR[d.month?.split('-')[1]] || d.month,
    Membres: parseInt(d.count) || 0,
  }))

  const allMonths = [...new Set([...revenueData.map(d => d.name), ...usersData.map(d => d.name)])]
  const mergedData = allMonths.map(m => ({
    name: m,
    CA:        revenueData.find(d => d.name === m)?.CA || 0,
    Commandes: revenueData.find(d => d.name === m)?.Commandes || 0,
    Membres:   usersData.find(d => d.name === m)?.Membres || 0,
  }))

  const statusData = ordersByStatus.map(d => ({
    name: STATUS_LABELS[d.status] || d.status,
    value: parseInt(d.count) || 0,
    color: STATUS_COLORS[d.status] || '#64748b',
  }))

  const catData = productsByCategory.map((d, i) => ({
    name: d.category ? d.category.charAt(0).toUpperCase() + d.category.slice(1) : '—',
    value: parseInt(d.count) || 0,
    color: CAT_COLORS[i % CAT_COLORS.length],
  }))

  const kpis = [
    { icon: Users,        val: stats.users.total,     lbl: 'Membres',       sub: `+${stats.users.month} ce mois`,                     tone: 'text-brand',  sec: 'users'    },
    { icon: ShoppingCart, val: stats.orders.total,    lbl: 'Commandes',     sub: `${stats.orders.pending} en attente`,                tone: 'text-info',   sec: 'orders'   },
    { icon: Wallet,       val: `${Math.round(stats.revenue.total / 1000)}K`, lbl: 'Revenus FCFA', sub: `${Math.round(stats.revenue.month / 1000)}K ce mois`, tone: 'text-warn', sec: 'orders' },
    { icon: Package,      val: stats.products.total,  lbl: 'Produits',      sub: `${stats.products.lowStock} stock bas`,              tone: 'text-violet', sec: 'products' },
    { icon: Inbox,        val: stats.contacts.total,  lbl: 'Réservations',  sub: `${stats.contacts.newMonth} nouvelles`,              tone: 'text-info',   sec: 'contacts' },
    { icon: CalendarDays, val: stats.events.upcoming, lbl: 'Événements',    sub: 'à venir',                                           tone: 'text-brand',  sec: 'events'   },
  ]

  return (
    <div className="flex flex-col gap-5">

      {stats.orders.pending > 0 && (
        <AlertBar
          icon={TriangleAlert} tone="warn"
          title={`${stats.orders.pending} commande${stats.orders.pending > 1 ? 's' : ''} en attente`}
          detail="À traiter rapidement pour ne pas faire attendre tes clients."
          action="Voir" onAction={() => setSection('orders')}
        />
      )}

      {mangaAlerts.map((a, i) => (
        <AlertBar
          key={i} icon={a.icon} tone="violet"
          title={`${a.count} ${a.label}`}
          detail="Action requise dans la plateforme manga."
          action="Gérer" onAction={() => setSection(a.section)}
        />
      ))}

      {/* ── Indicateurs ──
          Grille adaptative : 2 colonnes sur mobile, 3 dès 1024px. L'ancienne
          version était figée à 3 colonnes et écrasait les cartes sur petit écran. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {kpis.map((k, i) => {
          const Icon = k.icon
          return (
            <button
              key={i}
              onClick={() => setSection(k.sec)}
              className="adm-card group flex flex-col items-start text-left transition-colors hover:border-ink-700 hover:bg-ink-800"
            >
              <div className="mb-2.5 flex w-full items-start justify-between gap-2">
                <Icon size={20} className={`shrink-0 ${k.tone}`} />
                <span className="rounded-full border border-line px-2 py-0.5 text-[0.66rem] font-semibold text-fg-muted">
                  {k.sub}
                </span>
              </div>
              <div className={`text-[1.75rem] font-extrabold leading-none ${k.tone}`}>{k.val}</div>
              <div className="mt-1.5 text-[0.72rem] uppercase tracking-wider text-fg-faint">{k.lbl}</div>
            </button>
          )
        })}
      </div>

      {/* ── Chiffre d'affaires ── */}
      <ChartCard
        title="Chiffre d'affaires & commandes (6 mois)"
        height={260}
        empty={mergedData.length === 0 ? 'Aucune donnée de vente pour l’instant' : null}
      >
        <AreaChart data={mergedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradCmd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
          <XAxis dataKey="name" tick={{ fill: CHART.text, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: CHART.text, fontSize: 11 }} axisLine={false} tickLine={false} width={50}
            tickFormatter={v => (v >= 1000 ? `${v / 1000}K` : v)}
          />
          <Tooltip content={<ChartTooltip unit=" F" />} />
          <Legend formatter={v => <span className="text-[0.78rem] text-fg-muted">{v}</span>} />
          <Area type="monotone" dataKey="CA" name="CA (FCFA)" stroke="#10b981" strokeWidth={2} fill="url(#gradCA)" dot={{ fill: '#10b981', r: 3 }} />
          <Area type="monotone" dataKey="Commandes" stroke="#3b82f6" strokeWidth={2} fill="url(#gradCmd)" dot={{ fill: '#3b82f6', r: 3 }} />
        </AreaChart>
      </ChartCard>

      {/* ── Graphiques secondaires ── */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">

        <ChartCard title="Statuts des commandes" empty={statusData.length === 0 ? 'Aucune commande' : null}>
          <PieChart>
            <Pie data={statusData} cx="50%" cy="50%" innerRadius={48} outerRadius={76} paddingAngle={3} dataKey="value">
              {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend formatter={v => <span className="text-[0.72rem] text-fg-muted">{v}</span>} />
          </PieChart>
        </ChartCard>

        <ChartCard title="Produits par catégorie" empty={catData.length === 0 ? 'Aucun produit' : null}>
          <BarChart data={catData} layout="vertical" margin={{ left: 0, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
            <XAxis type="number" tick={{ fill: CHART.text, fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: CHART.text, fontSize: 10 }} axisLine={false} tickLine={false} width={68} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" name="Produits" radius={[0, 6, 6, 0]}>
              {catData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Nouveaux membres" empty={usersData.length === 0 ? 'Aucun nouveau membre' : null}>
          <BarChart data={usersData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
            <XAxis dataKey="name" tick={{ fill: CHART.text, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: CHART.text, fontSize: 11 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="Membres" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      {/* ── Activité récente ── */}
      <div className="grid gap-3 lg:grid-cols-2">

        <div className="adm-card !p-0">
          <div className="border-b border-line px-4 py-3 text-[0.85rem] font-bold">Dernières commandes</div>
          {recentOrders.length === 0 ? (
            <div className="px-4 py-6 text-center text-[0.84rem] text-fg-faint">Aucune commande</div>
          ) : recentOrders.map(o => (
            <div key={o.id} className="flex items-center gap-3 border-b border-line-soft px-4 py-2.5 last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[0.85rem] font-semibold text-brand">{o.orderNumber}</div>
                {o.quartier && <div className="truncate text-[0.72rem] text-fg-faint">{o.quartier}</div>}
              </div>
              <span className="shrink-0 text-[0.82rem] font-semibold">
                {o.total?.toLocaleString('fr-FR')} F
              </span>
              <Badge variant={statusVariant(o.status)} style={{ fontSize: '.62rem' }}>
                {STATUS_LABELS[o.status] || o.status}
              </Badge>
            </div>
          ))}
        </div>

        <div className="adm-card !p-0">
          <div className="border-b border-line px-4 py-3 text-[0.85rem] font-bold">Dernières réservations</div>
          {recentContacts.length === 0 ? (
            <div className="px-4 py-6 text-center text-[0.84rem] text-fg-faint">Aucune réservation</div>
          ) : recentContacts.map(c => (
            <div key={c.id} className="flex items-center gap-3 border-b border-line-soft px-4 py-2.5 last:border-b-0">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[0.85rem] font-semibold">{c.prenom} {c.nom}</div>
                <div className="truncate text-[0.72rem] text-fg-faint">{c.theme}</div>
              </div>
              <Badge variant={statusVariant(c.status)} style={{ fontSize: '.62rem' }}>
                {STATUS_LABELS[c.status] || c.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
