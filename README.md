# ⚡ OTAKU PULSE

<div align="center">

![Otaku Pulse Banner](public/img/deku.jpg)

### 🎌 Premier service événementiel Otaku clé en main au Cameroun

*"Vivez l'expérience au-delà de l'écran"*

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Sequelize](https://img.shields.io/badge/Sequelize-6-52B0E7?style=flat-square&logo=sequelize&logoColor=white)](https://sequelize.org)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)

**[🌐 Site Web](https://otaku-pulse.com)** • **[📬 Contact](mailto:contact@otaku-pulse.com)**

</div>

---

## 📖 À propos du projet

**Otaku Pulse** est une plateforme web fullstack pour un service événementiel spécialisé dans l'immersion manga/anime au Cameroun. Elle combine une vitrine commerciale, une boutique de goodies, un système de réservation d'événements et un dashboard d'administration complet.

### 🎯 Concept
Otaku Pulse transforme n'importe quel espace en univers manga en proposant 3 niveaux d'expérience :

| Pack | Prix | Cible |
|------|------|-------|
| 🥋 **GENIN** | 85 000 FCFA | Petits comités 5–12 personnes |
| ⚔️ **CHŪNIN** | 200 000 FCFA | Salons, jardins, salles de fête |
| 👑 **HOKAGE** | 450 000 FCFA | Événements extérieurs 80+ personnes |

---

## 🚀 Stack Technique

### Frontend
- **Vite.js** + Vanilla JavaScript (ES Modules)
- CSS Variables + animations custom
- Responsive design mobile-first
- Bilingue FR/EN

### Backend
- **Node.js** + **Express.js**
- **Sequelize ORM** + **PostgreSQL**
- **JWT** (access token + refresh token)
- Rate limiting, Helmet, CORS

### Infrastructure
- 🌐 **Frontend** → Hostinger (static hosting)
- 🖥️ **Backend** → Render (Node.js Web Service)
- 🗄️ **Base de données** → Render (PostgreSQL)

---

## 📁 Structure du projet

```
otaku-pulse/
│
├── 📄 index.html              # Entry point HTML
├── 📄 vite.config.js          # Config Vite
├── 📄 package.json            # Dépendances frontend
│
├── 📁 public/                 # Assets statiques
│   ├── img/deku.jpg
│   └── assets/music/
│       └── generique.mp3      # Musique anime
│
├── 📁 src/                    # Code source frontend
│   ├── api.js                 # Couche API centrale
│   ├── main.js                # Point d'entrée JS
│   ├── styles/main.css        # CSS global
│   └── components/
│       ├── navbar.js          # Navigation + Auth
│       ├── hero.js            # Section hero
│       ├── services.js        # Nos packs
│       ├── boutique.js        # Shop + panier
│       ├── events.js          # Événements
│       ├── apropos.js         # À propos
│       ├── contact.js         # Formulaire réservation
│       └── footer.js          # Footer + Newsletter
│
├── 📁 public_html/            # Upload sur Hostinger
│   ├── .htaccess
│   └── admin.html             # Dashboard admin
│
└── 📁 server/                 # Backend Node.js
    ├── index.js               # Serveur Express
    ├── package.json
    ├── .env.example
    ├── config/
    │   └── database.js        # Connexion PostgreSQL
    ├── models/
    │   └── index.js           # Modèles Sequelize
    ├── middleware/
    │   └── auth.js            # JWT middleware
    ├── routes/
    │   ├── auth.js            # /api/auth/*
    │   ├── users.js           # /api/users/*
    │   ├── products.js        # /api/products/*
    │   ├── orders.js          # /api/orders/*
    │   ├── events.js          # /api/events/*
    │   ├── contact.js         # /api/contact/*
    │   ├── newsletter.js      # /api/newsletter/*
    │   ├── payment.js         # /api/payment/*
    │   └── admin.js           # /api/admin/*
    └── utils/
        └── seed.js            # Données initiales
```

---

## ⚙️ Installation & Développement local

### Prérequis
- [Node.js](https://nodejs.org) v18 ou supérieur
- [PostgreSQL](https://www.postgresql.org/download/) v14+
- [Git](https://git-scm.com)

---

### 1. Cloner le projet

```bash
git clone https://github.com/TON_USERNAME/otaku-pulse.git
cd otaku-pulse
```

---

### 2. Installer le frontend

```bash
# À la racine du projet
npm install
```

---

### 3. Installer le backend

```bash
cd server
npm install
```

---

### 4. Configurer les variables d'environnement

```bash
cd server
cp .env.example .env
```

Ouvre `.env` et remplis :

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# PostgreSQL local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=otakupulse
DB_USER=postgres
DB_PASSWORD=ton_mot_de_passe

# JWT
JWT_SECRET=une_chaine_aleatoire_longue_ici
JWT_REFRESH_SECRET=une_autre_chaine_differente

# Admin par défaut
ADMIN_EMAIL=admin@otaku-pulse.com
ADMIN_PASSWORD=Admin2026!
```

---

### 5. Créer la base de données

```bash
# Avec psql
psql -U postgres -c "CREATE DATABASE otakupulse;"

# Ou via pgAdmin : créer une DB nommée "otakupulse"
```

---

### 6. Peupler la base de données

```bash
# Depuis le dossier server/
node utils/seed.js
```

Résultat attendu :
```
✅ PostgreSQL connecté
✅ Tables synchronisées
👤 Admin créé
📦 10 produits insérés
🎌 Événement créé
⚡ SEED TERMINÉ
```

---

### 7. Lancer le backend

```bash
# Depuis server/
npm run dev
# → Serveur sur http://localhost:5000
```

Vérification :
```bash
curl http://localhost:5000/api/health
# {"status":"OK","db":"connected"}
```

---

### 8. Lancer le frontend

```bash
# Depuis la racine du projet
npm run dev
# → Site sur http://localhost:5173
```

---

## 🏗️ Build & Déploiement

### Build du frontend

```bash
# À la racine
npm run build
# → Génère le dossier dist/
```

### Déploiement Frontend → Hostinger

1. Uploader le contenu de `dist/` dans `public_html/`
2. Uploader `public_html/admin.html` dans `public_html/`
3. S'assurer que `.htaccess` est présent

### Déploiement Backend → Render

1. Push le code sur GitHub
2. Sur [render.com](https://render.com) → New Web Service
3. Connecter le repo GitHub
4. Configuration :
   ```
   Root Directory  : server
   Build Command   : npm install
   Start Command   : node index.js
   ```
5. Ajouter les variables d'environnement dans le dashboard Render

### Base de données → Render PostgreSQL

1. Sur Render → New PostgreSQL → Free plan
2. Copier l'`External Database URL`
3. L'ajouter comme variable `DATABASE_URL` dans le Web Service

---

## 📡 API Endpoints

### Authentification
```
POST   /api/auth/register         Inscription
POST   /api/auth/login            Connexion
POST   /api/auth/refresh          Renouveler token
POST   /api/auth/logout           Déconnexion
GET    /api/auth/me               Profil connecté
POST   /api/auth/forgot-password  Mot de passe oublié
```

### Produits (public)
```
GET    /api/products              Liste avec filtres
GET    /api/products/:slug        Détail produit
```

### Événements (public)
```
GET    /api/events                Liste événements
GET    /api/events/:id            Détail événement
POST   /api/events/register       S'inscrire (auth)
```

### Contact & Réservation
```
POST   /api/contact               Envoyer demande
POST   /api/newsletter/subscribe  S'abonner newsletter
```

### Admin (rôle admin/superadmin requis)
```
GET    /api/admin/dashboard       Stats globales
GET    /api/admin/users           Liste utilisateurs
PATCH  /api/admin/users/:id       Modifier utilisateur
GET    /api/admin/orders          Toutes les commandes
GET    /api/admin/contacts        Toutes les réservations
```

---

## 🔐 Accès Admin

```
URL      : https://otaku-pulse.com/admin.html
Email    : admin@otaku-pulse.com
Password : (défini dans .env → ADMIN_PASSWORD)
```

Le dashboard admin donne accès à :
- 📊 Statistiques en temps réel
- 📬 Gestion des réservations (statuts CRM)
- 🛒 Gestion des commandes
- 📦 CRUD produits boutique
- 🎌 Gestion des événements
- 👥 Gestion des utilisateurs

---

## 🌍 Thèmes anime disponibles

> 50+ thèmes disponibles pour la décoration événementielle

Naruto • One Piece • Jujutsu Kaisen • Dragon Ball Z • Demon Slayer •
Attack on Titan • My Hero Academia • Bleach • Hunter × Hunter •
Tokyo Ghoul • Fullmetal Alchemist • Death Note • + Personnalisé

---

## 🍸 Menu Cocktails Narratifs

| Cocktail | Univers | Description |
|----------|---------|-------------|
| 🌀 Le Rasengan | Naruto | Gin · Curaçao bleu · Tonic |
| 👊 Gomu Gomu Punch | One Piece | Rhum · Bissap · Grenadine |
| 🌌 Extension du Territoire | JJK | Vodka · Goyave · Fumée froide |
| 💚 Senzu Bean Shake | Dragon Ball Z | Coco · Avocat · Miel (sans alcool) |

---

## 💳 Paiements supportés

- 📱 **MTN Mobile Money** (Cameroun)
- 📱 **Orange Money** (Cameroun)
- 💳 **Stripe** (carte bancaire — à configurer)
- 🏦 **Virement bancaire**

---

## 🤝 Contribution

Les contributions sont les bienvenues !

```bash
# 1. Fork le projet
# 2. Créer une branche
git checkout -b feature/ma-fonctionnalite

# 3. Commit
git commit -m "feat: ajouter ma fonctionnalité"

# 4. Push
git push origin feature/ma-fonctionnalite

# 5. Ouvrir une Pull Request
```

---

## 📄 Licence

Ce projet est sous licence **MIT** — voir le fichier [LICENSE](LICENSE) pour les détails.

---

## 👤 Auteur

**Otaku Pulse** — Yaoundé, Cameroun 🇨🇲

- 📸 Instagram : [@otakupulse_cm](https://instagram.com/otakupulse_cm)
- 📘 Facebook : [Otaku Pulse CM](https://facebook.com/otakupulsecm)
- 🎵 TikTok : [@otakupulse](https://tiktok.com/@otakupulse)
- 💬 WhatsApp : +237 6XX XXX XXX

---

<div align="center">

⚡ *Made with passion in Cameroun* 🇨🇲

**Otaku Pulse v1.0.0** — 2026

</div>