# PRD : fiabilité et confidentialité du temps réel

## Problème

Les parties se jouent en temps réel entre amis, mais cette partie a été écrite en projet d'école et montre ses limites. Les cartes face cachée et l'ordre de la pioche sont envoyés à tous les navigateurs : un joueur curieux peut lire le jeu des autres. Un compte connecté peut aussi suivre une partie dont il ne fait pas partie. Après « Rejouer » ou un passage d'une partie à l'autre, l'écran peut afficher l'ancienne partie. Quand le serveur refuse une action, le joueur ne voit rien et croit à un bug. Un simple rafraîchissement en salle d'attente fait sortir le joueur du salon. Le serveur ajoute des attentes artificielles pour masquer des courses entre requêtes. Le jeu est en production : ces défauts touchent de vraies parties.

## Solution

Chaque joueur ne reçoit que ce qu'il a le droit de voir : ses cartes et celles des autres face visible, la défausse, et le nombre de cartes restant dans la pioche. Seuls les joueurs d'une partie en reçoivent les mises à jour, et l'écran affiche toujours la partie ouverte. Toute action refusée s'explique par un message court. Une coupure brève (rafraîchissement, réseau instable, onglet en double) passe inaperçue. Les actions incohérentes avec l'état de la partie sont refusées : redistribuer en pleine manche, révéler plus de deux cartes au départ, relancer deux fois une partie. Le joueur indique seulement le coup qu'il joue (piocher, prendre la défausse, échanger ou retourner une carte) et c'est le serveur qui l'applique : un coup impossible à ce moment de la partie est refusé.

## Utilisateur cible

Un groupe d'amis ou une famille, de 2 à 8 personnes, qui lance une partie depuis un lien partagé, souvent sur téléphone, parfois avec un réseau mobile instable. Ils jouent plusieurs manches d'affilée et enchaînent avec « Rejouer ». La confiance règne, mais un joueur qui ouvre les outils du navigateur ne doit pas pouvoir lire les cartes cachées.

## User Stories

1. **US-1** En tant que joueur, je veux que mes cartes face cachée restent inconnues des autres, afin que personne ne puisse lire mon jeu.
2. **US-2** En tant que joueur, je veux que la prochaine carte de la pioche reste inconnue de tous, afin que la pioche garde sa part de hasard.
3. **US-3** En tant que joueur, je veux voir une carte dès qu'elle est révélée, la mienne comme celle d'un adversaire, afin de suivre la partie normalement.
4. **US-4** En tant que joueur, je veux voir toutes les cartes de tout le monde en fin de manche, afin de vérifier les scores.
5. **US-5** En tant que joueur, je veux que seuls les membres d'une partie en reçoivent les mises à jour, afin qu'un inconnu ne puisse pas l'espionner.
6. **US-6** En tant que joueur qui passe d'une partie à une autre (« Rejouer », nouvelle partie, partie publique), je veux que l'écran n'affiche que la partie ouverte, afin de ne pas voir resurgir l'ancienne.
7. **US-7** En tant que joueur, je veux un message clair quand mon action est refusée (pas mon tour, réservé au créateur, coup invalide), afin de comprendre ce qui se passe.
8. **US-8** En tant que joueur dont la session a expiré, je veux être renvoyé vers la connexion avec un message, afin de reprendre sans rester bloqué.
9. **US-9** En tant que joueur, je veux que mon plateau revienne à l'état réel de la partie après un refus, afin de ne pas jouer sur un affichage faux.
10. **US-10** En tant que joueur qui rafraîchit la page ou perd le réseau quelques secondes, je veux rester dans le salon ou dans la partie sans que les autres le remarquent, afin de ne pas être exclu par accident.
11. **US-11** En tant que joueur, je veux voir un adversaire « déconnecté » s'il ne revient pas après une dizaine de secondes, afin de savoir pourquoi la partie n'avance pas.
12. **US-12** En tant que joueur ouvert dans deux onglets, je veux n'être compté comme déconnecté qu'à la fermeture du dernier, afin que fermer un onglet en double ne me pénalise pas.
13. **US-13** En tant que joueur qui rejoint un salon, je veux que les autres soient prévenus une seule fois de mon arrivée, afin d'éviter les notifications en double.
14. **US-14** En tant que joueur qui rejoint un salon, je veux apparaître dans la liste sans attente artificielle, afin que l'arrivée soit instantanée.
15. **US-15** En tant que joueur, je veux garder l'animation de distribution au lancement d'une manche, afin de conserver l'ambiance de table.
16. **US-16** En tant que créateur, je veux ne pas pouvoir redistribuer pendant une manche en cours, afin de ne pas écraser la partie par un clic malheureux.
17. **US-17** En tant que créateur, je veux ne pas pouvoir lancer une partie seul, afin de ne pas démarrer une partie injouable.
18. **US-18** En tant que joueur, je veux ne pouvoir révéler que deux cartes pendant la révélation initiale, et seulement à ce moment-là, afin que la règle soit la même pour tous.
19. **US-19** En tant que créateur qui clique deux fois sur « Rejouer », je veux qu'une seule nouvelle partie soit créée, afin que tout le monde se retrouve à la même table.
20. **US-20** En tant que créateur, je veux ne pouvoir relancer qu'une partie terminée, afin de ne pas abandonner une partie en cours.
21. **US-21** En tant que joueur, je veux qu'une action mal formée (envoyée par un client modifié ou ancien) soit refusée proprement, afin que la partie ne soit pas corrompue.

