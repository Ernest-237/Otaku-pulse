// src/pages/Admin/sections/CoinsSection.jsx — Gestion des achats de coins
import { useState } from 'react'
import {
  Coins, Check, X, Search, Loader2, Clock, TrendingUp,
  DollarSign, Package, AlertCircle, Phone, Hash, Calendar,
  CheckCircle2, XCircle, Sparkles, User as UserIcon,
} from 'lucide-react'
import { useApi, useMutation } from '../../../hooks/useApi'
import { adminCoinsApi } from '../../../api'
import { useToast } from '../../../contexts/ToastContext'
import styles from '../Admin.module.css'

const PAYMENT_LABELS = {
  mtn_money:    { label: 'MTN Money', emoji: '📱', color: '#fbbf24' },
  orange_money: { label: 'Orange Money', emoji: '🟠', color: '#f97316' },
}

const STATUS_BADGE = {
  pending:   { label: 'En attente', color: '#f59e0b', icon: <Clock size={12} /> },
  approved:  { label: 'Validé',     color: '#22c55e', icon: <CheckCircle2 size={12} /> },
  rejected:  { label: 'Rejeté',     color: '#ef4444', icon: <XCircle size={12} /> },
  cancelled: { label: 'Annulé',     color: '#6b7280', icon: <X size={12} /> },
}

