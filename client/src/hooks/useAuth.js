import { useSelector } from "react-redux";

/**
 * Custom hook for authentication state.
 * @returns {{ user: Object|null, token: string|null, isAuthenticated: boolean, isAdmin: boolean }}
 */
const useAuth = () => {
    const user = useSelector((state) => state.user.profile);
    const token = useSelector((state) => state.auth.token);

    return {
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === "admin",
    };
};

export default useAuth;
