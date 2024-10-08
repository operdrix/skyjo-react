import { createContext, useEffect, useState } from "react";

type UserContextType = {
    token: string | null;
    setToken: (token: string | null) => void;
    isAuthentified: boolean;
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

    useEffect(() => {
        if (token) {
            window.localStorage.setItem("authToken", token);
        } else {
            window.localStorage.removeItem("authToken");
        }
    }, [token]);

    const isAuthentified = token !== null;

    return (
        <UserContext.Provider value={{ token, setToken, isAuthentified }}>
            {children}
        </UserContext.Provider>
    );
};


