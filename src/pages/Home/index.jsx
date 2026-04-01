// src/pages/Home/index.jsx
import { useEffect } from 'react'
import Navbar              from '../../components/Navbar'
import Music               from '../../components/Music'
import FloatingCharacter   from '../../components/FloatingCharacter'
import Hero                from './sections/Hero'
import AnimeCategories     from './sections/AnimeCategories'
import Boutique            from './sections/Boutique'
import Events              from './sections/Events'
import Apropos             from './sections/Apropos'
import Footer              from './sections/Footer'

export default function Home() {
  useEffect(() => {
    document.title = 'Otaku Pulse ⚡ — Goodies Anime livrés au Cameroun'
  }, [])
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <AnimeCategories />
        <section id="boutique"><Boutique /></section>
        <Events />
        <section id="apropos"><Apropos /></section>
      </main>
      <Footer />
      <Music />
      <FloatingCharacter />
    </>
  )
}