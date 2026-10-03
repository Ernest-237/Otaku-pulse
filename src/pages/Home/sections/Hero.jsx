import OtakuMark from '../../../components/ui/OtakuMark'
import MediaImage from '../../../components/ui/MediaImage'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUpRight, Leaf, Sparkles } from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import { heroApi } from '../../../api'
import styles from './Hero.module.css'

export default function Hero() {
  const { lang } = useLang()
  const fr = lang === 'fr'
  const [hero, setHero] = useState(null)
  useEffect(() => {
    let active = true
    heroApi
      .get()
      .then((d) => {
        if (active) setHero(d?.hero)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  const image =
    hero?.bgImageData && hero?.bgImageMime
      ? `data:${hero.bgImageMime};base64,${hero.bgImageData}`
      : hero?.bgImageUrl || '/assets/hero/tree.jpg'
  const content = (key) => hero?.[`${key}${fr ? 'F' : 'E'}`]?.trim()
  return (
    <section id="hero" className={styles.hero}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>
            <Leaf size={15} /> OTAKU PULSE <span>•</span>{' '}
            {content('tagline') ||
              (fr
                ? 'LE RENDEZ-VOUS DES PASSIONNÉS'
                : 'A PLACE FOR ANIME LOVERS')}
          </span>
          <h1>
            {content('line1') || (fr ? 'Un peu d’anime.' : 'A little anime.')}
            <br />
            {content('line2') || (fr ? 'Beaucoup de' : 'A whole lot of')}
            <br />
            <em>{content('accent') || 'passion.'}</em>
          </h1>
          <p>
            {content('subtitle') ||
              (fr
                ? 'Trouve ta prochaine obsession, vibre au rythme des génériques et partage ton univers. Ici, tu es chez toi.'
                : 'Find your next obsession, discover anime soundtracks and share your world. Make yourself at home.')}
          </p>
          <div className={styles.actions}>
            <a href="#anime-schedule" className={styles.primary}>
              {fr ? 'Explorer les animés' : 'Explore anime'}{' '}
              <ArrowUpRight size={18} />
            </a>
            <Link to="/fandom?tab=quiz" className={styles.secondary}>
              {fr ? 'Relever un défi' : 'Take a challenge'}{' '}
              <OtakuMark size={16} />
            </Link>
          </div>
          <div className={styles.note}>
            <span />
            {fr
              ? 'Anime, culture & communauté · Depuis le Cameroun'
              : 'Anime, culture & community · From Cameroon'}
          </div>
        </div>
        <div className={styles.art}>
          <div className={styles.orbit} aria-hidden="true" />
          <div className={styles.imageFrame}>
            <MediaImage
              src={image}
              alt={
                fr
                  ? 'Une parenthèse dans un univers anime'
                  : 'A moment in an anime world'
              }
              fetchPriority="high"
              onError={(e) => {
                if (!e.currentTarget.src.endsWith('/img/deku.jpg'))
                  e.currentTarget.src = '/img/deku.jpg'
              }}
            />
            <div className={styles.imageShade} />
            <span className={styles.vertical} aria-hidden="true">
              夢を見る • OTAKU LIFE
            </span>
            <div className={styles.artCaption}>
              <span>
                01 / {fr ? 'ENTRE DANS L’UNIVERS' : 'ENTER THE WORLD'}
              </span>
              <strong>
                {fr
                  ? 'Les belles histoires\nse partagent.'
                  : 'Good stories\nare meant to be shared.'}
              </strong>
            </div>
          </div>
          <Link to="/fandom" className={styles.floatingNote}>
            <span>
              <Leaf size={21} />
            </span>
            <div>
              <small>
                {fr ? 'TON PETIT RITUEL OTAKU' : 'YOUR OTAKU RITUAL'}
              </small>
              <strong>
                {fr
                  ? 'Découvrir. Jouer. Partager.'
                  : 'Discover. Play. Connect.'}
              </strong>
            </div>
            <ArrowUpRight size={18} />
          </Link>
          <span className={styles.seal} aria-hidden="true">
            好<br />奇<br />心
          </span>
        </div>
      </div>
      <div className={`container ${styles.bottom}`}>
        <span>{fr ? 'CULTIVE TA CURIOSITÉ' : 'STAY CURIOUS'}</span>
        <a
          href="#anime-schedule"
          aria-label={fr ? 'Découvrir la sélection' : 'Discover the selection'}
        >
          <ArrowDown size={18} />
        </a>
        <span>アニメの世界へ</span>
      </div>
    </section>
  )
}
