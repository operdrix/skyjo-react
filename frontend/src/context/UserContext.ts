import { createContext } from "react";

// Contexte seul : le provider est dans UserProvider.tsx
export type UserContextType = {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  // Connecté avec un pseudo : peut jouer
  isAuthentified: boolean;
  // Connecté (Google) mais pseudo pas encore choisi
  needsPseudo: boolean;
  suggestedPseudo: string;
  loading: boolean;
  logout: () => void;
  refresh: () => void;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);
