// authService.ts
import { api } from './apiService';

export const verifyAuth = async (): Promise<boolean> => {
    const response = await api.get('auth/verify');
    return response.code === 200;
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
