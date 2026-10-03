import type { GameData } from '@/types/types';

// Coups d'un joueur : chaque fonction renvoie de nouvelles données de partie
// (copie profonde), sans jamais modifier celles reçues de l'état React.

function copy(gameData: GameData): GameData {
  return structuredClone(gameData);
}

// Pioche : la carte du dessus est révélée et prise en main
export function drawFromDeck(gameData: GameData): GameData {
  const next = copy(gameData);
  next.deckCards[0].revealed = true;
  next.deckCards[0].onHand = true;
  next.currentStep = 'decide-deck';
  return next;
}

// Prend en main la carte du dessus de la défausse
export function takeDiscard(gameData: GameData): GameData {
  const next = copy(gameData);
  next.discardPile[next.discardPile.length - 1].onHand = true;
  next.currentStep = 'replace-discard';
  return next;
}

// Défausse la carte piochée : le joueur doit ensuite retourner une de ses cartes
export function discardDrawnCard(gameData: GameData): GameData {
  const next = copy(gameData);
  const drawn = next.deckCards.shift()!;
  drawn.onHand = false;
  next.discardPile.push(drawn);
  next.currentStep = 'flip-deck';
  return next;
}

// Échange une carte du jeu avec la carte prise sur la défausse
export function replaceWithDiscard(gameData: GameData, playerId: string, cardIndex: number): GameData {
  const next = copy(gameData);
  const discardCard = next.discardPile[next.discardPile.length - 1];
  const playerCard = next.playersCards[playerId][cardIndex];
  discardCard.onHand = false;
  playerCard.onHand = false;
  playerCard.revealed = true;
  next.playersCards[playerId][cardIndex] = discardCard;
  next.discardPile[next.discardPile.length - 1] = playerCard;
  next.currentStep = 'endTurn';
  return next;
}

// Échange une carte du jeu avec la carte piochée, la carte remplacée part à la défausse
export function replaceWithDrawn(gameData: GameData, playerId: string, cardIndex: number): GameData {
  const next = copy(gameData);
  const drawn = next.deckCards.shift()!;
  const playerCard = next.playersCards[playerId][cardIndex];
  drawn.onHand = false;
  playerCard.revealed = true;
  next.discardPile.push(playerCard);
  next.playersCards[playerId][cardIndex] = drawn;
  next.currentStep = 'endTurn';
  return next;
}

// Retourne une carte du jeu (après avoir défaussé la carte piochée)
export function flipCard(gameData: GameData, playerId: string, cardIndex: number): GameData {
  const next = copy(gameData);
  next.playersCards[playerId][cardIndex].revealed = true;
  next.currentStep = 'endTurn';
  return next;
}

// Phase initiale : révèle une carte, deux au maximum par joueur
export function revealInitialCard(gameData: GameData, playerId: string, cardIndex: number): GameData {
  const next = copy(gameData);
  const cards = next.playersCards[playerId];
  if (cards.filter(card => card.revealed).length < 2) {
    cards[cardIndex].revealed = true;
  }
  return next;
}