export default function CoinsSection() {
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [rejectModal, setRejectModal] = useState(null)
  const [adjustModal, setAdjustModal] = useState(false)

  // Dashboard stats
  const { data: dashData, refresh: refreshDash } = useApi(() => adminCoinsApi.getDashboard(), [])
  const stats = dashData?.stats || {}

  // Requests
  const { data: reqData, loading, refresh } = useApi(
    () => adminCoinsApi.getRequests({ status: statusFilter, search }),
    [statusFilter, search]
  )
  const requests = reqData?.requests || []

  const refreshAll = () => { refresh(); refreshDash() }

  return (
    <div className={styles.section}>
      {/* ── HEADER ── */}
      <div className={styles.sectionHead}>
        <div>
          <h2 className={styles.sectionTitle}>
            <Coins size={22} /> Coins & Paiements
          </h2>
          <p className={styles.sectionDesc}>
            Valide les demandes d'achat de coins après vérification du paiement Mobile Money
          </p>
        </div>
        <button className={styles.btnSecondary} onClick={() => setAdjustModal(true)}>
          <Sparkles size={15} /> Ajuster un solde
        </button>
      </div>

      {/* ── STATS ── */}
      <div className={styles.statsRow}>
        <StatCard
          icon={<Clock size={18} />}
          label="En attente"
          value={stats.pending ?? 0}
          color="#f59e0b"
          highlight={stats.pending > 0}
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Validées"
          value={stats.approved ?? 0}
          color="#22c55e"
        />
        <StatCard
          icon={<DollarSign size={18} />}
          label="Revenu total"
          value={`${(stats.totalRevenue ?? 0).toLocaleString('fr-FR')} F`}
          color="#3b82f6"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Ce mois"
          value={`${(stats.monthRevenue ?? 0).toLocaleString('fr-FR')} F`}
          color="#a78bfa"
        />
        <StatCard
          icon={<Coins size={18} />}
          label="Coins vendus"
          value={(stats.totalCoinsSold ?? 0).toLocaleString('fr-FR')}
          color="#eab308"
        />
      </div>

      {/* ── FILTRES ── */}
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {['pending','approved','rejected','all'].map(s => (
            <button
              key={s}
              className={`${styles.tab} ${statusFilter === s ? styles.tabActive : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'pending' ? '⏳ En attente'
                : s === 'approved' ? '✅ Validées'
                : s === 'rejected' ? '❌ Rejetées'
                : '📋 Toutes'}
              {s === 'pending' && stats.pending > 0 && (
                <span className={styles.tabBadge}>{stats.pending}</span>
              )}
            </button>
          ))}
        </div>
        <div className={styles.searchBox}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Rechercher par ID transaction..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── LISTE ── */}
      {loading ? (
        <div className={styles.loadingBox}><Loader2 size={28} className={styles.spin} /></div>
      ) : requests.length === 0 ? (
        <div className={styles.emptyBox}>
          <Coins size={40} />
          <p>Aucune demande {statusFilter !== 'all' ? STATUS_BADGE[statusFilter]?.label.toLowerCase() : ''}</p>
        </div>
      ) : (
        <div className={styles.coinReqList}>
          {requests.map(req => (
            <CoinRequestCard
              key={req.id}
              request={req}
              onApprove={refreshAll}
              onReject={() => setRejectModal(req)}
              toast={toast}
            />
          ))}
        </div>
      )}

      {/* ── MODAL REJET ── */}
      {rejectModal && (
        <RejectModal
          request={rejectModal}
          onClose={() => setRejectModal(null)}
          onDone={() => { setRejectModal(null); refreshAll() }}
          toast={toast}
        />
      )}

      {/* ── MODAL AJUSTEMENT ── */}
      {adjustModal && (
        <AdjustModal
          onClose={() => setAdjustModal(false)}
          onDone={() => { setAdjustModal(false); refreshAll() }}
          toast={toast}
        />
      )}
    </div>
  )
}

/* ══ STAT CARD ══ */
function StatCard({ icon, label, value, color, highlight }) {
  return (
    <div className={`${styles.statCard} ${highlight ? styles.statHighlight : ''}`} style={{ '--c': color }}>
      <div className={styles.statIcon} style={{ color }}>{icon}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

/* ══ REQUEST CARD ══ */
function CoinRequestCard({ request: req, onApprove, onReject, toast }) {
  const { mutate: approve, loading } = useMutation(() => adminCoinsApi.approve(req.id))
  const pay = PAYMENT_LABELS[req.paymentMethod] || {}
  const badge = STATUS_BADGE[req.status] || {}

  const handleApprove = async () => {
    const { data, error } = await approve()
    if (error) return toast.error(error)
    toast.success(data?.message || `${req.totalCoins} coins crédités !`)
    onApprove()
  }

  return (
    <div className={styles.coinReqCard}>
      {/* User + statut */}
      <div className={styles.coinReqHead}>
        <div className={styles.coinReqUser}>
          <div className={styles.coinReqAvatar}>
            <UserIcon size={16} />
          </div>
          <div>
            <div className={styles.coinReqName}>{req.user?.pseudo || 'Utilisateur'}</div>
            <div className={styles.coinReqEmail}>{req.user?.email}</div>
          </div>
        </div>
        <span className={styles.coinReqStatus} style={{ background: `${badge.color}20`, color: badge.color }}>
          {badge.icon} {badge.label}
        </span>
      </div>

      {/* Détails */}
      <div className={styles.coinReqGrid}>
        <div className={styles.coinReqField}>
          <span className={styles.coinReqLabel}><Package size={12} /> Pack</span>
          <span className={styles.coinReqValue}>
            {req.coinsAmount} {req.bonusCoins > 0 && <span className={styles.bonusTag}>+{req.bonusCoins}</span>}
            <Coins size={13} className={styles.coinIcon} />
          </span>
        </div>
        <div className={styles.coinReqField}>
          <span className={styles.coinReqLabel}><DollarSign size={12} /> Montant</span>
          <span className={styles.coinReqValue}>{req.priceXAF.toLocaleString('fr-FR')} FCFA</span>
        </div>
        <div className={styles.coinReqField}>
          <span className={styles.coinReqLabel}>{pay.emoji} Méthode</span>
          <span className={styles.coinReqValue} style={{ color: pay.color }}>{pay.label}</span>
        </div>
        <div className={styles.coinReqField}>
          <span className={styles.coinReqLabel}><Calendar size={12} /> Date</span>
          <span className={styles.coinReqValue}>
            {new Date(req.createdAt).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
          </span>
        </div>
      </div>

      {/* ID Transaction — À VÉRIFIER */}
      <div className={styles.coinReqTxId}>
        <Hash size={14} />
        <span className={styles.coinReqTxLabel}>ID Transaction :</span>
        <code className={styles.coinReqTxCode}>{req.transactionId}</code>
        {req.whatsappNumber && (
          <span className={styles.coinReqWa}>
            <Phone size={12} /> {req.whatsappNumber}
          </span>
        )}
      </div>

      {/* Notes admin si traité */}
      {req.adminNotes && (
        <div className={styles.coinReqNotes}>
          <AlertCircle size={13} /> {req.adminNotes}
        </div>
      )}

      {/* Actions (seulement si pending) */}
      {req.status === 'pending' && (
        <div className={styles.coinReqActions}>
          <button className={styles.coinReqReject} onClick={onReject} disabled={loading}>
            <X size={15} /> Rejeter
          </button>
          <button className={styles.coinReqApprove} onClick={handleApprove} disabled={loading}>
            {loading ? <Loader2 size={15} className={styles.spin} /> : <Check size={15} />}
            Valider & créditer {req.totalCoins} coins
          </button>
        </div>
      )}
    </div>
  )
}

/* ══ MODAL REJET ══ */
function RejectModal({ request, onClose, onDone, toast }) {
  const [notes, setNotes] = useState('')
  const { mutate, loading } = useMutation(() => adminCoinsApi.reject(request.id, { adminNotes: notes }))

  const submit = async () => {
    const { error } = await mutate()
    if (error) return toast.error(error)
    toast.success('Demande rejetée')
    onDone()
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h3>Rejeter la demande</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <p className={styles.modalText}>
          Motif du rejet (visible par l'utilisateur). Ex: "Paiement non reçu" ou "ID transaction invalide".
        </p>
        <textarea
          className={styles.modalTextarea}
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Motif du rejet..."
        />
        <div className={styles.modalActions}>
          <button className={styles.btnGhost} onClick={onClose}>Annuler</button>
          <button className={styles.btnDanger} onClick={submit} disabled={loading}>
            {loading ? <Loader2 size={15} className={styles.spin} /> : <X size={15} />}
            Confirmer le rejet
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══ MODAL AJUSTEMENT ══ */
function AdjustModal({ onClose, onDone, toast }) {
  const [userId, setUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const { mutate, loading } = useMutation(() => adminCoinsApi.adjust({
    userId: userId.trim(),
    amount: parseInt(amount),
    reason: reason.trim() || undefined,
  }))

  const submit = async () => {
    if (!userId.trim()) return toast.error('ID utilisateur requis')
    if (!amount || isNaN(parseInt(amount))) return toast.error('Montant invalide')
    const { data, error } = await mutate()
    if (error) return toast.error(error)
    toast.success(`Solde ajusté → ${data?.newBalance} coins`)
    onDone()
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h3><Sparkles size={18} /> Ajuster un solde</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <p className={styles.modalText}>
          Crédite ou débite manuellement des coins (cadeau, correction, remboursement).
          Utilise un montant négatif pour retirer des coins.
        </p>
        <div className={styles.modalField}>
          <label>ID Utilisateur *</label>
          <input
            type="text"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            placeholder="UUID de l'utilisateur"
            className={styles.modalInput}
          />
        </div>
        <div className={styles.modalField}>
          <label>Montant (coins) *</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Ex: 50 ou -20"
            className={styles.modalInput}
          />
        </div>
        <div className={styles.modalField}>
          <label>Raison (optionnel)</label>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ex: Cadeau de bienvenue"
            className={styles.modalInput}
          />
        </div>
        <div className={styles.modalActions}>
          <button className={styles.btnGhost} onClick={onClose}>Annuler</button>
          <button className={styles.btnPrimary} onClick={submit} disabled={loading}>
            {loading ? <Loader2 size={15} className={styles.spin} /> : <Check size={15} />}
            Appliquer
          </button>
        </div>
      </div>
    </div>
  )
}