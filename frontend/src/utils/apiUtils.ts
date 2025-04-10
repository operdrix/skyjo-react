/**
 * Construit une URL d'API en s'assurant que le préfixe /api est présent
 * @param endpoint - le chemin de l'endpoint sans le préfixe /api (ex: 'login', 'users/1')
 * @returns URL complète pour l'API
 */
export function buildApiUrl(endpoint: string): string {
  const backendHost = process.env.VITE_BACKEND_HOST || '';

  // Si l'URL se termine déjà par /api, on ajoute directement l'endpoint
  if (backendHost.endsWith('/api')) {
    return `${backendHost}/${endpoint}`;
  }

  // Sinon on ajoute le préfixe /api
  return `${backendHost}/api/${endpoint}`;
} 