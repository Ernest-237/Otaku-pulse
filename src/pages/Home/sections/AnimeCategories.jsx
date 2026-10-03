import OtakuMark from '../../../components/ui/OtakuMark'
import { Link } from 'react-router-dom'
import { ArrowUpRight, BookOpen, Headphones, Sparkles } from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import styles from './AnimeCategories.module.css'

export default function AnimeCategories() {
  const { lang } = useLang()
  const fr = lang === 'fr'
  const cards = [
    {
      to: '/fandom?tab=quiz',
      icon: OtakuMark,
      tag: '01 / PLAY',
      title: fr ? 'À toi de jouer.' : 'Your turn to play.',
      text: fr
        ? 'Quiz, cosplay et petits défis entre passionnés.'
        : 'Quiz, cosplay and challenges with fellow fans.',
    },
    {
      to: '/manga',
      icon: BookOpen,
      tag: '02 / READ',
      title: fr ? 'Encore un chapitre.' : 'One more chapter.',
      text: fr
        ? 'Des histoires à découvrir, à ton rythme.'
        : 'Stories to discover, at your own pace.',
    },
    {
      href: '#soundtracks',
      icon: Headphones,
      tag: '03 / LISTEN',
      title: fr ? 'Le son de ton anime.' : 'The sound of your anime.',
      text: fr
        ? 'Retrouve les openings et endings de tes séries.'
        : 'Find the openings and endings from your series.',
    },
  ]
  return (
    <section id="services" className={styles.section}>
      <div className={`container ${styles.grid}`}>
        {cards.map(({ to, href, icon: Icon, tag, title, text }) => {
          const content = (
            <>
              <div className={styles.top}>
                <Icon size={22} />
                <span>{tag}</span>
                <ArrowUpRight size={18} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </>
          )
          return to ? (
            <Link key={tag} to={to} className={styles.card}>
              {content}
            </Link>
          ) : (
            <a key={tag} href={href} className={styles.card}>
              {content}
            </a>
          )
        })}
      </div>
    </section>
  )
}
