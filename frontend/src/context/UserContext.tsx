import { api, setLogoutCallback } from "@/services/apiService";
import { verifyAuth } from "@/services/authService";
import { createContext, useCallback, useEffect, useState } from "react";

type UserData = {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  avatar: string;
} | null;

type UserContextType = {
  userId: string | null;
  userName: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  userEmail: string | null;
  userAvatar: string | null;
  isAuthentified: boolean;
  loading: boolean;
  logout: () => void;
  setUserData: (userData: UserData) => void;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: {
  children: React.ReactNode;
}) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userFirstName, setUserFirstName] = useState<string | null>(null);
  const [userLastName, setUserLastName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isAuthentified, setIsAuthentified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Fonction pour mettre à jour les données utilisateur
  const setUserData = useCallback((userData: UserData) => {
    if (userData) {
      setUserId(userData.id);
      setUserName(userData.username);
      setUserFirstName(userData.firstname);
      setUserLastName(userData.lastname);
      setUserEmail(userData.email);
      setUserAvatar(userData.avatar);
      setIsAuthentified(true);
    } else {
      setUserId(null);
      setUserName(null);
      setUserFirstName(null);
      setUserLastName(null);
      setUserEmail(null);
      setUserAvatar(null);
      setIsAuthentified(false);
    }
  }, []);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      setLoading(true);
      const { isAuth, user } = await verifyAuth();

      if (isMounted) {
        setIsAuthentified(isAuth);
        if (isAuth && user) {
          // Récupérer seulement id et username du token
          // Les autres infos seront chargées si nécessaire
          setUserId(user.id);
          setUserName(user.username);
        }
        setLoading(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('logout', {});
    } catch {
      // Même si l'appel échoue, on déconnecte localement
    } finally {
      setUserData(null);
    }
  }, [setUserData]);

  // Enregistrer le callback de logout pour l'intercepteur 401
  useEffect(() => {
    setLogoutCallback(logout);
  }, [logout]);

  return (
    <UserContext.Provider value={{
      userId,
      userName,
      userFirstName,
      userLastName,
      userEmail,
      userAvatar,
      isAuthentified,
      loading,
      logout,
      setUserData
    }}>
      {children}
    </UserContext.Provider>
  );
};


