import OtakuMark from '../../../components/ui/OtakuMark'
// src/pages/Manga/reader/ChapterUnlockGate.jsx
// Overlay de déblocage d'un chapitre premium par coins
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Coins, Loader2, Check, Sparkles, ShoppingCart, AlertCircle } from 'lucide-react'
import { coinsApi } from '../../../api'
import styles from './UnlockGate.module.css'

export default function ChapterUnlockGate({
  chapter,          // l'objet chapitre { id, chapterNumber, coinCost, title }
  walletBalance,    // solde actuel de coins du user
  onUnlocked,       // callback(newBalance) appelé après déblocage réussi
  toast,
  mangaTitle,
}) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const cost = chapter?.coinCost || 5
  const enough = walletBalance >= cost

  const handleUnlock = async () => {
    if (loading) return
    if (!enough) {
      navigate('/manga/coins')
      return
    }
    setLoading(true)
    try {
      const data = await coinsApi.unlockChapter(chapter.id)
      if (data?.alreadyUnlocked) {
        toast.success('Chapitre déjà débloqué')
        await onUnlocked(walletBalance)
        return
      }
      toast.success(data?.message || `Chapitre débloqué ! (-${cost} coins)`)
      await onUnlocked(data?.newBalance ?? walletBalance)
    } catch (err) {
      toast.error(err.message || 'Erreur lors du déblocage')
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.gate}>
      <div className={styles.gateGlow} />

      <div className={styles.gateInner}>
        <div className={styles.lockIcon}>
          <Lock size={32} />
        </div>

        <span className={styles.premiumBadge}>
          <OtakuMark size={12} /> CHAPITRE PREMIUM
        </span>

        <h2 className={styles.gateTitle}>
          Chapitre {Number(chapter?.chapterNumber)}
          {chapter?.title ? ` — ${chapter.title}` : ''}
        </h2>

        <p className={styles.gateSub}>
          Débloque ce chapitre pour continuer ta lecture de{' '}
          <strong>{mangaTitle}</strong>. Une fois débloqué, l'accès est{' '}
          <strong>conservé dans ton compte tant que le chapitre reste disponible</strong>.
        </p>

        {/* Coût */}
        <div className={styles.costBox}>
          <div className={styles.costItem}>
            <span className={styles.costLabel}>Coût</span>
            <span className={styles.costValue}>
              <Coins size={18} /> {cost}
            </span>
          </div>
          <div className={styles.costDivider} />
          <div className={styles.costItem}>
            <span className={styles.costLabel}>Ton solde</span>
            <span className={styles.costValue} style={{ color: enough ? '#33ff33' : '#ef4444' }}>
              <Coins size={18} /> {walletBalance}
            </span>
          </div>
        </div>

        {/* Alerte solde insuffisant */}
        {!enough && (
          <div className={styles.insufficientAlert}>
            <AlertCircle size={15} />
            Il te manque <strong>{cost - walletBalance} coins</strong> pour débloquer ce chapitre.
          </div>
        )}

        {/* Bouton principal */}
        <button
          className={`${styles.unlockBtn} ${!enough ? styles.buyBtn : ''}`}
          onClick={handleUnlock}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 size={16} className={styles.spin} /> Déblocage...</>
          ) : enough ? (
            <><Check size={16} /> Débloquer ({cost} coins)</>
          ) : (
            <><ShoppingCart size={16} /> Acheter des coins</>
          )}
        </button>

        <button
          className={styles.cancelBtn}
          onClick={() => navigate(-1)}
          disabled={loading}
        >
          Retour
        </button>
      </div>
    </div>
  )
}
