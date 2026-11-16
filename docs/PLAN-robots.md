# Plan : robots pour jouer contre l'ordinateur

> PRD source : `docs/PRD-robots.md`

## Décisions architecturales

Décisions durables qui s'appliquent à toutes les phases :

- **Livraison** : branche par phase depuis `dev`, une PR par phase vers `dev`. Release en production (`dev` → `main`, puis `make release`) seulement à la fin des 5 phases.
- **Schéma** : les robots sont des lignes de `users`, créées à la demande au premier ajout dans une partie (identifiant `robot-<niveau>-<rang>`). Une migration ajoute seulement les colonnes : les tests d'API vident `users` à chaque fichier, des robots créés par migration disparaîtraient.
  - 7 robots par niveau au plus, 21 en tout : de quoi remplir une table de 8 avec un seul humain, quel que soit le mélange de niveaux.
  - Nouvelles colonnes de `users` : `is_bot` (booléen, faux par défaut) et `bot_level` (`facile` | `moyen` | `difficile`, nul pour un humain).
  - `username` est nul pour un robot. Son nom affiché (« Robot moyen », « Robot moyen 2 »…) est dans `name` et sort par le même `coalesce(username, name)` que les invités oubliés : aucune collision possible avec un pseudo humain.
  - Pas de session ni de compte de connexion pour un robot : il ne peut pas se connecter.
  - Robots exclus de la purge des comptes inactifs et de l'oubli des invités.
- **Modèles clés** : `BotLevel` (`facile` | `moyen` | `difficile`) dans `shared/types.ts`. `PublicUser` gagne `isBot` et `botLevel` (nul pour un humain), diffusés avec les joueurs de la partie.
- **Événements temps réel** (catalogue typé dans `shared/types.ts`, accusé `{ ok }` / `{ ok: false, message }` comme les autres) :
  - `add-bot { room, level }` : réservé au créateur, partie en attente, s'il reste une place. Le serveur prend le premier robot libre de ce niveau.
  - `remove-bot { room, botId }` : réservé au créateur, partie en attente.
  - Les deux diffusent la partie à jour à la room, comme l'arrivée ou le départ d'un joueur.
- **Décision d'un robot** : une fonction pure (sans base ni socket) reçoit la **vue masquée** de la partie, celle qu'un humain reçoit, avec l'identifiant du robot, son niveau et un tirage aléatoire injectable. Elle renvoie une intention `{ move, cardIndex? }`. L'honnêteté est garantie par construction : le robot n'a jamais accès aux cartes cachées ni à la pioche.
- **Pilote** : côté serveur, après chaque changement d'état d'une partie (lancement, coup, manche suivante, nouvelle partie), si un robot doit jouer :
  - le serveur programme un geste après un délai (environ 1 s, réglable par variable d'environnement et mis à 0 en test) ;
  - il applique l'intention par le même chemin qu'un coup humain (calcul sur l'état enregistré, refus d'un coup impossible) ;
  - il diffuse la partie comme pour un humain.
  - Au plus un geste programmé par partie à la fois.
- **Coups des robots** : mêmes intentions que les humains (`reveal`, `draw`, `take-discard`, `discard-drawn`, `replace`, `flip`). Un tour se fait en deux gestes : prendre une carte, puis la placer ou la jeter (jeter entraîne un retournement, qui est aussi un geste).
- **Banc d'essai** : simulation de parties complètes en tête-à-tête entre deux niveaux, sans base ni socket, sur les règles pures. Il est lancé par un test unitaire avec un tirage aléatoire fixé, pour être reproductible.

---

## Phase 1 : un robot Facile joue une partie complète

**User stories** : US-1 (niveau Facile seulement), US-2, US-3, US-4, US-6, US-7, US-8, US-9, US-10, US-11, US-12, US-14, US-15, US-18, US-19, US-23, US-24

### Ce qu'on livre

**Salle d'attente**
- Le créateur ajoute un robot Facile avec un bouton « Ajouter un robot », et le retire avec un bouton propre à chaque robot.
- Le robot apparaît avec son nom (« Robot facile », « Robot facile 2 »…) et une mention « robot », comme la mention « invité ».
- Le bouton d'ajout est désactivé quand la partie est complète.
- Les autres joueurs voient les robots, mais aucun bouton d'ajout ni de retrait.
- Un humain plus un robot suffisent pour lancer.

**Pendant la partie**
- Les robots révèlent leurs 2 cartes dès la distribution.
- À son tour, un robot joue en deux gestes séparés d'environ 1 seconde, signalés comme le tour d'un humain.
- Le Facile choisit au hasard parmi les coups permis, en écartant les coups absurdes : ne jamais remplacer une carte visible par une carte plus forte, ne jamais prendre la défausse pour la remplacer par plus fort.
- Les règles s'appliquent telles quelles : colonnes, dernier tour, doublement.

**Fin de manche et de partie**
- Les robots n'empêchent ni la manche suivante ni la fin de partie.
- Ils sont toujours « Ok pour rejouer », et la nouvelle partie les contient.

### Critères d'acceptation

- [x] `add-bot` et `remove-bot` sont refusés à un non-créateur, hors salle d'attente, et quand la partie est complète (pour l'ajout). Un robot ne peut pas être créateur.
- [x] Deux robots Facile ajoutés à la même partie sont deux robots différents (« Robot facile », « Robot facile 2 »).
- [x] La fonction de décision ne reçoit que la vue masquée : un test vérifie qu'elle donne le même coup si l'on change la valeur des cartes cachées.
- [x] Le Facile ne fait jamais de coup refusé par le serveur, ni de coup absurde (test sur de nombreuses positions tirées au hasard).
- [x] Test temps réel : un humain seul avec un robot Facile joue une partie jusqu'à la fin (score ≥ 100). L'humain ne fait que ses coups et le lancement des manches, et le robot joue tous les siens.
- [x] En jeu réel, un tour de robot dure entre 1,5 et 3 secondes, en deux gestes visibles.
- [x] En fin de partie, le robot est dans la liste « Ok pour rejouer », et la nouvelle partie le contient.
- [x] Un invité qui rejoint une partie avec robot joue normalement. Un invité ne peut toujours pas créer de partie.
- [x] Les robots ne peuvent pas se connecter, et sont exclus de la purge des 3 ans et de l'oubli des invités.
- [x] Contrôle manuel dans Chrome : partie complète contre un robot Facile, sur ordinateur et en largeur mobile.

