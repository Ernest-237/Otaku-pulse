# Otaku-verse : le Château de l’Infini

La rubrique **Otaku-verse**, accessible depuis la navigation et à l’adresse `/otaku-verse`, propose une exploration interactive inspirée de l’univers de *Demon Slayer*. Il s’agit d’une création de fan avec une architecture et une ambiance sonore originales.

## Visiter

Le bouton **Entrer dans le château** ouvre la visite. Le bouton **Quitter le château** permet de revenir à l’accueil de la rubrique à tout moment. Aucun compte n’est nécessaire.

La **Carte du château** donne accès aux salles et permet de se déplacer sans devoir maîtriser les commandes de la scène. Trois interactions font progresser la visite :

1. **Galerie des lanternes** : éveiller les lanternes pour obtenir le sceau de la lumière.
2. **Escaliers suspendus** : sceller le passage pour obtenir le sceau du passage.
3. **Chambre du biwa** : faire résonner le biwa pour obtenir le sceau de la résonance et transformer le décor.

Ces trois sceaux ouvrent **Le cœur du château**. Il n’y a ni achat, ni monnaie virtuelle, ni limite de temps.

Le panneau **Aide** rappelle les commandes. La touche **Échap** ferme le panneau ouvert ; pendant l’exploration, elle ouvre le menu de pause. **Reprendre la visite** referme ce menu.

| Action | Ordinateur | Mobile |
| --- | --- | --- |
| Regarder | Maintenir le clic et glisser sur le décor | Glisser un doigt sur le décor |
| Marcher | ZQSD, WASD ou flèches, après avoir sélectionné la scène | Maintenir les flèches de déplacement à l’écran |
| Interagir | Approcher un objet et presser E ou cliquer dessus ; le bouton de la salle reste disponible | Toucher un objet proche ou utiliser le bouton de la salle |
| Choisir une salle | Carte du château | Carte du château |

## Confort et sauvegarde

- Le son reste coupé tant que le visiteur ne l’active pas. Il s’agit de sons synthétisés dans le navigateur : aucun morceau de l’anime n’est téléchargé.
- Le **Mode calme** limite les mouvements du décor. La préférence de réduction des animations du navigateur est prise en compte.
- La progression reste sur l’appareil, dans `localStorage` sous la clé `op_otaku_verse_v1`. Elle ne nécessite aucune écriture dans l’API. Effacer les données du site supprime cette progression.
- Lorsque WebGL n’est pas disponible, la carte et les interactions permettent de poursuivre la visite guidée.

## Vérification locale

Démarrer le serveur Vite, puis exécuter :

```powershell
node scripts/verify-otaku-verse.cjs <chemin-vers-le-package-playwright>
```

Le script utilise Microsoft Edge en mode headless. La variable `VERSE_PREVIEW_URL` permet de choisir une autre adresse que `http://127.0.0.1:5173`.

Les vérifications couvrent l’entrée et la sortie (y compris depuis la pause), la carte, les trois sceaux, le verrouillage du cœur, la sauvegarde, le son, le déplacement au clavier, la souris, les gestes tactiles, les modes portrait et paysage, le mode calme et l’absence de WebGL. Tous les appels API sont interceptés ; aucune donnée réelle n’est écrite. Les captures de contrôle sont produites dans `.preview.local/`.

Ajouter `--mobile-only` après le chemin du package Playwright pour vérifier uniquement les parcours mobiles et les mises en page portrait/paysage.
