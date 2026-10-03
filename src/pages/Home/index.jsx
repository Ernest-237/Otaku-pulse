// src/pages/Home/index.jsx
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar              from '../../components/Navbar'
import FloatingCharacter   from '../../components/FloatingCharacter'
import Hero                from './sections/Hero'
import AnimeCategories     from './sections/AnimeCategories'
import AnimeSchedule       from './sections/AnimeSchedule'
import Boutique            from './sections/Boutique'
import Events              from './sections/Events'
import Apropos             from './sections/Apropos'
import Footer              from './sections/Footer'
import Soundtracks from './sections/Soundtracks'

export default function Home() {
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView())
    return () => cancelAnimationFrame(frame)
  }, [hash])
  useEffect(() => {
    document.title = 'Otaku Pulse ⚡ — Vivez l\'expérience otaku au Cameroun'
  }, [])
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AnimeSchedule />
        <AnimeCategories />
        <Soundtracks />
        <Boutique />
        <Events />
        <Apropos />
      </main>
      <Footer />
      <FloatingCharacter />
    </>
  )
}
