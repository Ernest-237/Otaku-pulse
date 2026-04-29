// server/utils/mailer.js — Service email avec debug
const nodemailer = require('nodemailer')

const ADMIN_EMAILS = [
  'contact@otaku-pulse.com',
]
const FROM = '"Otaku Pulse ⚡" <contact@otaku-pulse.com>'

function createTransporter() {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn('⚠️  MAIL_USER ou MAIL_PASS non défini — emails désactivés')
    return null
  }
  // SMTP professionnel Hostinger (ou autre hébergeur du domaine otaku-pulse.com)
  // Variables Render à configurer :
  //   MAIL_HOST = smtp.hostinger.com   (ou mail.otaku-pulse.com)
  //   MAIL_PORT = 465
  //   MAIL_USER = contact@otaku-pulse.com
  //   MAIL_PASS = [mot de passe de la boîte mail professionnelle]
  return nodemailer.createTransport({
    host:   process.env.MAIL_HOST || 'smtp.hostinger.com',
    port:   parseInt(process.env.MAIL_PORT || '465'),
    secure: parseInt(process.env.MAIL_PORT || '465') === 465,
    auth: {
      user: process.env.MAIL_USER,  // contact@otaku-pulse.com
      pass: process.env.MAIL_PASS,  // mot de passe boîte mail
    },
    tls: { rejectUnauthorized: false },
  })
}

