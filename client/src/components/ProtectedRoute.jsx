import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * ProtectedRoute - Redirects unauthenticated users to login page.
 * Saves attempted URL so user can be redirected back after login.
 */
const ProtectedRoute = ({ children }) => {
    const user = useSelector((state) => state.user);
    const token = useSelector((state) => state.token);
    const location = useLocation();

    if (!user || !token) {
        // Save the attempted URL for redirect after login
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return children;
};

export default ProtectedRoute;
