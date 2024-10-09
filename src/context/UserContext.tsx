import { createContext, useEffect, useState } from "react";

type UserContextType = {
    token: string | null;
    setToken: (token: string | null) => void;
    isAuthentified: boolean;
    logout: () => void;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: {
    children: React.ReactNode;
}) => {
    const [token, setToken] = useState(() => {
        if (typeof window !== "undefined") {
            return window.localStorage.getItem("authToken") || null;
        }
        return null;
    });
    const [isAuthentified, setIsAuthentified] = useState(false);

    useEffect(() => {
        verifyJwt()
            .then((auth) => {
                setIsAuthentified(auth);
            });
    });

    // Sauvegarde du token dans le localStorage ou suppression
    useEffect(() => {
        if (token) {
            window.localStorage.setItem("authToken", token);
        } else {
            window.localStorage.removeItem("authToken");
        }
    }, [token]);

    const verifyJwt = async () => {
        try {
            const response = await fetch(`${process.env.BACKEND_HOST}/auth/verify`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                return true
            } else {
                setToken(null);
                return false
            }
        } catch (error) {
            setToken(null);
            console.log(error);
            return false

        }
    }

    const logout = () => {
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
    };

    return (
        <UserContext.Provider value={{ token, setToken, isAuthentified, logout }}>
            {children}
        </UserContext.Provider>
    );
};


