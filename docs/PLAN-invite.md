# Plan : jouer sans compte (invités)

> PRD source : `docs/PRD-invite.md`

## Décisions architecturales

Décisions durables qui s'appliquent à toutes les phases :

- **Invité** : un utilisateur Better Auth créé par le plugin `anonymous` (`POST /api/auth/sign-in/anonymous`), même cookie de session httpOnly qu'un compte. Colonne `users.is_anonymous` (migration). L'invité est reconnu par sa session côté serveur, jamais par le body.
- **Pseudo** : même règle et même unicité que pour un compte (plugin `username`). Un invité a toujours un pseudo avant d'entrer dans une partie.
- **Garde serveur** : création de partie et historique refusés aux invités (réponse 403 avec message). Le reste de l'API et les événements socket sont inchangés.
- **Oubli après 7 jours** : la ligne de l'invité n'est pas supprimée, ce qui effacerait ses parties chez les autres par cascade. Ses sessions sont supprimées et son pseudo libéré. Le nom qu'il portait est gardé pour l'affichage dans l'historique. Il ne reste aucune donnée personnelle.
- **Conversion** : à l'inscription d'un invité (email ou Google), ses parties sont transférées au nouveau compte et son pseudo lui est rendu, puis le compte invité est supprimé (hook `onLinkAccount` du plugin).
- **Routes front** : une page pour l'avertissement et le pseudo de l'invité, avec retour à la partie visée par `?redirect=` comme la connexion. Routes de partie inchangées.
- **Contexte utilisateur** : le front sait si le joueur connecté est un invité, et les parties diffusées indiquent quels joueurs sont invités.
- **Release** : uniquement quand les 4 phases sont fusionnées (les pages légales annoncent la purge dès la phase 1).

---

## Phase 1 : rejoindre sans compte

**User stories** : US-1, US-2, US-3, US-4, US-5, US-6, US-13, US-7 et US-8 (côté serveur)

### Ce qu'on livre

Sur la page de connexion, un choix « Rejoindre sans compte » mène à un écran d'avertissement (pas d'historique, place liée à ce navigateur, oubli après 7 jours sans visite) avec un pseudo prérempli, tiré au hasard et modifiable. « Jouer » crée la session invité avec ce pseudo et renvoie vers la partie visée. L'invité rejoint par lien ou depuis la liste des parties publiques et joue une partie complète comme un joueur avec compte. L'API refuse la création de partie et l'historique à un invité. Les pages légales décrivent le compte invité : données gardées et durée.

### Critères d'acceptation

- [x] Test d'API : un invité créé avec un pseudo a une session ; un pseudo déjà pris est refusé avec un message.
- [x] Test d'API : un invité rejoint une partie, entre dans la room et joue un coup.
- [x] Test d'API : un invité reçoit un refus (403) à la création de partie et à la lecture de son historique.
- [x] Test de composant : le choix « Rejoindre sans compte », l'avertissement, le pseudo prérempli modifiable, le retour à la partie visée.
- [x] Test unitaire : le pseudo proposé respecte les règles des pseudos.
- [x] Pages légales à jour.
- [x] Contrôle manuel dans le navigateur : lien de partie, rejoindre sans compte, partie jouée jusqu'au bout.
- [x] `make check` vert.

## Bloquée par

Aucune — démarrable immédiatement.

---

## Phase 2 : ce que l'invité voit

**User stories** : US-7, US-8, US-11

### Ce qu'on livre

Un invité qui tente de créer une partie ou d'ouvrir « Mon espace » voit un message éphémère, puis arrive sur la page d'inscription. Un bouton « Créer mon compte » remplace « Mon espace » dans l'en-tête, et apparaît sur l'écran de fin de partie. Une mention « invité » accompagne le pseudo d'un invité : en salle d'attente, à la table, dans les résultats et dans l'historique des autres joueurs.

### Critères d'acceptation

- [x] Test de composant : un invité qui va sur la création de partie ou « Mon espace » est renvoyé vers l'inscription avec un message.
- [x] Test de composant : en-tête et fin de partie proposent « Créer mon compte » à un invité, pas à un joueur avec compte.
- [x] Test : la partie diffusée indique les joueurs invités ; la mention « invité » s'affiche en salle d'attente, à la table, dans les résultats et l'historique.
- [x] `make check` vert.

## Bloquée par

- Phase 1

---

## Phase 3 : créer un compte en gardant ses parties

**User stories** : US-9

### Ce qu'on livre

Depuis « Créer mon compte », l'invité s'inscrit par email et mot de passe ou par Google. Son pseudo lui est conservé (prérempli pour l'email, repris automatiquement pour Google), ses parties passent sur le nouveau compte et apparaissent dans son historique. La partie en cours continue sans interruption. Le compte invité est ensuite supprimé.

### Critères d'acceptation

- [x] Test d'API : un invité qui s'inscrit par email garde son pseudo et retrouve ses parties dans son historique ; le compte invité n'existe plus.
- [x] Test d'API : même chose pour un compte créé par Google (simulé en appelant directement le transfert, avec un compte sans pseudo).
- [x] Test d'API : un invité en pleine partie qui s'inscrit peut continuer à jouer.
- [x] Contrôle manuel dans le navigateur : conversion par email en fin de partie, historique visible.
- [x] `make check` vert.

## Bloquée par

- Phase 1

---

## Phase 4 : oubli après 7 jours

**User stories** : US-10, US-12

### Ce qu'on livre

La purge quotidienne oublie les invités sans visite depuis 7 jours : sessions supprimées, pseudo libéré pour d'autres joueurs, nom gardé pour l'affichage. L'historique des joueurs avec compte affiche toujours le pseudo des invités oubliés, avec la mention « invité ». Un invité qui revient après l'oubli repart de zéro avec un nouveau pseudo.

### Critères d'acceptation

- [ ] Test : un invité inactif depuis plus de 7 jours est oublié (plus de session, pseudo libre) ; un invité actif ne l'est pas ; un compte normal jamais.
- [ ] Test d'API : après l'oubli, l'historique d'un joueur avec compte affiche toujours le pseudo de l'invité.
- [ ] Test d'API : le pseudo libéré peut être repris par un nouvel invité ou un compte.
- [ ] `make check` vert.

## Bloquée par

- Phase 1
