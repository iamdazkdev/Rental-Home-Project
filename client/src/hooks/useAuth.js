import { useSelector } from "react-redux";

/**
 * Custom hook for authentication state.
 * @returns {{ user: Object|null, token: string|null, isAuthenticated: boolean, isAdmin: boolean }}
 */
const useAuth = () => {
    const user = useSelector((state) => state.user);
    const token = useSelector((state) => state.token);

    return {
        user,
        token,
        isAuthenticated: !!user && !!token,
        isAdmin: user?.role === "admin",
    };
};

export default useAuth;
