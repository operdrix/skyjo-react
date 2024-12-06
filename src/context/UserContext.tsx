/* eslint-disable react-hooks/exhaustive-deps */
import { createContext, useCallback, useEffect, useState } from "react";
import { verifyJwt } from "../services/authService";
import getUserIdFromToken from "../utils/getUserIdFromToken";

type UserContextType = {
  token: string | null;
  userId: string | null;
  userName: string | null;
  isAuthentified: boolean;
  loading: boolean;
  setToken: (token: string | null) => void;
  logout: () => void;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: {
  children: React.ReactNode;
}) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("authToken") || null;
    }
    return null;
  });

  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const [isAuthentified, setIsAuthentified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Sauvegarde du token dans le localStorage ou suppression
  useEffect(() => {
    setTokenInLocalStorage(token);
  }, [token]);

  useEffect(() => {
    setLoading(true);
    console.log("usercontext: Token", loading);

    let isMounted = true;

    if (token) {
      verifyJwt(token).then((auth) => {
        if (isMounted) {
          const decode = getUserIdFromToken(token);
          if (decode) {
            setUserId(decode.id);
            setUserName(decode.username);
          }
          console.log("usercontext: isAuthentified", auth);

          setIsAuthentified(auth);
          setLoading(false);  // Fin de la vérification
        }
      });
    } else {
      setIsAuthentified(false);
      setLoading(false);  // Fin de la vérification
    }

    return () => {
      isMounted = false;
    };

  }, [token]);

  useEffect(() => {
    if (userId) {
      window.localStorage.setItem("userId", userId);
    } else {
      window.localStorage.removeItem("userId");
    }
  }, [userId]);

  useEffect(() => {
    if (userName) {
      window.localStorage.setItem("userName", userName);
    } else {
      window.localStorage.removeItem("userName");
    }
  }, [userName]);

  const setTokenInLocalStorage = (token: string | null) => {
    if (token) {
      window.localStorage.setItem("authToken", token);
    } else {
      window.localStorage.removeItem("authToken");
    }
  };

  const logout = useCallback(() => {
    // appel de l'api pour détruire le token
    try {
      fetch(`${process.env.BACKEND_HOST}/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.log(error);
    }
    setToken(null);
    window.localStorage.removeItem('authToken');
  }, [token]);

  return (
    <UserContext.Provider value={{ token, setToken, userId, userName, isAuthentified, loading, logout }}>
      {children}
    </UserContext.Provider>
  );
};


