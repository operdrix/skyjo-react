import { toast } from "@/lib/toast";

// Page où revenir après connexion, transmise dans l'adresse (?redirect=) pour survivre à l'aller-retour Google

// Seul un chemin interne est accepté : pas de redirection vers un autre site (//exemple.test, /\exemple.test)
export const safeRedirect = (value: string | null): string =>
  value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/";

export const withRedirect = (path: string, redirect: string): string =>
  redirect === "/" ? path : `${path}?redirect=${encodeURIComponent(redirect)}`;

// Action réservée aux joueurs avec compte : message éphémère puis inscription
export const goToRegister = (navigate: (path: string) => void, message: string): void => {
  toast({ type: "info", title: "Compte requis", message });
  navigate("/auth/register");
};

// Page réservée aux joueurs connectés : message éphémère puis connexion, avec retour à la page demandée
export const goToLogin = (navigate: (path: string) => void, from: string, message: string): void => {
  toast({ type: "info", title: "Connexion requise", message });
  navigate(withRedirect("/auth/login", from));
};
