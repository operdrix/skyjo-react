import chalk from "chalk";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Système de logging conditionnel
 * Les logs debug/info sont désactivés en production pour optimiser les performances
 */
export const logger = {
  /**
   * Informations générales (uniquement en dev)
   */
  info: (...args) => {
    if (isDev) {
      console.log(chalk.blue("[INFO]"), ...args);
    }
  },

  /**
   * Erreurs critiques (toujours affichées)
   */
  error: (...args) => {
    console.error(chalk.red("[ERROR]"), ...args);
  },

  /**
   * Avertissements (toujours affichés)
   */
  warn: (...args) => {
    console.warn(chalk.yellow("[WARN]"), ...args);
  },

  /**
   * Messages de debug (uniquement en dev)
   */
  debug: (...args) => {
    if (isDev) {
      console.log(chalk.gray("[DEBUG]"), ...args);
    }
  },

  /**
   * Messages de succès (toujours affichés)
   */
  success: (...args) => {
    console.log(chalk.green("[SUCCESS]"), ...args);
  },
};
