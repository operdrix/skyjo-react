import { createClient } from "redis";
import { logger } from "./utils/logger.js";

let redisClient = null;
let memoryBlacklist = new Map(); // Fallback en mémoire

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
}, 5 * 60 * 1000); // 5 minutes

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
    redisClient = createClient({
      url: process.env.REDIS_URL,
    });

    redisClient.on("error", (err) => {
      logger.error("Erreur Redis:", err);
    });

    await redisClient.connect();
    logger.success("✓ Connecté à Redis");
    return redisClient;
  } catch (error) {
    logger.error(
      "❌ Impossible de se connecter à Redis:",
      error.message
    );
    logger.warn(
      "⚠️  Utilisation de la blacklist en mémoire (non recommandé en production)"
    );
    return null;
  }
}

// Ajouter un token à la blacklist
export async function addToBlacklist(token, expiresIn) {
  if (!redisClient) {
    // Fallback en mémoire si Redis n'est pas disponible
    const expiryTimestamp = Date.now() + expiresIn * 1000;
    memoryBlacklist.set(token, expiryTimestamp);
    logger.debug(`Token ajouté à la blacklist mémoire (expire dans ${expiresIn}s)`);
    return true;
  }

  try {
    // Stocker le token avec expiration (en secondes)
    await redisClient.setEx(`blacklist:${token}`, expiresIn, "1");
    return true;
  } catch (error) {
    logger.error("Erreur lors de l'ajout à la blacklist Redis:", error);
    return false;
  }
}

// Vérifier si un token est blacklisté
export async function isBlacklisted(token) {
  if (!redisClient) {
    // Fallback en mémoire si Redis n'est pas disponible
    const expiry = memoryBlacklist.get(token);
    if (!expiry) return false;

    // Vérifier si le token a expiré
    if (Date.now() > expiry) {
      memoryBlacklist.delete(token);
      return false;
    }

    return true;
  }

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
