# PRD : robots pour jouer contre l'ordinateur

## Problème

Skyjo ne se joue qu'entre humains. Quand personne n'est disponible, un joueur ne peut rien faire sur le site : il attend ou il va jouer ailleurs. À deux, la partie manque aussi de sel : le jeu est plus intéressant à 3 ou 4, mais il faut trouver d'autres joueurs. Les règles sont stables, le temps réel est fiable, et le serveur calcule déjà chaque coup à partir de l'intention du joueur : c'est le bon moment pour ajouter des adversaires joués par l'ordinateur.

## Solution

Dans la salle d'attente, le créateur d'une partie peut ajouter des robots, en choisissant pour chacun un niveau : Facile, Moyen ou Difficile. Un robot occupe une place comme un joueur. Seul, on crée une partie, on ajoute un ou plusieurs robots et on lance : on joue contre l'ordinateur. Entre amis, on complète la table avec des robots. Les robots jouent à leur tour, à un rythme qu'on peut suivre des yeux. Ils révèlent leurs cartes au départ, sont toujours d'accord pour rejouer, et ne trichent jamais : ils ne voient que ce qu'un joueur humain verrait. Les parties avec robots sont gardées dans l'historique et comptent dans les statistiques, chaque niveau de robot apparaissant comme un adversaire.

## Utilisateur cible

Un joueur Skyjo avec un compte, membre du groupe d'amis ou de la famille qui joue sur le site. Il a dix minutes devant lui et personne pour jouer : il lance une partie contre un ou deux robots sur son téléphone. Ou bien deux joueurs en visio veulent une partie à 4 : ils ajoutent deux robots. Secondairement : l'invité arrivé par un lien, qui se retrouve à une table où le créateur a mis des robots.

## User Stories

**Ajouter des robots**
1. **US-1** En tant que créateur dans la salle d'attente, je veux ajouter un robot en choisissant son niveau (Facile, Moyen, Difficile), afin de compléter la table.
2. **US-2** En tant que créateur, je veux retirer un robot de la salle d'attente, afin de corriger mon choix ou faire de la place à un ami.
3. **US-3** En tant que créateur, je veux voir le bouton d'ajout désactivé quand la partie est complète, afin de comprendre qu'il n'y a plus de place.
4. **US-4** En tant que créateur seul avec au moins un robot, je veux lancer la partie, afin de jouer contre l'ordinateur.
5. **US-5** En tant que créateur, je veux mélanger des robots de niveaux différents dans une même partie, afin de doser la difficulté.
6. **US-6** En tant que joueur dans la salle d'attente, je veux voir chaque robot avec son niveau dans son nom (« Robot facile », « Robot moyen 2 »…) et une mention « robot », afin de savoir contre qui je joue.
7. **US-7** En tant que joueur non créateur, je ne veux ni ajouter ni retirer de robot, afin que la table reste décidée par le créateur.
8. **US-8** En tant que joueur qui rejoint une partie publique ou par lien, je veux voir les robots déjà présents, afin de savoir à quoi m'attendre.

**Pendant la partie**
9. **US-9** En tant que joueur, je veux que les robots révèlent leurs 2 cartes dès la distribution, afin que la manche démarre sans attente.
10. **US-10** En tant que joueur, je veux voir le tour d'un robot en deux gestes (il pioche ou prend la défausse, puis il place ou jette), avec environ 1 seconde entre chaque geste, afin de suivre ce qu'il a fait.
11. **US-11** En tant que joueur, je veux que le tour d'un robot soit signalé comme celui d'un joueur humain, afin de savoir qui joue.
12. **US-12** En tant que joueur, je veux qu'un robot ne connaisse jamais mes cartes cachées ni la prochaine carte de la pioche, afin que la partie soit honnête.
13. **US-13** En tant que joueur seul face à des robots, je veux que la partie attende quand je me déconnecte et reprenne quand je reviens, afin de ne rien rater.
14. **US-14** En tant que joueur, je veux que les robots respectent toutes les règles (colonnes de 3 cartes identiques, dernier tour, doublement des points de celui qui termine sans avoir le plus petit score), afin que le jeu reste le même.

**Niveaux**
15. **US-15** En tant que débutant, je veux qu'un robot Facile soit battable, afin d'apprendre sans me décourager.
16. **US-16** En tant que joueur confirmé, je veux qu'un robot Difficile me donne du fil à retordre, afin d'avoir un vrai défi.
17. **US-17** En tant que joueur, je veux que chaque niveau joue nettement mieux que le précédent, afin que le choix du niveau ait un sens.

**Fin de manche et de partie**
18. **US-18** En tant que créateur, je veux lancer la manche suivante comme aujourd'hui, les robots étant toujours prêts, afin de ne pas les attendre.
19. **US-19** En tant que joueur en fin de partie, je veux que les robots soient toujours « Ok pour rejouer », afin de relancer une partie avec eux.