## Bloquée par

Aucune : démarrable immédiatement.

---

## Phase 2 : pause sans humain connecté

**User stories** : US-13

### Ce qu'on livre

Les robots ne jouent que si au moins un humain de la partie est connecté. Quand le dernier humain est marqué déconnecté (après le délai de grâce actuel), aucun geste de robot n'est plus joué et un geste déjà programmé est annulé. Dès qu'un humain revient dans la partie, les robots reprennent là où ils en étaient.

### Critères d'acceptation

- [ ] Test temps réel : le seul humain se déconnecte pendant le tour d'un robot. Après le délai de grâce, l'état de la partie ne bouge plus.
- [ ] Au retour de l'humain, le robot dont c'était le tour joue son coup.
- [ ] Dans une partie à deux humains et un robot, le robot continue de jouer tant qu'un des deux humains est connecté.
- [ ] Aucun geste programmé ne reste en attente une fois la partie supprimée ou terminée.

## Bloquée par

- Phase 1

---

## Phase 3 : niveau Moyen, choix du niveau et banc d'essai

**User stories** : US-1 (choix du niveau), US-5, US-17

### Ce qu'on livre

**Choix du niveau**
- Le bouton « Ajouter un robot » propose le niveau : Facile, Moyen, Difficile. Difficile est grisé jusqu'à la phase 4.
- On peut mélanger les niveaux dans une même partie, et le nom de chaque robot indique son niveau.

**Robot Moyen**
- Il prend la défausse si elle est basse.
- Il garde une carte piochée basse et remplace sa plus forte carte visible.
- Sinon, il jette la carte piochée et retourne une carte cachée.

**Banc d'essai**
- Il simule des parties en tête-à-tête entre deux niveaux et donne le taux de victoire de chacun.

### Critères d'acceptation

- [ ] Un robot ajouté avec le niveau Moyen apparaît « Robot moyen », et un robot Facile ajouté ensuite apparaît « Robot facile ».
- [ ] Le Moyen ne fait jamais de coup refusé par le serveur (test sur de nombreuses positions tirées au hasard).
- [ ] Banc d'essai, 200 parties, tirage fixé : Moyen bat Facile au moins 70 % du temps.
- [ ] Contrôle manuel dans Chrome : partie contre un Facile et un Moyen.

## Bloquée par

- Phase 1

---

## Phase 4 : niveau Difficile

**User stories** : US-16, US-17

### Ce qu'on livre

Le niveau Difficile devient disponible. En plus du jeu du Moyen, il :
- cherche à compléter des colonnes de 3 cartes identiques ;
- estime la valeur moyenne des cartes cachées à partir des cartes déjà sorties (visibles par tous) ;
- évite de déclencher la fin de manche s'il risque de ne pas avoir le plus petit score, donc de voir ses points doublés ;
- surveille un adversaire proche de finir.

### Critères d'acceptation

- [ ] Le Difficile ne fait jamais de coup refusé par le serveur (test sur de nombreuses positions tirées au hasard).
- [ ] Test sur position construite : il complète une colonne quand la défausse le permet.
- [ ] Test sur position construite : il ne retourne pas sa dernière carte cachée quand son total visible dépasse nettement celui d'un adversaire.
- [ ] Banc d'essai, 200 parties, tirage fixé : Difficile bat Moyen au moins 60 % du temps.
- [ ] Contrôle manuel dans Chrome : partie contre un Difficile.

## Bloquée par

- Phase 3

---

## Phase 5 : historique et bilan par niveau

**User stories** : US-20, US-21, US-22

### Ce qu'on livre

Les parties avec robots apparaissent dans l'historique, les robots avec la mention « robot ». Dans le bilan par adversaire, les robots d'un même niveau sont regroupés en une seule ligne (« Robot moyen » et « Robot moyen 2 » comptent pour « Robot moyen »). Le filtre par adversaire de l'historique suit ce regroupement. Les victoires et le taux de victoire incluent les parties avec robots.

### Critères d'acceptation

- [ ] Une partie terminée contre « Robot moyen 2 » apparaît dans l'historique avec la mention « robot ».
- [ ] Le bilan par adversaire montre une ligne « Robot moyen » qui cumule les parties contre « Robot moyen » et « Robot moyen 2 ».
- [ ] Filtrer l'historique sur « Robot moyen » montre les parties contre tous les robots de ce niveau.
- [ ] Les victoires et le taux de victoire comptent les parties gagnées ou perdues contre des robots.

## Bloquée par

- Phase 1
