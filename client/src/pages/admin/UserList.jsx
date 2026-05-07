import React, {useEffect, useState, useCallback} from "react";
import {useNavigate} from "react-router-dom";
import AdminService from "../../services/admin/AdminService";
import "../../styles/admin/UserList.scss";
import { toast, confirmDialog } from "../../stores/useNotificationStore";


const UserList = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [filters, setFilters] = useState({
        search: "",
        role: "",
        sortBy: "createdAt",
        sortOrder: "desc",
    });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await AdminService.getUsers({
                page: pagination.page,
                limit: pagination.limit,
                ...filters,
            });

            setUsers(response.data);
            setPagination((prev) => {
                if (prev.total === response.pagination.total && prev.totalPages === response.pagination.totalPages) {
                    return prev;
                }
                return {
                    ...prev,
                    total: response.pagination.total,
                    totalPages: response.pagination.totalPages,
                };
            });
        } catch (error) {
            toast.error("Failed to fetch users: " + error.message);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, filters]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearch = (e) => {
        setFilters((prev) => ({...prev, search: e.target.value}));
        setPagination((prev) => ({...prev, page: 1}));
    };

    const handleRoleFilter = (e) => {
        setFilters((prev) => ({...prev, role: e.target.value}));
        setPagination((prev) => ({...prev, page: 1}));
    };

    const handleDeleteUser = async (userId, userName) => {
        if (!await confirmDialog({ message: `Are you sure you want to delete ${userName}? This action cannot be undone.` })) {
            return;
        }

        try {
            await AdminService.deleteUser(userId);
            toast.success("User deleted successfully");
            fetchUsers();
        } catch (error) {
            toast.error("Failed to delete user: " + error.message);
        }
    };

    const handleRoleChange = async (userId, currentRole, userName) => {
        const newRole = prompt(
            `Change role for ${userName}\nCurrent role: ${currentRole}\n\nEnter new role (user/host/admin):`,
            currentRole
        );

        if (!newRole || newRole === currentRole) return;

        if (!["user", "host", "admin"].includes(newRole.toLowerCase())) {
            toast.info("Invalid role. Must be user, host, or admin");
            return;
        }

        try {
            await AdminService.updateUserRole(userId, newRole.toLowerCase());
            toast.info(`User role updated to ${newRole}`);
            fetchUsers();
        } catch (error) {
            toast.error("Failed to update role: " + error.message);
        }
    };

    const handlePageChange = (newPage) => {
        setPagination((prev) => ({...prev, page: newPage}));
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case "admin":
                return "role-badge admin";
            case "host":
                return "role-badge host";
            default:
                return "role-badge user";
        }
    };

    if (loading && users.length === 0) {
        return (
            <div className="user-list-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="user-list-container">
            <div className="user-list-header">
                <h1>👥 User Management</h1>
                <div className="header-stats">
                    <span>Total Users: {pagination.total}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={filters.search}
                        onChange={handleSearch}
                    />
                </div>
                <select value={filters.role} onChange={handleRoleFilter}>
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="host">Host</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            {/* User Table */}
            <div className="users-table-wrapper">
                <table className="users-table">
                    <thead>
                    <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Properties</th>
                        <th>Trips</th>
                        <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map((user) => (
                        <tr key={user._id}>
                            <td>
                                <div className="user-info">
                                    <img
                                        src={user.profileImagePath || "/assets/default-avatar.png"}
                                        alt={`${user.firstName} ${user.lastName}`}
                                        className="user-avatar"
                                    />
                                    <span>{`${user.firstName} ${user.lastName}`}</span>
                                </div>
                            </td>
                            <td>{user.email}</td>
                            <td>{user.phone || "N/A"}</td>
                            <td>
                  <span className={getRoleBadgeClass(user.role)}>
                    {user.role.toUpperCase()}
                  </span>
                            </td>
                            <td>{user.stats.propertyCount}</td>
                            <td>{user.stats.tripCount}</td>
                            <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                            <td>
                                <div className="action-buttons">
                                    <button
                                        className="btn-view"
                                        onClick={() => navigate(`/admin/users/${user._id}`)}
                                        title="View Details"
                                    >
                                        👁️
                                    </button>
                                    <button
                                        className="btn-edit"
                                        onClick={() =>
                                            handleRoleChange(
                                                user._id,
                                                user.role,
                                                `${user.firstName} ${user.lastName}`
                                            )
                                        }
                                        title="Change Role"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="btn-delete"
                                        onClick={() =>
                                            handleDeleteUser(user._id, `${user.firstName} ${user.lastName}`)
                                        }
                                        title="Delete User"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                    >
                        Previous
                    </button>
                    <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
                    <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserList;

