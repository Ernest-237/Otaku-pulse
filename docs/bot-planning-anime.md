# Bot du planning anime

Le planning se remplit **tout seul**, sans aucune intervention. La saisie
manuelle reste possible à tout moment et n'est jamais écrasée.

## Ce que le bot importe

Trois passes complémentaires à chaque synchronisation :

| Passe | Contenu |
|---|---|
| **En cours** | Les animés en diffusion, triés par popularité |
| **À venir** | La saison suivante (annonces) |
| **Tendances** | Ce qui monte cette saison |

Pour chaque animé : titre (romaji + anglais), synopsis, affiche haute
résolution, bannière, studio, note, genres, nombre d'épisodes, lien AniList,
bande-annonce YouTube, et surtout **le prochain épisode avec sa date et son
jour de diffusion** — c'est ce qui alimente « ça sort cette semaine ».

## Quand il tourne

| Moment | Ce qu'il fait |
|---|---|
| **04h00** (heure du Cameroun) | Synchronisation complète + nettoyage des séries terminées |
| **Toutes les 6 heures** | Rafraîchissement du calendrier de diffusion |
| **Au premier démarrage** | Remplissage initial si la base est vide |

Deux fréquences parce que les fiches (titre, synopsis, affiche) ne bougent
quasiment jamais, alors que le prochain épisode change à chaque diffusion. Tout
resynchroniser toutes les 6 h serait du gaspillage ; ne le faire qu'une fois par
jour laisserait le calendrier faux la moitié du temps.

## Source des données

**AniList** — `https://graphql.anilist.co`. Gratuit, **sans clé d'API**, rien à
configurer.

Choisi plutôt que Jikan/MyAnimeList parce qu'une seule requête GraphQL ramène
tendances, saison à venir *et* calendrier de diffusion. Jikan aurait imposé
3 requêtes/seconde et plusieurs appels séparés pour le même résultat.

Le bot fait 3 requêtes par passage, très loin du plafond d'AniList (~90/min), et
les espace de 700 ms par correction.

## La règle d'or : le travail manuel est intouchable

**Deux protections, jamais contournées :**

1. Une fiche **`source: 'manual'`** — créée à la main via « + Anime » — n'est
   jamais touchée par le bot, même si son titre correspond à un animé AniList.
2. Une fiche **verrouillée** (`isLocked`) est ignorée par le bot.

### Le verrouillage est automatique

Dès que tu **modifies le contenu** d'une fiche importée (titre, synopsis,
affiche, opening…), elle se verrouille toute seule. Le bot ne la réécrira plus
jamais.

Sans ce mécanisme, chaque passage nocturne effacerait ton travail — une
traduction française du synopsis aurait disparu le lendemain matin.

Les champs **purement d'affichage** (`order`, `isActive`) ne verrouillent pas :
réordonner le carrousel ne doit pas figer la fiche pour toujours.

Le cadenas 🔒 dans la liste permet de verrouiller/déverrouiller à la main.
Déverrouiller rend la fiche au bot — utile pour annuler une retouche ratée.

## Pilotage

**Admin → Planning Anime**. Le panneau du haut affiche le nombre de fiches
importées, manuelles, verrouillées, en cours et à venir, la date de la dernière
synchronisation, et un bouton **« Synchroniser maintenant »**.

Chaque fiche porte son origine : badge **AniList** pour une fiche importée,
badge **Verrouillée** quand le bot ne peut plus y toucher.

## Affichage

Les animés apparaissent automatiquement dans le carrousel du **Hero** (page
d'accueil) et de la page **Fandom** — le composant `AnimeCarousel` existait
déjà et consomme `GET /api/anime`. Aucune modification n'a été nécessaire de ce
côté : il suffisait de remplir la table.

## Choix techniques

### Les affiches sont stockées en URL, pas en base64

Le modèle `Anime` stocke les images téléversées en base64 dans Postgres —
cohérent pour un upload manuel. Pour l'import, ce serait catastrophique :
40 animés × ~250 Ko à chaque passage feraient gonfler la base de 10 Mo par
synchronisation, sur un Render en plan gratuit.

Les affiches AniList sont donc référencées par leur URL CDN (`coverImageUrl`).
Une image téléversée à la main l'emporte toujours sur celle importée : si un
admin a pris la peine d'uploader la sienne, c'est un choix délibéré.

> ⚠️ **Piège** : `coverUrl` vaut soit un chemin relatif (`/api/anime/…/cover`),
> soit une URL absolue vers le CDN. Le helper `resolveCover()` distingue les
> deux — préfixer aveuglément par `API_BASE` casserait les images importées.

### Le synopsis français est laissé vide

AniList ne fournit pas de traduction française. Le bot remplit `synopsisE` et
laisse `synopsisF` vide : l'affichage retombe sur l'anglais, et tu peux traduire
à ton rythme — la fiche se verrouille alors d'elle-même.

Recopier l'anglais dans le champ français en le faisant passer pour du français
aurait été pire que de laisser vide.

### Le bot ne peut pas faire tomber l'API

Il démarre **après** `app.listen()` et attrape ses propres erreurs. Si AniList
est injoignable, le planning ne se met pas à jour — la boutique, les commandes
et les factures continuent de fonctionner normalement. Un verrou empêche aussi
deux synchronisations simultanées.

## Configuration

Rien n'est obligatoire. Deux variables facultatives :

```
ANIME_SYNC_ENABLED=true          # `false` pour désactiver le bot
CRON_TZ=Africa/Douala            # sinon node-cron suit l'UTC de Render
```

Sans `CRON_TZ`, « 04h00 » tomberait à 5h du matin heure du Cameroun.

## API

| Route | Auth | Rôle |
|---|---|---|
| `GET /api/anime` | ❌ publique | Liste (alimente le carrousel) |
| `POST /api/anime/sync` | ✅ admin | Forcer une synchronisation |
| `GET /api/anime/sync/status` | ✅ admin | Compteurs + dernière synchro |
| `PATCH /api/anime/:id/lock` | ✅ admin | (Dé)verrouiller une fiche |
| `POST /api/anime` | ✅ admin | Création manuelle (`source: 'manual'`) |

## Tests

```bash
cd server && npm test     # 20 cas sur le bot
```

Couvrent le nettoyage HTML des synopsis, la troncature sans couper de mot, la
correspondance des statuts, le passage d'année en décembre, et la robustesse
face à une entrée AniList quasi vide (annonce sans date ni titre anglais).

## Fichiers

| Fichier | Rôle |
|---|---|
| `server/services/animeSync.js` | Client AniList, normalisation, upsert |
| `server/services/animeSync.test.js` | 20 tests |
| `server/jobs/animeCron.js` | Planification node-cron |
| `server/routes/anime.js` | Routes de pilotage + verrouillage |
| `server/models/index.js` | Champs `source`, `externalId`, `isLocked`… |
| `src/pages/Admin/sections/AnimeSection.jsx` | Panneau de contrôle |
| `src/components/AnimeCarousel.jsx` | Carrousel Hero + Fandom |
