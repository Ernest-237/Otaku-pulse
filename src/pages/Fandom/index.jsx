import OtakuMark from '../../components/ui/OtakuMark'
import MediaImage from '../../components/ui/MediaImage'
// src/pages/Fandom/index.jsx — FANDOM (titraille/activités admin-gérées)
// 3 onglets : Cosplay (upload + votes), Quizz, Classements
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Trophy, Heart, Camera, Brain, Gamepad2, Crown, Medal,
  Upload, X, Loader2, Sparkles, Award, ChevronRight, Star,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useLang } from '../../contexts/LangContext'
import { fandomApi, API_BASE , resolveMediaUrl } from '../../api'
import Navbar from '../../components/Navbar'
import Footer from '../Home/sections/Footer'
import Modal from '../../components/ui/Modal'
import AnimeCarousel from '../../components/AnimeCarousel'
import styles from './Fandom.module.css'
import QuizExperience from './QuizExperience'

async function fileToBase64Safe(file) {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof Blob)) return reject(new Error('Fichier invalide'))
    const reader = new FileReader()
    reader.onload = () => {
      const r = reader.result
      const comma = r.indexOf(',')
      if (comma === -1) return reject(new Error('Format non reconnu'))
      resolve({ data: r.substring(comma + 1), mime: file.type || 'image/jpeg' })
    }
    reader.onerror = () => reject(new Error('Erreur lecture'))
    reader.readAsDataURL(file)
  })
}

