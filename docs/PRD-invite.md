# PRD : jouer sans compte (invités)

## Problème

Pour jouer, un ami invité par lien doit aujourd'hui créer un compte : email, mot de passe ou Google, puis pseudo. Pour une partie improvisée en famille ou entre amis, cette étape décourage. Certains renoncent, ou le créateur doit attendre qu'ils s'inscrivent. Le jeu est pensé pour inviter vite. L'inscription obligatoire est le principal frein à l'arrivée d'un nouveau joueur.

## Solution

Un joueur peut rejoindre une partie sans compte. Il choisit « Rejoindre sans compte » sur la page de connexion. Un pseudo lui est proposé et il peut le modifier. Il est prévenu de ce qu'il perd : pas d'historique, et une identité liée à ce navigateur. Il joue ensuite exactement comme les autres. Créer une partie reste réservé aux comptes. Un invité peut à tout moment créer un vrai compte et garde alors ses parties. Un invité qui ne revient pas pendant 7 jours est oublié ; son pseudo reste visible dans l'historique des joueurs avec compte.

## Utilisateur cible

L'ami ou le membre de la famille qui reçoit un lien de partie sur son téléphone, n'a jamais joué sur le site et veut juste faire une partie maintenant. Il ne compte pas forcément revenir. Secondairement : le curieux qui parcourt les parties publiques.

## User Stories

1. **US-1** En tant que visiteur sans compte arrivé par un lien de partie, je veux choisir « Rejoindre sans compte » sur la page de connexion, afin de jouer sans m'inscrire.
2. **US-2** En tant que visiteur qui choisit de jouer sans compte, je veux être prévenu que je n'aurai pas d'historique et que je perdrai ma place si je change d'appareil ou de navigateur, afin de décider en connaissance de cause.
3. **US-3** En tant que visiteur sans compte, je veux un pseudo proposé par défaut que je peux modifier, afin d'entrer en un clic.
4. **US-4** En tant que visiteur sans compte, je veux arriver directement dans la partie que je voulais rejoindre après avoir choisi mon pseudo, afin de ne pas chercher le lien à nouveau.
5. **US-5** En tant qu'invité, je veux rejoindre une partie publique depuis la liste, afin de jouer avec qui est disponible.
6. **US-6** En tant qu'invité, je veux jouer une partie complète comme un joueur avec compte (révélation, tours, reconnexion, fin de partie, « Rejouer »), afin de ne pas avoir une expérience au rabais.
7. **US-7** En tant qu'invité, je veux être prévenu que créer une partie demande un compte, avec un accès direct à l'inscription, afin de comprendre pourquoi je ne peux pas le faire.
8. **US-8** En tant qu'invité, je ne veux pas voir d'historique ni d'espace personnel, mais une invitation à créer un compte, afin de savoir ce que j'y gagnerais.
9. **US-9** En tant qu'invité, je veux créer un vrai compte (email et mot de passe, ou Google) en gardant mon pseudo et mes parties, afin de ne rien perdre si je m'attache au jeu.
10. **US-10** En tant que joueur avec compte, je veux voir le pseudo des invités dans mon historique et mes scores, même longtemps après, afin que mes parties passées restent lisibles.
11. **US-11** En tant que joueur, je veux repérer qui est invité à la table (mention « invité »), afin de savoir qui pourrait ne pas revenir.
12. **US-12** En tant qu'invité revenu après plus de 7 jours d'absence, je veux simplement repartir avec un nouveau pseudo, afin de ne pas être bloqué par un ancien passage.
13. **US-13** En tant que visiteur sans compte, je veux qu'un pseudo déjà pris soit refusé avec un message clair, afin d'en choisir un autre.

## Critères de succès

- Depuis un lien de partie, un visiteur sans compte entre dans la salle d'attente en 2 écrans au plus (connexion, puis avertissement et pseudo) et 2 clics au plus s'il garde le pseudo proposé.
- Un invité qui tente de créer une partie, par l'interface ou par l'API, est refusé avec un message.
- Un invité n'a accès ni à l'historique ni à l'espace personnel, par l'interface ou par l'API.
- Un invité qui crée un compte retrouve dans son historique les parties jouées en tant qu'invité.
- 7 jours après la dernière visite d'un invité, sa session et son compte invité sont supprimés, et son pseudo apparaît toujours dans l'historique des autres joueurs.
- Pages légales à jour (compte invité, données gardées, durée).

## Hors périmètre

- Créer une partie sans compte.
- Retrouver un compte invité depuis un autre appareil ou navigateur, ou après effacement des cookies.
- Fusionner un compte invité avec un compte existant (seule la création d'un nouveau compte est prévue).
- Historique ou statistiques pour les invités.
- Réserver le pseudo d'un invité après son départ : il redevient libre.
- Changer le pseudo d'un invité en cours de partie.

## Décisions d'implémentation

- Libellé du choix : « Rejoindre sans compte », sur la page de connexion, sous les choix existants.
- Écran suivant : avertissement court (pas d'historique, place liée à ce navigateur, oublié après 7 jours sans visite), pseudo prérempli et modifiable, bouton « Jouer ».
- Pseudo proposé : tiré au hasard, court et sympathique (ex. « Lynx 42 »). Il suit les mêmes règles que les pseudos des comptes (longueur, caractères, unicité).
- Mention « invité » à côté du pseudo d'un invité, en partie et dans l'historique.
- Invité qui tente de créer une partie ou d'ouvrir son espace : message éphémère, puis page d'inscription.
- Bouton « Créer mon compte » visible par l'invité dans l'en-tête, et sur l'écran de fin de partie.
- Durée de vie d'un invité : 7 jours après sa dernière visite.
- Pseudo dans l'historique : celui que le joueur portait pendant la partie, conservé après la suppression du compte invité.

## Notes complémentaires

- Risque : création en masse de comptes invités. On s'appuie sur la limite de débit déjà en place sur l'authentification.
- Hypothèse : le pseudo conservé dans l'historique est la seule donnée gardée après la suppression ; c'est à mentionner dans la politique de confidentialité.
- Deux joueurs différents peuvent donc apparaître sous le même pseudo dans de vieux historiques. C'est accepté.
