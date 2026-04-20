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


// ── 6. Confirmation commande — client ──
async function sendOrderConfirmation(order, user) {
  const itemsHtml = (order.items || []).map(i => `
    <div class="row">
      <span class="label">${i.emoji || '🎁'} ${i.nameF || i.name} <span style="color:#94a3b8">×${i.quantity}</span></span>
      <span class="value" style="color:#16a34a">${i.lineTotal?.toLocaleString()} FCFA</span>
    </div>`).join('')

  const payLabel = { mtn_money:'MTN Mobile Money', orange_money:'Orange Money', cash:'Paiement à la livraison' }

  return sendMail({
    to: user.email,
    subject: `✅ Commande confirmée ${order.orderNumber} — Otaku Pulse`,
    html: baseTemplate(`
      <div class="title">🎌 Commande reçue avec succès !</div>
      <p class="text">Bonjour <strong>${user.pseudo}</strong>,<br>
      Merci pour votre confiance ! Votre commande <strong>${order.orderNumber}</strong> a bien été enregistrée.
      Notre équipe vous contactera sur WhatsApp sous <strong>24h</strong> pour confirmer le paiement et organiser la livraison.</p>

      <div class="box" style="border-left:4px solid #16a34a">
        <div style="font-size:.7rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#16a34a;margin-bottom:10px">📦 Récapitulatif de commande</div>
        ${itemsHtml}
        <div class="row" style="margin-top:8px;padding-top:10px;border-top:2px solid #e2e0f0">
          <span class="label">Livraison</span>
          <span class="value" style="color:${order.shipping === 0 ? '#16a34a' : '#1e1b4b'}">${order.shipping === 0 ? '🎁 Gratuite' : order.shipping?.toLocaleString() + ' FCFA'}</span>
        </div>
        <div class="row" style="padding:10px 0 0">
          <span class="label" style="font-size:.95rem;font-weight:900;color:#0f0e24">TOTAL À PAYER</span>
          <span style="font-size:1.3rem;font-weight:900;color:#16a34a">${order.total?.toLocaleString()} FCFA</span>
        </div>
      </div>

      <div class="box">
        <div style="font-size:.7rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-bottom:10px">🚚 Informations de livraison</div>
        <div class="row"><span class="label">N° commande</span><span class="value" style="font-family:monospace;letter-spacing:2px;color:#6d28d9">${order.orderNumber}</span></div>
        <div class="row"><span class="label">Quartier</span><span class="value">${order.quartier}, ${order.city}</span></div>
        <div class="row"><span class="label">WhatsApp</span><span class="value">${order.whatsappNumber}</span></div>
        <div class="row"><span class="label">Paiement</span><span class="value">${payLabel[order.paymentMethod] || order.paymentMethod}</span></div>
      </div>

      <div style="background:#fffbeb;border:1.5px solid rgba(217,119,6,.2);border-radius:10px;padding:14px 18px;margin:16px 0">
        <p style="font-size:.85rem;color:#92400e;margin:0;line-height:1.6">
          ⚠️ <strong>Important :</strong> Notre équipe vous contactera sur WhatsApp au numéro <strong>${order.whatsappNumber}</strong> pour valider le paiement.
          Conservez ce numéro accessible.
        </p>
      </div>

      <a href="https://otaku-pulse.com/profil" class="cta">📦 Suivre ma commande en ligne</a>

      <p class="text" style="font-size:.8rem;text-align:center">
        Des questions ? Contactez-nous directement :<br>
        <a href="https://wa.me/237675712739" style="color:#16a34a;font-weight:700">💬 WhatsApp : +237 6 75 71 27 39</a>
      </p>
    `)
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
    cancelled: { emoji:'❌', label:'Annulée',           msg:'Votre commande a été annulée. Contactez-nous pour plus d'infos.' },
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

module.exports = {
  sendReservationConfirmation,
  sendReservationNotifAdmin,
  sendMembershipConfirmation,
  sendMembershipNotifAdmin,
  sendMembershipActivated,
  sendOrderConfirmation,
  sendOrderNotifAdmin,
  sendOrderStatusUpdate,
}