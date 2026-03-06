import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * AdminRoute - Allows access only to authenticated users with admin role.
 * Redirects to login if not authenticated, or home if not admin.
 */
const AdminRoute = ({ children }) => {
    const user = useSelector((state) => state.user);
    const token = useSelector((state) => state.token);

    if (!user || !token) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;
