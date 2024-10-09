import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
    id: string;
    username: string;
}

const getUserIdFromToken = (token: string | null): JwtPayload | null => {
    if (!token) return null;

    try {
        const decoded = jwtDecode<JwtPayload>(token);
        return decoded;
    } catch (error) {
        console.error("Invalid token", error);
        return null;
    }
};

export default getUserIdFromToken;