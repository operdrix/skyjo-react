// Banc d'essai des robots : parties complètes jouées entièrement par des robots, sans base ni socket.
// Chaque coup passe par l'intention, comme pour un joueur humain (un coup refusé fait échouer la simulation).

import type { BotLevel, GameData } from "../../../shared/types.ts";
import { chooseIntent } from "./bots.ts";
import { applyIntent } from "./moves.ts";
import { advanceGame, checkMaximumScore, computeRoundScores, dealCards, type Scores } from "./rules.ts";
import { hideCards } from "./view.ts";

export type SimulatedPlayer = { id: string; level: BotLevel };
export type SimulationResult = { totals: Scores; winner: string; rounds: number };

// Garde-fou : une manche ne dure jamais aussi longtemps
const MAX_MOVES_PER_ROUND = 5000;

// Tirage pseudo-aléatoire reproductible (mulberry32)
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Joueur qui doit agir : celui dont c'est le tour, ou pendant la révélation initiale le premier
// qui n'a pas encore révélé ses 2 cartes
function actor(gameData: GameData, players: SimulatedPlayer[]): SimulatedPlayer {
  if (gameData.currentPlayer) return players.find((player) => player.id === gameData.currentPlayer)!;
  return players.find((player) => gameData.playersCards[player.id].filter((card) => card.revealed).length < 2)!;
}

// Joue une manche jusqu'à sa fin et renvoie les données finales
export function simulateRound(players: SimulatedPlayer[], random: () => number): GameData {
  let gameData = dealCards(
    players.map((player) => player.id),
    random,
  );
  for (let moves = 0; gameData.currentStep !== "endGame"; moves++) {
    if (moves >= MAX_MOVES_PER_ROUND) throw new Error("Manche sans fin");
    const { id, level } = actor(gameData, players);
    const intent = chooseIntent(hideCards(gameData), id, level, random);
    const next = intent && applyIntent(gameData, id, intent);
    if (!next) throw new Error(`Coup refusé pour ${id} (${level}) : ${JSON.stringify(intent)}`);
    gameData = advanceGame(next);
  }
  return gameData;
}

// Joue une partie complète (jusqu'à 100 points) ; le gagnant a le plus petit total
export function simulateGame(players: SimulatedPlayer[], random: () => number): SimulationResult {
  const totals: Scores = Object.fromEntries(players.map((player) => [player.id, 0]));
  for (let rounds = 1; ; rounds++) {
    const scores = computeRoundScores(simulateRound(players, random));
    for (const player of players) totals[player.id] += scores[player.id];
    const { finished, winner } = checkMaximumScore(totals);
    if (finished) return { totals, winner: winner!, rounds };
  }
}
