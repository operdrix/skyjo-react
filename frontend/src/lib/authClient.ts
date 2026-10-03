import { buildApiUrl } from '@/utils/apiUtils';
import { usernameClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

// Client Better Auth : session (cookie httpOnly), connexion email ou Google, pseudo
export const authClient = createAuthClient({
  baseURL: new URL(buildApiUrl('auth'), window.location.origin).toString(),
  plugins: [usernameClient()],
});