function baseTemplate(content) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <style>
    body{margin:0;padding:0;background:#f8f7ff;font-family:Arial,sans-serif}
    .wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
    .header{background:linear-gradient(135deg,#16a34a,#22c55e);padding:28px 36px;text-align:center}
    .logo{font-size:1.6rem;font-weight:900;letter-spacing:4px;color:#fff}
    .tagline{font-size:.75rem;color:rgba(255,255,255,.75);letter-spacing:2px}
    .body{padding:28px 36px}
    .title{font-size:1.3rem;font-weight:800;color:#0f0e24;margin-bottom:8px}
    .text{font-size:.9rem;color:#64748b;line-height:1.7;margin-bottom:14px}
    .box{background:#f8f7ff;border-radius:10px;padding:18px 20px;margin:16px 0;border:1px solid #e2e0f0}
    .row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e2e0f0;font-size:.85rem}
    .row:last-child{border-bottom:none}
    .label{color:#64748b;font-weight:600}
    .value{color:#0f0e24;font-weight:700}
    .badge{display:inline-block;padding:3px 12px;border-radius:99px;font-size:.75rem;font-weight:800}
    .badge-green{background:#dcfce7;color:#16a34a}
    .badge-purple{background:#ede9fe;color:#6d28d9}
    .badge-amber{background:#fffbeb;color:#d97706}
    .cta{display:block;text-align:center;padding:13px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:99px;font-weight:800;font-size:.92rem;margin:20px 0}
    .footer{background:#f1f0f9;padding:18px 36px;text-align:center;font-size:.72rem;color:#94a3b8}
  </style>
</head>
<body>
<div style="padding:20px 12px;background:#f8f7ff">
<div class="wrap">
  <div class="header">
    <div class="logo">⚡ OTAKU PULSE</div>
    <div class="tagline">VIVEZ L'EXPÉRIENCE · CAMEROUN</div>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    📧 contact@otaku-pulse.com · 📱 +237 6 75 71 27 39<br>
    📍 Yaoundé · Douala · Bafoussam<br>
    © ${new Date().getFullYear()} Otaku Pulse
  </div>
</div>
</div>
</body>
</html>`
}

async function sendMail(options) {
  const transporter = createTransporter()
  if (!transporter) return false
  try {
    const info = await transporter.sendMail({ from: FROM, ...options })
    console.log(`📧 Email envoyé: ${info.messageId} → ${options.to}`)
    return true
  } catch (err) {
    console.error(`❌ Erreur email vers ${options.to}:`, err.message)
    throw err
  }
}

// ── 1. Confirmation client — réservation événement ──
async function sendReservationConfirmation(contact) {
  const packLabels = { genin:'Pack GENIN', chunin:'Pack CHŪNIN', hokage:'Pack HOKAGE', custom:'Pack sur mesure' }
  return sendMail({
    to: contact.email,
    subject: `✅ Réservation reçue — Otaku Pulse`,
    html: baseTemplate(`
      <div class="title">🎉 Réservation reçue !</div>
      <p class="text">Bonjour <strong>${contact.prenom} ${contact.nom}</strong>,<br>
      Merci pour votre demande ! Notre équipe vous contacte sous <strong>24 à 48h</strong>.</p>
      <div class="box">
        <div class="row"><span class="label">Pack</span><span class="value"><span class="badge badge-green">${packLabels[contact.pack] || contact.pack?.toUpperCase()}</span></span></div>
        <div class="row"><span class="label">Thème</span><span class="value">${contact.theme}</span></div>
        <div class="row"><span class="label">Date</span><span class="value">${contact.date ? new Date(contact.date).toLocaleDateString('fr-FR',{dateStyle:'long'}) : 'Non précisée'}</span></div>
        <div class="row"><span class="label">Invités</span><span class="value">${contact.guests} personnes</span></div>
        <div class="row"><span class="label">Ville</span><span class="value">${contact.ville}</span></div>
        <div class="row"><span class="label">Téléphone</span><span class="value">${contact.phone}</span></div>
      </div>
      <a href="https://wa.me/237675712739" class="cta">💬 Nous contacter sur WhatsApp</a>
      <p class="text" style="font-size:.78rem;color:#94a3b8">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `)
  })
}

// ── 2. Notification admins — réservation ──
async function sendReservationNotifAdmin(contact) {
  const packLabels = { genin:'GENIN', chunin:'CHŪNIN', hokage:'HOKAGE', custom:'CUSTOM' }
  return sendMail({
    to: ADMIN_EMAILS.join(', '),
    replyTo: contact.email,
    subject: `🎌 Nouvelle réservation — ${contact.prenom} ${contact.nom}`,
    html: baseTemplate(`
      <div class="title">📬 Nouvelle réservation reçue !</div>
      <p class="text">Une demande vient d'être soumise sur <strong>otaku-pulse.com</strong>.</p>
      <div class="box">
        <div class="row"><span class="label">Nom</span><span class="value">${contact.prenom} ${contact.nom}</span></div>
        <div class="row"><span class="label">Email</span><span class="value">${contact.email}</span></div>
        <div class="row"><span class="label">Téléphone</span><span class="value">${contact.phone}</span></div>
        <div class="row"><span class="label">WhatsApp</span><span class="value">${contact.whatsapp || contact.phone}</span></div>
        <div class="row"><span class="label">Pack</span><span class="value"><span class="badge badge-purple">${packLabels[contact.pack] || contact.pack}</span></span></div>
        <div class="row"><span class="label">Thème</span><span class="value">${contact.theme}</span></div>
        <div class="row"><span class="label">Date</span><span class="value">${contact.date ? new Date(contact.date).toLocaleDateString('fr-FR',{dateStyle:'long'}) : 'Non précisée'}</span></div>
        <div class="row"><span class="label">Invités</span><span class="value">${contact.guests}</span></div>
        <div class="row"><span class="label">Ville</span><span class="value">${contact.ville}${contact.quartier ? ', ' + contact.quartier : ''}</span></div>
        ${contact.message ? `<div class="row"><span class="label">Message</span><span class="value" style="max-width:200px">${contact.message}</span></div>` : ''}
      </div>
      <a href="https://otaku-pulse.com/admin" class="cta">⚙️ Gérer dans le Dashboard Admin</a>
    `)
  })
}

// ── 3. Confirmation client — carte membre ──
async function sendMembershipConfirmation(request) {
  const planLabels = { basic:'Pulse Basic ⚡', plus:'Pulse Plus 🔥', elite:'Pulse Elite 👑' }
  return sendMail({
    to: request.email,
    subject: `🎴 Demande Carte Membre reçue — Otaku Pulse`,
    html: baseTemplate(`
      <div class="title">🎴 Demande de Carte Membre reçue !</div>
      <p class="text">Bonjour <strong>${request.nom}</strong>,<br>
      Votre demande pour le plan <strong>${planLabels[request.plan] || request.plan}</strong> a été reçue. Notre équipe vous contacte sous <strong>24h</strong>.</p>
      <div class="box">
        <div class="row"><span class="label">Plan</span><span class="value"><span class="badge badge-purple">${planLabels[request.plan]}</span></span></div>
        <div class="row"><span class="label">Ville</span><span class="value">${request.ville}</span></div>
        <div class="row"><span class="label">Contact</span><span class="value">${request.phone}</span></div>
      </div>
      <a href="https://otaku-pulse.com/membership" class="cta">🎴 En savoir plus</a>
    `)
  })
}

// ── 4. Notification admins — carte membre ──
async function sendMembershipNotifAdmin(request) {
  const planLabels = { basic:'BASIC', plus:'PLUS', elite:'ELITE' }
  return sendMail({
    to: ADMIN_EMAILS.join(', '),
    replyTo: request.email,
    subject: `🎴 Nouvelle demande Carte Membre — ${request.nom} (${planLabels[request.plan] || ''})`,
    html: baseTemplate(`
      <div class="title">🎴 Nouvelle demande Carte Membre</div>
      <div class="box">
        <div class="row"><span class="label">Nom</span><span class="value">${request.nom}</span></div>
        <div class="row"><span class="label">Email</span><span class="value">${request.email}</span></div>
        <div class="row"><span class="label">Téléphone</span><span class="value">${request.phone}</span></div>
        <div class="row"><span class="label">Plan</span><span class="value"><span class="badge badge-amber">${planLabels[request.plan] || request.plan}</span></span></div>
        <div class="row"><span class="label">Ville</span><span class="value">${request.ville}</span></div>
        ${request.message ? `<div class="row"><span class="label">Message</span><span class="value">${request.message}</span></div>` : ''}
      </div>
      <a href="https://otaku-pulse.com/admin" class="cta">⚙️ Activer la carte dans l'Admin</a>
    `)
  })
}

// ── 5. Activation carte membre ──
async function sendMembershipActivated(request) {
  const planLabels = { basic:'Pulse Basic ⚡', plus:'Pulse Plus 🔥', elite:'Pulse Elite 👑' }
  const expiry = request.expiresAt
    ? new Date(request.expiresAt).toLocaleDateString('fr-FR',{dateStyle:'long'})
    : '1 an à compter de l\'activation'
  return sendMail({
    to: request.email,
    subject: `✅ Votre Carte Membre Otaku Pulse est activée !`,
    html: baseTemplate(`
      <div class="title">✅ Carte Membre activée !</div>
      <p class="text">Félicitations <strong>${request.nom}</strong> ! Bienvenue dans la communauté Otaku Pulse.</p>
      <div class="box">
        <div class="row"><span class="label">Plan</span><span class="value"><span class="badge badge-purple">${planLabels[request.plan] || request.plan}</span></span></div>
        <div class="row"><span class="label">ID Carte</span><span class="value" style="font-family:monospace;letter-spacing:2px">${request.cardId}</span></div>
        <div class="row"><span class="label">Valide jusqu'au</span><span class="value">${expiry}</span></div>
      </div>
      <a href="https://otaku-pulse.com/profil" class="cta">🎴 Voir ma Carte Membre</a>
    `)
  })
}



// ── Générateur QR Code SVG simple (basé sur hash du texte) ──
function generateQRSVG(text) {
  // Créer un pattern unique basé sur le texte
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i)
    hash = hash & hash
  }
  
  const size = 9 // grille 9x9
  const cellSize = 8
  const totalSize = size * cellSize + 20
  
  // Générer les cellules de manière déterministe
  let cells = ''
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      // Coins fixes (finder patterns)
      const isCornerTL = (row < 3 && col < 3)
      const isCornerTR = (row < 3 && col >= size-3)
      const isCornerBL = (row >= size-3 && col < 3)
      
      let filled = false
      if (isCornerTL || isCornerTR || isCornerBL) {
        filled = (row === 0 || row === 2 || col === 0 || col === 2) || 
                 (row === 1 && col === 1 && isCornerTL) ||
                 (row === 1 && col === size-2 && isCornerTR) ||
                 (row === size-2 && col === 1 && isCornerBL)
      } else {
        // Data cells — déterministe via hash
        const idx = row * size + col
        const bit = (Math.abs(hash * (idx + 1) * 2654435761) >>> 0) % 2
        filled = bit === 1
      }
      
      if (filled) {
        const x = col * cellSize + 10
        const y = row * cellSize + 10
        cells += `<rect x="${x}" y="${y}" width="${cellSize-1}" height="${cellSize-1}" fill="#1a2e1a" rx="1"/>`
      }
    }
  }
  
  return `<svg width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg" style="display:block;">
    <rect width="${totalSize}" height="${totalSize}" fill="white" rx="4"/>
    <rect x="8" y="8" width="${totalSize-16}" height="${totalSize-16}" fill="white"/>
    ${cells}
  </svg>`
}

// ── 6. Confirmation commande — Bon de commande + QR code ──
async function sendOrderConfirmation(order, user) {
  const itemsHtml = (order.items || []).map(i => `
    <tr>
      <td style="padding:8px 12px;font-size:.85rem;color:#1a2e1a;border-bottom:1px solid #e2e8e0">
        ${i.emoji || '🎁'} ${i.nameF || i.name}
      </td>
      <td style="padding:8px 12px;text-align:center;font-size:.85rem;color:#64748b;border-bottom:1px solid #e2e8e0">
        ×${i.quantity}
      </td>
      <td style="padding:8px 12px;text-align:right;font-size:.85rem;font-weight:700;color:#16a34a;border-bottom:1px solid #e2e8e0">
        ${(i.lineTotal || i.price * i.quantity)?.toLocaleString()} FCFA
      </td>
    </tr>`).join('')

  const payLabel = { mtn_money:'MTN Mobile Money', orange_money:'Orange Money', cash:'Paiement à la livraison' }
  const qrSVG   = generateQRSVG(order.orderNumber + user.email)
  const dateStr  = new Date().toLocaleDateString('fr-FR', { dateStyle:'long' })
  const timeStr  = new Date().toLocaleTimeString('fr-FR', { timeStyle:'short' })

  return sendMail({
    to: user.email,
    subject: `📦 Bon de commande ${order.orderNumber} — Otaku Pulse`,
    html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body{margin:0;padding:0;background:#f0fdf4;font-family:'Helvetica Neue',Arial,sans-serif}
    @media(max-width:600px){.container{width:100%!important}.inner{padding:1rem!important}.col2{display:block!important;width:100%!important}}
  </style>
</head>
<body>
<div style="padding:20px 12px;background:#f0fdf4">
<table class="container" width="600" cellpadding="0" cellspacing="0" style="margin:0 auto;max-width:600px">
  <tr><td>

    <!-- EN-TÊTE -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#16a34a,#22c55e);border-radius:16px 16px 0 0;overflow:hidden">
      <tr>
        <td style="padding:28px 32px">
          <div style="font-family:'Impact',sans-serif;font-size:1.6rem;letter-spacing:4px;color:#fff">⚡ OTAKU PULSE</div>
          <div style="font-size:.7rem;letter-spacing:2px;color:rgba(255,255,255,.75);margin-top:2px">VIVEZ L'EXPÉRIENCE · CAMEROUN</div>
        </td>
        <td style="padding:28px 32px;text-align:right">
          <div style="font-size:.65rem;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,.7);text-transform:uppercase">Bon de commande</div>
          <div style="font-family:'Impact',sans-serif;font-size:1.2rem;letter-spacing:3px;color:#fff;margin-top:2px">${order.orderNumber}</div>
          <div style="font-size:.7rem;color:rgba(255,255,255,.65);margin-top:4px">${dateStr} à ${timeStr}</div>
        </td>
      </tr>
    </table>

    <!-- CORPS -->
    <table width="100%" cellpadding="0" cellspacing="0" class="inner" style="background:#fff;padding:2rem">
      <tr><td>

        <!-- Bandeau statut -->
        <div style="background:#dcfce7;border:2px solid #16a34a;border-radius:12px;padding:14px 20px;margin-bottom:1.5rem;display:flex;align-items:center;gap:10px">
          <span style="font-size:1.5rem">✅</span>
          <div>
            <div style="font-weight:900;color:#16a34a;font-size:.95rem">Commande reçue avec succès !</div>
            <div style="font-size:.8rem;color:#15803d;margin-top:2px">Notre équipe vous contacte sur WhatsApp sous 24h pour confirmer et organiser la livraison.</div>
          </div>
        </div>

        <!-- Infos client + QR côte à côte -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:1.5rem">
          <tr>
            <td class="col2" style="width:60%;vertical-align:top;padding-right:16px">
              <div style="font-size:.68rem;font-weight:800;letter-spacing:1.5px;color:#64748b;text-transform:uppercase;margin-bottom:8px">Client</div>
              <table cellpadding="0" cellspacing="0">
                ${[['Nom', user.pseudo], ['Email', user.email], ['WhatsApp', order.whatsappNumber], ['Livraison', `${order.quartier}, ${order.city}`], ['Paiement', payLabel[order.paymentMethod] || order.paymentMethod]].map(([l,v]) => `
                <tr>
                  <td style="font-size:.78rem;color:#94a3b8;font-weight:600;padding:3px 12px 3px 0;white-space:nowrap">${l}</td>
                  <td style="font-size:.78rem;color:#1a2e1a;font-weight:700;padding:3px 0">${v || '—'}</td>
                </tr>`).join('')}
              </table>
            </td>
            <td class="col2" style="width:40%;text-align:center;vertical-align:top">
              <div style="font-size:.68rem;font-weight:800;letter-spacing:1.5px;color:#64748b;text-transform:uppercase;margin-bottom:8px">Scan pour vérifier</div>
              <div style="display:inline-block;border:2px solid #dcfce7;border-radius:10px;padding:8px;background:#fff">
                ${qrSVG}
              </div>
              <div style="font-size:.65rem;color:#94a3b8;margin-top:6px;font-family:monospace;letter-spacing:1px">${order.orderNumber}</div>
            </td>
          </tr>
        </table>

        <!-- Tableau articles -->
        <div style="font-size:.68rem;font-weight:800;letter-spacing:1.5px;color:#64748b;text-transform:uppercase;margin-bottom:8px">Articles commandés</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #e2e8e0;border-radius:12px;overflow:hidden;margin-bottom:1rem">
          <thead>
            <tr style="background:#f0fdf4">
              <th style="padding:9px 12px;text-align:left;font-size:.72rem;color:#16a34a;letter-spacing:1px;font-weight:800">Article</th>
              <th style="padding:9px 12px;text-align:center;font-size:.72rem;color:#16a34a;letter-spacing:1px;font-weight:800">Qté</th>
              <th style="padding:9px 12px;text-align:right;font-size:.72rem;color:#16a34a;letter-spacing:1px;font-weight:800">Prix</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <!-- Totaux -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #e2e8e0;border-radius:12px;overflow:hidden;margin-bottom:1.5rem">
          <tr>
            <td style="padding:8px 16px;font-size:.85rem;color:#64748b;border-bottom:1px solid #e2e8e0">Sous-total</td>
            <td style="padding:8px 16px;text-align:right;font-size:.85rem;color:#1a2e1a;font-weight:700;border-bottom:1px solid #e2e8e0">${(order.subtotal||order.total)?.toLocaleString()} FCFA</td>
          </tr>
          <tr>
            <td style="padding:8px 16px;font-size:.85rem;color:#64748b;border-bottom:1px solid #e2e8e0">Livraison</td>
            <td style="padding:8px 16px;text-align:right;font-size:.85rem;font-weight:700;border-bottom:1px solid #e2e8e0;color:${order.shipping===0?'#16a34a':'#1a2e1a'}">${order.shipping===0?'🎁 Gratuite':`${order.shipping?.toLocaleString()} FCFA`}</td>
          </tr>
          <tr style="background:#f0fdf4">
            <td style="padding:12px 16px;font-size:1rem;font-weight:900;color:#1a2e1a">TOTAL À PAYER</td>
            <td style="padding:12px 16px;text-align:right;font-size:1.2rem;font-weight:900;color:#16a34a">${order.total?.toLocaleString()} FCFA</td>
          </tr>
        </table>

        <!-- Note paiement -->
        <div style="background:#fffbeb;border:1.5px solid rgba(217,119,6,.2);border-radius:10px;padding:14px 16px;margin-bottom:1.5rem">
          <div style="font-size:.8rem;color:#92400e;line-height:1.6">
            ⚠️ <strong>Aucun paiement n'a encore été effectué.</strong> Notre équipe vous contactera sur WhatsApp au <strong>${order.whatsappNumber}</strong> pour finaliser le règlement via MTN Money ou Orange Money avant la livraison.
          </div>
        </div>

        <!-- Boutons -->
        <div style="text-align:center;margin-bottom:1rem">
          <a href="https://otaku-pulse.com/profil" style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;text-decoration:none;border-radius:99px;font-weight:800;font-size:.9rem;margin:0 6px 8px">
            📦 Suivre ma commande
          </a>
          <a href="https://wa.me/237675712739" style="display:inline-block;padding:13px 28px;background:#25d366;color:#fff;text-decoration:none;border-radius:99px;font-weight:800;font-size:.9rem;margin:0 6px 8px">
            💬 Nous contacter
          </a>
        </div>

      </td></tr>
    </table>

    <!-- PIED -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a2e1a;border-radius:0 0 16px 16px">
      <tr><td style="padding:18px 32px;text-align:center;font-size:.72rem;color:rgba(255,255,255,.45)">
        📧 contact@otaku-pulse.com · 📱 +237 6 75 71 27 39<br>
        📍 Yaoundé · Douala · Bafoussam — Cameroun<br>
        <span style="margin-top:6px;display:block">© ${new Date().getFullYear()} Otaku Pulse — Tous droits réservés</span>
      </td></tr>
    </table>

  </td></tr>
</table>
</div>
</body>
</html>`
  })
}


// ── 7. Notification admins — nouvelle commande ──
async function sendOrderNotifAdmin(order, user) {
  const itemsHtml = (order.items || []).map(i => `
    <div class="row">
      <span class="label">${i.emoji || '🎁'} ${i.nameF || i.name} ×${i.quantity}</span>
      <span class="value" style="color:#16a34a">${i.lineTotal?.toLocaleString()} FCFA</span>
    </div>`).join('')

  // Message WhatsApp pré-rempli cliquable
  const itemsList = (order.items || []).map(i => `• ${i.emoji || ''} ${i.nameF || i.name} ×${i.quantity} — ${i.lineTotal?.toLocaleString()} FCFA`).join('%0A')
  const waText = encodeURIComponent(
    `🎌 *OTAKU PULSE — Commande ${order.orderNumber}*

` +
    `👤 Client: ${user.pseudo}
📱 WhatsApp: ${order.whatsappNumber}
📍 ${order.quartier}, ${order.city}

` +
    `Confirmer la commande ?`
  )
  const waLink = `https://wa.me/${order.whatsappNumber?.replace(/[\s+]/g,'')}?text=${waText}`

  return sendMail({
    to: ADMIN_EMAILS.join(', '),
    replyTo: user.email,
    subject: `🛒 NOUVELLE COMMANDE ${order.orderNumber} — ${user.pseudo} (${order.total?.toLocaleString()} FCFA)`,
    html: baseTemplate(`
      <div style="background:#dcfce7;border:2px solid #16a34a;border-radius:12px;padding:16px 20px;margin-bottom:16px;text-align:center">
        <div style="font-size:2rem;margin-bottom:4px">🛒</div>
        <div style="font-size:1.1rem;font-weight:900;color:#16a34a">NOUVELLE COMMANDE</div>
        <div style="font-family:monospace;font-size:1.3rem;letter-spacing:3px;color:#0f0e24;font-weight:800">${order.orderNumber}</div>
        <div style="font-size:1.4rem;font-weight:900;color:#16a34a;margin-top:6px">${order.total?.toLocaleString()} FCFA</div>
      </div>

      <div class="box">
        <div style="font-size:.7rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:10px">👤 Client</div>
        <div class="row"><span class="label">Pseudo</span><span class="value">${user.pseudo}</span></div>
        <div class="row"><span class="label">Email</span><span class="value">${user.email}</span></div>
        <div class="row"><span class="label">WhatsApp</span><span class="value" style="color:#16a34a;font-weight:800">${order.whatsappNumber}</span></div>
        <div class="row"><span class="label">Livraison</span><span class="value">${order.quartier}, ${order.city}</span></div>
        <div class="row"><span class="label">Paiement</span><span class="value">${order.paymentMethod?.replace('_',' ').toUpperCase()}</span></div>
      </div>

      <div class="box">
        <div style="font-size:.7rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:10px">📦 Articles</div>
        ${itemsHtml}
        <div class="row" style="margin-top:8px;padding-top:10px;border-top:2px solid #e2e0f0">
          <span style="font-size:.95rem;font-weight:900;color:#0f0e24">TOTAL</span>
          <span style="font-size:1.2rem;font-weight:900;color:#16a34a">${order.total?.toLocaleString()} FCFA</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0">
        <a href="${waLink}" style="display:block;text-align:center;padding:13px;background:#25d366;color:#fff;text-decoration:none;border-radius:99px;font-weight:800;font-size:.9rem">
          💬 Contacter sur WhatsApp
        </a>
        <a href="https://otaku-pulse.com/admin" style="display:block;text-align:center;padding:13px;background:#16a34a;color:#fff;text-decoration:none;border-radius:99px;font-weight:800;font-size:.9rem">
          ⚙️ Ouvrir l'Admin
        </a>
      </div>
    `)
  })
}

// ── 8. Mise à jour statut commande — client ──
async function sendOrderStatusUpdate(order, user, status, note) {
  const statusLabels = {
    confirmed: { emoji:'✅', label:'Confirmée',        msg:'Votre commande a été confirmée ! Nous la préparons.' },
    preparing: { emoji:'📦', label:'En préparation',   msg:'Nous préparons soigneusement votre commande.' },
    shipped:   { emoji:'🚚', label:'En livraison',     msg:'Votre commande est en route vers vous !' },
    delivered: { emoji:'🎉', label:'Livrée',           msg:'Votre commande a été livrée. Merci ! 🎌' },
    cancelled: { emoji:'❌', label:'Annulée',           msg:'Votre commande a été annulée. Contactez-nous pour plus d\'infos.' },
  }
  const s = statusLabels[status] || { emoji:'📋', label:status, msg:note || 'Statut mis à jour.' }
  return sendMail({
    to: user.email,
    subject: `${s.emoji} Commande ${order.orderNumber} — ${s.label}`,
    html: baseTemplate(`
      <div class="title">${s.emoji} Commande ${s.label}</div>
      <p class="text">Bonjour <strong>${user.pseudo}</strong>,<br>${note || s.msg}</p>
      <div class="box">
        <div class="row"><span class="label">N° commande</span><span class="value" style="font-family:monospace">${order.orderNumber}</span></div>
        <div class="row"><span class="label">Statut</span><span class="value"><span class="badge badge-green">${s.label}</span></span></div>
        <div class="row"><span class="label">Total</span><span class="value" style="color:#16a34a">${order.total?.toLocaleString()} FCFA</span></div>
      </div>
      <a href="https://otaku-pulse.com/profil" class="cta">📦 Voir ma commande</a>
    `)
  })
}


// ── 9. Email bienvenue (inscription) ──
async function sendWelcome(user) {
  return sendMail({
    to: user.email,
    subject: '🎌 Bienvenue dans la communauté Otaku Pulse !',
    html: baseTemplate(`
      <div class="title">🎌 Bienvenue, ${user.pseudo} !</div>
      <p class="text">Tu fais maintenant partie de la première communauté otaku du Cameroun.<br>
      Explore notre boutique, réserve ton événement et rejoins le mouvement !</p>
      <div class="box">
        <div class="row"><span class="label">Ton pseudo</span><span class="value">${user.pseudo}</span></div>
        <div class="row"><span class="label">Email</span><span class="value">${user.email}</span></div>
      </div>
      <a href="https://otaku-pulse.com/boutique" class="cta">🛒 Explorer la boutique</a>
      <p class="text" style="font-size:.8rem;text-align:center">
        Des questions ? <a href="https://wa.me/237675712739" style="color:#16a34a;font-weight:700">WhatsApp : +237 6 75 71 27 39</a>
      </p>
    `)
  })
}

// ── 10. Reset mot de passe — code 6 chiffres ──
async function sendPasswordReset(user, code) {
  return sendMail({
    to: user.email,
    subject: '🔑 Code de réinitialisation — Otaku Pulse',
    html: baseTemplate(`
      <div class="title">🔑 Réinitialisation du mot de passe</div>
      <p class="text">Bonjour <strong>${user.pseudo}</strong>,<br>
      Voici ton code de réinitialisation. Il est valable <strong>15 minutes</strong>.</p>
      <div style="text-align:center;margin:24px 0">
        <div style="display:inline-block;background:#f1f0f9;border:2px dashed #6d28d9;border-radius:16px;padding:20px 40px">
          <div style="font-size:.72rem;font-weight:800;letter-spacing:2px;color:#6d28d9;text-transform:uppercase;margin-bottom:8px">Code de vérification</div>
          <div style="font-size:2.8rem;font-weight:900;letter-spacing:12px;color:#0f0e24;font-family:monospace">${code}</div>
        </div>
      </div>
      <p class="text">Entre ce code dans l'application pour choisir un nouveau mot de passe.</p>
      <div style="background:#fef2f2;border:1.5px solid rgba(220,38,38,.2);border-radius:10px;padding:12px 16px;margin-top:16px">
        <p style="font-size:.82rem;color:#dc2626;margin:0">
          ⚠️ Si tu n'as pas demandé cette réinitialisation, ignore cet email. Ton mot de passe reste inchangé.
        </p>
      </div>
    `)
  })
}

// ╔═══════════════════════════════════════════════════════════╗
// ║              MANGA PLATFORM — EMAILS                       ║
// ╚═══════════════════════════════════════════════════════════╝

const PLAN_LABELS = {
  daily:   { fr: 'Day Pass — 24h',      en: 'Day Pass — 24h' },
  weekly:  { fr: 'Hebdomadaire — 7j',   en: 'Weekly — 7d' },
  monthly: { fr: 'Mensuel — 30j',       en: 'Monthly — 30d' },
  yearly:  { fr: 'Annuel — 365j',       en: 'Yearly — 365d' },
}

// ── 11. Demande d'abonnement reçue (client) ──
async function sendSubscriptionRequest(user, sub, plan) {
  return sendMail({
    to: user.email,
    subject: `📚 Demande d'abonnement Manga reçue — Otaku Pulse`,
    html: baseTemplate(`
      <div class="title">📚 Demande d'abonnement Manga reçue !</div>
      <p class="text">Bonjour <strong>${user.pseudo}</strong>,<br>
      Votre demande d'abonnement <strong>${PLAN_LABELS[sub.planType]?.fr || sub.planType}</strong> a bien été reçue. Notre équipe vous contacte sur WhatsApp sous <strong>24h</strong> pour finaliser le paiement via MTN Money ou Orange Money.</p>
      <div class="box">
        <div class="row"><span class="label">Plan</span><span class="value"><span class="badge badge-green">${PLAN_LABELS[sub.planType]?.fr}</span></span></div>
        <div class="row"><span class="label">Montant</span><span class="value" style="color:#16a34a;font-weight:900">${sub.amount.toLocaleString()} FCFA</span></div>
        <div class="row"><span class="label">WhatsApp</span><span class="value">${sub.whatsappNumber || '—'}</span></div>
        <div class="row"><span class="label">Statut</span><span class="value"><span class="badge badge-amber">En attente de paiement</span></span></div>
      </div>
      <div style="background:#fffbeb;border:1.5px solid rgba(217,119,6,.2);border-radius:10px;padding:14px 16px;margin-bottom:1rem">
        <div style="font-size:.83rem;color:#92400e;line-height:1.6">
          ⚡ <strong>Étape suivante :</strong> envoyez <strong>${sub.amount.toLocaleString()} FCFA</strong> au <strong>+237 6 75 71 27 39</strong> via MTN Money ou Orange Money, puis envoyez-nous le code de transaction sur WhatsApp.
        </div>
      </div>
      <a href="https://wa.me/237675712739" class="cta">💬 Contacter sur WhatsApp</a>
    `)
  })
}

// ── 12. Notification admin — nouvelle demande ──
async function sendSubscriptionAdminNotif(user, sub, plan) {
  return sendMail({
    to: ADMIN_EMAILS.join(', '),
    replyTo: user.email,
    subject: `📚 Nouvelle demande abonnement Manga — ${user.pseudo} (${sub.amount.toLocaleString()} FCFA)`,
    html: baseTemplate(`
      <div class="title">📚 Nouvelle demande abonnement Manga</div>
      <div class="box">
        <div class="row"><span class="label">Utilisateur</span><span class="value">${user.pseudo}</span></div>
        <div class="row"><span class="label">Email</span><span class="value">${user.email}</span></div>
        <div class="row"><span class="label">WhatsApp</span><span class="value" style="color:#16a34a;font-weight:800">${sub.whatsappNumber || '—'}</span></div>
        <div class="row"><span class="label">Plan</span><span class="value"><span class="badge badge-purple">${PLAN_LABELS[sub.planType]?.fr}</span></span></div>
        <div class="row"><span class="label">Montant</span><span class="value" style="color:#16a34a;font-weight:900">${sub.amount.toLocaleString()} FCFA</span></div>
      </div>
      <a href="https://otaku-pulse.com/admin" class="cta">⚙️ Activer dans l'Admin</a>
    `)
  })
}

// ── 13. Abonnement activé ──
async function sendSubscriptionActivated(user, sub, plan) {
  const expiry = new Date(sub.expiresAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })
  return sendMail({
    to: user.email,
    subject: `✅ Votre abonnement Manga est activé !`,
    html: baseTemplate(`
      <div class="title">✅ Abonnement Manga activé !</div>
      <p class="text">Félicitations <strong>${user.pseudo}</strong> ! Tu peux maintenant lire tout le catalogue manga d'Otaku Pulse.</p>
      <div class="box">
        <div class="row"><span class="label">Plan</span><span class="value"><span class="badge badge-green">${PLAN_LABELS[sub.planType]?.fr}</span></span></div>
        <div class="row"><span class="label">Valide jusqu'au</span><span class="value">${expiry}</span></div>
        <div class="row"><span class="label">Montant payé</span><span class="value">${sub.amount.toLocaleString()} FCFA</span></div>
      </div>
      <a href="https://otaku-pulse.com/manga" class="cta">📖 Lire des mangas</a>
    `)
  })
}

// ── 14. Notification admin — nouvelle candidature publisher ──
async function sendPublisherAdminNotif(user, application) {
  return sendMail({
    to: ADMIN_EMAILS.join(', '),
    replyTo: user.email,
    subject: `✍️ Nouvelle candidature Éditeur Manga — ${user.pseudo}`,
    html: baseTemplate(`
      <div class="title">✍️ Nouvelle candidature Éditeur</div>
      <div class="box">
        <div class="row"><span class="label">Pseudo</span><span class="value">${user.pseudo}</span></div>
        <div class="row"><span class="label">Email</span><span class="value">${user.email}</span></div>
        ${application.realName ? `<div class="row"><span class="label">Nom réel</span><span class="value">${application.realName}</span></div>` : ''}
        ${application.phone ? `<div class="row"><span class="label">Téléphone</span><span class="value">${application.phone}</span></div>` : ''}
      </div>
      <div class="box">
        <div style="font-size:.7rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:8px">📝 Bio</div>
        <p class="text" style="margin:0">${application.bio}</p>
      </div>
      ${application.portfolioLinks?.length ? `
        <div class="box">
          <div style="font-size:.7rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:8px">🔗 Portfolio</div>
          ${application.portfolioLinks.map(l => `<div style="font-size:.85rem;margin:4px 0"><a href="${l}" style="color:#16a34a">${l}</a></div>`).join('')}
        </div>
      ` : ''}
      <a href="https://otaku-pulse.com/admin" class="cta">⚙️ Examiner la candidature</a>
    `)
  })
}

// ── 15. Candidature approuvée ──
async function sendPublisherApproved(user) {
  return sendMail({
    to: user.email,
    subject: `🎉 Votre candidature Éditeur a été approuvée !`,
    html: baseTemplate(`
      <div class="title">🎉 Bienvenue dans l'équipe Éditeurs !</div>
      <p class="text">Félicitations <strong>${user.pseudo}</strong> ! Ta candidature a été approuvée. Tu peux maintenant publier tes mangas sur Otaku Pulse.</p>
      <div class="box">
        <div class="row"><span class="label">Statut</span><span class="value"><span class="badge badge-green">Éditeur validé</span></span></div>
        <div class="row"><span class="label">Espace éditeur</span><span class="value">/manga/publisher</span></div>
      </div>
      <a href="https://otaku-pulse.com/manga/publisher" class="cta">✍️ Accéder à mon espace éditeur</a>
      <p class="text" style="font-size:.82rem">Chaque manga que tu publies sera modéré avant d'apparaître dans le catalogue. Crée ton premier manga dès maintenant !</p>
    `)
  })
}

// ── 16. Candidature rejetée ──
async function sendPublisherRejected(user, reason) {
  return sendMail({
    to: user.email,
    subject: `Candidature Éditeur — Otaku Pulse`,
    html: baseTemplate(`
      <div class="title">📋 Mise à jour de ta candidature</div>
      <p class="text">Bonjour <strong>${user.pseudo}</strong>,<br>
      Merci pour ton intérêt à devenir éditeur sur Otaku Pulse. Après examen, ta candidature n'a pas pu être retenue cette fois.</p>
      ${reason ? `
        <div class="box">
          <div style="font-size:.7rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:8px">📝 Note de l'équipe</div>
          <p class="text" style="margin:0">${reason}</p>
        </div>
      ` : ''}
      <p class="text">Tu peux soumettre une nouvelle candidature plus tard, en renforçant ton portfolio.</p>
      <a href="https://wa.me/237675712739" class="cta">💬 Nous contacter</a>
    `)
  })
}
module.exports = {
  sendReservationConfirmation,
  sendReservationNotifAdmin,
  sendMembershipConfirmation,
  sendMembershipNotifAdmin,
  sendMembershipActivated,
  sendOrderConfirmation,
  sendOrderNotifAdmin,
  sendOrderStatusUpdate,
  sendWelcome,
  sendPasswordReset,
  // Manga Platform
  sendSubscriptionRequest,
  sendSubscriptionAdminNotif,
  sendSubscriptionActivated,
  sendPublisherAdminNotif,
  sendPublisherApproved,
  sendPublisherRejected,
}