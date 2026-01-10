import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import AdminService from "../../services/admin/AdminService";
import "../../styles/admin/AdminDashboard.scss";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await AdminService.getStats();
            setStats(response.data);
        } catch (error) {
            alert("Failed to fetch statistics: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-dashboard">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1>📊 Admin Dashboard</h1>
                    <p>Welcome to the admin control panel</p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn-manage-users"
                        onClick={() => navigate("/admin/users")}
                    >
                        👥 Manage Users
                    </button>
                    <button
                        className="btn-verifications"
                        onClick={() => navigate("/admin/verifications")}
                    >
                        🔐 Identity Verification
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <h3>Total Users</h3>
                        <p className="stat-value">{stats?.totalUsers || 0}</p>
                        <span className="stat-label">Registered accounts</span>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-icon">🏠</div>
                    <div className="stat-content">
                        <h3>Total Hosts</h3>
                        <p className="stat-value">{stats?.totalHosts || 0}</p>
                        <span className="stat-label">Property owners</span>
                    </div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon">🔑</div>
                    <div className="stat-content">
                        <h3>Administrators</h3>
                        <p className="stat-value">{stats?.totalAdmins || 0}</p>
                        <span className="stat-label">Admin accounts</span>
                    </div>
                </div>

                <div className="stat-card info">
                    <div className="stat-icon">🏡</div>
                    <div className="stat-content">
                        <h3>Properties</h3>
                        <p className="stat-value">{stats?.totalProperties || 0}</p>
                        <span className="stat-label">Listed properties</span>
                    </div>
                </div>

                <div className="stat-card secondary">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <h3>Bookings</h3>
                        <p className="stat-value">{stats?.totalBookings || 0}</p>
                        <span className="stat-label">Total bookings</span>
                    </div>
                </div>

                <div className="stat-card accent">
                    <div className="stat-icon">🆕</div>
                    <div className="stat-content">
                        <h3>New Users</h3>
                        <p className="stat-value">{stats?.recentUsers || 0}</p>
                        <span className="stat-label">Last 7 days</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h2>⚡ Quick Actions</h2>
                <div className="actions-grid">
                    <button
                        className="action-card"
                        onClick={() => navigate("/admin/users")}
                    >
                        <div className="action-icon">👥</div>
                        <h3>Manage Users</h3>
                        <p>View, edit, and delete users</p>
                    </button>

                    <button
                        className="action-card"
                        onClick={() => navigate("/admin/verifications")}
                    >
                        <div className="action-icon">🔐</div>
                        <h3>Identity Verification</h3>
                        <p>Review user verifications</p>
                    </button>

                    <button
                        className="action-card"
                        onClick={() => navigate("/admin/users?role=host")}
                    >
                        <div className="action-icon">🏠</div>
                        <h3>View Hosts</h3>
                        <p>Manage property owners</p>
                    </button>

                    <button
                        className="action-card"
                        onClick={() => navigate("/admin/users?role=admin")}
                    >
                        <div className="action-icon">🔑</div>
                        <h3>Admin Accounts</h3>
                        <p>Manage administrators</p>
                    </button>

                    <button className="action-card" onClick={fetchStats}>
                        <div className="action-icon">🔄</div>
                        <h3>Refresh Stats</h3>
                        <p>Update dashboard data</p>
                    </button>
                </div>
            </div>

            {/* System Info */}
            <div className="system-info">
                <h2>ℹ️ System Information</h2>
                <div className="info-grid">
                    <div className="info-item">
                        <span className="info-label">User to Host Ratio:</span>
                        <span className="info-value">
              {stats?.totalUsers > 0
                  ? ((stats.totalHosts / stats.totalUsers) * 100).toFixed(1)
                  : 0}
                            %
            </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Avg Properties per Host:</span>
                        <span className="info-value">
              {stats?.totalHosts > 0
                  ? (stats.totalProperties / stats.totalHosts).toFixed(1)
                  : 0}
            </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Avg Bookings per Property:</span>
                        <span className="info-value">
              {stats?.totalProperties > 0
                  ? (stats.totalBookings / stats.totalProperties).toFixed(1)
                  : 0}
            </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Growth Rate (7 days):</span>
                        <span className="info-value">
              {stats?.totalUsers > 0
                  ? ((stats.recentUsers / stats.totalUsers) * 100).toFixed(1)
                  : 0}
                            %
            </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

