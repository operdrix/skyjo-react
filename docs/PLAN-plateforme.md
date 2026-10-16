# Plan : plateforme multi-jeux olivgames.fr et Banco

> PRD source : `docs/PRD-plateforme.md`

## Décisions architecturales

Décisions durables qui s'appliquent à toutes les phases :

- **Un seul front, jeu choisi par le domaine** : la même image sert le portail (`olivgames.fr`) et chaque jeu (un sous-domaine par jeu). Le domaine visité détermine ce qui s'affiche ; le code de chaque jeu est chargé à la demande. En local, le jeu se choisit sans sous-domaine, par un réglage de dev.
- **Une seule API** sur `api.olivgames.fr`. La session reste un cookie httpOnly posé par l'API : tous les sous-domaines appellent la même API, donc la connexion est partagée sans cookie à cheval sur plusieurs domaines. Chaque domaine de jeu est ajouté aux origines autorisées (CORS et Better Auth). L'ancienne adresse `api-skyjo` disparaît : une reconnexion unique est demandée à tous, les comptes restent intacts.
- **Schéma** : colonne `games.game_type` (`colonnes` | `banco`), `colonnes` pour les parties existantes (migration). `game_data` a une forme propre à chaque jeu. Les autres tables (`users`, `game_players`, sessions) sont communes.
- **Moteur** : chaque jeu fournit un module pur, sans accès base ni socket : mise en place d'une manche, intention → nouvel état (refus si coup impossible), vue masquée pour un joueur, fin de manche, scores, fin de partie, nombre de joueurs autorisé. Le socle commun garde salons, rooms, accusés, présence avec délai de grâce, rejouer, invités, historique et pages légales.
- **API** : la création de partie prend un `type`. La liste des parties publiques et l'historique sont filtrés par `type`. Un seul événement `play-move { room, move, ... }`, avec des intentions propres à chaque jeu. Les cartes non révélées ne quittent jamais le serveur, quel que soit le jeu.
- **Routes front** : sur un domaine de jeu, routes inchangées (`/create`, `/public-rooms`, `/join/:id`, `/game/:id`, historique). Sur le portail : accueil (liste des jeux), `/auth/*`, `/dashboard`, pages légales. Les pages d'auth d'un jeu renvoient vers celles du portail.
- **Retour après connexion** : `?redirect=` peut viser un autre sous-domaine, mais uniquement sur un domaine olivgames.fr connu (pas de redirection ouverte).
- **Thèmes** : `users.theme` reste global ; chaque domaine garde sa copie locale, resynchronisée depuis le compte.
- **Noms** : « Banco » et « Colonnes » sont provisoires. Les noms internes (dépôt, images Docker, base) ne changent pas dans ce plan.
- **Release** : uniquement quand toutes les phases sont fusionnées sur `dev` (phase 8).

---

## Phase 1 : moteur générique et type de jeu

**User stories** : US-15

### Ce qu'on livre

Le jeu actuel devient le jeu `colonnes` d'un socle commun, sans aucun changement visible pour les joueurs. Les parties existantes prennent le type `colonnes`. La création accepte un type (`colonnes` par défaut) ; la liste publique et l'historique filtrent par type. Le serveur choisit les règles d'une partie selon son type.

### Critères d'acceptation

- [x] Migration : les parties existantes ont le type `colonnes` (vérifié sur la base de dev, colonne `NOT NULL DEFAULT 'colonnes'`).
- [x] Test d'API : une partie créée sans type est de type `colonnes` ; un type inconnu est refusé avec un message.
- [x] Test d'API : liste publique et historique ne renvoient que les parties du type demandé.
- [x] Tous les tests existants (règles, websocket, invités, cartes masquées) passent sans modification de comportement.
- [ ] Contrôle manuel : une partie complète à 2 joueurs dans le navigateur, identique à avant.
- [x] `make check` vert.

## Bloquée par

Aucune — démarrable immédiatement.

---

## Phase 2 : Banco jouable, nombres seuls

**User stories** : US-16, US-18, US-19, US-20, US-21, US-22, US-23, US-29, US-31, US-33, US-35, US-36, US-37, US-38, US-39, US-40, US-41, US-42, US-43

### Ce qu'on livre

