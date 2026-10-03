import { authClient } from "@/lib/authClient";
import { suggestPseudo } from "@/lib/pseudo";
import { setLogoutCallback } from "@/services/apiService";
import { createContext, useCallback, useEffect } from "react";

type UserContextType = {
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

export const UserProvider = ({ children }: {
  children: React.ReactNode;
}) => {
  const { data, isPending, refetch } = authClient.useSession();
  const user = data?.user;
  const userName = user?.username ?? null;

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const logout = useCallback(async () => {
    try {
      await authClient.signOut();
    } finally {
      refetch();
    }
  }, [refetch]);

  // Session expirée côté serveur (401) : on recharge l'état de session
  useEffect(() => {
    setLogoutCallback(refresh);
  }, [refresh]);

  return (
    <UserContext.Provider value={{
      userId: userName ? user!.id : null,
      userName,
      userEmail: user?.email ?? null,
      isAuthentified: Boolean(user && userName),
      needsPseudo: Boolean(user && !userName),
      suggestedPseudo: suggestPseudo(user?.name),
      loading: isPending,
      logout,
      refresh,
    }}>
      {children}
    </UserContext.Provider>
  );
};
