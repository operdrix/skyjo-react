import { playBotMove } from "../controllers/games.ts";
import { logger } from "../utils/logger.ts";
import type { GameServer } from "./types.ts";

// Pause avant chaque geste d'un robot : un tour (prendre une carte, puis la poser) se suit des yeux
const BOT_DELAY_MS = Number(process.env.BOT_DELAY_MS ?? 1000);

// Geste de robot programmé, par partie (au plus un à la fois)
const botTurns = new Map<string, NodeJS.Timeout>();

// À l'arrêt du serveur, les gestes programmés sont abandonnés (la base est fermée)
export function cancelBotTurns() {
  botTurns.forEach(clearTimeout);
  botTurns.clear();
}

// Après chaque changement d'une partie : si un robot doit jouer, son geste est joué après la pause,
// diffusé comme le coup d'un humain, puis le geste suivant est programmé
export function scheduleBots(io: GameServer, gameId: string) {
  if (botTurns.has(gameId)) return;
  const timer = setTimeout(async () => {
    // Libéré avant de jouer : un coup humain joué entre-temps peut reprogrammer un geste
    botTurns.delete(gameId);
    try {
      const game = await playBotMove(gameId);
      if (!game) return;
      io.to(gameId).emit("play-move", game);
      scheduleBots(io, gameId);
    } catch (error) {
      logger.error("[robot]", error);
    }
  }, BOT_DELAY_MS);
  botTurns.set(gameId, timer);
}
