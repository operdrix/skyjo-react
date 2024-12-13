# Projet Skyjo en React

## Installation

## Concepts

## Etapes de chaque parties :

- **initialReveal** : Au début de la partie, chaque joueur révèle 2 de ses cartes.

- **draw** : Le joueur pioche une carte (depuis la pioche ou la défausse).
- **decide** : Le joueur décide de garder la carte piochée (et l’échanger avec une carte de son tableau) ou de la défausser et retourner une carte cachée.
- **replace** (optionnel, si la carte piochée est gardée) : Le joueur remplace une carte de son tableau par la carte piochée, puis défausse la carte remplacée.
- **flip** (optionnel, si la carte piochée n’est pas gardée) : Le joueur révèle l’une de ses cartes face cachée sans échange.
- **endTurn** : Fin du tour, passage au joueur suivant.
- **endGame** : Fin de la manche