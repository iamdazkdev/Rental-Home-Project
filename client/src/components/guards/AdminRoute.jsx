import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

/**
 * Admin route guard — only allows users with role="admin".
 * Redirects to /login if not authenticated, or / if authenticated but not admin.
 */
const AdminRoute = ({ children }) => {
    const { isAuthenticated, isAdmin } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;
