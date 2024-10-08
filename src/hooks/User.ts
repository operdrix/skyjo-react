import { useContext } from "react";
import { UserContext } from "../context/UserContext";

// Hook personnalisé pour simplifier l'accès au contexte
export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};