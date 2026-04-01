// src/components/FloatingCharacter.jsx
// Personnage flottant avec quotes d'anime — responsive
import { useState, useEffect, useRef } from 'react'
import styles from './FloatingCharacter.module.css'

const QUOTES = [
  { text: "La douleur reconnaît la douleur. C'est pour ça que tu me comprends.", char: 'Pain', anime: 'Naruto' },
  { text: "Si tu ne te bats pas, tu ne peux pas gagner !", char: 'Eren Yeager', anime: 'L\'Attaque des Titans' },
  { text: "Je ne mourrai pas. Je vais vivre et voir un monde libre !", char: 'Armin Arlert', anime: 'L\'Attaque des Titans' },
  { text: "Le monde est cruel, mais aussi très beau.", char: 'Mikasa Ackerman', anime: 'L\'Attaque des Titans' },
  { text: "Ceux qui se battent avec honneur jusqu'au bout sont les véritables héros.", char: 'Whitebeard', anime: 'One Piece' },
  { text: "Je n'ai pas besoin d'un monde sans guerre. J'ai besoin de mes nakama !", char: 'Monkey D. Luffy', anime: 'One Piece' },
  { text: "Le passé ne revient jamais. Mais tu peux choisir comment tu avances.", char: 'Itachi Uchiha', anime: 'Naruto' },
  { text: "Ceux qui violent les règles sont des déchets. Mais ceux qui abandonnent leurs amis sont pires que des déchets.", char: 'Kakashi Hatake', anime: 'Naruto' },
  { text: "Dans ce monde, il y a des choses que l'on ne peut pas exprimer avec des mots.", char: 'Gojo Satoru', anime: 'Jujutsu Kaisen' },
  { text: "Je suis le plus fort. C'est pour ça que je peux protéger tout le monde.", char: 'Gojo Satoru', anime: 'Jujutsu Kaisen' },
  { text: "Le saviez-vous ? En mode Bansho Man, Shinra peut atteindre la vitesse de la lumière !", char: 'Shinra Kusakabe', anime: 'Fire Force' },
  { text: "La force sans sagesse n'est que violence. La sagesse sans force n'est que rêve.", char: 'Aizen Sōsuke', anime: 'Bleach' },
  { text: "Même les plus faibles ont leur propre façon de briller.", char: 'Izuku Midoriya', anime: 'My Hero Academia' },
  { text: "Un héros naît au fond de nos cœurs quand on choisit de ne pas abandonner.", char: 'All Might', anime: 'My Hero Academia' },
  { text: "La vie d'un être vivant vaut plus que n'importe quel trésor.", char: 'Edward Elric', anime: 'Fullmetal Alchemist' },
]

// Personnage par défaut — remplace l'URL par ton image !
const CHARACTER_IMG = '/assets/characters/yuta.jpg'

export default function FloatingCharacter() {
  const [visible,    setVisible]    = useState(false)
  const [quoteIdx,   setQuoteIdx]   = useState(0)
  const [quoteAnim,  setQuoteAnim]  = useState(true)
  const [minimized,  setMinimized]  = useState(false)
  const [dismissed,  setDismissed]  = useState(false)
  const timerRef = useRef(null)

  // Apparaît après 4 secondes
  useEffect(() => {
    const alreadyDismissed = sessionStorage.getItem('char_dismissed') === '1'
    if (alreadyDismissed) return
    const t = setTimeout(() => setVisible(true), 4000)
    return () => clearTimeout(t)
  }, [])

  // Change de quote toutes les 8 secondes
  useEffect(() => {
    if (!visible || minimized) return
    timerRef.current = setInterval(() => {
      setQuoteAnim(false)
      setTimeout(() => {
        setQuoteIdx(i => (i + 1) % QUOTES.length)
        setQuoteAnim(true)
      }, 300)
    }, 8000)
    return () => clearInterval(timerRef.current)
  }, [visible, minimized])

  const nextQuote = () => {
    setQuoteAnim(false)
    setTimeout(() => {
      setQuoteIdx(i => (i + 1) % QUOTES.length)
      setQuoteAnim(true)
    }, 200)
  }

  const dismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('char_dismissed', '1')
  }

  if (dismissed || !visible) return null

  const q = QUOTES[quoteIdx]

  return (
    <div className={`${styles.wrapper} ${minimized ? styles.minimized : ''}`}>

      {/* Bulle de dialogue */}
      {!minimized && (
        <div className={`${styles.bubble} ${quoteAnim ? styles.bubbleIn : styles.bubbleOut}`}>
          {/* Bouton fermer */}
          <button className={styles.closeBtn} onClick={dismiss} title="Fermer">✕</button>

          {/* Quote */}
          <div className={styles.quoteIcon}>"</div>
          <p className={styles.quoteText}>{q.text}</p>
          <div className={styles.quoteMeta}>
            <span className={styles.charName}>— {q.char}</span>
            <span className={styles.animeName}>{q.anime}</span>
          </div>

          {/* Navigation */}
          <button className={styles.nextBtn} onClick={nextQuote}>
            Suivante ›
          </button>

          {/* Queue de la bulle */}
          <div className={styles.bubbleTail} />
        </div>
      )}

      {/* Personnage */}
      <div className={styles.character} onClick={() => setMinimized(m => !m)}>
        <img
          src={CHARACTER_IMG}
          alt="Personnage Otaku"
          className={styles.charImg}
          onError={e => { e.target.style.display='none'; e.target.parentNode.classList.add(styles.charFallback) }}
        />
        {/* Fallback emoji si image absente */}
        <div className={styles.charEmojiDefault}>🧑‍🦯</div>

        {/* Badge animé */}
        <div className={styles.charBadge}>
          {minimized ? '💬' : '✕'}
        </div>

        {/* Glow au sol */}
        <div className={styles.charShadow} />
      </div>
    </div>
  )
}