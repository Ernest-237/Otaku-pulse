// src/pages/Legal/index.jsx
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import styles from './Legal.module.css'
export default function LegalPage() {
  useEffect(() => { document.title = 'Droits & Politique — Otaku Pulse' }, [])
  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.header}>
        <div className="container">
          <Link to="/" className={styles.back}>← Retour</Link>
          <h1 className={styles.title}>⚖️ DROITS & POLITIQUE</h1>
          <p className={styles.sub}>Conditions d'utilisation et politique de confidentialité d'Otaku Pulse</p>
        </div>
      </div>
      <div className="container">
        <div className={styles.content}>
          {[
            { id:'mentions', title:'1. Mentions Légales', text:`Otaku Pulse est une entreprise de commerce en ligne spécialisée dans la distribution de goodies anime au Cameroun.\n\nSiège social : Yaoundé, Cameroun\nEmail : contact@otaku-pulse.com\nTéléphone : +237 600 000 000` },
            { id:'cgv', title:'2. Conditions Générales de Vente (CGV)', text:`En passant commande sur Otaku Pulse, vous acceptez les présentes conditions.\n\n• Les prix sont indiqués en FCFA (Franc CFA) et sont susceptibles de varier.\n• La commande est confirmée après validation du paiement via MTN Money ou Orange Money.\n• Les délais de livraison sont de 1 à 5 jours ouvrés selon la ville.\n• Toute commande peut être annulée dans les 2h suivant sa passation.\n• Les produits en rupture de stock feront l'objet d'un remboursement ou d'un remplacement.` },
            { id:'delivery', title:'3. Livraison', text:`Otaku Pulse livre dans les villes suivantes :\n• Yaoundé : 1-2 jours ouvrés\n• Douala : 2-3 jours ouvrés\n• Bafoussam : 3-5 jours ouvrés\n• Autres villes : sur devis\n\nLes frais de livraison sont offerts pour toute commande supérieure à 15 000 FCFA.` },
            { id:'refund', title:'4. Retours & Remboursements', text:`Vous disposez de 48h après réception pour signaler tout produit défectueux ou non conforme. Le retour est accepté uniquement si le produit n'a pas été utilisé et est dans son emballage d'origine. Le remboursement est effectué dans un délai de 7 jours ouvrés via le moyen de paiement initial.` },
            { id:'privacy', title:'5. Politique de Confidentialité', text:`Vos données personnelles (nom, email, téléphone, adresse) sont collectées uniquement dans le cadre de la gestion de vos commandes et ne sont jamais vendues à des tiers.\n\nNous respectons le RGPD et les lois camerounaises sur la protection des données.\nVous pouvez demander la suppression de vos données à tout moment en nous contactant.` },
            { id:'cookies', title:'6. Cookies', text:`Notre site utilise des cookies techniques nécessaires au bon fonctionnement de la boutique (panier, session). Aucun cookie publicitaire n'est utilisé sans votre consentement explicite.` },
            { id:'ip', title:'7. Propriété Intellectuelle', text:`Tout le contenu du site Otaku Pulse (logos, textes, images) est protégé par le droit d'auteur. Les noms et visuels des anime sont la propriété de leurs détenteurs respectifs (Shueisha, Toei Animation, etc.). Otaku Pulse est un revendeur indépendant et n'est affilié à aucun studio d'animation.` },
            { id:'contact-legal', title:'8. Contact & Réclamations', text:`Pour toute réclamation ou question concernant ces conditions, contactez-nous :\n• Email : legal@otaku-pulse.com\n• WhatsApp : +237 600 000 000\n• Courrier : Otaku Pulse, Yaoundé, Cameroun` },
          ].map(section => (
            <div key={section.id} id={section.id} className={styles.section}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              <div className={styles.sectionText}>{section.text.split('\n').map((line,i) => (
                <p key={i} className={line.startsWith('•') ? styles.bullet : ''}>{line}</p>
              ))}</div>
            </div>
          ))}
          <div className={styles.updated}>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR',{dateStyle:'long'})}</div>
        </div>
      </div>
    </div>
  )
}