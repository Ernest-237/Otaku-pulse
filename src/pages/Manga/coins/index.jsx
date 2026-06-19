// src/pages/Manga/coins/index.jsx — Achat de coins
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Coins, ChevronLeft, Sparkles, Check, Loader2, X, Crown,
  Wallet, History, TrendingUp, TrendingDown, Gift, Copy,
  Smartphone, ArrowRight, Zap,
} from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import { useAuth } from '../../../contexts/AuthContext'
import { useApi, useMutation } from '../../../hooks/useApi'
import { coinsApi } from '../../../api'
import { useToast } from '../../../contexts/ToastContext'
import Navbar from '../../../components/Navbar'
import Footer from '../../Home/sections/Footer'
import Modal from '../../../components/ui/Modal'
import { PageLoader } from '../../../components/ui/Spinner'
import styles from './Coins.module.css'

const PACK_STYLES = {
  starter:  { color: '#22c55e', glow: 'rgba(34,197,94,0.3)',  icon: '🪙', popular: false },
  standard: { color: '#3b82f6', glow: 'rgba(59,130,246,0.3)', icon: '💰', popular: true  },
  premium:  { color: '#a78bfa', glow: 'rgba(167,139,250,0.3)',icon: '💎', popular: false },
  mega:     { color: '#f59e0b', glow: 'rgba(245,158,11,0.3)', icon: '👑', popular: false },
}

const TX_META = {
  purchase:     { icon: <TrendingUp size={14} />,   color: '#22c55e', label: 'Achat' },
  unlock:       { icon: <TrendingDown size={14} />, color: '#ef4444', label: 'Déblocage' },
  bonus:        { icon: <Gift size={14} />,         color: '#a78bfa', label: 'Bonus' },
  refund:       { icon: <TrendingUp size={14} />,   color: '#3b82f6', label: 'Remboursement' },
  admin_adjust: { icon: <Sparkles size={14} />,     color: '#f59e0b', label: 'Ajustement' },
  earning:      { icon: <Coins size={14} />,        color: '#22c55e', label: 'Revenu' },
}

