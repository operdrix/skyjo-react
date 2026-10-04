import App from "@/App.tsx";
import Toaster from "@/components/Toaster";
import AppLayout from "@/AppLayout.tsx";
import { UserProvider } from "@/context/UserProvider.tsx";
import "@/index.css";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

// Page chargée à la demande : chaque route a son propre fichier JS (l'accueil reste dans le bundle principal)
const page = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await load()).default,
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { path: "/", element: <App /> },
      { path: "/privacy", lazy: page(() => import("@/pages/legal/PrivacyPage")) },
      { path: "/cgu", lazy: page(() => import("@/pages/legal/Terms")) },
      { path: "/cookies", lazy: page(() => import("@/pages/legal/Cookies")) },
      { path: "/mentions-legales", lazy: page(() => import("@/pages/legal/LegalNotice")) },
      { path: "/rules", lazy: page(() => import("@/pages/game/Rules")) },
      { path: "/dashboard", lazy: page(() => import("@/pages/dashboard/Dashboard")) },
    ],
  },
  {
    // Pages de jeu : connexion websocket
    path: "/",
    lazy: page(() => import("@/pages/game/GameLayout")),
    children: [
      { path: "/create", lazy: page(() => import("@/pages/game/Create")) },
      { path: "/public-rooms", lazy: page(() => import("@/pages/game/JoinPublic")) },
      { path: "/game/:gameId", lazy: page(() => import("@/pages/game/Game")) },
      { path: "/join/:gameId", lazy: page(() => import("@/pages/game/WaitingRoom")) },
    ],
  },
  {
    path: "/auth",
    lazy: page(() => import("@/pages/auth/AuthLayout")),
    children: [
      { path: "/auth/login", lazy: page(() => import("@/pages/auth/Login")) },
      { path: "/auth/register", lazy: page(() => import("@/pages/auth/Register")) },
      { path: "/auth/pseudo", lazy: page(() => import("@/pages/auth/ChoosePseudo")) },
      { path: "/auth/request-reset-password", lazy: page(() => import("@/pages/auth/RequestResetPassword")) },
      { path: "/auth/password-reset", lazy: page(() => import("@/pages/auth/ResetPassword")) },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <UserProvider>
    <RouterProvider router={router} />
    <Toaster />
  </UserProvider>,
);