export default function FandomPage() {
  const { isLoggedIn, user } = useAuth()
  const { lang } = useLang()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const tab = ['cosplay', 'quiz', 'ranking'].includes(params.get('tab')) ? params.get('tab') : 'quiz'
  const setTab = value => setParams({ tab: value }, { replace: true })
  const [config, setConfig] = useState(null)
  const [activities, setActivities] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const [c, a] = await Promise.all([fandomApi.getConfig(), fandomApi.getActivities()])
        setConfig(c.config)
        setActivities(a.activities || [])
      } catch (_) {}
    })()
  }, [])

  const badge = lang === 'en' ? config?.badgeE : config?.badgeF
  const title = lang === 'en' ? config?.titleE : config?.titleF

  useEffect(() => {
    document.title = `🎮 Fandom — ${title || 'Otaku Pulse'}`
  }, [title])

  return (
    <div className={styles.page}>
      <Navbar />

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className="container">
          <span className={styles.heroBadge}><OtakuMark size={12} /> {badge || 'ESPACE FANDOM'}</span>
          <h1 className={styles.heroTitle}>{title || 'FANDOM ARENA'}</h1>
          <p className={styles.heroSub}>
            Montre ton cosplay, teste tes connaissances otaku, grimpe au classement.
            {!isLoggedIn && ' Connecte-toi pour participer !'}
          </p>
          <div className={styles.heroCarousel}>
            <AnimeCarousel variant="dark" label={lang === 'fr' ? "ANIMÉS À L'AFFICHE" : 'FEATURED ANIME'} />
          </div>
        </div>
      </section>

      {/* ACTIVITÉS (gérées depuis l'admin) */}
      {activities.length > 0 && (
        <div className="container">
          <div className={styles.activitiesGrid}>
            {activities.map(a => {
              const aTitle = lang === 'en' ? (a.titleE || a.titleF) : a.titleF
              const aDesc  = lang === 'en' ? (a.descE || a.descF) : a.descF
              const onClick = a.linkTab && a.linkTab !== 'custom'
                ? () => setTab(a.linkTab === 'classement' ? 'ranking' : a.linkTab === 'quizz' ? 'quiz' : a.linkTab)
                : a.externalUrl ? () => window.open(a.externalUrl, '_blank') : undefined
              return (
                <button key={a.id} className={styles.activityCard} onClick={onClick} disabled={!onClick}>
                  {a.imageUrl
                    ? <MediaImage src={resolveMediaUrl(a.imageUrl)} alt={aTitle} className={styles.activityImg} />
                    : <span className={styles.activityIcon}>{a.icon}</span>}
                  <div className={styles.activityBody}>
                    {a.source === 'auto' && <span className={styles.botLabel}>{lang === 'fr' ? 'LE RENDEZ-VOUS DE LA SEMAINE' : 'THIS WEEK’S CHALLENGE'}</span>}
                    <h3>{aTitle}</h3>
                    {aDesc && <p>{aDesc}</p>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* TABS */}
      <div className={styles.tabsBar}>
        <div className="container">
          <div className={styles.tabsInner}>
            <button className={`${styles.tabBtn} ${tab === 'cosplay' ? styles.tabActive : ''}`}
              onClick={() => setTab('cosplay')}><Camera size={16} /> Cosplay</button>
            <button className={`${styles.tabBtn} ${tab === 'quiz' ? styles.tabActive : ''}`}
              onClick={() => setTab('quiz')}><Brain size={16} /> Quizz</button>
            <button className={`${styles.tabBtn} ${tab === 'ranking' ? styles.tabActive : ''}`}
              onClick={() => setTab('ranking')}><Trophy size={16} /> Classements</button>
          </div>
        </div>
      </div>

      <div className="container">
        {tab === 'cosplay' && <CosplayTab isLoggedIn={isLoggedIn} user={user} toast={toast} />}
        {tab === 'quiz'    && <QuizExperience isLoggedIn={isLoggedIn} toast={toast} />}
        {tab === 'ranking' && <RankingTab />}
      </div>

      <Footer />
    </div>
  )
}

/* ══ ONGLET COSPLAY ══ */
function CosplayTab({ isLoggedIn, user, toast }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    try { const d = await fandomApi.getCosplays(); setEntries(d.entries || []) }
    catch (e) { toast.error('Erreur chargement cosplays') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const vote = async (id) => {
    if (!isLoggedIn) { toast.error('Connecte-toi pour voter'); return }
    try {
      const r = await fandomApi.voteCosplay(id)
      toast.success(r.message)
      setEntries(prev => prev.map(e => e.id === id
        ? { ...e, hasVoted: r.voted, voteCount: e.voteCount + (r.voted ? 1 : -1) }
        : e))
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHead}>
        <h2 className={styles.tabTitle}>🎭 Concours Cosplay</h2>
        {isLoggedIn && (
          <button className={styles.ctaBtn} onClick={() => setModalOpen(true)}>
            <Upload size={15} /> Soumettre mon cosplay
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.loader}><Loader2 className={styles.spin} size={28} /></div>
      ) : entries.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎭</div>
          <p>Aucun cosplay pour le moment. Sois le premier !</p>
        </div>
      ) : (
        <div className={styles.cosplayGrid}>
          {entries.map((e, i) => (
            <div key={e.id} className={styles.cosplayCard}>
              {i < 3 && <span className={styles.rankBadge}>{['🥇','🥈','🥉'][i]}</span>}
              <div className={styles.cosplayImg}>
                <MediaImage src={resolveMediaUrl(e.imageUrl)} alt={e.characterName} loading="lazy" />
              </div>
              <div className={styles.cosplayBody}>
                <h3 className={styles.cosplayChar}>{e.characterName}</h3>
                {e.animeName && <p className={styles.cosplayAnime}>{e.animeName}</p>}
                <p className={styles.cosplayUser}>par {e.pseudo}</p>
                <button
                  className={`${styles.voteBtn} ${e.hasVoted ? styles.voteBtnActive : ''}`}
                  onClick={() => vote(e.id)}>
                  <Heart size={15} fill={e.hasVoted ? 'currentColor' : 'none'} />
                  {e.voteCount} {e.voteCount > 1 ? 'votes' : 'vote'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <CosplaySubmitModal onClose={() => setModalOpen(false)}
          onSuccess={() => { setModalOpen(false); load(); toast.success('🎉 Cosplay soumis !') }}
          toast={toast} />
      )}
    </div>
  )
}

function CosplaySubmitModal({ onClose, onSuccess, toast }) {
  const [form, setForm] = useState({ characterName: '', animeName: '', description: '', file: null })
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const pickFile = (file) => {
    if (!file || !file.type.startsWith('image/')) { toast.error('Image uniquement'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image trop lourde (max 5MB)'); return }
    s('file', file)
    setPreview(URL.createObjectURL(file))
  }

  const submit = async () => {
    if (!form.characterName.trim()) return toast.error('Nom du personnage requis')
    if (!form.file) return toast.error('Ajoute une photo')
    setLoading(true)
    try {
      const { data, mime } = await fileToBase64Safe(form.file)
      await fandomApi.submitCosplay({
        characterName: form.characterName.trim(),
        animeName: form.animeName.trim(),
        description: form.description.trim(),
        imageData: data, imageMime: mime,
      })
      onSuccess()
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal isOpen dark title="🎭 Soumettre mon cosplay" onClose={onClose}
      footer={
        <>
          <button className={styles.modalGhost} onClick={onClose}>Annuler</button>
          <button className={styles.modalPrimary} onClick={submit} disabled={loading}>
            {loading ? <Loader2 size={14} className={styles.spin} /> : <Upload size={14} />} Soumettre
          </button>
        </>
      }>
      <div className={styles.field}>
        <label>Photo du cosplay *</label>
        <div className={styles.dropZone} onClick={() => document.getElementById('cosFile').click()}>
          {preview ? <MediaImage src={preview} alt="preview" className={styles.dropPreview} />
            : <div className={styles.dropPlaceholder}><Camera size={28} /><span>Cliquer pour choisir</span></div>}
          <input id="cosFile" type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => pickFile(e.target.files?.[0])} />
        </div>
      </div>
      <div className={styles.field}>
        <label>Personnage incarné *</label>
        <input value={form.characterName} onChange={e => s('characterName', e.target.value)}
          placeholder="Ex: Naruto Uzumaki" maxLength={120} />
      </div>
      <div className={styles.field}>
        <label>Anime / Manga</label>
        <input value={form.animeName} onChange={e => s('animeName', e.target.value)}
          placeholder="Ex: Naruto Shippuden" maxLength={120} />
      </div>
      <div className={styles.field}>
        <label>Description (optionnel)</label>
        <textarea value={form.description} onChange={e => s('description', e.target.value)}
          rows={2} placeholder="Quelques mots sur ton cosplay..." />
      </div>
    </Modal>
  )
}

/* ══ ONGLET CLASSEMENTS ══ */
function RankingTab() {
  const [cosplay, setCosplay] = useState([])
  const [quiz, setQuiz] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [c, q] = await Promise.all([
          fandomApi.cosplayLeaderboard(),
          fandomApi.quizLeaderboard(),
        ])
        setCosplay(c.leaderboard || [])
        setQuiz(q.leaderboard || [])
      } catch (_) {}
      finally { setLoading(false) }
    })()
  }, [])

  if (loading) return <div className={styles.loader}><Loader2 className={styles.spin} size={28} /></div>

  return (
    <div className={styles.tabContent}>
      <div className={styles.rankGrid}>
        {/* Cosplay ranking */}
        <div className={styles.rankCol}>
          <h3 className={styles.rankTitle}><Camera size={18} /> Top Cosplay</h3>
          {cosplay.length === 0 ? <p className={styles.rankEmpty}>Aucun cosplay encore</p> : (
            <div className={styles.rankList}>
              {cosplay.map((e, i) => (
                <div key={e.id} className={styles.rankItem}>
                  <span className={styles.rankPos}>{['🥇','🥈','🥉'][i] || `#${i+1}`}</span>
                  <MediaImage src={resolveMediaUrl(e.imageUrl)} alt="" className={styles.rankThumb} />
                  <div className={styles.rankInfo}>
                    <div className={styles.rankName}>{e.characterName}</div>
                    <div className={styles.rankMeta}>par {e.pseudo}</div>
                  </div>
                  <span className={styles.rankScore}><Heart size={12} fill="currentColor" /> {e.voteCount}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quiz ranking */}
        <div className={styles.rankCol}>
          <h3 className={styles.rankTitle}><Brain size={18} /> Top Quizz</h3>
          {quiz.length === 0 ? <p className={styles.rankEmpty}>Aucun score encore</p> : (
            <div className={styles.rankList}>
              {quiz.map((q, i) => (
                <div key={q.id} className={styles.rankItem}>
                  <span className={styles.rankPos}>{['🥇','🥈','🥉'][i] || `#${i+1}`}</span>
                  <span className={styles.rankAvatar}>{q.user?.avatar || '🎌'}</span>
                  <div className={styles.rankInfo}>
                    <div className={styles.rankName}>{q.user?.pseudo || q.pseudo}</div>
                    <div className={styles.rankMeta}>{q.totalGames} parties</div>
                  </div>
                  <span className={styles.rankScore}><Star size={12} fill="currentColor" /> {q.bestScore}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
