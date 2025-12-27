import chalk from "chalk";
import { createClient } from "redis";

let redisClient = null;

// Initialiser le client Redis
export async function initRedis() {
  // Si Redis n'est pas configuré, utiliser le fallback en mémoire
  if (!process.env.REDIS_URL) {
    console.log(
      chalk.yellow(
        "⚠️  REDIS_URL non défini - utilisation de la blacklist en mémoire (non recommandé en production)"
      )
    );
    return null;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
    });

    redisClient.on("error", (err) => {
      console.error(chalk.red("Erreur Redis:"), err);
    });

    await redisClient.connect();
    console.log(chalk.green("✓ Connecté à Redis"));
    return redisClient;
  } catch (error) {
    console.error(
      chalk.red("❌ Impossible de se connecter à Redis:"),
      error.message
    );
    console.log(
      chalk.yellow(
        "⚠️  Utilisation de la blacklist en mémoire (non recommandé en production)"
      )
    );
    return null;
  }
}

// Ajouter un token à la blacklist
export async function addToBlacklist(token, expiresIn) {
  if (!redisClient) {
    // Fallback en mémoire si Redis n'est pas disponible
    return false;
  }

  try {
    // Stocker le token avec expiration (en secondes)
    await redisClient.setEx(`blacklist:${token}`, expiresIn, "1");
    return true;
  } catch (error) {
    console.error(chalk.red("Erreur lors de l'ajout à la blacklist Redis:"), error);
    return false;
  }
}

// Vérifier si un token est blacklisté
export async function isBlacklisted(token) {
  if (!redisClient) {
    // Fallback en mémoire si Redis n'est pas disponible
    return false;
  }

  try {
    const exists = await redisClient.exists(`blacklist:${token}`);
    return exists === 1;
  } catch (error) {
    console.error(
      chalk.red("Erreur lors de la vérification de la blacklist Redis:"),
      error
    );
    return false;
  }
}

// Fermer la connexion Redis
export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    console.log(chalk.green("✓ Déconnecté de Redis"));
  }
}

export { redisClient };
