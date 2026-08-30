// src/pages/Admin/sections/InvoicesSection.jsx — Facturation
//
// Deux façons de créer une facture :
//   · manuelle    — saisie libre (vente en main propre, prestation, sponsoring)
//   · automatique — générée depuis une commande boutique existante
//
// Les totaux affichés pendant la saisie ne sont qu'un APERÇU de confort : le
// serveur recalcule tout à la création (routes/adminInvoices.js) et c'est son
// résultat qui est stocké et réaffiché ensuite.
import { useState, useMemo, useEffect } from 'react'
import {
  FileText, Plus, Printer, Check, X, Trash2, RefreshCw,
  ShoppingBag, MapPin, Loader2, ArrowLeft, Send, Ban, Wallet,
} from 'lucide-react'
import { useApi, useMutation } from '../../../hooks/useApi'
import { adminInvoicesApi, adminApi } from '../../../api'
import { useToast } from '../../../contexts/ToastContext'
import InvoiceDocument from '../../../components/InvoiceDocument'
import { quartiersOf, locate, describePosition } from '../../../utils/cameroonGeo'
import styles from '../Admin.module.css'

const CITIES = ['Yaoundé', 'Douala', 'Bafoussam', 'Autre']

const STATUS_META = {
  draft:     { label: 'Brouillon', color: '#8fa896' },
  issued:    { label: 'À régler',  color: '#f59e0b' },
  paid:      { label: 'Acquittée', color: '#22c55e' },
  cancelled: { label: 'Annulée',   color: '#ef4444' },
}

const FILTERS = [
  { id: 'all',       label: 'Toutes'     },
  { id: 'draft',     label: 'Brouillons' },
  { id: 'issued',    label: 'À régler'   },
  { id: 'paid',      label: 'Acquittées' },
  { id: 'cancelled', label: 'Annulées'   },
]

const fmt = (n) => Number(n || 0).toLocaleString('fr-FR')
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { dateStyle: 'short' }) : '—'

const emptyLine = () => ({ label: '', qty: 1, unitPrice: 0 })

