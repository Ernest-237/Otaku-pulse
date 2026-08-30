# Connexion Google

## Ce qui a été mis en place

Un bouton « Se connecter avec Google » dans la modale d'authentification du
`Navbar`, aux deux onglets (connexion et inscription). Le même bouton fait les
deux : si l'adresse Google est inconnue, le compte est créé à la volée.

**Aucune dépendance npm n'a été ajoutée**, ni côté serveur ni côté client.

## Fonctionnement

```
Navigateur                          Serveur                        Google
    │                                  │                              │
    │ 1. clic sur le bouton            │                              │
    ├──────────────── popup Google ────┼─────────────────────────────►│
    │◄─────────────── ID token (JWT) ──┼──────────────────────────────┤
    │                                  │                              │
    │ 2. POST /api/auth/google         │                              │
    │    { credential }                │                              │
    ├─────────────────────────────────►│ 3. GET /oauth2/v3/certs      │
    │                                  ├─────────────────────────────►│
    │                                  │◄──── clés publiques (JWKS) ──┤
    │                                  │                              │
    │                                  │ 4. vérifie signature RS256,  │
    │                                  │    aud, iss, email_verified  │
    │                                  │ 5. crée ou rattache le compte│
    │◄──── accessToken + refreshToken ─┤                              │
```

L'étape 4 est la seule qui compte pour la sécurité. Trois contrôles sont
obligatoires et tous les trois sont faits dans `server/services/googleAuth.js` :

| Contrôle | Pourquoi |
|---|---|
| Signature RS256 contre les clés publiques Google | Sans, n'importe qui forge un jeton |
| `aud` = notre `GOOGLE_CLIENT_ID` | Sans, un jeton émis pour **une autre application Google** serait accepté |
| `email_verified === true` | Sans, on pourrait revendiquer l'adresse d'un compte existant et en prendre le contrôle |

### Pourquoi pas `google-auth-library`

Les trois contrôles ci-dessus sont exactement ce que fait la librairie officielle.
Node 24 sait convertir une JWK en clé publique nativement
(`crypto.createPublicKey({ format: 'jwk' })`), et `jsonwebtoken` est déjà une
dépendance du projet. La librairie n'aurait rien apporté de plus.

### Pourquoi pas l'endpoint `/tokeninfo`

Google propose `oauth2.googleapis.com/tokeninfo?id_token=…`, qui fait la
vérification à notre place. C'est plus simple, mais ça ajoute un aller-retour
réseau **bloquant sur le chemin critique de la connexion**. Le backend tourne sur
Render en plan gratuit, où la latence est déjà un problème : on évite tout ce qui
rallonge un login. Les clés publiques sont mises en cache selon l'en-tête
`Cache-Control` renvoyé par Google, donc après le premier appel il n'y a plus
aucun trafic sortant.

## Configuration

### 1. Créer l'identifiant OAuth

Sur <https://console.cloud.google.com/apis/credentials> :

1. **Créer des identifiants** → **ID client OAuth 2.0**
2. Type d'application : **Application Web**
3. **Origines JavaScript autorisées** — c'est le champ qui compte :
   ```
   http://localhost:5173
   https://otaku-pulse.com
   https://www.otaku-pulse.com
   ```
4. **URI de redirection autorisés** : *laisser vide*. Google Identity Services
   fonctionne en mode popup et n'en utilise pas.

Le **client secret n'est pas nécessaire** : le flux se déroule dans le navigateur
et le serveur ne fait que vérifier une signature.

### 2. Renseigner la variable

Dans `server/.env` en local, et dans les variables d'environnement Render en
production :

```
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
```

**Si la variable est absente, la connexion Google est désactivée** :
`GET /api/auth/google/config` renvoie `{ enabled: false }` et le formulaire
email/mot de passe continue de fonctionner normalement. Il n'y a aucun risque à
laisser la variable vide.

Ce que voit l'utilisateur dans ce cas dépend du mode :

| Mode | Affichage |
|---|---|
| `npm run dev` | Un bouton **grisé** avec la mention « Inactif : ajoute `GOOGLE_CLIENT_ID` » |
| Build de production | **Rien du tout** |

Cette distinction est volontaire. En production, un bouton mort déroute le
visiteur. En développement, ne rien afficher donne l'impression que
l'intégration n'a pas été faite — alors qu'il ne manque qu'une clé.

Le frontend n'a **aucune** variable à configurer : il lit le Client ID depuis
l'API. C'est délibéré — une variable `VITE_` est inlinée dans le bundle au build,
et la changer imposerait un redéploiement complet du frontend.

## Effets sur le modèle `User`

Deux colonnes ajoutées (`server/models/index.js`) :

| Colonne | Rôle |
|---|---|
| `googleId` | `sub` du jeton Google, unique. Jamais exposé par `toJSON()` |
| `authProvider` | `'local'` ou `'google'` |

`comparePassword()` a été durci : un compte créé via Google n'a pas de mot de
passe en base, et `bcrypt.compare(x, null)` lève une exception. La méthode
renvoie désormais `false`, ce qui produit un 401 propre au lieu d'une 500.

`sequelize.sync({ alter: true })` crée ces colonnes au premier démarrage — aucune
migration à lancer.

## Rattachement de compte

Si quelqu'un s'est inscrit avec `jean@gmail.com` par mot de passe, puis se
connecte plus tard avec Google sur la même adresse, **les deux comptes sont
fusionnés** : `googleId` est ajouté au compte existant, qui garde son mot de
passe, son historique, ses coins et ses commandes.

C'est sûr parce que Google a certifié que l'adresse est vérifiée
(`email_verified`) : l'utilisateur prouve qu'il la possède. Sans ce contrôle, ce
rattachement serait au contraire une prise de contrôle de compte.

## Génération du pseudo

Le modèle impose 3-20 caractères dans `[a-zA-Z0-9_-]`. Un nom Google comme
« José Ngué Ébolo » ne passe pas tel quel. `generateUniquePseudo()` translittère
(`José` → `Jose`), retire ce qui reste d'invalide, puis suffixe d'un nombre si le
pseudo est déjà pris (`jose`, `jose2`, `jose3`…).

## Points à vérifier au premier test

- **`origin_mismatch`** dans la console du navigateur : l'origine n'est pas
  déclarée dans la console Google. C'est de loin l'erreur la plus fréquente.
- **Le bouton ne s'affiche pas** : `GOOGLE_CLIENT_ID` absent côté serveur.
  Vérifier avec `curl https://…/api/auth/google/config`.
- **« Jeton Google invalide »** : le `GOOGLE_CLIENT_ID` du serveur ne correspond
  pas à celui utilisé par le navigateur.