## Critères de succès

- Pendant une manche, aucun message reçu par un joueur ne contient la valeur d'une carte face cachée, ni de la sienne, ni d'un adversaire, ni de la pioche (vérifié par test automatisé sur chaque type de mise à jour).
- En fin de manche, les messages reçus contiennent la valeur de toutes les cartes des joueurs.
- Un compte qui n'est pas joueur d'une partie et demande à la suivre reçoit un refus et aucune mise à jour de cette partie.
- Après passage de la partie A à la partie B, une action jouée dans A ne modifie pas l'écran du joueur sur B.
- Chaque action refusée affiche un message en français dans les 2 s suivant le clic.
- Un rafraîchissement en salle d'attente ou en partie, avec retour en moins de 10 s, ne produit chez les autres ni retrait de la liste ni statut « déconnecté ».
- Sans retour au bout de 10 s : le joueur est retiré du salon (salle d'attente) ou affiché « déconnecté » (partie en cours).
- Un joueur qui rejoint un salon apparaît chez les autres en moins de 1 s, avec une seule notification.
- Le serveur répond au lancement d'une manche sans délai imposé ; l'animation de distribution dure environ 3 s côté joueur.
- Une demande de distribution pendant une manche en cours, de lancement avec un seul joueur, de troisième révélation initiale ou de révélation hors de cette phase est refusée, avec un message.
- Deux demandes « Rejouer » rapprochées du créateur créent une seule nouvelle partie.
- Toutes les vérifications du projet passent.

## Hors périmètre

- Détection ou sanction de la triche (signalement, bannissement) : le serveur refuse les coups impossibles, sans plus.
- Mode spectateur, ou suivi d'une partie par un non-joueur.
- Chat, émotes, indicateur « en train de jouer ».
- Reprise d'une partie sur un autre appareil en cours de manche au-delà de ce qui fonctionne déjà.
- Remplacement d'un joueur parti par un robot, ou expulsion par le créateur.
- Optimisation de la vérification de session à chaque action (point 12 de l'audit).
- Refonte visuelle du plateau ou des messages.
- Historique des actions refusées.

## Décisions d'implémentation

- Cartes visibles par un joueur : ses cartes révélées, les cartes révélées des adversaires, la défausse. Pour une carte face cachée, seul l'emplacement est connu ; pour la pioche, seul le nombre de cartes restantes.
- En fin de manche, toutes les cartes des joueurs sont révélées à tous.
- Délai de grâce de déconnexion : 10 s, identique en salle d'attente et en partie.
- Plusieurs onglets d'un même joueur comptent comme une seule présence.
- Messages de refus : toast d'erreur éphémère avec un motif court en français (« Ce n'est pas ton tour », « Seul le créateur de la partie peut faire cela », « Coup refusé », « La partie est déjà en cours », « Il faut au moins 2 joueurs »).
- Session expirée : message éphémère puis redirection vers la page de connexion.
- Après un refus, le plateau reprend l'état reçu du serveur.
- Animation de distribution : environ 3 s, déclenchée et minutée côté joueur.
- Minimum 2 joueurs pour lancer une partie.
- Révélation initiale : exactement 2 cartes par joueur, uniquement pendant cette phase.
- « Rejouer » : une seule nouvelle partie par partie terminée ; un second clic renvoie vers la même.

## Notes complémentaires

- Risque : les navigateurs déjà ouverts pendant le déploiement utilisent l'ancien protocole. Les joueurs devront rafraîchir la page, ce qui est acceptable vu le public.
- Décision prise au découpage : cacher les cartes impose que le serveur calcule les coups (le navigateur ne connaît plus les valeurs cachées). Le choix d'origine « le serveur fait confiance à l'état envoyé par le client » est abandonné.
- Futur : allègement de la vérification de session.
- Les consignes du projet sur la confiance faite à l'état envoyé par le client seront à mettre à jour.
