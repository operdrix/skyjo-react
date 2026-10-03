// Service API centralisé : cookies de session envoyés, rechargement de la session sur 401
import { buildApiUrl } from "../utils/apiUtils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  code?: number;
}

let logoutCallback: (() => void) | null = null;

// Appelé quand le serveur répond 401 (session expirée ou révoquée)
export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const apiCall = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(buildApiUrl(endpoint), {
      credentials: "include", // Important pour envoyer les cookies httpOnly
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (response.status === 401) {
      logoutCallback?.();
    }

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || "Une erreur est survenue",
        code: response.status,
      };
    }

    return { data, code: response.status };
  } catch {
    return {
      error: "Erreur de connexion au serveur",
      code: 500,
    };
  }
};

// Méthodes raccourcies
export const api = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: <T = any>(endpoint: string, options?: RequestInit) => apiCall<T>(endpoint, { ...options, method: "GET" }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  post: <T = any>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiCall<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  patch: <T = any>(endpoint: string, body?: unknown, options?: RequestInit) =>
    apiCall<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete: <T = any>(endpoint: string, options?: RequestInit) => apiCall<T>(endpoint, { ...options, method: "DELETE" }),
};
