// authService.ts
import { buildApiUrl } from "../utils/apiUtils";

export const verifyJwt = async (token: string | null): Promise<boolean> => {
    try {
        const response = await fetch(buildApiUrl('auth/verify'), {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.ok;
    } catch (error) {
        console.error(error);
        return false;
    }
};
