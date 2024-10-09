// authService.ts
export const verifyJwt = async (token: string | null): Promise<boolean> => {
    try {
        const response = await fetch(`${process.env.BACKEND_HOST}/auth/verify`, {
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
