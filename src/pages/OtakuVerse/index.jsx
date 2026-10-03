import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  Compass,
  DoorOpen,
  Headphones,
  HelpCircle,
  LockKeyhole,
  Map,
  Maximize,
  Minimize,
  MousePointer2,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react'
import Navbar from '../../components/Navbar'
import Modal from '../../components/ui/Modal'
import {
  ROOMS,
  PROGRESS_KEY,
  canEnterRoom,
  collectSeal,
  discoverRoom,
  readProgress,
} from './world'
import useCastleAudio from './useCastleAudio'
import styles from './OtakuVerse.module.css'

const CastleScene = lazy(() => import('./CastleScene'))

class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error) {
    this.props.onUnavailable(error)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function GuidedBackdrop({ room }) {
  return (
    <div className={styles.guidedBackdrop} aria-hidden="true">
      <div className={styles.guidedMoon} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className={styles.pavilion} style={{ '--index': i }}>
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      ))}
      <div className={styles.guidedKanji}>{room.kanji}</div>
    </div>
  )
}

export default function OtakuVerse() {
  const [active, setActive] = useState(false)
  const [roomId, setRoomId] = useState('threshold')
  const [progress, setProgress] = useState(readProgress)
  const [ready, setReady] = useState(false)
  const [guided, setGuided] = useState(false)
  const [menu, setMenu] = useState(null)
  const [comfort, setComfort] = useState(
    () =>
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false
  )
  const [shift, setShift] = useState(0)
  const [lanternsOn, setLanternsOn] = useState(true)
  const [notice, setNotice] = useState('')
  const [fullscreen, setFullscreen] = useState(false)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [hidden, setHidden] = useState(document.hidden)
  const [transitioning, setTransitioning] = useState(false)
  const scene = useRef(null)
  const stage = useRef(null)
  const enterButton = useRef(null)
  const transitionTimer = useRef(null)
  const noticeTimer = useRef(null)
  const room = ROOMS.find((item) => item.id === roomId) || ROOMS[0]
  const audio = useCastleAudio(active && !menu && !hidden)
  const allSeals = progress.seals.length === 3

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Otaku-verse · Le Château de l’Infini | Otaku Pulse'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
      setStorageAvailable(true)
    } catch {
      setStorageAvailable(false)
    }
  }, [progress])

  useEffect(() => {
    if (!active) return
    document.body.classList.add('otaku-verse-active')
    return () => {
      document.body.classList.remove('otaku-verse-active')
    }
  }, [active])

  useEffect(() => {
    const onVisibility = () => {
      setHidden(document.hidden)
      if (document.hidden && active) setMenu((current) => current || 'pause')
    }
    const onFullscreen = () =>
      setFullscreen(document.fullscreenElement === stage.current)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('fullscreenchange', onFullscreen)
    }
  }, [active])

  useEffect(() => {
    if (!active || menu) return
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMenu('pause')
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active, menu])

  useEffect(() => {
    if (active && ready && !menu) {
      const frame = requestAnimationFrame(() =>
        stage.current?.querySelector('canvas')?.focus({ preventScroll: true })
      )
      return () => cancelAnimationFrame(frame)
    }
  }, [active, ready, menu])

  useEffect(
    () => () => {
      clearTimeout(transitionTimer.current)
      clearTimeout(noticeTimer.current)
      if (document.fullscreenElement === stage.current)
        document.exitFullscreen?.().catch(() => {})
    },
    []
  )

  const announce = useCallback((message) => {
    clearTimeout(noticeTimer.current)
    setNotice(message)
    noticeTimer.current = setTimeout(() => setNotice(''), 6500)
  }, [])
  const onReady = useCallback(() => setReady(true), [])
  const onUnavailable = useCallback(() => {
    setGuided(true)
    setReady(true)
  }, [])

  const travel = useCallback(
    (destination) => {
      if (!canEnterRoom(destination, progress)) {
        announce(
          'Les trois sceaux sont nécessaires pour ouvrir le cœur du château.'
        )
        return
      }
      setMenu(null)
      setRoomId(destination)
      setProgress((current) => discoverRoom(current, destination))
      setNotice('')
      clearTimeout(transitionTimer.current)
      if (!comfort) {
        setTransitioning(true)
        transitionTimer.current = setTimeout(() => setTransitioning(false), 450)
      }
    },
    [progress, comfort, announce]
  )

  function enter() {
    setRoomId('threshold')
    setActive(true)
    setMenu(null)
    setNotice(
      'Bienvenue. Déplace-toi librement ou ouvre la carte pour choisir une salle.'
    )
  }

  function leave() {
    audio.stop()
    clearTimeout(transitionTimer.current)
    setTransitioning(false)
    if (document.fullscreenElement === stage.current)
      document.exitFullscreen?.().catch(() => {})
    setMenu(null)
    setActive(false)
    setNotice('')
    requestAnimationFrame(() =>
      enterButton.current?.focus({ preventScroll: true })
    )
  }

  function interact() {
    if (!active || menu) return
    if (room.id === 'threshold') {
      travel('lanterns')
      return
    }
    if (room.id === 'heart') {
      setShift((value) => value + 1)
      audio.play('seal')
      announce(
        'Les trois sceaux brillent ensemble. Le château t’a confié son secret. La visite reste ouverte.'
      )
      return
    }
    const alreadyFound = progress.seals.includes(room.id)
    setProgress((current) => collectSeal(current, room.id))
    if (room.id === 'lanterns')
      setLanternsOn((value) => (alreadyFound ? !value : true))
    if (room.id === 'biwa') setShift((value) => value + 1)
    audio.play(room.id === 'biwa' ? 'biwa' : 'seal')
    announce(
      !alreadyFound && progress.seals.length === 2
        ? `${room.discovery} Les trois sceaux sont réunis : le cœur du château est ouvert.`
        : room.discovery
    )
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === stage.current)
        await document.exitFullscreen()
      else await stage.current.requestFullscreen()
    } catch {
      announce(
        'Le plein écran n’est pas disponible. La visite reste accessible dans cette fenêtre.'
      )
    }
  }

  function movementProps(direction) {
    return {
      onPointerDown(event) {
        event.preventDefault()
        event.currentTarget.setPointerCapture?.(event.pointerId)
        scene.current?.move(direction, true)
      },
      onPointerUp() {
        scene.current?.move(direction, false)
      },
      onPointerCancel() {
        scene.current?.move(direction, false)
      },
      onLostPointerCapture() {
        scene.current?.move(direction, false)
      },
      onKeyDown(event) {
        if ([' ', 'Enter'].includes(event.key)) {
          event.preventDefault()
          scene.current?.move(direction, true)
        }
      },
      onKeyUp(event) {
        if ([' ', 'Enter'].includes(event.key)) {
          event.preventDefault()
          scene.current?.move(direction, false)
        }
      },
      onBlur() {
        scene.current?.move(direction, false)
      },
    }
  }

  return (
    <div className={styles.page}>
      {!active && <Navbar />}
      <main
        ref={stage}
        className={`${styles.stage} ${active ? styles.exploring : ''}`}
        style={{ '--room-accent': room.accent }}
      >
        <div className={styles.scene} data-testid="verse-scene">
          {guided ? (
            <GuidedBackdrop room={room} />
          ) : (
            <SceneBoundary onUnavailable={onUnavailable}>
              <Suspense fallback={null}>
                <CastleScene
                  ref={scene}
                  roomId={roomId}
                  active={active}
                  paused={!!menu || hidden}
                  comfort={comfort}
                  shift={shift}
                  lanternsOn={lanternsOn}
                  onReady={onReady}
                  onUnavailable={onUnavailable}
                  onPortal={travel}
                  onInteract={interact}
                />
              </Suspense>
            </SceneBoundary>
          )}
        </div>
        <div
          className={`${styles.shade} ${active ? styles.worldShade : ''}`}
          aria-hidden="true"
        />
        {transitioning && (
          <div className={styles.transition} aria-hidden="true" />
        )}

        {!active ? (
          <div className={styles.landing}>
            <div className={styles.topline}>
              <span className={styles.verseName}>
                <span className={styles.redSeal} aria-hidden="true">
                  界
                </span>{' '}
                OTAKU–VERSE
              </span>
              <span className={styles.chapter}>MONDE 001 / DEMON SLAYER</span>
            </div>
            <div className={styles.intro}>
              <span className={styles.eyebrow}>
                <span /> AU-DELÀ DE TON ÉCRAN
              </span>
              <h1>
                Le Château
                <br />
                <em>de l’Infini</em>
              </h1>
              <p className={styles.japanese}>
                無限城 <span>IKŪKAN MUGEN-JŌ</span>
              </p>
              <p className={styles.introText}>
                Une dimension sans horizon. Des salles qui défient la gravité.
                Franchis le seuil du repaire de Muzan et trouve ton chemin dans
                l’infini.
              </p>
              <div className={styles.enterActions}>
                <button
                  ref={enterButton}
                  className={styles.enter}
                  disabled={!ready}
                  onClick={enter}
                >
                  {ready ? 'Entrer dans le château' : 'Le château se dessine…'}{' '}
                  <ArrowUpRight size={19} />
                </button>
                <button
                  className={styles.textButton}
                  onClick={() => setMenu('help')}
                >
                  Comment explorer <ArrowRight size={15} />
                </button>
              </div>
              <p className={styles.quietNote}>
                <Headphones size={14} /> Son désactivé à l’entrée · Visite à ton
                rythme
              </p>
              {!ready && (
                <button
                  className={styles.loadingAlternative}
                  onClick={onUnavailable}
                >
                  Continuer en visite guidée
                </button>
              )}
              {guided && (
                <p className={styles.guidedNote}>
                  Visite guidée : explore les salles et leurs secrets avec les
                  commandes à l’écran. La vue 3D est indisponible sur cet
                  appareil.
                </p>
              )}
            </div>
            <div className={styles.verticalScript} aria-hidden="true">
              無<br />限<br />城
            </div>
            <div className={styles.landingBottom}>
              <div className={styles.stats}>
                <span>
                  <b>05</b> salles à explorer
                </span>
                <span>
                  <b>03</b> sceaux à éveiller
                </span>
                <span>
                  <b>∞</b> horizons
                </span>
              </div>
              <button
                className={styles.aboutLink}
                onClick={() => setMenu('about')}
              >
                Un monde inspiré de Demon Slayer <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <header className={styles.hudHeader}>
              <div className={styles.worldBrand}>
                <span className={styles.redSeal} aria-hidden="true">
                  界
                </span>
                <span>
                  OTAKU–VERSE<small>LE CHÂTEAU DE L’INFINI</small>
                </span>
              </div>
              <div className={styles.headerActions}>
                <button
                  className={styles.iconButton}
                  onClick={() => setMenu('pause')}
                  aria-label="Mettre en pause"
                >
                  <Pause size={18} />
                </button>
                <button className={styles.exitButton} onClick={leave}>
                  <DoorOpen size={16} /> <span>Quitter le château</span>
                </button>
              </div>
            </header>

            <div
              className={styles.location}
              data-testid="verse-room"
              data-room={room.id}
            >
              <span className={styles.roomIndex}>
                SALLE {room.number} <i />{' '}
                {guided ? 'VISITE GUIDÉE' : 'EXPLORATION LIBRE'}
              </span>
              <h1>{room.title}</h1>
              <p>{room.subtitle}</p>
            </div>

            <div className={styles.toolbar} aria-label="Options de visite">
              <button
                className={styles.tool}
                onClick={() => setMenu('map')}
                aria-label="Carte du château"
              >
                <Map size={19} />
                <span>Carte</span>
              </button>
              <button
                className={styles.tool}
                onClick={() => setMenu('help')}
                aria-label="Aide"
              >
                <HelpCircle size={19} />
                <span>Aide</span>
              </button>
              <button
                className={styles.tool}
                onClick={audio.toggle}
                aria-label={audio.enabled ? 'Couper le son' : 'Activer le son'}
                aria-pressed={audio.enabled}
              >
                {audio.enabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
                <span>Son</span>
              </button>
              <button
                className={styles.tool}
                onClick={() => setComfort((value) => !value)}
                aria-label="Mode calme"
                aria-pressed={comfort}
              >
                <Wind size={19} />
                <span>Calme</span>
              </button>
              {document.fullscreenEnabled && (
                <button
                  className={`${styles.tool} ${styles.fullscreenTool}`}
                  onClick={toggleFullscreen}
                  aria-label={fullscreen ? 'Réduire la vue' : 'Plein écran'}
                >
                  {fullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
                  <span>Écran</span>
                </button>
              )}
            </div>

            {!guided && (
              <div className={styles.crosshair} aria-hidden="true">
                <span />
              </div>
            )}

            <div className={styles.worldBottom}>
              <section
                className={styles.storyCard}
                aria-label="Interaction de la salle"
              >
                <div className={styles.storyHeading}>
                  <span className={styles.storyKanji} aria-hidden="true">
                    {room.kanji}
                  </span>
                  <div>
                    <span className={styles.kicker}>
                      {room.id === 'heart'
                        ? 'LE SECRET DE L’INFINI'
                        : 'LE CHÂTEAU TE MURMURE'}
                    </span>
                    <p>{room.description}</p>
                  </div>
                </div>
                <button className={styles.actionButton} onClick={interact}>
                  {room.action}
                  <ArrowRight size={16} />
                </button>
                {room.seal && progress.seals.includes(room.id) && (
                  <span className={styles.collected}>
                    <Check size={12} /> {room.seal} recueilli
                  </span>
                )}
              </section>
              <div className={styles.journey}>
                <div
                  className={styles.seals}
                  data-testid="verse-progress"
                  aria-label={`${progress.seals.length} sur 3 sceaux recueillis`}
                >
                  <div className={styles.sealIcons}>
                    {ROOMS.filter((item) => item.seal).map((item) => (
                      <span
                        key={item.id}
                        className={
                          progress.seals.includes(item.id)
                            ? styles.sealFound
                            : ''
                        }
                        title={`${item.seal} ${progress.seals.includes(item.id) ? 'recueilli' : 'à découvrir'}`}
                      >
                        {item.kanji}
                      </span>
                    ))}
                  </div>
                  <span>{progress.seals.length} / 3 sceaux</span>
                </div>
                <button
                  className={styles.journeyButton}
                  onClick={() => (allSeals ? travel('heart') : setMenu('map'))}
                >
                  {allSeals ? 'Le cœur est ouvert' : 'Choisir une salle'}{' '}
                  <ArrowUpRight size={15} />
                </button>
                <span className={styles.saveNote}>
                  {storageAvailable
                    ? 'Découvertes gardées sur cet appareil'
                    : 'Découvertes gardées pour cette visite'}
                </span>
              </div>
            </div>

            {!guided && (
              <>
                <div
                  className={styles.walkPad}
                  aria-label="Déplacement tactile"
                >
                  <button
                    {...movementProps('forward')}
                    className={styles.forward}
                    aria-label="Avancer"
                  >
                    <ArrowUp size={20} />
                  </button>
                  <button
                    {...movementProps('left')}
                    className={styles.left}
                    aria-label="Aller à gauche"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <button
                    {...movementProps('backward')}
                    className={styles.backward}
                    aria-label="Reculer"
                  >
                    <ArrowDown size={20} />
                  </button>
                  <button
                    {...movementProps('right')}
                    className={styles.right}
                    aria-label="Aller à droite"
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
                <p className={styles.controlsHint}>
                  <MousePointer2 size={13} /> Glisser pour regarder{' '}
                  <span>·</span> ZQSD / WASD pour marcher <span>·</span> E pour
                  interagir
                </p>
              </>
            )}
            <div className={styles.notice} role="status" aria-live="polite">
              {notice || audio.error}
            </div>
          </>
        )}

        <Modal
          isOpen={menu === 'map'}
          onClose={() => setMenu(null)}
          title="Carte du château"
        >
          <div className={styles.dialogContent}>
            <p className={styles.dialogIntro}>
              Les salles changent de place. La carte te permet toujours de
              retrouver ton chemin.
            </p>
            <div className={styles.roomList}>
              {ROOMS.map((item) => {
                const locked = !canEnterRoom(item.id, progress)
                return (
                  <button
                    key={item.id}
                    className={`${styles.roomLink} ${item.id === roomId ? styles.currentRoom : ''}`}
                    disabled={locked}
                    onClick={() => travel(item.id)}
                    aria-label={`${item.number} ${item.title}`}
                    aria-current={item.id === roomId ? 'location' : undefined}
                  >
                    <span className={styles.mapKanji} aria-hidden="true">
                      {item.kanji}
                    </span>
                    <span>
                      <b>
                        {item.number} {item.title}
                      </b>
                      <small>
                        {locked
                          ? 'Réunis les 3 sceaux pour ouvrir cette salle'
                          : item.id === roomId
                            ? 'Tu es ici'
                            : progress.visited.includes(item.id)
                              ? 'Déjà explorée'
                              : item.subtitle}
                      </small>
                    </span>
                    {locked ? (
                      <LockKeyhole size={17} />
                    ) : (
                      <ArrowUpRight size={17} />
                    )}
                  </button>
                )
              })}
            </div>
            <p className={styles.dialogFoot}>
              {progress.visited.length} / 5 salles découvertes ·{' '}
              {progress.seals.length} / 3 sceaux
            </p>
          </div>
        </Modal>

        <Modal
          isOpen={menu === 'help'}
          onClose={() => setMenu(null)}
          title="Explorer le château"
        >
          <div className={styles.dialogContent}>
            <p className={styles.dialogIntro}>
              Aucune course, aucun combat. Approche les objets lumineux ou
              utilise les boutons de chaque salle pour découvrir ses secrets.
            </p>
            <dl className={styles.instructions}>
              <div>
                <dt>Regarder</dt>
                <dd>
                  Maintiens le clic et glisse, ou fais glisser un doigt sur le
                  décor.
                </dd>
              </div>
              <div>
                <dt>Marcher</dt>
                <dd>
                  Touches ZQSD, WASD ou flèches. Sur mobile, maintiens les
                  flèches à l’écran.
                </dd>
              </div>
              <div>
                <dt>Interagir</dt>
                <dd>
                  Approche un objet puis clique dessus ou presse E. Le bouton de
                  la salle fonctionne aussi, sans déplacement.
                </dd>
              </div>
              <div>
                <dt>Changer de salle</dt>
                <dd>
                  Emprunte une porte ou choisis ta destination sur la carte.
                  Trois sceaux ouvrent la dernière salle.
                </dd>
              </div>
              <div>
                <dt>Faire une pause</dt>
                <dd>
                  Échap ou le bouton pause. « Quitter le château » te ramène
                  toujours à l’entrée.
                </dd>
              </div>
            </dl>
            <button
              className={styles.dialogToggle}
              onClick={() => setComfort((value) => !value)}
              aria-pressed={comfort}
            >
              <Wind size={17} />
              <span>
                Mode calme
                <small>Limite les animations et les transitions.</small>
              </span>
              <b>{comfort ? 'Activé' : 'Désactivé'}</b>
            </button>
            <button
              className={styles.dialogPrimary}
              onClick={() => setMenu(null)}
            >
              {active ? 'Reprendre la visite' : 'J’ai compris'}{' '}
              <ArrowRight size={16} />
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={menu === 'pause'}
          onClose={() => setMenu(null)}
          title="La visite est en pause"
        >
          <div className={styles.dialogContent}>
            <p className={styles.dialogIntro}>
              Le château peut attendre. Tes découvertes sont conservées{' '}
              {storageAvailable ? 'sur cet appareil' : 'pendant cette visite'}.
            </p>
            <button
              className={styles.dialogPrimary}
              onClick={() => setMenu(null)}
            >
              Reprendre la visite <ArrowRight size={16} />
            </button>
            <button
              className={styles.dialogSecondary}
              onClick={() => {
                scene.current?.resetView()
                setMenu(null)
              }}
            >
              <RotateCcw size={17} /> Recentrer la vue
            </button>
            <button
              className={styles.dialogSecondary}
              onClick={() => setMenu('map')}
            >
              <Compass size={17} /> Carte du château
            </button>
            <button className={styles.dialogSecondary} onClick={leave}>
              <DoorOpen size={17} /> Quitter le château
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={menu === 'about'}
          onClose={() => setMenu(null)}
          title="Un passage vers l’Otaku-verse"
        >
          <div className={styles.dialogContent}>
            <p>
              Le Château de l’Infini est la dimension labyrinthique qui abrite
              Muzan dans <em>Demon Slayer: Kimetsu no Yaiba</em>.
            </p>
            <p>
              Cette visite de fans recrée son atmosphère à travers une
              architecture originale. Les cinq salles et la quête des sceaux
              sont imaginées pour Otaku Pulse.
            </p>
            <a
              className={styles.sourceLink}
              href="https://kimetsu-no-yaiba.fandom.com/fr/wiki/Forteresse_Dimensionnelle_Infinie"
              target="_blank"
              rel="noreferrer"
            >
              Découvrir l’univers du château <ArrowUpRight size={16} />
            </a>
            <Link className={styles.sourceLink} to="/">
              Retrouver Otaku Pulse <ArrowRight size={16} />
            </Link>
          </div>
        </Modal>
      </main>
    </div>
  )
}
