# PRD : plateforme multi-jeux olivgames.fr et Banco

## Problème

Les amis et la famille qui jouent sur olivgames.fr n'ont qu'un seul jeu. Une fois Skyjo épuisé, ils retournent ailleurs pour varier : applis grand public, jeux de société physiques. Ajouter un jeu aujourd'hui voudrait dire recopier tout le socle de Skyjo (comptes, salons, invités, présence, historique, pages légales). La maintenance doublerait, et les joueurs devraient se créer un compte par jeu. Skyjo est stable en production, avec invités et temps réel terminés : c'est le bon moment pour sortir ce socle et accueillir les jeux récents que le groupe aime, en commençant par un jeu de type « stop ou encore ». Le nom actuel « Skyjo » est en plus une marque d'éditeur, risque qui grandit si le site s'ouvre à plusieurs jeux.

## Solution

olivgames.fr devient un portail. On y trouve la liste des jeux, la connexion et l'inscription, l'espace personnel (pseudo, thème, résumé des parties par jeu, suppression du compte) et les pages légales. Chaque jeu vit sur son propre sous-domaine, où l'on retrouve ce que Skyjo offre déjà : créer une partie, inviter par lien, parties publiques, salle d'attente, jouer, rejouer, historique du jeu. Un seul compte, connecté partout : on passe d'un jeu à l'autre sans se reconnecter, avec le même pseudo et le même thème. Les invités fonctionnent pareil dans tous les jeux.

Deux jeux à l'ouverture :
- **Colonnes** (nom provisoire), le Skyjo actuel renommé, sans perte de compte ni d'historique.
- **Banco** (nom provisoire), nouveau jeu « stop ou encore » : à son tour, on prend une carte ou on s'arrête ; un nombre en double fait perdre la manche ; des cartes action ciblent un joueur. Premier à 200 points.

## Utilisateur cible

Un groupe d'amis ou une famille, de 2 à 8 personnes. Ils jouent à distance, chacun sur son téléphone pendant une visio, ou autour d'une table avec chacun son écran. Ils connaissent déjà Skyjo sur le site et veulent changer de jeu entre deux parties, sans se réinscrire ni chercher un autre site. Secondairement : l'invité qui arrive par un lien vers un jeu précis, sans connaître le portail.

## User Stories

**Portail et compte**
1. **US-1** En tant que visiteur, je veux voir sur olivgames.fr la liste des jeux (nom, nombre de joueurs, durée indicative), afin de choisir à quoi jouer.
2. **US-2** En tant que visiteur, je veux qu'un clic sur un jeu m'emmène sur son site, afin de commencer à jouer.
3. **US-3** En tant que visiteur, je veux m'inscrire ou me connecter une seule fois sur olivgames.fr, afin d'accéder à tous les jeux.
4. **US-4** En tant que joueur connecté, je veux passer d'un jeu à l'autre sans me reconnecter, afin d'enchaîner les parties.
5. **US-5** En tant que visiteur non connecté arrivé directement sur un jeu, je veux être envoyé vers la connexion puis ramené sur la page où j'étais, afin de ne pas me perdre.
6. **US-6** En tant que joueur, je veux que mon pseudo et mon thème soient les mêmes dans tous les jeux, afin d'être reconnu partout.
7. **US-7** En tant que joueur, je veux voir dans mon espace personnel le nombre de parties jouées par jeu et mes dernières parties avec un lien, afin de retrouver mon activité.
8. **US-8** En tant que joueur sans aucune partie, je veux un espace personnel qui m'invite à choisir un jeu, afin de ne pas tomber sur une page vide.
9. **US-9** En tant que joueur, je veux me déconnecter depuis n'importe quel jeu et être déconnecté partout, afin de sécuriser un appareil partagé.
10. **US-10** En tant que joueur, je veux supprimer mon compte depuis le portail, afin que mes données disparaissent de tous les jeux.
11. **US-11** En tant que visiteur, je veux trouver les pages légales au même endroit pour tous les jeux, afin de savoir comment mes données sont traitées.

