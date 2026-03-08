import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

/**
 * Route guard — redirects unauthenticated users to /login.
 * Preserves the intended URL so user is redirected back after login.
 */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
