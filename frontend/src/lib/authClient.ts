import { buildApiUrl } from "@/utils/apiUtils";
import { anonymousClient, inferAdditionalFields, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Client Better Auth : session (cookie httpOnly), connexion email ou Google, invité, pseudo, thème
export const authClient = createAuthClient({
  baseURL: new URL(buildApiUrl("auth"), window.location.origin).toString(),
  plugins: [
    usernameClient(),
    anonymousClient(),
    inferAdditionalFields({ user: { theme: { type: "string", required: false } } }),
  ],
});