export default function CoinsPage() {
  const { lang } = useLang()
  const { isLoggedIn } = useAuth()
  const toast = useToast()
  const [purchaseModal, setPurchaseModal] = useState(null) // pack sélectionné

  useEffect(() => { document.title = '🪙 Coins — Otaku Pulse' }, [])

  // Packs (public)
  const { data: packsData, loading: packsLoading } = useApi(() => coinsApi.getPacks(), [])
  const packs = packsData?.packs || []
  const paymentNumbers = packsData?.paymentNumbers || {}
  const chapterCost = packsData?.chapterCost || 5

  // Wallet (si connecté)
  const { data: walletData, loading: walletLoading, refresh: refreshWallet } = useApi(
    () => isLoggedIn ? coinsApi.getWallet() : Promise.resolve({ wallet: null }),
    [isLoggedIn],
    isLoggedIn
  )
  const wallet = walletData?.wallet

  // Transactions (si connecté)
  const { data: txData, refresh: refreshTx } = useApi(
    () => isLoggedIn ? coinsApi.getTransactions({ limit: 30 }) : Promise.resolve({ transactions: [] }),
    [isLoggedIn],
    isLoggedIn
  )
  const transactions = txData?.transactions || []

  if (packsLoading) return <><Navbar /><PageLoader /><Footer /></>

  return (
    <div className={styles.page}>
      <Navbar />

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className="container">
          <Link to="/manga" className={styles.backLink}>
            <ChevronLeft size={14} /> Retour au catalogue
          </Link>

          <div className={styles.heroInner}>
            <div className={styles.heroLeft}>
              <span className={styles.heroBadge}>
                <Coins size={12} /> MONNAIE OTAKU
              </span>
              <h1 className={styles.heroTitle}>
                Recharge tes <span className={styles.heroAccent}>Coins</span>
              </h1>
              <p className={styles.heroSub}>
                Débloque tes chapitres premium ({chapterCost} coins/chapitre) et soutiens tes auteurs préférés.
              </p>
            </div>

            {/* Wallet card */}
            {isLoggedIn && (
              <div className={styles.walletCard}>
                <div className={styles.walletGlow} />
                <div className={styles.walletIcon}><Wallet size={20} /></div>
                <div className={styles.walletLabel}>Mon solde</div>
                <div className={styles.walletBalance}>
                  <Coins size={24} className={styles.walletBalanceIcon} />
                  {walletLoading ? '...' : (wallet?.balance ?? 0)}
                </div>
                <div className={styles.walletStats}>
                  <span>🛒 {wallet?.totalPurchased ?? 0} achetés</span>
                  <span>📖 {wallet?.totalSpent ?? 0} dépensés</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── PACKS ── */}
      <section className={styles.packsSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Choisis ton pack</h2>
          <p className={styles.sectionSub}>Plus tu prends, plus tu gagnes de bonus 🎁</p>

          <div className={styles.packsGrid}>
            {packs.map(pack => {
              const st = PACK_STYLES[pack.id] || PACK_STYLES.starter
              return (
                <div
                  key={pack.id}
                  className={`${styles.packCard} ${st.popular ? styles.packPopular : ''}`}
                  style={{ '--pack-color': st.color, '--pack-glow': st.glow }}
                >
                  {st.popular && <div className={styles.popularBadge}><Zap size={11} /> POPULAIRE</div>}

                  <div className={styles.packIcon}>{st.icon}</div>

                  <div className={styles.packCoins}>
                    <Coins size={20} className={styles.packCoinsIcon} />
                    <span className={styles.packCoinsNum}>{pack.coins}</span>
                  </div>

                  {pack.bonus > 0 && (
                    <div className={styles.packBonus}>
                      <Gift size={12} /> +{pack.bonus} bonus
                    </div>
                  )}

                  <div className={styles.packTotal}>
                    = {pack.coins + pack.bonus} coins au total
                  </div>

                  <div className={styles.packPrice}>
                    {pack.priceXAF.toLocaleString('fr-FR')} <span>FCFA</span>
                  </div>

                  <button
                    className={styles.packBtn}
                    onClick={() => {
                      if (!isLoggedIn) {
                        sessionStorage.setItem('openLogin', '1')
                        toast.error('Connecte-toi pour acheter des coins')
                        return
                      }
                      setPurchaseModal(pack)
                    }}
                  >
                    <Sparkles size={14} /> Acheter
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HISTORIQUE ── */}
      {isLoggedIn && transactions.length > 0 && (
        <section className={styles.historySection}>
          <div className="container">
            <h2 className={styles.sectionTitle}><History size={20} /> Historique</h2>
            <div className={styles.txList}>
              {transactions.map(tx => {
                const meta = TX_META[tx.type] || TX_META.purchase
                const isCredit = tx.amount > 0
                return (
                  <div key={tx.id} className={styles.txItem}>
                    <div className={styles.txIcon} style={{ color: meta.color, background: `${meta.color}15` }}>
                      {meta.icon}
                    </div>
                    <div className={styles.txInfo}>
                      <div className={styles.txDesc}>{tx.description || meta.label}</div>
                      <div className={styles.txDate}>
                        {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className={styles.txAmount} style={{ color: isCredit ? '#22c55e' : '#ef4444' }}>
                      {isCredit ? '+' : ''}{tx.amount}
                      <Coins size={12} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── MODAL ACHAT ── */}
      {purchaseModal && (
        <PurchaseModal
          pack={purchaseModal}
          paymentNumbers={paymentNumbers}
          onClose={() => setPurchaseModal(null)}
          onSuccess={() => {
            setPurchaseModal(null)
            refreshWallet()
            refreshTx()
          }}
          toast={toast}
        />
      )}

      <Footer />
    </div>
  )
}

/* ══ MODAL ACHAT ══════════════════════════════════════ */
function PurchaseModal({ pack, paymentNumbers, onClose, onSuccess, toast }) {
  const [step, setStep] = useState(1)  // 1 = choix méthode, 2 = paiement + ID
  const [method, setMethod] = useState('mtn_money')
  const [transactionId, setTransactionId] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const { mutate, loading } = useMutation((data) => coinsApi.purchase(data))

  const payInfo = paymentNumbers[method] || {}
  const totalCoins = pack.coins + pack.bonus

  const copyNumber = () => {
    navigator.clipboard.writeText((payInfo.number || '').replace(/\s/g, ''))
    toast.success('Numéro copié !')
  }

  const submit = async () => {
    if (!transactionId.trim() || transactionId.trim().length < 3) {
      return toast.error('Entre un ID de transaction valide')
    }
    const { data, error } = await mutate({
      packId: pack.id,
      paymentMethod: method,
      transactionId: transactionId.trim(),
      whatsappNumber: whatsapp.trim() || undefined,
    })
    if (error) return toast.error(error)
    toast.success(data?.message || '🎉 Demande envoyée ! Tes coins arrivent après validation.')
    onSuccess()
  }

  return (
    <Modal isOpen onClose={onClose} title={`Acheter ${totalCoins} coins`}
      footer={
        step === 1 ? (
          <>
            <button onClick={onClose} className={styles.modalBtnGhost}>Annuler</button>
            <button onClick={() => setStep(2)} className={styles.modalBtnPrimary}>
              Continuer <ArrowRight size={14} />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setStep(1)} className={styles.modalBtnGhost}>
              <ChevronLeft size={14} /> Retour
            </button>
            <button onClick={submit} disabled={loading} className={styles.modalBtnPrimary}>
              {loading ? <Loader2 size={14} className={styles.spin} /> : <Check size={14} />}
              {loading ? 'Envoi...' : 'J\'ai payé'}
            </button>
          </>
        )
      }>

      {/* Récap pack */}
      <div className={styles.modalRecap}>
        <div className={styles.modalRecapCoins}>
          <Coins size={18} /> {pack.coins}
          {pack.bonus > 0 && <span className={styles.modalRecapBonus}>+{pack.bonus} bonus</span>}
        </div>
        <div className={styles.modalRecapPrice}>{pack.priceXAF.toLocaleString('fr-FR')} FCFA</div>
      </div>

      {step === 1 && (
        <div className={styles.modalStep}>
          <label className={styles.modalLabel}>Choisis ta méthode de paiement</label>
          <div className={styles.methodGrid}>
            <button
              className={`${styles.methodBtn} ${method === 'mtn_money' ? styles.methodActive : ''}`}
              onClick={() => setMethod('mtn_money')}
            >
              <span className={styles.methodEmoji}>📱</span>
              <span className={styles.methodName}>MTN Mobile Money</span>
              {method === 'mtn_money' && <Check size={16} className={styles.methodCheck} />}
            </button>
            <button
              className={`${styles.methodBtn} ${method === 'orange_money' ? styles.methodActive : ''}`}
              onClick={() => setMethod('orange_money')}
            >
              <span className={styles.methodEmoji}>🟠</span>
              <span className={styles.methodName}>Orange Money</span>
              {method === 'orange_money' && <Check size={16} className={styles.methodCheck} />}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={styles.modalStep}>
          {/* Instructions paiement */}
          <div className={styles.payBox}>
            <div className={styles.payBoxHead}>
              <Smartphone size={16} /> {payInfo.label}
            </div>
            <p className={styles.payBoxText}>
              Envoie <strong>{pack.priceXAF.toLocaleString('fr-FR')} FCFA</strong> au numéro :
            </p>
            <div className={styles.payNumber}>
              <span>{payInfo.number}</span>
              <button onClick={copyNumber} className={styles.payCopy} title="Copier">
                <Copy size={15} />
              </button>
            </div>
            <p className={styles.payNote}>
              💡 Après le paiement, tu recevras un SMS avec l'ID de transaction. Entre-le ci-dessous.
            </p>
          </div>

          {/* ID transaction */}
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>ID de transaction *</label>
            <input
              type="text"
              value={transactionId}
              onChange={e => setTransactionId(e.target.value)}
              placeholder="Ex: MP240608.1234.A56789"
              className={styles.modalInput}
            />
          </div>

          {/* WhatsApp optionnel */}
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Ton numéro WhatsApp (optionnel)</label>
            <input
              type="text"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="Ex: 6XX XX XX XX"
              className={styles.modalInput}
            />
            <span className={styles.modalHint}>Pour qu'on te contacte si besoin</span>
          </div>

          <div className={styles.modalInfo}>
            <Crown size={14} />
            <span>Tes coins seront crédités après vérification (généralement sous quelques heures).</span>
          </div>
        </div>
      )}
    </Modal>
  )
}