**Joueurs existants et Colonnes**
12. **US-12** En tant que joueur Skyjo existant, je veux me connecter avec mes identifiants habituels, afin de ne pas me réinscrire.
13. **US-13** En tant que joueur Skyjo existant, je veux retrouver toutes mes parties passées dans l'historique de Colonnes, afin de ne rien perdre.
14. **US-14** En tant que joueur avec un ancien lien ou un ancien favori Skyjo, je veux être redirigé vers Colonnes (sur la même partie si c'était un lien de partie), afin que mes liens marchent encore.
15. **US-15** En tant que joueur de Colonnes, je veux exactement le même jeu qu'avant, sous son nouveau nom, afin de ne pas réapprendre.

**Invités**
16. **US-16** En tant qu'invité arrivé par un lien de partie, je veux rejoindre sans compte, quel que soit le jeu, afin de jouer tout de suite.
17. **US-17** En tant qu'invité qui crée un compte, je veux garder mes parties de tous les jeux, afin de ne rien perdre.

**Banco : avant la partie**
18. **US-18** En tant que joueur, je veux créer une partie de Banco publique ou privée et inviter par lien, afin de jouer avec mes proches.
19. **US-19** En tant que créateur, je veux lancer la partie dès 2 joueurs présents et jusqu'à 8, afin de jouer à 2 comme à 8.
20. **US-20** En tant que joueur, je veux voir les parties publiques de Banco ouvertes, afin de rejoindre une table.

**Banco : pendant une manche**
21. **US-21** En tant que joueur dont c'est le tour, je veux choisir « Encore » (prendre une carte) ou « Stop » (garder mes points), afin de doser mon risque.
22. **US-22** En tant que joueur, je veux voir les cartes de chacun, son total provisoire et s'il est en jeu, arrêté ou éliminé, afin de juger le risque des autres.
23. **US-23** En tant que joueur qui tire un nombre déjà devant lui, je veux être clairement éliminé de la manche avec 0 point, afin de comprendre ce qui s'est passé.
24. **US-24** En tant que joueur qui tire une carte action, je veux choisir sa cible parmi les joueurs encore en jeu (moi compris), afin de jouer tactique.
25. **US-25** En tant que joueur ciblé par Gel, je veux être arrêté en gardant mes points, afin que la règle soit appliquée.
26. **US-26** En tant que joueur ciblé par Trois d'un coup, je veux recevoir 3 cartes une à une, la manche s'arrêtant au premier doublon ou à 7 nombres, afin que la règle soit appliquée.
27. **US-27** En tant que joueur qui a une Seconde chance, je veux qu'elle annule automatiquement mon prochain doublon, afin de rester en jeu.
28. **US-28** En tant que joueur qui tire une deuxième Seconde chance, je veux la donner à un autre joueur en jeu, ou la défausser si personne ne peut la prendre, afin que la règle soit appliquée.
29. **US-29** En tant que joueur qui réunit 7 nombres différents, je veux recevoir le bonus de 15 points et voir la manche s'arrêter, afin d'être récompensé.
30. **US-30** En tant que joueur, je veux voir les modificateurs (+2 à +10, ×2) comptés dans mon total provisoire, afin de connaître mon score réel.
31. **US-31** En tant que joueur, je ne veux jamais pouvoir connaître la prochaine carte de la pioche, afin que la partie soit honnête.
32. **US-32** En tant que joueur, je veux que la pioche soit reformée avec la défausse quand elle est vide, afin que la manche continue.
33. **US-33** En tant que joueur qui ne joue pas, je veux une indication de qui joue et ce qu'il vient de tirer, afin de suivre la partie.
34. **US-34** En tant que joueur, je veux consulter une aide de jeu (bouton « Règles ») pendant la partie, afin de vérifier une règle sans quitter la table.
35. **US-35** En tant que joueur qui tente une action hors de son tour, je veux un refus avec un message, afin de comprendre.

**Banco : fin de manche et de partie**
36. **US-36** En tant que joueur, je veux voir les résultats de la manche (points de chacun, totaux) au centre de la table, afin de suivre le classement.
37. **US-37** En tant que joueur, je veux que le premier joueur change à chaque manche, afin que ce soit équitable.
38. **US-38** En tant que joueur, je veux que la partie s'arrête à la fin d'une manche où quelqu'un atteint 200 points, le plus haut total gagnant, afin de connaître le vainqueur.
39. **US-39** En tant que joueur à égalité en tête en fin de partie, je veux être déclaré vainqueur ex æquo, afin que la partie se termine sans manche en plus.
40. **US-40** En tant que joueur, je veux rejouer avec la même table en un clic, afin d'enchaîner.
41. **US-41** En tant que joueur, je veux retrouver mes parties de Banco dans l'historique de Banco, afin de revoir mes scores.

**Présence**
42. **US-42** En tant que joueur qui perd brièvement le réseau, je veux retrouver ma place à la reconnexion, comme dans Colonnes, afin de ne pas perdre ma partie.
43. **US-43** En tant que joueur dont un adversaire a quitté la partie, je veux que la partie continue sans bloquer sur son tour, afin de ne pas rester coincé.

## Critères de succès

1. Un joueur connecté sur le portail ouvre Banco puis Colonnes sans se reconnecter, avec le même pseudo et le même thème.
2. Un joueur Skyjo existant se connecte avec ses identifiants habituels et retrouve toutes ses parties dans l'historique de Colonnes.
3. L'ancien sous-domaine Skyjo et les anciens liens de partie redirigent vers Colonnes, sur la même partie.
4. Une partie de Banco de 2 à 8 joueurs se joue jusqu'à 200 points : tours, actions ciblées, doublon, bonus de 7 nombres, plusieurs manches, rejouer.
5. Une carte non retournée de la pioche de Banco ne sort jamais du serveur, ni par l'API ni par le temps réel.
6. Un invité rejoint une partie de Banco par lien, comme dans Colonnes.
7. L'espace personnel du portail affiche le nombre de parties par jeu et les dernières parties, avec un lien vers chacune.
8. Les noms « Skyjo » et « Flip 7 », leurs visuels et le texte de leurs règles n'apparaissent nulle part sur le site (titres, métadonnées, sous-domaines).
9. Les noms définitifs des deux jeux sont vérifiés sur les bases de marques INPI et TMview avant la mise en production.
10. Les pages légales, centralisées sur le portail, sont à jour (domaines, cookie partagé entre sous-domaines).
11. Les 3 thèmes (Tapis, Néon, Confettis) s'appliquent à tous les jeux.

## Hors périmètre

- Créer une partie depuis le portail : il redirige seulement vers le jeu.
- Un historique ou un classement global qui mélange les jeux (seulement un résumé).
- Un classement entre joueurs, du matchmaking entre inconnus, un chat.
- Un score cible réglable ou des règles maison dans Banco.
- Un habillage ou des thèmes propres à un jeu.
- Un 2e nouveau jeu (6 qui prend et les autres restent dans les idées notées).
- Des robots ou une IA pour compléter une table.
- Une application mobile native.
- La monétisation (publicité, achats) : le site reste gratuit.
- Passer d'un jeu à l'autre avec la même table de joueurs.

## Décisions d'implémentation

- **Adresses** : le portail sur olivgames.fr, chaque jeu sur son sous-domaine (nom définitif du jeu). L'ancien sous-domaine Skyjo redirige vers Colonnes.
- **Connexion** : inscription, connexion et espace personnel sur le portail. Un visiteur non connecté sur un jeu est envoyé à la connexion du portail, puis ramené sur la page d'origine. La déconnexion vaut pour tous les jeux.
- **Portail** : une carte par jeu (nom, 2 à 8 joueurs, durée indicative). Un clic ouvre le jeu. Pas de création de partie depuis le portail.
- **Espace personnel** : nombre de parties par jeu et dernières parties avec lien. Sans partie : invitation à choisir un jeu.
- **Thèmes** : Tapis, Néon, Confettis, communs à tous les jeux. Le thème choisi suit le joueur partout.
- **Colonnes** : jeu, règles et parcours identiques à Skyjo, seul le nom change (titres, textes, visuels).
- **Banco, paquet** : 94 cartes. Nombres de 0 à 12 (n exemplaires de n, un seul 0), 6 modificateurs (+2, +4, +6, +8, +10, ×2), 9 actions renommées : 3 Gel, 3 Trois d'un coup, 3 Seconde chance.
- **Banco, tour** : deux boutons, « Encore » et « Stop ». Une action tirée demande de choisir une cible parmi les joueurs en jeu ; si le joueur est seul en jeu, elle s'applique à lui. Une action tirée pendant un « Trois d'un coup » est résolue après les 3 cartes.
- **Banco, score de manche** : somme des nombres, doublée par le ×2, puis ajout des modificateurs +, plus 15 si 7 nombres différents. Doublon : 0 point.
- **Banco, fin de manche** : quand tous les joueurs sont arrêtés ou éliminés, ou dès qu'un joueur réunit 7 nombres différents. Résultats affichés au centre de la table, comme dans Colonnes. Le premier joueur change à chaque manche.
- **Banco, fin de partie** : à la fin d'une manche où au moins un joueur atteint 200 points. Le plus haut total gagne ; en cas d'égalité, vainqueurs ex æquo.
- **Banco, joueurs** : de 2 à 8, lancement dès 2 joueurs. Règles identiques à 2 joueurs.
- **Aide de jeu** : bouton « Règles » accessible en partie, texte rédigé pour le site.
- **Refus** : une action hors de son tour ou impossible est refusée avec un message éphémère, comme dans Colonnes.
- **Présence et invités** : même comportement que Colonnes dans tous les jeux (délai de grâce à la déconnexion, reconnexion, invités, oubli après 7 jours).
- **Noms** : « Banco » et « Colonnes » sont provisoires ; les noms définitifs sont choisis et vérifiés avant la mise en production.

## Notes complémentaires

- **Prérequis juridique** : choisir les noms définitifs des deux jeux et les vérifier dans les bases de marques INPI et TMview (classes 28 et 41) avant la mise en production. Appliquer les précautions des notes d'idées de jeux (règles réécrites, visuels propres, aucune mention des marques d'origine).
- **Hypothèse** : les règles de Banco décrites ici sont celles du jeu d'origine de mémoire, à vérifier avec la boîte du jeu avant de coder.
- **Dépendance** : création des nouveaux sous-domaines chez l'hébergeur et redirection de l'ancien sous-domaine.
- **Futur** : les autres jeux candidats (6 qui prend, Trio, Skull…) et les mécanismes qu'ils demandent sont listés dans les notes d'idées de jeux.
