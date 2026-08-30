# Phase 1 — Couche de paiement abstraite + Fapshi

> **Statut : EN ATTENTE.** Aucune ligne de code écrite. Le chantier démarre à la
> réception des clés API sandbox Fapshi. Ce document fige les décisions prises
> pendant l'exploration du dépôt pour qu'elles ne soient pas reperdues.

## 1. Ce qui est réutilisé

| Brique existante | Fichier | Usage |
|---|---|---|
| Auth JWT + rôles | `server/middleware/auth.js` | Tel quel, aucune modification |
| Client HTTP unique | `src/api.js` | Ajout d'un objet `paymentsApi` |
| Mailer templaté | `server/utils/mailer.js` | Ajout de `sendPaymentReceipt()` |
| Modale bloquante | `src/components/PolicyGate.jsx` | Squelette du futur popup de CG |
| Flux MoMo manuel | `server/routes/coins.js` + `adminCoins.js` | Modèle de référence de la machine à états |
| Admin par sections | `src/pages/Admin/index.jsx` | Ajout d'une section `payments` |

## 2. Décisions actées

### 2.1 Préfixe `league_*` pour la Ligue de quiz

La table `quiz_questions` **existe déjà** (module Fandom, `models/index.js`), avec
un schéma incompatible (options en JSONB, `correctIndex`, pas de `sessionId`).
Réutiliser ce nom casserait le Fandom en silence, car `sequelize.sync({ alter: true })`
tenterait d'altérer la table existante au lieu d'échouer.

Toutes les tables de la Ligue sont donc préfixées : `league_seasons`,
`league_sessions`, `league_questions`, `league_options`, `league_entries`,
`league_answers`, `league_standings`. Le `purpose` de paiement correspondant est
`LEAGUE_ENTRY` et non `QUIZ_ENTRY`.

### 2.2 Le webhook Fapshi n'est jamais une source de vérité

Fapshi n'émet pas de signature HMAC : il envoie un header `x-wh-secret` contenant
le secret en clair, configuré dans le tableau de bord. C'est un mot de passe
partagé, pas une preuve d'intégrité du corps de la requête.

**Règle non négociable :** le webhook est un simple signal de réveil. À sa
réception, on rappelle `GET /payment-status/{transId}` chez Fapshi ; c'est cette
réponse serveur-à-serveur, authentifiée par nos clés API, qui fait foi. Le corps
du webhook est journalisé dans `payment_events` mais ne déclenche jamais un
crédit à lui seul.

Conséquence heureuse : webhook et polling deviennent deux déclencheurs
strictement équivalents du même chemin de vérification.

### 2.3 Conventions de nommage

`tableName` en snake_case (`payments`), **colonnes en camelCase** (`amountMinor`),
comme les 33 modèles existants. Le SQL du brief d'origine est en snake_case
intégral : on ne le suit pas, sous peine de casser les `include` Sequelize et de
rendre `models/index.js` illisible.

### 2.4 Convention de montant

Les montants sont des entiers en unité mineure. **Le XAF n'a pas de sous-unité :
500 FCFA se stocke `500`.** Pour CAD/EUR/USD, l'unité mineure est le centime.
Toute conversion vit dans `services/payments/currency.js`, jamais dans un contrôleur.

## 3. Frictions relevées, à trancher avant de coder

1. **`/api/payment/confirm` est une faille ouverte** — `server/routes/payment.js`
   passe n'importe quelle commande en `paid` pour tout utilisateur authentifié,
   sans contrôle de propriétaire (contrairement à `/initiate`). À colmater en
   priorité, indépendamment de Fapshi.
2. **Migrations** — le dépôt n'en a aucune (`sync({ alter: true })`). Proposition :
   `umzug` limité aux nouvelles tables, le reste du dépôt inchangé. *Accord requis.*
3. **Tests** — aucun framework. Proposition : `node:test` (zéro dépendance). *Accord requis.*
4. **Rate limit** — `index.js` applique 300 req/15 min par IP sur `/api/`. Le polling
   (36 req/paiement) et le NAT opérateur camerounais épuiseraient le quota. Il faut
   un limiteur dédié sur l'endpoint de statut, clé `req.user.id` au lieu de l'IP.
5. **Raw body** — `express.json` global rend inopérant le `express.raw()` du webhook
   Stripe existant (`body-parser` pose `req._body = true`). Sans impact pour Fapshi
   (pas de HMAC), bloquant pour Stripe plus tard. Correctif : option `verify` sur
   `express.json` pour capturer `req.rawBody`.
6. **SMTP absent** — `server/.env` ne contient ni `MAIL_USER` ni `MAIL_PASS`.
   `createTransporter()` retourne `null` et tous les emails sont avalés
   silencieusement. À vérifier côté Render.

## 4. Arborescence prévue

```
server/services/payments/
  index.js               resolveProvider(), createPayment(), applyStatus()
  PaymentProvider.js     contrat abstrait + NotSupportedError
  errors.js              mapping code Fapshi -> message français
  phone.js               normalisation +237, détection MTN/Orange
  currency.js            unités mineures
  providers/fapshi.js
  providers/stripe.js    stub

server/routes/payments.js       création, statut, retry
server/routes/webhooks.js       POST /api/webhooks/fapshi
server/routes/adminPayments.js  écran admin
server/jobs/paymentPoller.js    filet de sécurité node-cron
```

## 5. Machine à états

```js
const ALLOWED = {
  CREATED:    ['PENDING','FAILED','EXPIRED'],
  PENDING:    ['SUCCESSFUL','FAILED','EXPIRED'],
  SUCCESSFUL: ['REFUNDED'],
  FAILED: [], EXPIRED: [], REFUNDED: [],
}
```

`applyStatus()` s'exécute dans une transaction avec `SELECT ... FOR UPDATE`
(`lock: t.LOCK.UPDATE`) sur la ligne. Une transition non autorisée est journalisée
et ignorée, jamais appliquée. Les effets métier (créditer des coins, créer un
entitlement) se déclenchent sur la **transition** vers `SUCCESSFUL`, jamais sur
l'**état** — c'est ce qui garantit l'exécution exactement-une-fois quand le
webhook et le poller arrivent simultanément.

## 6. Référence API Fapshi

- Sandbox : `https://sandbox.fapshi.com` (clés `FAK_TEST_...`)
- Live : `https://live.fapshi.com` (clés `FAK_...`)
- Auth : headers `apiuser` et `apikey`
- Endpoints : `POST /initiate-pay`, `POST /direct-pay`, `GET /payment-status/{transId}`,
  `POST /expire-pay`, `GET /balance`, `POST /payout`
- Statuts : `CREATED`, `PENDING`, `SUCCESSFUL`, `FAILED`, `EXPIRED`
- Webhook : header `x-wh-secret`, payload identique à la réponse de `payment-status`

Sources : <https://docs.fapshi.com/en/api-reference/endpoint/webhook>, <https://github.com/Fapshi/php-sdk>

## 7. Éléments attendus pour démarrer

- `FAPSHI_API_USER`, `FAPSHI_API_KEY` (sandbox, préfixe `FAK_TEST_`), `FAPSHI_WEBHOOK_SECRET`
- Confirmation que `MAIL_USER` / `MAIL_PASS` sont renseignés sur Render
- Une URL publique pour tester le webhook en local (ngrok / tunnel Cloudflare),
  ou test direct sur Render en sandbox
