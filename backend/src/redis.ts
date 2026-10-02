import { createClient, type RedisClientType } from "redis";
import { logger } from "./utils/logger.ts";

let redisClient: RedisClientType | null = null;
const memoryBlacklist = new Map<string, number>(); // Fallback en mémoire

// Nettoyer automatiquement la blacklist mémoire toutes les 5 minutes
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  for (const [token, expiry] of memoryBlacklist.entries()) {
    if (now > expiry) {
      memoryBlacklist.delete(token);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug(`Nettoyage blacklist mémoire: ${cleaned} tokens expirés supprimés`);
  }
}, 5 * 60 * 1000).unref(); // 5 minutes, sans empêcher l'arrêt du processus

// Initialiser le client Redis
export async function initRedis() {
  // Si Redis n'est pas configuré, utiliser le fallback en mémoire
  if (!process.env.REDIS_URL) {
    logger.warn(
      "⚠️  REDIS_URL non défini - utilisation de la blacklist en mémoire (non recommandé en production)"
    );
    return null;
  }

  try {
    const client: RedisClientType = createClient({
      url: process.env.REDIS_URL,
    });
    redisClient = client;

    client.on("error", (err) => {
      logger.error("Erreur Redis:", err);
    });

    await client.connect();
    logger.success("✓ Connecté à Redis");
    return redisClient;
  } catch (error) {
    logger.error(
      "❌ Impossible de se connecter à Redis:",
      (error as Error).message
    );
    logger.warn(
      "⚠️  Utilisation de la blacklist en mémoire (non recommandé en production)"
    );
    return null;
  }
}

// Ajouter un token à la blacklist (en mémoire si Redis est absent ou en erreur)
export async function addToBlacklist(token: string, expiresIn: number) {
  if (redisClient) {
    try {
      // Stocker le token avec expiration (en secondes)
      await redisClient.setEx(`blacklist:${token}`, expiresIn, "1");
      return;
    } catch (error) {
      logger.error("Erreur lors de l'ajout à la blacklist Redis, repli en mémoire:", error);
    }
  }
  memoryBlacklist.set(token, Date.now() + expiresIn * 1000);
  logger.debug(`Token ajouté à la blacklist mémoire (expire dans ${expiresIn}s)`);
}

function isInMemoryBlacklist(token: string) {
  const expiry = memoryBlacklist.get(token);
  if (!expiry) return false;

  // Vérifier si le token a expiré
  if (Date.now() > expiry) {
    memoryBlacklist.delete(token);
    return false;
  }
  return true;
}

// Vérifier si un token est blacklisté (mémoire, puis Redis)
export async function isBlacklisted(token: string) {
  if (isInMemoryBlacklist(token)) return true;
  if (!redisClient) return false;

  try {
    const exists = await redisClient.exists(`blacklist:${token}`);
    return exists === 1;
  } catch (error) {
    logger.error(
      "Erreur lors de la vérification de la blacklist Redis:",
      error
    );
    return false;
  }
}

// Fermer la connexion Redis
export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    logger.success("✓ Déconnecté de Redis");
  }
}

// Obtenir les statistiques de la blacklist
export function getBlacklistStats() {
  return {
    redisConnected: redisClient !== null,
    memoryTokensCount: memoryBlacklist.size,
  };
}

export { redisClient };