export default function InvoicesSection() {
  const toast = useToast()

  const [filter,  setFilter]  = useState('all')
  const [search,  setSearch]  = useState('')
  const [view,    setView]    = useState('list')     // list | form | detail
  const [current, setCurrent] = useState(null)       // facture affichée en détail

  const { data: cfg }        = useApi(() => adminInvoicesApi.getConfig(), [])
  const { data: statsData, refresh: refreshStats } = useApi(() => adminInvoicesApi.getStats(), [])
  const { data: listData, loading, refresh } = useApi(
    () => adminInvoicesApi.list({ status: filter, search }),
    [filter, search]
  )

  const stats    = statsData?.stats || {}
  const invoices = listData?.invoices || []
  const company  = cfg?.company || {}

  const refreshAll = () => { refresh(); refreshStats() }

  const openDetail = async (id) => {
    const data = await adminInvoicesApi.get(id)
    setCurrent(data.invoice)
    setView('detail')
  }

  // ── Vues plein écran ──
  if (view === 'form') {
    return (
      <InvoiceForm
        cfg={cfg}
        onCancel={() => setView('list')}
        onCreated={(inv) => { refreshAll(); setCurrent(inv); setView('detail') }}
      />
    )
  }

  if (view === 'detail' && current) {
    return (
      <InvoiceDetail
        invoice={current}
        company={company}
        paymentMethods={cfg?.paymentMethods || []}
        onBack={() => { setCurrent(null); setView('list'); refreshAll() }}
        onChanged={(inv) => { setCurrent(inv); refreshAll() }}
      />
    )
  }

  // ── Liste ──
  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}><FileText size={22} /> Facturation</h2>
          <p className={styles.sectionDesc}>
            Crée une facture à la main ou génère-la depuis une commande. Chaque facture porte
            son numéro, son code-barres et un plan de situation de la livraison.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <FromOrderButton cfg={cfg} onCreated={(inv) => { refreshAll(); setCurrent(inv); setView('detail') }} />
          <button className={styles.btnPrimary} onClick={() => setView('form')}>
            <Plus size={15} /> Nouvelle facture
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <Stat icon="📄" label="Brouillons" value={stats.counts?.draft ?? 0} />
        <Stat icon="⏳" label="À encaisser" value={`${fmt(stats.outstanding)} F`} highlight />
        <Stat icon="✅" label="Encaissé ce mois" value={`${fmt(stats.monthTotal)} F`} />
      </div>

      <div className={styles.filters}>
        {FILTERS.map(f => (
          <button key={f.id}
            className={`${styles.filterBtn} ${filter === f.id ? styles.filterActive : ''}`}
            onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
        <input
          className={styles.searchBox}
          placeholder="N° facture, nom, téléphone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ minWidth: 220, flex: 1 }}
        />
        <button className={styles.btnGhost} onClick={refreshAll} title="Rafraîchir">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div className={styles.loadingBox}><Loader2 size={20} className={styles.spin} /> Chargement…</div>
        ) : invoices.length === 0 ? (
          <div className={styles.emptyBox}>Aucune facture pour ce filtre.</div>
        ) : (
          // Le tableau défile dans son propre conteneur : sur téléphone, sans ça,
          // c'est toute la page qui part en défilement horizontal.
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N°</th><th>Client</th><th>Destination</th>
                  <th>Date</th><th>Montant</th><th>Statut</th><th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const meta = STATUS_META[inv.status] || STATUS_META.draft
                  return (
                    <tr key={inv.id} className={styles.tr}>
                      <td style={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{inv.invoiceNumber}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{inv.clientName}</div>
                        {inv.clientPhone && (
                          <div style={{ fontSize: '.72rem', opacity: .65 }}>{inv.clientPhone}</div>
                        )}
                      </td>
                      <td style={{ fontSize: '.78rem' }}>
                        {inv.clientQuartier || '—'}
                        <div style={{ opacity: .6 }}>{inv.clientCity}</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(inv.createdAt)}</td>
                      <td style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>{fmt(inv.total)} F</td>
                      <td>
                        <span className={styles.badge} style={{ color: meta.color }}>{meta.label}</span>
                      </td>
                      <td>
                        <button className={styles.btnGhost} onClick={() => openDetail(inv.id)}>Ouvrir</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
function Stat({ icon, label, value, highlight }) {
  return (
    <div className={`${styles.statCard} ${highlight ? styles.statHighlight : ''}`}>
      <div className={styles.statTop}>
        <span className={styles.statIcon}>{icon}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
      <div className={styles.statValue}>{value}</div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// GÉNÉRATION DEPUIS UNE COMMANDE
// ══════════════════════════════════════════════════════
function FromOrderButton({ cfg, onCreated }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [taxPreset, setTaxPreset] = useState('none')
  const { data, loading } = useApi(() => adminApi.getOrders({ limit: 40 }), [open], open)
  const { mutate, loading: creating } = useMutation(adminInvoicesApi.fromOrder)

  const orders = data?.orders || []
  const presets = cfg?.taxPresets || []
  const rate = presets.find(p => p.id === taxPreset)?.rate ?? 0

  const generate = async (orderId) => {
    const { data: res, error } = await mutate(orderId, { taxRate: rate })
    if (error) return toast.error(error)
    toast.success(res.message)
    setOpen(false)
    onCreated(res.invoice)
  }

  return (
    <>
      <button className={styles.btnSecondary} onClick={() => setOpen(true)}>
        <ShoppingBag size={15} /> Depuis une commande
      </button>

      {open && (
        <div className={styles.modalBackdrop} onClick={() => setOpen(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className={styles.modalHead}>
              <h3>Générer une facture depuis une commande</h3>
              <button className={styles.btnGhost} onClick={() => setOpen(false)}><X size={16} /></button>
            </div>

            <div className={styles.modalField}>
              <label className={styles.label}>Taxe à appliquer</label>
              <select className={styles.select} value={taxPreset} onChange={e => setTaxPreset(e.target.value)}>
                {presets.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>

            {loading ? (
              <div className={styles.loadingBox}><Loader2 size={18} className={styles.spin} /> Chargement…</div>
            ) : orders.length === 0 ? (
              <div className={styles.emptyBox}>Aucune commande.</div>
            ) : (
              <div style={{ maxHeight: '46vh', overflowY: 'auto' }}>
                {orders.map(o => (
                  <div key={o.id} className={styles.listRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{o.orderNumber}</div>
                      <div style={{ fontSize: '.75rem', opacity: .7 }}>
                        {o.user?.pseudo || '—'} · {o.quartier || o.city || '—'} · {fmt(o.total)} F
                      </div>
                    </div>
                    <button className={styles.btnPrimary} disabled={creating}
                      onClick={() => generate(o.id)}>
                      {creating ? <Loader2 size={14} className={styles.spin} /> : 'Générer'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ══════════════════════════════════════════════════════
// FORMULAIRE DE SAISIE MANUELLE
// ══════════════════════════════════════════════════════
function InvoiceForm({ cfg, onCancel, onCreated }) {
  const toast = useToast()
  const { mutate, loading } = useMutation(adminInvoicesApi.create)

  const [f, setF] = useState({
    clientName: '', clientPhone: '', clientEmail: '',
    clientCity: 'Yaoundé', clientQuartier: '', clientAddress: '',
    destLat: '', destLng: '', destLandmark: '',
    discount: 0, shipping: 0, taxPreset: 'none',
    paymentMethod: '', dueAt: '', notes: '', adminNotes: '',
  })
  const [items, setItems] = useState([emptyLine()])

  const set = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }))

  const presets = cfg?.taxPresets || []
  const preset  = presets.find(p => p.id === f.taxPreset) || { rate: 0, taxLabel: '' }

  // Aperçu local, purement indicatif : le serveur refait ce calcul et c'est son
  // résultat qui est enregistré. Reproduire la formule ici évite juste à l'admin
  // de saisir à l'aveugle.
  const preview = useMemo(() => {
    const subtotal = items.reduce(
      (s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0)
    const disc = Math.min(Number(f.discount) || 0, subtotal)
    const ship = Number(f.shipping) || 0
    const base = subtotal - disc + ship
    const tax  = Math.round(base * preset.rate / 10000)
    return { subtotal, disc, ship, tax, total: base + tax }
  }, [items, f.discount, f.shipping, preset.rate])

  // Position déduite en direct, pour que l'admin voie tout de suite si le
  // quartier saisi est reconnu — plutôt que de le découvrir à l'impression.
  const geo = useMemo(() => locate({
    city: f.clientCity, quartier: f.clientQuartier,
    lat: f.destLat, lng: f.destLng,
  }), [f.clientCity, f.clientQuartier, f.destLat, f.destLng])

  const setItem = (i, k, v) => setItems(prev =>
    prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it))

  const submit = async (e) => {
    e.preventDefault()
    const payload = {
      ...f,
      items: items.filter(it => it.label.trim()),
      taxRate:  preset.rate,
      taxLabel: preset.taxLabel,
      destLat: f.destLat === '' ? null : Number(f.destLat),
      destLng: f.destLng === '' ? null : Number(f.destLng),
      dueAt:   f.dueAt || null,
    }
    const { data, error } = await mutate(payload)
    if (error) return toast.error(error)
    toast.success(data.message)
    onCreated(data.invoice)
  }

  return (
    <form className={styles.section} onSubmit={submit}>
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}><Plus size={20} /> Nouvelle facture</h2>
          <p className={styles.sectionDesc}>
            Elle sera créée en brouillon : tu pourras la relire avant de l'émettre.
          </p>
        </div>
        <button type="button" className={styles.btnGhost} onClick={onCancel}>
          <ArrowLeft size={15} /> Retour
        </button>
      </div>

      {/* ── Client ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}><h3 className={styles.cardTitle}>Client</h3></div>
        <div className={`${styles.formRow} ${styles.formRow2}`}>
          <div>
            <label className={styles.label}>Nom du client *</label>
            <input className={styles.input} required value={f.clientName}
              onChange={set('clientName')} placeholder="Ernest Tsimi" />
          </div>
          <div>
            <label className={styles.label}>Téléphone</label>
            <input className={styles.input} value={f.clientPhone}
              onChange={set('clientPhone')} placeholder="+237 6 75 71 27 39" />
          </div>
        </div>
        <div className={`${styles.formRow} ${styles.formRow2}`}>
          <div>
            <label className={styles.label}>Email</label>
            <input className={styles.input} type="email" value={f.clientEmail}
              onChange={set('clientEmail')} placeholder="client@email.com" />
          </div>
          <div>
            <label className={styles.label}>Ville</label>
            <select className={styles.select} value={f.clientCity} onChange={set('clientCity')}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Livraison ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><MapPin size={16} /> Livraison</h3>
        </div>
        <div className={`${styles.formRow} ${styles.formRow2}`}>
          <div>
            <label className={styles.label}>Quartier</label>
            <input className={styles.input} value={f.clientQuartier}
              onChange={set('clientQuartier')} list="op-quartiers" placeholder="Bastos" />
            {/* La liste sert de suggestion, pas de contrainte : un quartier
                absent de la table doit rester saisissable. */}
            <datalist id="op-quartiers">
              {quartiersOf(f.clientCity).map(q => <option key={q} value={q} />)}
            </datalist>
          </div>
          <div>
            <label className={styles.label}>Repère visuel</label>
            <input className={styles.input} value={f.destLandmark}
              onChange={set('destLandmark')} placeholder="En face de la pharmacie du Soleil" />
          </div>
        </div>

        <div className={styles.formRow}>
          <label className={styles.label}>Adresse complète</label>
          <input className={styles.input} value={f.clientAddress}
            onChange={set('clientAddress')} placeholder="Rue 1.234, immeuble Kamdem, 2e étage" />
        </div>

        <div className={`${styles.formRow} ${styles.formRow2}`}>
          <div>
            <label className={styles.label}>Latitude GPS (facultatif)</label>
            <input className={styles.input} value={f.destLat} onChange={set('destLat')}
              placeholder="3.886900" inputMode="decimal" />
          </div>
          <div>
            <label className={styles.label}>Longitude GPS (facultatif)</label>
            <input className={styles.input} value={f.destLng} onChange={set('destLng')}
              placeholder="11.508800" inputMode="decimal" />
          </div>
        </div>

        <p style={{ fontSize: '.75rem', color: 'var(--ad-text-2)', margin: '4px 0 0' }}>
          {geo.source === 'manual'   && '📍 Coordonnées GPS saisies — elles priment sur le quartier.'}
          {geo.source === 'quartier' && `📍 Quartier reconnu (${geo.matchedName}) · ${describePosition(geo, geo.cityRef)}`}
          {geo.source === 'city'     && `⚠️ Quartier non reconnu — le plan pointera le centre de ${geo.cityRef.label}. Ajoute les coordonnées GPS pour être précis.`}
        </p>
      </div>

      {/* ── Lignes ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Désignations</h3>
          <button type="button" className={styles.btnGhost}
            onClick={() => setItems(p => [...p, emptyLine()])}>
            <Plus size={14} /> Ligne
          </button>
        </div>

        {items.map((it, i) => (
          <div key={i} className={`${styles.formRow} ${styles.formRow3}`}
            style={{ alignItems: 'end', marginBottom: 10 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className={styles.label}>Désignation</label>
              <input className={styles.input} value={it.label}
                onChange={e => setItem(i, 'label', e.target.value)}
                placeholder="T-shirt Otaku Pulse — taille L" />
            </div>
            <div>
              <label className={styles.label}>Quantité</label>
              <input className={styles.input} type="number" min="0" value={it.qty}
                onChange={e => setItem(i, 'qty', e.target.value)} />
            </div>
            <div>
              <label className={styles.label}>Prix unitaire (F)</label>
              <input className={styles.input} type="number" min="0" value={it.unitPrice}
                onChange={e => setItem(i, 'unitPrice', e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, fontWeight: 800, whiteSpace: 'nowrap' }}>
                {fmt((Number(it.qty) || 0) * (Number(it.unitPrice) || 0))} F
              </div>
              {items.length > 1 && (
                <button type="button" className={styles.btnDanger}
                  onClick={() => setItems(p => p.filter((_, idx) => idx !== i))}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Montants ── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}><h3 className={styles.cardTitle}>Montants</h3></div>
        <div className={`${styles.formRow} ${styles.formRow3}`}>
          <div>
            <label className={styles.label}>Remise (F)</label>
            <input className={styles.input} type="number" min="0"
              value={f.discount} onChange={set('discount')} />
          </div>
          <div>
            <label className={styles.label}>Livraison (F)</label>
            <input className={styles.input} type="number" min="0"
              value={f.shipping} onChange={set('shipping')} />
          </div>
          <div>
            <label className={styles.label}>Taxe</label>
            <select className={styles.select} value={f.taxPreset} onChange={set('taxPreset')}>
              {presets.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div className={`${styles.formRow} ${styles.formRow2}`}>
          <div>
            <label className={styles.label}>Moyen de paiement prévu</label>
            <select className={styles.select} value={f.paymentMethod} onChange={set('paymentMethod')}>
              <option value="">— Non précisé —</option>
              {(cfg?.paymentMethods || []).map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={styles.label}>Échéance</label>
            <input className={styles.input} type="date" value={f.dueAt} onChange={set('dueAt')} />
          </div>
        </div>

        <div className={styles.formRow}>
          <label className={styles.label}>Note visible sur la facture</label>
          <textarea className={styles.textarea} value={f.notes} onChange={set('notes')}
            placeholder="Livraison sous 48 h. Merci de votre confiance !" />
        </div>

        <div style={{
          borderTop: '1px solid var(--ad-border)', paddingTop: 12, marginTop: 4,
          display: 'grid', gap: 4, fontSize: '.85rem',
        }}>
          <Row label="Sous-total" value={`${fmt(preview.subtotal)} F`} />
          {preview.disc > 0 && <Row label="Remise" value={`− ${fmt(preview.disc)} F`} />}
          {preview.ship > 0 && <Row label="Livraison" value={`${fmt(preview.ship)} F`} />}
          {preset.rate > 0 && (
            <Row label={`${preset.taxLabel}`} value={`${fmt(preview.tax)} F`} />
          )}
          <Row label={preset.rate > 0 ? 'Total TTC' : 'Total'}
            value={`${fmt(preview.total)} F`} strong />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button type="button" className={styles.btnGhost} onClick={onCancel}>Annuler</button>
        <button type="submit" className={styles.btnPrimary} disabled={loading}>
          {loading ? <Loader2 size={15} className={styles.spin} /> : <Check size={15} />}
          {' '}Créer la facture
        </button>
      </div>
    </form>
  )
}

function Row({ label, value, strong }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', gap: 12,
      fontWeight: strong ? 900 : 500,
      fontSize: strong ? '1.05rem' : undefined,
      color: strong ? 'var(--ad-accent)' : undefined,
    }}>
      <span style={{ opacity: strong ? 1 : .7 }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// DÉTAIL + ACTIONS
// ══════════════════════════════════════════════════════
function InvoiceDetail({ invoice, company, paymentMethods, onBack, onChanged }) {
  const toast = useToast()
  const { mutate: setStatus, loading } = useMutation(adminInvoicesApi.setStatus)
  const { mutate: archive } = useMutation(adminInvoicesApi.archive)
  const [payMethod, setPayMethod] = useState(invoice.paymentMethod || '')

  useEffect(() => { setPayMethod(invoice.paymentMethod || '') }, [invoice.id])

  const change = async (status) => {
    const { data, error } = await setStatus(invoice.id, status, payMethod || undefined)
    if (error) return toast.error(error)
    toast.success(data.message)
    onChanged(data.invoice)
  }

  const doArchive = async () => {
    if (!window.confirm(`Archiver la facture ${invoice.invoiceNumber} ? Elle disparaîtra des listes mais restera en base.`)) return
    const { data, error } = await archive(invoice.id)
    if (error) return toast.error(error)
    toast.success(data.message)
    onBack()
  }

  const meta = STATUS_META[invoice.status] || STATUS_META.draft

  return (
    <div className={styles.section}>
      {/* Cette barre d'actions est masquée à l'impression par la règle
          `visibility: hidden` d'InvoiceDocument.module.css : seule la feuille
          de facture reste visible sur le papier. */}
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>
            <FileText size={20} /> {invoice.invoiceNumber}
          </h2>
          <p className={styles.sectionDesc}>
            <span className={styles.badge} style={{ color: meta.color }}>{meta.label}</span>
            {' '}· {invoice.source === 'auto' ? 'Générée depuis une commande' : 'Saisie manuelle'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className={styles.btnGhost} onClick={onBack}><ArrowLeft size={15} /> Retour</button>
          <button className={styles.btnSecondary} onClick={() => window.print()}>
            <Printer size={15} /> Imprimer / PDF
          </button>
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: '1.2rem' }}>
        <div className={styles.cardHeader}><h3 className={styles.cardTitle}>Actions</h3></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {invoice.status === 'draft' && (
            <button className={styles.btnPrimary} disabled={loading} onClick={() => change('issued')}>
              <Send size={15} /> Émettre
            </button>
          )}
          {(invoice.status === 'draft' || invoice.status === 'issued') && (
            <>
              <select className={styles.select} style={{ width: 'auto', minWidth: 190 }}
                value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                <option value="">Moyen de paiement…</option>
                {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
              <button className={styles.btnPrimary} disabled={loading} onClick={() => change('paid')}>
                <Wallet size={15} /> Marquer réglée
              </button>
            </>
          )}
          {invoice.status !== 'cancelled' && (
            <button className={styles.btnDanger} disabled={loading} onClick={() => change('cancelled')}>
              <Ban size={15} /> Annuler
            </button>
          )}
          <button className={styles.btnDanger} onClick={doArchive}>
            <Trash2 size={15} /> Archiver
          </button>
        </div>
        {invoice.status !== 'draft' && (
          <p style={{ fontSize: '.75rem', color: 'var(--ad-text-2)', marginTop: 10, marginBottom: 0 }}>
            Cette facture est émise : son contenu est figé. Pour la corriger, annule-la et crée-en une nouvelle.
          </p>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <InvoiceDocument invoice={invoice} company={company} />
      </div>
    </div>
  )
}
