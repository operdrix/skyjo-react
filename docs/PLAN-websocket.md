# Plan : fiabilité et confidentialité du temps réel

> PRD source : `docs/PRD-websocket.md` (issu de l'audit websocket du 2026-10-05)

## Décisions architecturales

Décisions durables qui s'appliquent à toutes les phases :

- **Catalogue d'événements** : tous les événements client → serveur et serveur → client sont déclarés une seule fois, typés, dans les types partagés back/front. Plus de nom d'événement en chaîne libre.
- **Accusé de réception** : chaque événement envoyé par le client reçoit une réponse `{ ok: true }` ou `{ ok: false, message }` (message en français, affichable tel quel). L'événement générique `error` n'est plus utilisé pour les refus.
- **Coups par intention** : le client envoie `play-move { room, move, cardIndex? }`, avec `move` ∈ `draw`, `take-discard`, `discard-drawn`, `replace`, `flip`, `reveal`. Le serveur applique la fonction pure du coup (partagée back/front) à l'état complet, sous verrou, après avoir vérifié le tour et l'étape. Le client n'envoie plus jamais de `gameData`.
- **Vue joueur** : ce que le serveur diffuse a la même forme que la partie actuelle. Une carte face cachée n'a ni valeur ni couleur ; la pioche ne contient que des cartes masquées (sa longueur donne le nombre restant). En fin de manche, toutes les cartes des joueurs sont visibles.
- **Identifiants de cartes** : tirés au hasard à la distribution (l'id actuel `card_N`, attribué avant le mélange, révèle la valeur).
- **Rooms** : une room par partie, identifiée par l'id de la partie. Un socket est dans au plus une room de partie. Entrer dans une room exige d'être joueur de la partie.
- **Présence** : un joueur est présent dans une partie tant qu'au moins un de ses sockets est dans la room. Délai de grâce de 10 s avant de le retirer (salle d'attente) ou de le marquer `disconnected` (partie en cours).
- **Routes HTTP** inchangées (`PATCH /api/game/join/:id` reste l'entrée dans un salon).
- **Schéma** : inchangé. Base jetable : pas de migration des parties en cours, les parties en production au moment du déploiement peuvent être perdues.
- **Session** : toujours vérifiée au handshake et à chaque événement (pas de cache, hors périmètre).

---

## Phase 1 : rooms sûres

**User stories** : US-5, US-6

### Ce qu'on livre

Seul un joueur d'une partie peut en suivre les mises à jour : un compte étranger qui demande à rejoindre la room est refusé et ne reçoit rien. Quand un joueur passe d'une partie à une autre (« Rejouer », nouvelle partie, partie publique), son socket quitte l'ancienne room avant d'entrer dans la nouvelle, et la déconnexion ne concerne que la partie courante. Côté front, toute mise à jour dont l'id ne correspond pas à la partie affichée est ignorée.

### Critères d'acceptation

- [ ] Test : un compte non joueur qui émet `player-joined-game` sur une partie n'en reçoit aucune mise à jour ensuite.
- [ ] Test : un socket qui rejoint la partie B après la partie A ne reçoit plus les événements de A.
- [ ] Test : à la déconnexion, seule la partie courante passe le joueur en `leave`.
- [ ] Test front : un `play-move` d'une autre partie ne modifie pas l'état affiché.
- [ ] `make check` vert.

## Bloquée par

Aucune — démarrable immédiatement.

---

## Phase 2 : accusés et messages d'erreur

**User stories** : US-7, US-8, US-9, US-21

### Ce qu'on livre

Le catalogue d'événements typé remplace les chaînes libres des deux côtés. Chaque action envoyée reçoit un accusé. Sur un refus, le joueur voit un toast d'erreur avec le motif, et le plateau reprend l'état du serveur (relecture de la partie). Sur une session expirée, un toast s'affiche puis le joueur est redirigé vers la connexion. Les entrées de chaque événement sont validées par un schéma (types et formes, pas seulement « non vide »), et une erreur inattendue côté serveur renvoie un accusé d'échec au lieu du silence. Le provider websocket est nettoyé : suppression de `joinRoom` et `subscribeToError`, messages en français, envoi avec accusé.

### Critères d'acceptation

- [ ] Test : chaque garde-fou existant (pas ton tour, créateur seulement, coup refusé) renvoie `{ ok: false, message }` à l'émetteur seul.
- [ ] Test : une entrée mal typée (`room` objet, `cardId` nombre…) est refusée avec un message, sans toucher la base.
- [ ] Test : une exception dans un handler renvoie un accusé d'échec.
- [ ] Test front : un accusé d'échec affiche un toast d'erreur et relit la partie.
- [ ] Test front : un accusé « session expirée » affiche un toast et redirige vers la connexion.
- [ ] Plus aucune émission de l'événement générique `error` pour un refus ; plus de code mort dans le provider.
- [ ] `make check` vert.

## Bloquée par

- Phase 1

---

## Phase 3 : coups par intention

**User stories** : US-18 (en partie), US-21

### Ce qu'on livre

Les fonctions pures des coups deviennent partagées. Le client n'envoie plus que l'intention (`draw`, `take-discard`, `discard-drawn`, `replace`, `flip`, `reveal` + index de carte). Le serveur vérifie que c'est le tour du joueur (sauf `reveal` en révélation initiale) et que le coup est permis à l'étape courante, l'applique à l'état complet sous verrou, fait avancer la partie et diffuse. Un coup impossible à cette étape est refusé avec un message. L'ancien `initial-turn-card` est remplacé par le coup `reveal`. Le serveur ne fait plus confiance à aucun `gameData` envoyé.

### Critères d'acceptation

- [ ] Tests unitaires : pour chaque étape, les coups permis et refusés.
- [ ] Test d'API : une manche complète jouée uniquement par intentions jusqu'à `endGame`, scores enregistrés.
- [ ] Test : un `play-move` portant un `gameData` est refusé (schéma) ; un coup hors étape (`flip` pendant `draw`) est refusé.
- [ ] Le front (pioche, défausse, plateau, révélation initiale) envoie des intentions ; partie à 2 joueurs vérifiée dans le navigateur.
- [ ] `make check` vert.

## Bloquée par

- Phase 2

---

## Phase 4 : cartes cachées

**User stories** : US-1, US-2, US-3, US-4

### Ce qu'on livre

Les ids de cartes sont tirés au hasard à la distribution. Chaque diffusion (événements socket et lecture HTTP de la partie) est filtrée pour le joueur destinataire : ses cartes et celles des adversaires face cachée n'ont ni valeur ni couleur, et la pioche n'est qu'une suite de cartes masquées. La carte piochée devient visible de tous dès qu'elle est en main, comme une carte révélée. En fin de manche, tout est visible. Le front affiche le dos de carte pour toute carte masquée. Les consignes du projet (`CLAUDE.md`, mémoire de reprise) sont mises à jour : le serveur ne fait plus confiance au `gameData` du client et ne diffuse plus les cartes cachées.

### Critères d'acceptation

- [ ] Test : pour chaque événement diffusé et pour `GET` de la partie, aucune carte non révélée ne porte de valeur ni de couleur, pour chaque joueur.
- [ ] Test : la pioche diffusée ne contient que des cartes masquées, de la bonne longueur.
- [ ] Test : en `endGame`, toutes les cartes des joueurs portent leur valeur.
- [ ] Test : deux distributions donnent des ids sans lien avec la valeur (pas de `card_N`).
- [ ] Contrôle manuel dans le navigateur : l'onglet réseau ne montre aucune valeur cachée pendant une manche.
- [ ] `CLAUDE.md` et `.claude/memoire/reprise.md` à jour.
- [ ] `make check` vert.

## Bloquée par

- Phase 3

---

## Phase 5 : contrôles d'état

**User stories** : US-16, US-17, US-18, US-19, US-20

### Ce qu'on livre

Le serveur refuse, avec un message, les actions incohérentes avec l'état de la partie : distribuer alors qu'une manche est en cours (seulement au lancement ou en fin de manche), lancer avec moins de 2 joueurs, révéler une 3e carte ou révéler hors de la phase initiale, relancer une partie qui n'est pas terminée. « Rejouer » est idempotent : un second clic du créateur renvoie la nouvelle partie déjà créée au lieu d'en créer une autre.

### Critères d'acceptation

- [ ] Test : `start-game` pendant une manche en cours est refusé, partie inchangée.
- [ ] Test : `start-game` avec un seul joueur est refusé.
- [ ] Test : une 3e révélation initiale, ou une révélation pendant `draw`, est refusée.
- [ ] Test : `restart-game` sur une partie non terminée est refusé.
- [ ] Test : deux `restart-game` successifs ne créent qu'une seule nouvelle partie et renvoient le même id.
- [ ] `make check` vert.

## Bloquée par

- Phase 2

---

## Phase 6 : arrivée instantanée

**User stories** : US-13, US-14, US-15

### Ce qu'on livre

En salle d'attente, le front attend la fin de l'inscription dans la partie avant d'annoncer l'arrivée, et ne l'annonce qu'une fois. Le serveur ne fait plus aucune attente artificielle (ni à l'arrivée, ni au lancement, ni au « Rejouer »). L'animation de distribution (environ 3 s) est déclenchée et minutée côté navigateur à la réception du lancement de manche.

### Critères d'acceptation

- [ ] Test front : l'arrivée d'un nouveau joueur émet une seule annonce, après la réponse de l'inscription.
- [ ] Test d'API : un joueur qui rejoint est diffusé aux autres en moins de 1 s ; `start-game` diffuse sans délai.
- [ ] Plus aucune attente artificielle côté serveur.
- [ ] Test front : l'écran de distribution reste affiché environ 3 s puis laisse place au plateau.
- [ ] `make check` vert.

## Bloquée par

- Phase 1

---

## Phase 7 : présence avec délai de grâce

**User stories** : US-10, US-11, US-12

### Ce qu'on livre

Une déconnexion ne retire plus le joueur immédiatement. Le serveur attend 10 s ; si le joueur revient entre-temps (rafraîchissement, réseau instable) ou s'il a encore un autre onglet dans la room, rien ne change pour les autres. Sinon il est retiré du salon (salle d'attente) ou marqué « déconnecté » (partie en cours), et les autres en sont informés. Au retour, il repasse « connecté ».

### Critères d'acceptation

- [ ] Test : déconnexion puis reconnexion en moins de 10 s → aucun `player-left-game`, joueur toujours membre.
- [ ] Test : déconnexion sans retour → après 10 s, retrait (salle d'attente) ou statut `disconnected` (partie), diffusé aux autres.
- [ ] Test : deux sockets du même joueur, un seul se déconnecte → aucun changement.
- [ ] Délai de grâce réglable en test (pas d'attente réelle de 10 s dans la suite).
- [ ] `make check` vert.

## Bloquée par

- Phase 1
