import React from "react";
import {NavLink, Outlet, useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {setLogout} from "../../redux/state";
import "../../styles/admin/AdminLayout.scss";

const AdminLayout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.user);

    // Check if user is admin
    if (!user || user.role !== "admin") {
        return (
            <div className="admin-access-denied">
                <div className="denied-content">
                    <h1>🚫 Access Denied</h1>
                    <p>You don't have permission to access this area.</p>
                    <p>Admin privileges required.</p>
                    <button onClick={() => navigate("/")}>Return to Home</button>
                </div>
            </div>
        );
    }

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            dispatch(setLogout());
            navigate("/login");
        }
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <h2>🎛️ Admin Panel</h2>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/admin" end className="nav-item">
                        <span className="nav-icon">📊</span>
                        <span className="nav-label">Dashboard</span>
                    </NavLink>

                    <NavLink to="/admin/users" className="nav-item">
                        <span className="nav-icon">👥</span>
                        <span className="nav-label">User Management</span>
                    </NavLink>

                    <NavLink to="/admin/verifications" className="nav-item">
                        <span className="nav-icon">🔐</span>
                        <span className="nav-label">Identity Verification</span>
                    </NavLink>

                    <div className="nav-divider"></div>

                    <button onClick={() => navigate("/")} className="nav-item">
                        <span className="nav-icon">🏠</span>
                        <span className="nav-label">Back to Site</span>
                    </button>

                    <button onClick={handleLogout} className="nav-item logout">
                        <span className="nav-icon">🚪</span>
                        <span className="nav-label">Logout</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="admin-content">
                {/* Topbar */}
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <h3>Admin Dashboard</h3>
                    </div>
                    <div className="topbar-right">
                        <div className="admin-user-info">
                            <img
                                src={user.profileImagePath || "/assets/default-avatar.png"}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="admin-avatar"
                            />
                            <div className="admin-details">
                <span className="admin-name">
                  {user.firstName} {user.lastName}
                </span>
                                <span className="admin-role">Administrator</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="admin-main">
                    <Outlet/>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;