**Historique et statistiques**
20. **US-20** En tant que joueur, je veux retrouver mes parties avec robots dans mon historique, afin de garder une trace.
21. **US-21** En tant que joueur, je veux voir dans le bilan par adversaire une ligne par niveau de robot (« Robot difficile : 3 victoires, 5 défaites »), afin de mesurer ma progression.
22. **US-22** En tant que joueur, je veux que mes parties contre des robots comptent dans mes victoires et mon taux de victoire, comme les autres.

**Invités**
23. **US-23** En tant qu'invité, je veux jouer dans une partie où le créateur a mis des robots, afin de profiter de la table.
24. **US-24** En tant qu'invité, je ne peux pas créer de partie, et donc pas jouer seul contre des robots, comme aujourd'hui.

## Critères de succès

- Dans la salle d'attente, le créateur ajoute un robot de chaque niveau : chacun apparaît avec son niveau et la mention « robot ». Un autre joueur ne voit aucun bouton d'ajout ni de retrait.
- Un joueur seul avec un robot lance la partie et la joue jusqu'à la fin (score ≥ 100) sans autre action que ses propres coups et le lancement des manches.
- Un tour de robot montre deux gestes séparés d'environ 1 seconde, et dure entre 1,5 et 3 secondes.
- Aucune réponse ni diffusion ne donne à un robot une information qu'un humain n'aurait pas : la décision d'un robot ne dépend que des cartes visibles par tous.
- Sur 200 parties simulées en tête-à-tête, Moyen bat Facile au moins 70 % du temps, et Difficile bat Moyen au moins 60 % du temps.
- Facile ne fait jamais un coup absurde, par exemple placer un 12 à la place d'un −2 visible.
- Quand le seul humain d'une partie se déconnecte (après le délai de grâce actuel), aucun robot ne joue plus. La partie reprend à son retour.
- En fin de partie, chaque robot apparaît « Ok pour rejouer », et la nouvelle partie les contient.
- L'historique montre la partie, le bilan par adversaire contient une ligne par niveau de robot rencontré, et les victoires et le taux incluent ces parties.

## Hors périmètre

- Robots dans Banco ou dans tout autre jeu que Skyjo.
- Bouton « Jouer seul » avec lancement direct : on passe par la salle d'attente.
- Partie solo pour un invité.
- Vitesse des robots réglable, ou mode accéléré.
- Robot qui remplace automatiquement un joueur humain absent ou parti.
- Robot qui « triche », ou qui adapte son niveau en cours de partie.
- Noms, avatars ou personnalités de robots personnalisables.
- Statistiques séparées « entre humains » et « contre robots ».
- Classement général ou succès débloqués contre les robots.
- Discussion ou réactions des robots.

## Décisions d'implémentation

- **Niveaux :** trois niveaux, choisis robot par robot.
  - Facile : joue au hasard parmi les coups permis, en évitant les coups absurdes.
  - Moyen : garde les cartes basses et remplace sa plus forte carte visible.
  - Difficile : vise en plus les colonnes de 3 cartes identiques, tient compte des cartes déjà sorties et évite de terminer la manche s'il risque de ne pas avoir le plus petit score.
- **Noms :** « Robot facile », « Robot moyen », « Robot difficile ». Un deuxième robot du même niveau dans la partie devient « Robot moyen 2 », et ainsi de suite. Une mention « robot » s'affiche à côté du nom, comme la mention « invité ».
- **Places :** un robot occupe une place et compte dans le nombre maximum de joueurs (8 au plus). Il ne peut pas être créateur.
- **Lancement :** il faut toujours au moins 2 joueurs, et un humain plus un robot suffisent.
- **Rythme :** deux gestes par tour, environ 1 seconde entre chaque. La révélation des 2 cartes au départ est immédiate.
- **Présence :** les robots ne jouent que si au moins un humain de la partie est connecté. Sinon la partie attend.
- **Fin de partie :** les robots sont toujours prêts à rejouer. La manche suivante et la nouvelle partie restent lancées par le créateur.
- **Historique :** les parties avec robots y figurent. Le bilan par adversaire regroupe les robots par niveau, et les statistiques globales les incluent.
- **Partie publique :** une partie publique avec des robots reste dans la liste des parties publiques tant qu'il reste de la place.

## Notes complémentaires

- **Plateforme multi-jeux :** les robots sont livrés sur le Skyjo en production. La plateforme multi-jeux, encore en construction, devra intégrer cette évolution, avec des conflits possibles sur la table de jeu et la salle d'attente.
- **Banco :** il n'a pas de robots dans ce plan. Ce sera à recadrer une fois la plateforme sortie.
- **Données personnelles :** les robots ne sont pas des personnes. Aucune nouvelle donnée personnelle, donc pas de changement des pages légales. Les robots ne peuvent pas se connecter et sont exclus de la purge des comptes inactifs.
