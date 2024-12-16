# Projet Skyjo en React

## Installation

## Concepts

## Etapes de chaque parties :

- **initialReveal** : Au début de la partie, chaque joueur révèle 2 de ses cartes.

- **draw** : Le joueur pioche une carte (depuis la pioche ou la défausse).
- **CHOIX 1 : la carte vient de la défausse**
  - **replace-discard** (Optionel si la carte vient de la défausse) : Il doit remplacer une de ses carte.
- **CHOIX 2 : la carte vient de la pioche**
  - **decide-deck** (optionel si la carte vient de la pioche) : Il décide si il souhaite la garder et remplacer une de ses cartes ou de la défausser et retourner une carte cachée.
  - **flip-deck** (optionnel, si la carte piochée n’est pas gardée) : Le joueur révèle l’une de ses cartes face cachée sans échange.
- **endTurn** : Fin du tour, passage au joueur suivant.
- **endGame** : Fin de la manche, affichage des résultats de la manche ou de la partie