Une partie de Banco se joue de bout en bout avec les cartes nombres (0 à 12, n exemplaires de n, un seul 0). Création publique ou privée, invitation par lien, invités, salle d'attente, lancement de 2 à 8 joueurs. À son tour, le joueur choisit « Encore » ou « Stop ». Un doublon l'élimine de la manche avec 0 point. 7 nombres différents donnent +15 et arrêtent la manche. Chaque joueur voit les cartes de tous, leur total provisoire et leur état (en jeu, arrêté, éliminé), ainsi que le dernier tirage. Les résultats de manche s'affichent au centre de la table. Le premier joueur tourne à chaque manche. La partie s'arrête à la fin d'une manche où quelqu'un atteint 200 points ; le plus haut total gagne, avec des vainqueurs ex æquo en cas d'égalité. On peut rejouer, et l'historique de Banco liste les parties. Un joueur parti est passé sans bloquer la partie. La pioche n'est jamais visible.

### Critères d'acceptation

- [ ] Tests unitaires des règles : paquet de nombres, Encore, Stop, doublon à 0 point, bonus de 7 nombres et fin de manche, fin de manche quand tous sont arrêtés ou éliminés, rotation du premier joueur, fin à 200, égalité.
- [ ] Test d'API : création d'une partie Banco, de 2 à 8 joueurs, refus hors limites.
- [ ] Test websocket : partie jouée par intentions jusqu'à la fin ; coup hors de son tour refusé avec un message.
- [ ] Test websocket : aucune carte de la pioche dans les réponses HTTP ni dans les diffusions.
- [ ] Test websocket : un joueur déconnecté au-delà du délai de grâce est passé ; reconnexion dans le délai sans perte.
- [ ] Test d'API : un invité rejoint et joue une partie Banco.
- [ ] Tests de composant : boutons Encore/Stop actifs seulement à son tour, état des joueurs, résultats de manche, écran de fin.
- [ ] Contrôle manuel à 3 joueurs (navigateur + robots), sur mobile compris.
- [ ] `make check` vert.

## Bloquée par

- Phase 1

---

## Phase 3 : Banco, modificateurs

**User stories** : US-30

### Ce qu'on livre

Les 6 modificateurs (+2, +4, +6, +8, +10, ×2) entrent dans le paquet. Ils sont posés devant le joueur, ne comptent pas comme des nombres (ni doublon, ni dans les 7 nombres) et apparaissent dans le total provisoire : somme des nombres, doublée par le ×2, puis ajout des +, puis bonus de 7 nombres. Un joueur éliminé marque 0 malgré ses modificateurs.

### Critères d'acceptation

- [ ] Tests unitaires : calcul du score avec et sans ×2, avec plusieurs +, avec bonus de 7 ; modificateurs exclus du doublon et des 7 nombres ; 0 point en cas de doublon.
- [ ] Test de composant : modificateurs affichés à part des nombres, total provisoire juste.
- [ ] `make check` vert.

## Bloquée par

- Phase 2

---

## Phase 4 : Banco, cartes action et aide de jeu

**User stories** : US-24, US-25, US-26, US-27, US-28, US-32, US-34

### Ce qu'on livre

Le paquet complet de 94 cartes. Une carte action tirée demande au joueur de choisir une cible parmi les joueurs en jeu, lui compris. S'il est seul en jeu, l'action s'applique à lui. Gel arrête la cible, qui garde ses points. Trois d'un coup fait tirer 3 cartes une à une à la cible ; ce tirage s'arrête au premier doublon ou à 7 nombres, et les actions tirées pendant sont résolues après. Seconde chance annule le prochain doublon (les deux cartes sont défaussées). Une deuxième Seconde chance se donne à un autre joueur en jeu qui n'en a pas, ou se défausse. Quand la pioche est vide, la défausse est mélangée pour la reformer. Un bouton « Règles » ouvre en partie une aide de jeu rédigée pour le site.

### Critères d'acceptation

- [ ] Tests unitaires : chaque action, choix de cible valide ou refusé, cible unique automatique, enchaînements pendant Trois d'un coup, Seconde chance (usage, don, défausse), pioche reformée.
- [ ] Test websocket : une intention de cible est refusée si la cible n'est pas en jeu ; aucune carte de la pioche ne fuit après remélange.
- [ ] Test de composant : choix de cible, état « Seconde chance » visible, aide de jeu accessible pendant la partie.
- [ ] Texte de l'aide de jeu rédigé sans reprendre le livret d'origine ni le nom des cartes d'origine.
- [ ] Contrôle manuel d'une partie complète à 3 joueurs jusqu'à 200 points.
- [ ] `make check` vert.

## Bloquée par

- Phase 3

---

## Phase 5 : portail et sous-domaines

**User stories** : US-1, US-2, US-3, US-4, US-5, US-6, US-9, US-11, US-12

### Ce qu'on livre

