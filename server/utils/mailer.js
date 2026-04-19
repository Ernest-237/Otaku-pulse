// server/utils/mailer.js — Service email Nodemailer
const nodemailer = require('nodemailer')

// ── Config transporteur ──────────────────────────────
// Variables d'environnement à ajouter dans Render :
// MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS
// Pour Gmail : activer "Mots de passe d'application" dans le compte Google

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.MAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.MAIL_PORT || '587'),
    secure: process.env.MAIL_PORT === '465',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  })
}

// ── Adresses admin ───────────────────────────────────
const ADMIN_EMAILS = [
  'contact@otaku-pulse.com',
  'contactotakufusion@gmail.com',
]

const FROM = '"Otaku Pulse ⚡" <contact@otaku-pulse.com>'

// ── Templates HTML ───────────────────────────────────
function baseTemplate(content) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin:0; padding:0; background:#f8f7ff; font-family:'Helvetica Neue',Arial,sans-serif; }
    .wrap { max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(30,27,75,.08); }
    .header { background:linear-gradient(135deg,#16a34a,#22c55e); padding:32px 40px; text-align:center; }
    .logo   { font-size:2rem; font-weight:900; letter-spacing:4px; color:#fff; margin-bottom:4px; }
    .tagline{ font-size:.8rem; color:rgba(255,255,255,.75); letter-spacing:2px; }
    .body   { padding:32px 40px; }
    .title  { font-size:1.4rem; font-weight:800; color:#0f0e24; margin-bottom:8px; }
    .text   { font-size:.92rem; color:#64748b; line-height:1.7; margin-bottom:16px; }
    .box    { background:#f1f0f9; border-radius:12px; padding:20px 24px; margin:20px 0; }
    .row    { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #e2e0f0; font-size:.88rem; }
    .row:last-child { border-bottom:none; }
    .label  { color:#64748b; font-weight:600; }
    .value  { color:#0f0e24; font-weight:700; text-align:right; }
    .badge  { display:inline-block; padding:4px 14px; border-radius:99px; font-size:.78rem; font-weight:800; }
    .badge-green  { background:#dcfce7; color:#16a34a; }
    .badge-purple { background:#ede9fe; color:#6d28d9; }
    .badge-amber  { background:#fffbeb; color:#d97706; }
    .cta    { display:block; text-align:center; padding:14px 28px; background:#16a34a; color:#fff; text-decoration:none; border-radius:99px; font-weight:800; font-size:.95rem; margin:24px 0; }
    .footer { background:#f1f0f9; padding:20px 40px; text-align:center; font-size:.75rem; color:#94a3b8; }
    .social { margin:8px 0; }
  </style>
</head>
<body>
  <div style="padding:24px 16px; background:#f8f7ff;">
    <div class="wrap">
      <div class="header">
        <div class="logo">⚡ OTAKU PULSE</div>
        <div class="tagline">VIVEZ L'EXPÉRIENCE</div>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        <div class="social">📧 contact@otaku-pulse.com · 📱 +237 6 75 71 27 39</div>
        <div>📍 Yaoundé · Douala · Bafoussam — Cameroun</div>
        <div style="margin-top:8px;">© ${new Date().getFullYear()} Otaku Pulse — Tous droits réservés</div>
      </div>
    </div>
  </div>
</body>
</html>`
}

// ── 1. Email confirmation client (réservation événement) ──
async function sendReservationConfirmation(contact) {
  const transporter = createTransporter()
  const packLabels = { genin:'Pack GENIN', chunin:'Pack CHŪNIN', hokage:'Pack HOKAGE' }
  const html = baseTemplate(`
    <div class="title">🎉 Réservation reçue !</div>
    <p class="text">Bonjour <strong>${contact.prenom} ${contact.nom}</strong>,<br>
    Merci pour votre demande de réservation chez <strong>Otaku Pulse</strong> ! Notre équipe vous contactera sous <strong>24 à 48h</strong> pour confirmer votre événement et établir le devis définitif.</p>
    <div class="box">
      <div class="row"><span class="label">Pack choisi</span><span class="value"><span class="badge badge-green">${packLabels[contact.pack] || contact.pack?.toUpperCase()}</span></span></div>
      <div class="row"><span class="label">Thème anime</span><span class="value">${contact.theme}</span></div>
      <div class="row"><span class="label">Date souhaitée</span><span class="value">${new Date(contact.date).toLocaleDateString('fr-FR',{dateStyle:'long'})}</span></div>
      <div class="row"><span class="label">Nombre d'invités</span><span class="value">${contact.guests} personnes</span></div>
      <div class="row"><span class="label">Ville</span><span class="value">${contact.ville}${contact.quartier ? ', ' + contact.quartier : ''}</span></div>
      <div class="row"><span class="label">Contact</span><span class="value">${contact.phone}</span></div>
    </div>
    <p class="text">En attendant, n'hésitez pas à explorer notre boutique ou à nous contacter sur WhatsApp.</p>
    <a href="https://wa.me/237675712739" class="cta">💬 Nous contacter sur WhatsApp</a>
    <p class="text" style="font-size:.8rem;color:#94a3b8;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
  `)
  await transporter.sendMail({
    from: FROM,
    to: contact.email,
    subject: `✅ Réservation reçue — ${packLabels[contact.pack] || contact.pack} | Otaku Pulse`,
    html,
  })
}

// ── 2. Email notification admins (réservation reçue) ──
async function sendReservationNotifAdmin(contact) {
  const transporter = createTransporter()
  const packLabels = { genin:'GENIN', chunin:'CHŪNIN', hokage:'HOKAGE' }
  const html = baseTemplate(`
    <div class="title">📬 Nouvelle réservation !</div>
    <p class="text">Une nouvelle demande de réservation a été soumise sur <strong>otaku-pulse.com</strong>.</p>
    <div class="box">
      <div class="row"><span class="label">Nom</span><span class="value">${contact.prenom} ${contact.nom}</span></div>
      <div class="row"><span class="label">Email</span><span class="value">${contact.email}</span></div>
      <div class="row"><span class="label">Téléphone</span><span class="value">${contact.phone}</span></div>
      <div class="row"><span class="label">Pack</span><span class="value"><span class="badge badge-purple">${packLabels[contact.pack] || contact.pack}</span></span></div>
      <div class="row"><span class="label">Thème</span><span class="value">${contact.theme}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${new Date(contact.date).toLocaleDateString('fr-FR',{dateStyle:'long'})}</span></div>
      <div class="row"><span class="label">Invités</span><span class="value">${contact.guests}</span></div>
      <div class="row"><span class="label">Ville</span><span class="value">${contact.ville}${contact.quartier ? ', ' + contact.quartier : ''}</span></div>
      ${contact.message ? `<div class="row"><span class="label">Message</span><span class="value" style="max-width:220px;">${contact.message}</span></div>` : ''}
    </div>
    <a href="https://otaku-pulse.com/admin" class="cta">⚙️ Gérer dans le Dashboard Admin</a>
  `)
  await transporter.sendMail({
    from: FROM,
    to: ADMIN_EMAILS.join(', '),
    subject: `🎌 Nouvelle réservation — ${contact.prenom} ${contact.nom} (${(packLabels[contact.pack]||'').toUpperCase()})`,
    html,
    replyTo: contact.email,
  })
}

// ── 3. Email demande carte membre (client) ──
async function sendMembershipConfirmation(request) {
  const transporter = createTransporter()
  const planLabels = { basic:'Pulse Basic ⚡', plus:'Pulse Plus 🔥', elite:'Pulse Elite 👑' }
  const html = baseTemplate(`
    <div class="title">🎴 Demande de Carte Membre reçue !</div>
    <p class="text">Bonjour <strong>${request.nom}</strong>,<br>
    Votre demande d'adhésion au programme <strong>Carte Membre Otaku Pulse</strong> a bien été reçue. Notre équipe vous contacte sous <strong>24h</strong> pour finaliser votre abonnement.</p>
    <div class="box">
      <div class="row"><span class="label">Plan choisi</span><span class="value"><span class="badge badge-purple">${planLabels[request.plan] || request.plan}</span></span></div>
      <div class="row"><span class="label">Ville</span><span class="value">${request.ville}</span></div>
      <div class="row"><span class="label">Contact</span><span class="value">${request.phone}</span></div>
    </div>
    <p class="text">Une fois votre abonnement activé, vous recevrez votre <strong>Carte Membre numérique</strong> avec votre identifiant unique et votre QR code.</p>
    <a href="https://otaku-pulse.com/membership" class="cta">🎴 En savoir plus sur la Carte Membre</a>
  `)
  await transporter.sendMail({
    from: FROM,
    to: request.email,
    subject: `🎴 Demande Carte Membre reçue — ${planLabels[request.plan] || request.plan} | Otaku Pulse`,
    html,
  })
}

// ── 4. Email notification admins (demande carte membre) ──
async function sendMembershipNotifAdmin(request) {
  const transporter = createTransporter()
  const planLabels = { basic:'Basic', plus:'Plus', elite:'Elite' }
  const html = baseTemplate(`
    <div class="title">🎴 Nouvelle demande Carte Membre</div>
    <div class="box">
      <div class="row"><span class="label">Nom</span><span class="value">${request.nom}</span></div>
      <div class="row"><span class="label">Email</span><span class="value">${request.email}</span></div>
      <div class="row"><span class="label">Téléphone</span><span class="value">${request.phone}</span></div>
      <div class="row"><span class="label">Plan</span><span class="value"><span class="badge badge-amber">${planLabels[request.plan]?.toUpperCase() || request.plan}</span></span></div>
      <div class="row"><span class="label">Ville</span><span class="value">${request.ville}</span></div>
      ${request.message ? `<div class="row"><span class="label">Message</span><span class="value">${request.message}</span></div>` : ''}
    </div>
    <a href="https://otaku-pulse.com/admin" class="cta">⚙️ Activer la carte dans l'Admin</a>
  `)
  await transporter.sendMail({
    from: FROM,
    to: ADMIN_EMAILS.join(', '),
    subject: `🎴 Nouvelle demande Carte Membre — ${request.nom} (${(planLabels[request.plan]||'').toUpperCase()})`,
    html,
    replyTo: request.email,
  })
}

// ── 5. Email activation carte membre (client) ──
async function sendMembershipActivated(request) {
  const transporter = createTransporter()
  const planLabels = { basic:'Pulse Basic ⚡', plus:'Pulse Plus 🔥', elite:'Pulse Elite 👑' }
  const expiry = request.expiresAt
    ? new Date(request.expiresAt).toLocaleDateString('fr-FR',{dateStyle:'long'})
    : 'Non définie'
  const html = baseTemplate(`
    <div class="title">✅ Votre Carte Membre est activée !</div>
    <p class="text">Félicitations <strong>${request.nom}</strong> !<br>
    Votre <strong>Carte Membre Otaku Pulse</strong> est maintenant active. Bienvenue dans la communauté !</p>
    <div class="box">
      <div class="row"><span class="label">Plan</span><span class="value"><span class="badge badge-purple">${planLabels[request.plan] || request.plan}</span></span></div>
      <div class="row"><span class="label">ID Carte</span><span class="value" style="font-family:monospace;letter-spacing:2px;">${request.cardId}</span></div>
      <div class="row"><span class="label">Valide jusqu'au</span><span class="value">${expiry}</span></div>
    </div>
    <p class="text">Connectez-vous à votre profil pour accéder à votre carte membre numérique et découvrir vos avantages exclusifs.</p>
    <a href="https://otaku-pulse.com/profil" class="cta">🎴 Voir ma Carte Membre</a>
  `)
  await transporter.sendMail({
    from: FROM,
    to: request.email,
    subject: `✅ Carte Membre activée — ${request.cardId} | Otaku Pulse`,
    html,
  })
}

module.exports = {
  sendReservationConfirmation,
  sendReservationNotifAdmin,
  sendMembershipConfirmation,
  sendMembershipNotifAdmin,
  sendMembershipActivated,
}