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
  ShoppingBag, MapPin, Loader2, Clock, ArrowLeft, Send, Ban, Wallet,
} from 'lucide-react'
import { useApi, useMutation } from '../../../hooks/useApi'
import { adminInvoicesApi, adminApi } from '../../../api'
import { useToast } from '../../../contexts/ToastContext'
import InvoiceDocument from '../../../components/InvoiceDocument'
import { quartiersOf, locate, describePosition } from '../../../utils/cameroonGeo'
import styles from '../Admin.module.css'

const CITIES = ['Yaoundé', 'Douala', 'Bafoussam', 'Autre']

// Le statut « partial » n'est jamais posé à la main : il est déduit côté
// serveur du montant encaissé face au total (voir routes/adminInvoices.js).
const STATUS_META = {
  draft:     { label: 'Brouillon', cls: 'text-fg-muted' },
  issued:    { label: 'À régler',  cls: 'text-warn'     },
  partial:   { label: 'Partiel',   cls: 'text-info'     },
  paid:      { label: 'Réglée',    cls: 'text-brand'    },
  cancelled: { label: 'Annulée',   cls: 'text-danger'   },
}

const FILTERS = [
  { id: 'all',       label: 'Toutes'     },
  { id: 'draft',     label: 'Brouillons' },
  { id: 'issued',    label: 'À régler'   },
  { id: 'partial',   label: 'Partiels'   },
  { id: 'paid',      label: 'Réglées'    },
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
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[1.05rem] font-bold">
            <FileText size={19} className="text-brand" /> Facturation
          </h2>
          <p className="mt-1 mb-0 max-w-2xl text-[0.82rem] leading-relaxed text-fg-muted">
            Crée une facture à la main ou génère-la depuis une commande. Les encaissements
            se déclarent versement par versement — le statut suit automatiquement.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FromOrderButton cfg={cfg} onCreated={(inv) => { refreshAll(); setCurrent(inv); setView('detail') }} />
          <button className="adm-btn adm-btn-primary" onClick={() => setView('form')}>
            <Plus size={15} /> Nouvelle facture
          </button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={FileText}  label="Brouillons"       value={stats.counts?.draft ?? 0} tone="text-fg-muted" />
        <Stat icon={Clock}     label="Partiels"         value={stats.counts?.partial ?? 0} tone="text-info" />
        <Stat icon={Wallet}    label="Reste à encaisser" value={`${fmt(stats.outstanding)} F`} tone="text-warn" />
        <Stat icon={Check}     label="Encaissé ce mois"  value={`${fmt(stats.monthTotal)} F`} tone="text-brand" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={[
              'rounded-full border px-3.5 py-1.5 text-[0.8rem] font-semibold transition-colors',
              filter === f.id
                ? 'border-brand bg-brand/12 text-brand-hi'
                : 'border-line text-fg-muted hover:bg-ink-800 hover:text-fg',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
        <input
          className="adm-input ml-auto w-full sm:w-64"
          placeholder="N° facture, nom, téléphone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="adm-btn adm-btn-ghost" onClick={refreshAll} title="Rafraîchir">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="adm-card !p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-fg-muted">
            <Loader2 size={19} className="animate-spin" /> Chargement…
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-10 text-center text-[0.86rem] text-fg-faint">
            Aucune facture pour ce filtre.
          </div>
        ) : (
          // Le tableau défile dans son propre conteneur : sur téléphone, sans ça,
          // c'est toute la page qui part en défilement horizontal.
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>N°</th><th>Client</th><th>Destination</th>
                  <th>Date</th><th className="text-right">Montant</th>
                  <th>Encaissé</th><th>Statut</th><th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const meta = STATUS_META[inv.status] || STATUS_META.draft
                  const paid = Number(inv.amountPaid || 0)
                  const pct  = inv.total > 0 ? Math.round((paid / inv.total) * 100) : 0
                  return (
                    <tr key={inv.id}>
                      <td className="whitespace-nowrap font-mono text-[0.82rem]">{inv.invoiceNumber}</td>
                      <td>
                        <div className="font-semibold">{inv.clientName}</div>
                        {inv.clientPhone && (
                          <div className="text-[0.72rem] text-fg-faint">{inv.clientPhone}</div>
                        )}
                      </td>
                      <td className="text-[0.78rem]">
                        {inv.clientQuartier || '—'}
                        <div className="text-fg-faint">{inv.clientCity}</div>
                      </td>
                      <td className="whitespace-nowrap text-[0.78rem] text-fg-muted">
                        {fmtDate(inv.createdAt)}
                      </td>
                      <td className="whitespace-nowrap text-right font-bold">{fmt(inv.total)} F</td>
                      <td className="min-w-[92px]">
                        {/* Colonne d'encaissement : d'un coup d'œil, on voit
                            quelles factures ont un solde à aller chercher. */}
                        <div className="text-[0.76rem] font-semibold">
                          {paid > 0 ? `${fmt(paid)} F` : '—'}
                        </div>
                        {paid > 0 && paid < inv.total && (
                          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-ink-800">
                            <div className="h-full rounded-full bg-warn" style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`adm-chip ${meta.cls}`}>{meta.label}</span>
                      </td>
                      <td>
                        <button className="adm-btn adm-btn-ghost !px-3 !py-1" onClick={() => openDetail(inv.id)}>
                          Ouvrir
                        </button>
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
function Stat({ icon: Icon, label, value, tone = 'text-fg' }) {
  return (
    <div className="adm-card">
      <div className="mb-2 flex items-center gap-2">
        <Icon size={16} className={`shrink-0 ${tone}`} />
        <span className="text-[0.7rem] uppercase tracking-wider text-fg-faint">{label}</span>
      </div>
      <div className={`text-[1.4rem] font-extrabold leading-none ${tone}`}>{value}</div>
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
              onChange={set('clientPhone')} placeholder="+237 670 63 36 70" />
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
  const { mutate: setStatus,     loading: busyStatus } = useMutation(adminInvoicesApi.setStatus)
  const { mutate: addPayment,    loading: busyPay }    = useMutation(adminInvoicesApi.addPayment)
  const { mutate: removePayment }                      = useMutation(adminInvoicesApi.removePayment)
  const { mutate: archive }                            = useMutation(adminInvoicesApi.archive)

  const paid      = Number(invoice.amountPaid || 0)
  const remaining = Math.max(0, Number(invoice.total || 0) - paid)
  const history   = Array.isArray(invoice.payments) ? invoice.payments : []

  const [amount, setAmount]       = useState('')
  const [payMethod, setPayMethod] = useState(invoice.paymentMethod || '')
  const [note, setNote]           = useState('')

  useEffect(() => {
    setPayMethod(invoice.paymentMethod || '')
    setAmount('')
    setNote('')
  }, [invoice.id, invoice.amountPaid])

  // Libellés des moyens de paiement, dérivés de la configuration serveur
  // (`GET /api/admin/invoices/config`) plutôt que recopiés en dur : c'est le
  // backend qui fait autorité sur la liste des moyens acceptés.
  const methodLabels = Object.fromEntries((paymentMethods || []).map(m => [m.id, m.label]))

  const meta     = STATUS_META[invoice.status] || STATUS_META.draft
  const closed   = invoice.status === 'cancelled'
  const settled  = invoice.status === 'paid'
  const progress = invoice.total > 0 ? Math.min(100, Math.round((paid / invoice.total) * 100)) : 0

  const changeStatus = async (status) => {
    const { data, error } = await setStatus(invoice.id, status)
    if (error) return toast.error(error)
    toast.success(data.message)
    onChanged(data.invoice)
  }

  const record = async (value) => {
    const { data, error } = await addPayment(invoice.id, {
      amount: value,
      paymentMethod: payMethod || undefined,
      note: note || undefined,
    })
    if (error) return toast.error(error)
    toast.success(data.message)
    onChanged(data.invoice)
  }

  const cancelPayment = async (i) => {
    if (!window.confirm('Annuler ce versement ? Le statut de la facture sera recalculé.')) return
    const { data, error } = await removePayment(invoice.id, i)
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

  return (
    <div>
      {/* Cette barre est masquée à l'impression : seule la feuille de facture
          apparaît sur le papier (voir InvoiceDocument.module.css). */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[1.05rem] font-bold">
            <FileText size={19} className="text-brand" />
            <span className="font-mono">{invoice.invoiceNumber}</span>
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.8rem] text-fg-muted">
            <span className={`adm-chip ${meta.cls}`}>{meta.label}</span>
            <span>{invoice.source === 'auto' ? 'Générée depuis une commande' : 'Saisie manuelle'}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="adm-btn adm-btn-ghost" onClick={onBack}>
            <ArrowLeft size={15} /> Retour
          </button>
          <button className="adm-btn adm-btn-primary" onClick={() => window.print()}>
            <Printer size={15} /> Imprimer / PDF
          </button>
        </div>
      </div>

      {/* ── Encaissements ── */}
      <div className="adm-card mb-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[0.85rem] font-bold">Encaissement</span>
          <span className="text-[0.8rem] text-fg-muted">
            <strong className="text-fg">{fmt(paid)}</strong> / {fmt(invoice.total)} {invoice.currency}
          </span>
        </div>

        {/* Barre de progression : lire un pourcentage est plus rapide que
            comparer deux nombres à quatre chiffres. */}
        <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-ink-800">
          <div
            className={`h-full rounded-full transition-all ${settled ? 'bg-brand' : 'bg-warn'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mb-4 flex justify-between text-[0.74rem] text-fg-faint">
          <span>{progress}% encaissé</span>
          <span>{remaining > 0 ? `Reste ${fmt(remaining)} ${invoice.currency}` : 'Soldée'}</span>
        </div>

        {closed ? (
          <p className="m-0 text-[0.82rem] text-fg-muted">
            Facture annulée : aucun encaissement possible.
          </p>
        ) : settled ? (
          <p className="m-0 text-[0.82rem] text-brand">
            Intégralement réglée. Pour corriger une erreur, annule le versement concerné ci-dessous.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="adm-label">Montant reçu ({invoice.currency})</label>
                <input
                  className="adm-input" type="number" min="1" max={remaining}
                  value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder={String(remaining)}
                />
              </div>
              <div>
                <label className="adm-label">Moyen</label>
                <select className="adm-input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  <option value="">Non précisé</option>
                  {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="adm-label">Note (facultatif)</label>
                <input
                  className="adm-input" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Acompte, réf. transaction…"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="adm-btn adm-btn-primary"
                disabled={busyPay || !amount || Number(amount) <= 0}
                onClick={() => record(Number(amount))}
              >
                {busyPay ? <Loader2 size={15} className="animate-spin" /> : <Wallet size={15} />}
                Enregistrer l'acompte
              </button>
              <button
                className="adm-btn adm-btn-ghost"
                disabled={busyPay || remaining <= 0}
                onClick={() => record(remaining)}
              >
                <Check size={15} /> Solder ({fmt(remaining)} {invoice.currency})
              </button>
            </div>
          </>
        )}

        {history.length > 0 && (
          <div className="mt-4 border-t border-line pt-3">
            <div className="mb-2 text-[0.72rem] font-bold uppercase tracking-wider text-fg-faint">
              Versements ({history.length})
            </div>
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-line-soft py-2 last:border-b-0">
                <span className="w-24 shrink-0 font-semibold text-brand">
                  {fmt(h.amount)} {invoice.currency}
                </span>
                <span className="min-w-0 flex-1 truncate text-[0.78rem] text-fg-muted">
                  {methodLabels[h.method] || h.method || '—'}
                  {h.note ? ` · ${h.note}` : ''}
                </span>
                <span className="hidden shrink-0 text-[0.72rem] text-fg-faint sm:inline">
                  {new Date(h.at).toLocaleDateString('fr-FR')} · {h.by}
                </span>
                <button
                  className="adm-btn adm-btn-danger !px-2.5 !py-1"
                  onClick={() => cancelPayment(i)}
                  title="Annuler ce versement"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Cycle de vie du document ── */}
      <div className="adm-card mb-5">
        <div className="mb-3 text-[0.85rem] font-bold">Document</div>
        <div className="flex flex-wrap items-center gap-2">
          {invoice.status === 'draft' && (
            <button className="adm-btn adm-btn-primary" disabled={busyStatus} onClick={() => changeStatus('issued')}>
              <Send size={15} /> Émettre
            </button>
          )}
          {!closed && (
            <button className="adm-btn adm-btn-danger" disabled={busyStatus} onClick={() => changeStatus('cancelled')}>
              <Ban size={15} /> Annuler la facture
            </button>
          )}
          <button className="adm-btn adm-btn-ghost" onClick={doArchive}>
            <Trash2 size={15} /> Archiver
          </button>
        </div>
        {invoice.status !== 'draft' && (
          <p className="mb-0 mt-3 text-[0.78rem] text-fg-faint">
            Cette facture est émise : ses lignes et ses montants sont figés. Pour les corriger,
            annule-la et crée-en une nouvelle.
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <InvoiceDocument invoice={invoice} company={company} />
      </div>
    </div>
  )
}