Le front choisit ce qu'il affiche selon le domaine : le portail sur `olivgames.fr`, un jeu sur chaque sous-domaine. Le portail présente une carte par jeu (nom, 2 à 8 joueurs, durée indicative) qui ouvre le jeu. Inscription, connexion, choix du pseudo, mot de passe oublié et pages légales vivent sur le portail ; un jeu y renvoie, et le joueur revient ensuite sur la page d'origine. Une seule API sert tous les domaines : connecté une fois, connecté partout, avec le même pseudo et le même thème. La déconnexion vaut partout. Les pages légales décrivent les domaines et le partage de la session entre eux.

### Critères d'acceptation

- [ ] Test unitaire : correspondance domaine → portail ou jeu, et réglage de dev sans sous-domaine.
- [ ] Test unitaire : `?redirect=` accepté vers un domaine olivgames.fr connu, refusé ailleurs (retour à l'accueil).
- [ ] Test d'API : origines de tous les domaines autorisées (CORS et auth), une origine inconnue refusée.
- [ ] Tests de composant : liste des jeux du portail ; page d'un jeu non connecté qui renvoie vers la connexion du portail avec retour.
- [ ] Contrôle manuel avec plusieurs domaines locaux (image `make full` ou hôtes locaux) : connexion sur le portail, ouverture de deux jeux sans reconnexion, déconnexion depuis un jeu visible dans l'autre, Google compris.
- [ ] Pages légales à jour.
- [ ] `make check` vert.

## Bloquée par

- Phase 1

---

## Phase 6 : espace personnel multi-jeux

**User stories** : US-7, US-8, US-10, US-17

### Ce qu'on livre

L'espace personnel du portail affiche le nombre de parties jouées par jeu et les dernières parties (jeu, date, résultat), chacune avec un lien vers son sous-domaine. Sans partie, il invite à choisir un jeu. La suppression du compte efface les données de tous les jeux. Un invité qui crée un compte garde ses parties de tous les jeux.

### Critères d'acceptation

- [ ] Test d'API : résumé par jeu et dernières parties, tous types confondus ; refusé aux invités comme l'historique.
- [ ] Test d'API : la conversion d'un invité transfère ses parties Colonnes et Banco ; la suppression d'un compte efface ses lignes de joueur des deux jeux.
- [ ] Tests de composant : résumé, liens vers le bon sous-domaine, état vide.
- [ ] `make check` vert.

## Bloquée par

- Phase 2
- Phase 5

---

## Phase 7 : Skyjo devient Colonnes

**User stories** : US-13, US-14, US-15

### Ce qu'on livre

Le jeu actuel s'appelle Colonnes partout où un joueur peut le voir : titres, en-têtes, métadonnées, mails, textes, logo et visuels. Ses règles sont réécrites avec nos propres mots. L'ancien sous-domaine et les anciens liens de partie et de salle d'attente redirigent vers Colonnes, sur la même page. Les parties passées apparaissent dans l'historique de Colonnes.

### Critères d'acceptation

- [ ] Recherche dans le code servi au navigateur, les mails et les métadonnées : aucune occurrence de « Skyjo » ni de « Flip 7 » visible par un joueur.
- [ ] Règles de Colonnes réécrites, sans reprendre le livret d'origine.
- [ ] Test : un ancien lien `/join/:id` ou `/game/:id` sur l'ancien domaine mène à la même partie sur Colonnes (règle de redirection testée en local).
- [ ] Contrôle manuel : un compte existant retrouve tout son historique dans Colonnes.
- [ ] `make check` vert.

## Bloquée par

- Phase 5

---

## Phase 8 : mise en production

**User stories** : aucune (critères de succès 3, 9 et 10 du PRD)

### Ce qu'on livre

Les noms définitifs remplacent « Banco » et « Colonnes » après vérification des marques. Les domaines sont créés chez l'hébergeur (portail, API, un sous-domaine par jeu), avec la redirection de l'ancien sous-domaine Skyjo. Les variables d'environnement de production (origines, adresse de l'API, OAuth Google) sont mises à jour. La release est publiée.

### Critères d'acceptation

- [ ] Noms définitifs vérifiés dans les bases INPI et TMview (classes 28 et 41), résultat noté dans `docs/IDEES-JEUX.md`.
- [ ] Noms provisoires remplacés partout, sous-domaines compris.
- [ ] Domaines et certificats en place ; redirection de l'ancien sous-domaine vérifiée en production.
- [ ] URI de redirection Google mise à jour pour la nouvelle adresse de l'API.
- [ ] Pages légales à jour (domaines, hébergement).
- [ ] Après la release : connexion sur le portail, une partie Colonnes et une partie Banco jouées en production, déconnexion partout.

## Bloquée par

- Phases 1 à 7
