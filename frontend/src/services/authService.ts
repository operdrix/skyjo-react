// authService.ts
import { api } from './apiService';

type UserData = {
    id: string;
    username: string;
};

export const verifyAuth = async (): Promise<{ isAuth: boolean; user?: UserData }> => {
    const response = await api.get('auth/verify');
    if (response.code === 200 && response.data?.valid) {
        return { isAuth: true, user: response.data.user };
    }
    return { isAuth: false };
};

export const login = async (email: string, password: string) => {
    return await api.post('login', { email, password });
};

export const logout = async () => {
    return await api.post('logout');
};

export const register = async (userData: {
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    password: string;
    avatar?: string;
}) => {
    return await api.post('register', userData);
};
