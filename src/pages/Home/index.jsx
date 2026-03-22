// src/pages/Home/index.jsx
import { useEffect } from 'react'
import Navbar    from '../../components/Navbar'
import Music     from '../../components/Music'
import Hero      from './sections/Hero'
import Services  from './sections/Services'
import Boutique  from './sections/Boutique'
import Events    from './sections/Events'
import Apropos   from './sections/Apropos'
import Contact   from './sections/Contact'
import Footer    from './sections/Footer'

export default function Home() {
  useEffect(() => {
    document.title = 'Otaku Pulse ⚡ — Service Événementiel Otaku au Cameroun'
  }, [])

  return (
    <>
      <Navbar />
      <main>
        <section id="hero">     <Hero />     </section>
        <section id="services"> <Services /> </section>
        <section id="boutique"> <Boutique /> </section>
        <section id="events">   <Events />   </section>
        <section id="apropos">  <Apropos />  </section>
        <section id="contact">  <Contact />  </section>
      </main>
      <Footer />
      <Music />
    </>
  )
}