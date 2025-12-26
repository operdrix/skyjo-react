// Service API centralisé avec gestion des erreurs, auto-logout sur 401 et refresh token automatique
import { buildApiUrl } from '../utils/apiUtils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  code?: number;
}

let logoutCallback: (() => void) | null = null;
let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

// Fonction pour définir le callback de déconnexion
export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// Fonction pour notifier tous les appels en attente du résultat du refresh
const onRefreshed = (success: boolean) => {
  refreshSubscribers.forEach((callback) => callback(success));
  refreshSubscribers = [];
};

// Fonction pour ajouter un appel en attente du refresh
const addRefreshSubscriber = (callback: (success: boolean) => void) => {
  refreshSubscribers.push(callback);
};

// Fonction pour rafraîchir le token d'accès
const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const response = await fetch(buildApiUrl('auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erreur lors du refresh du token:', error);
    return false;
  }
};

// Fonction centralisée pour faire des appels API avec gestion des erreurs et refresh automatique
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiCall = async <T = any>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false
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

    // Si erreur 401 (non autorisé)
    if (response.status === 401) {
      // Si c'est la route de vérification ou de refresh, ou si c'est déjà un retry, ne pas retry
      if (endpoint.includes('auth/verify') || endpoint.includes('auth/refresh') || isRetry) {
        // Pour auth/verify, c'est normal si pas connecté, ne pas déconnecter
        if (!endpoint.includes('auth/verify') && logoutCallback) {
          logoutCallback();
        }
        const data = await response.json();
        return {
          error: data.error || 'Non autorisé',
          code: 401,
        };
      }

      // Tentative de refresh du token
      if (!isRefreshing) {
        isRefreshing = true;
        const refreshSuccess = await refreshAccessToken();
        isRefreshing = false;
        onRefreshed(refreshSuccess);

        if (refreshSuccess) {
          // Retry la requête originale avec le nouveau token
          return apiCall<T>(endpoint, options, true);
        } else {
          // Échec du refresh, déconnexion
          if (logoutCallback) {
            logoutCallback();
          }
          return {
            error: 'Session expirée. Veuillez vous reconnecter.',
            code: 401,
          };
        }
      } else {
        // Un refresh est déjà en cours, attendre qu'il se termine
        return new Promise((resolve) => {
          addRefreshSubscriber((success: boolean) => {
            if (success) {
              // Retry la requête originale
              resolve(apiCall<T>(endpoint, options, true));
            } else {
              resolve({
                error: 'Session expirée. Veuillez vous reconnecter.',
                code: 401,
              });
            }
          });
        });
      }
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
