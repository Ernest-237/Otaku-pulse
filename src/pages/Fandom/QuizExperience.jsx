import { useRef, useState } from 'react'
import { Brain, ArrowRight, Check, RotateCcw, Loader2 } from 'lucide-react'
import { fandomApi } from '../../api'
import styles from './Fandom.module.css'

export default function QuizExperience({ isLoggedIn, toast }) {
  const [phase, setPhase] = useState('idle')
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [selected, setSelected] = useState(null)
  const [category, setCategory] = useState('all')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const heading = useRef(null)
  const q = questions[answers.length]
  const start = async () => {
    if (!isLoggedIn)
      return toast.error(
        'Connecte-toi depuis le menu pour participer et enregistrer ton score.'
      )
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      const data = await fandomApi.getQuizQuestions({ limit: 10, category })
      if (!data?.questions?.length)
        throw new Error('Ce quiz se prépare encore. Essaie le mode découverte.')
      setQuestions(data.questions)
      setAnswers([])
      setSelected(null)
      setResult(null)
      setPhase('playing')
    } catch (e) {
      setError(e.message)
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  const finish = async (finalAnswers) => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      const data = await fandomApi.submitQuiz(finalAnswers)
      if (!data) throw new Error('Reconnecte-toi pour enregistrer ton score.')
      setResult(data)
      setPhase('done')
    } catch (e) {
      setError(e.message)
      setPhase('retry')
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  const next = () => {
    if (selected === null || busy || !q) return
    const nextAnswers = [
      ...answers,
      { questionId: q.id, answerIndex: selected },
    ]
    setAnswers(nextAnswers)
    setSelected(null)
    if (nextAnswers.length === questions.length) {
      setPhase('submitting')
      finish(nextAnswers)
    } else requestAnimationFrame(() => heading.current?.focus())
  }
  return (
    <div className={styles.tabContent}>
      {phase === 'idle' && (
        <div className={styles.quizIntro}>
          <span className={styles.quizEyebrow}>LE DOJO DES CURIEUX</span>
          <div className={styles.quizIntroIcon}>
            <Brain size={38} />
          </div>
          <h2>Quel otaku sommeille en toi ?</h2>
          <p>
            Jusqu’à 10 questions, à ton rythme. Choisis ta réponse, confirme-la
            et découvre ton résultat à la fin.
          </p>
          <div className={styles.quizModes}>
            {[
              { key: 'all', label: 'Découverte', text: 'Tous les univers' },
              {
                key: 'saison',
                label: 'Quiz de saison',
                text: 'Les studios à l’affiche',
              },
            ].map((m) => (
              <button
                key={m.key}
                aria-pressed={category === m.key}
                className={category === m.key ? styles.modeSelected : ''}
                onClick={() => setCategory(m.key)}
              >
                <strong>{m.label}</strong>
                <small>{m.text}</small>
              </button>
            ))}
          </div>
          <button className={styles.ctaBtn} onClick={start} disabled={busy}>
            {busy ? (
              <Loader2 className={styles.spin} size={17} />
            ) : (
              <ArrowRight size={17} />
            )}{' '}
            Commencer le quiz
          </button>
          {!isLoggedIn && (
            <p className={styles.quizWarn}>
              Connecte-toi via le menu pour conserver ton score.
            </p>
          )}
        </div>
      )}
      {phase === 'playing' && q && (
        <div className={styles.quizCard}>
          <div className={styles.quizProgress}>
            <span>
              Question {answers.length + 1} / {questions.length}
            </span>
            <span>
              {q.difficulty} · {q.points} pts
            </span>
          </div>
          <progress
            className={styles.progress}
            value={answers.length}
            max={questions.length}
            aria-label="Questions complétées"
          />
          <h2 ref={heading} tabIndex={-1} className={styles.quizQuestion}>
            {q.question}
          </h2>
          <div className={styles.quizOptions}>
            {q.options.map((option, i) => (
              <button
                key={i}
                aria-pressed={selected === i}
                className={`${styles.quizOption} ${selected === i ? styles.optionSelected : ''}`}
                onClick={() => setSelected(i)}
                disabled={busy}
              >
                <span className={styles.quizOptLetter}>{'ABCD'[i]}</span>
                {option}
                {selected === i && <Check size={17} />}
              </button>
            ))}
          </div>
          <div className={styles.quizNavigation}>
            <span>Aucune limite de temps. Fais-toi confiance.</span>
            <button
              className={styles.ctaBtn}
              disabled={selected === null || busy}
              onClick={next}
            >
              {answers.length + 1 === questions.length
                ? 'Voir mon résultat'
                : 'Confirmer'}{' '}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
      {(phase === 'submitting' || phase === 'retry') && (
        <div className={styles.quizResult} role="status">
          {busy ? (
            <>
              <Loader2 className={styles.spin} />
              <p>On prépare ton résultat…</p>
            </>
          ) : (
            <>
              <p>
                Tes réponses sont conservées. Tu peux réessayer
                l’enregistrement.
              </p>
              <button className={styles.ctaBtn} onClick={() => finish(answers)}>
                Réessayer
              </button>
            </>
          )}
        </div>
      )}
      {phase === 'done' && result && (
        <div className={styles.quizResult}>
          <span className={styles.quizEyebrow}>DÉFI TERMINÉ</span>
          <h2>
            {result.score} <small>points</small>
          </h2>
          <p>
            {result.correct} / {result.total} bonnes réponses · Record :{' '}
            {result.bestScore} pts
          </p>
          <div className={styles.review}>
            {questions.map((question, i) => {
              const detail = result.details?.find(
                (d) => d.questionId === question.id
              )
              return (
                <div key={question.id}>
                  <strong>
                    {detail?.correct ? '✓' : '↗'} {question.question}
                  </strong>
                  <p>
                    Ta réponse : {question.options[answers[i]?.answerIndex]}
                  </p>
                  {!detail?.correct && (
                    <p>
                      Bonne réponse :{' '}
                      {question.options[detail?.correctIndex] || 'Indisponible'}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          <button className={styles.ctaBtn} onClick={() => setPhase('idle')}>
            <RotateCcw size={16} /> Un nouveau défi
          </button>
        </div>
      )}
      {error && (
        <p className={styles.quizError} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
