// Service API centralisé avec gestion des erreurs et auto-logout sur 401
import { buildApiUrl } from '../utils/apiUtils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  code?: number;
}

let logoutCallback: (() => void) | null = null;

// Fonction pour définir le callback de déconnexion
export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// Fonction centralisée pour faire des appels API avec gestion des erreurs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiCall = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = buildApiUrl(endpoint);

  // Configuration par défaut
  const defaultOptions: RequestInit = {
    credentials: 'include', // Important pour envoyer les cookies httpOnly
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    // Si erreur 401 (non autorisé), on déconnecte automatiquement l'utilisateur
    // SAUF si c'est la route de vérification elle-même (pour éviter une boucle)
    if (response.status === 401 && !endpoint.includes('auth/verify')) {
      if (logoutCallback) {
        logoutCallback();
      }
      return {
        error: 'Session expirée. Veuillez vous reconnecter.',
        code: 401
      };
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || 'Une erreur est survenue',
        code: response.status,
      };
    }

    return { data, code: response.status };
  } catch (error) {
    // Ne pas logger les erreurs attendues de auth/verify (utilisateur non connecté)
    if (!endpoint.includes('auth/verify')) {
      console.error('Erreur API:', error);
    }
    return {
      error: 'Erreur de connexion au serveur',
      code: 500,
    };
  }
};

// Méthodes raccourcies
export const api = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiCall<T>(endpoint, { ...options, method: 'GET' }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: <T = any>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiCall<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch: <T = any>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiCall<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiCall<T>(endpoint, { ...options, method: 'DELETE' }),
};
