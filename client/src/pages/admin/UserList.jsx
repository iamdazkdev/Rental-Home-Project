import React from "react";
import { useNavigate, useLoaderData, useNavigation, useSubmit, useFetcher } from "react-router-dom";
import AdminService from "../../services/admin/AdminService";
import "../../styles/admin/UserList.scss";
import { toast, confirmDialog } from "../../stores/useNotificationStore";

export const userListLoader = async ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get("page") || 1;
    const limit = url.searchParams.get("limit") || 10;
    const search = url.searchParams.get("search") || "";
    const role = url.searchParams.get("role") || "";
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";

    try {
        const response = await AdminService.getUsers({
            page,
            limit,
            search,
            role,
            sortBy,
            sortOrder,
        });
        return { 
            users: response.data, 
            pagination: response.pagination,
            filters: { search, role, sortBy, sortOrder }
        };
    } catch (error) {
        toast.error("Failed to fetch users: " + error.message);
        throw error;
    }
};

export const userListAction = async ({ request }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const userId = formData.get("userId");

    try {
        if (intent === "delete") {
            await AdminService.deleteUser(userId);
            toast.success("User deleted successfully");
        } else if (intent === "updateRole") {
            const newRole = formData.get("newRole");
            await AdminService.updateUserRole(userId, newRole);
            toast.info(`User role updated to ${newRole}`);
        }
    } catch (error) {
        toast.error(`Failed to ${intent}: ` + error.message);
    }
    return null;
};

const UserList = () => {
    const navigate = useNavigate();
    const submit = useSubmit();
    const fetcher = useFetcher();
    const { users, pagination, filters } = useLoaderData();
    const navigation = useNavigation();

    const isLoading = navigation.state === "loading";

    const handleSearch = (e) => {
        submit({ ...filters, search: e.target.value, page: 1 }, { replace: true });
    };

    const handleRoleFilter = (e) => {
        submit({ ...filters, role: e.target.value, page: 1 }, { replace: true });
    };

    const handlePageChange = (newPage) => {
        submit({ ...filters, page: newPage });
    };

    const handleDeleteUser = async (userId, userName) => {
        if (!await confirmDialog({ message: `Are you sure you want to delete ${userName}? This action cannot be undone.` })) {
            return;
        }
        fetcher.submit({ intent: "delete", userId }, { method: "post" });
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

        fetcher.submit({ intent: "updateRole", userId, newRole: newRole.toLowerCase() }, { method: "post" });
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

    if (isLoading && users.length === 0) {
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
                        defaultValue={filters.search}
                        onChange={handleSearch}
                    />
                </div>
                <select defaultValue={filters.role} onChange={handleRoleFilter}>
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
                                        disabled={fetcher.state !== "idle"}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="btn-delete"
                                        onClick={() =>
                                            handleDeleteUser(user._id, `${user.firstName} ${user.lastName}`)
                                        }
                                        title="Delete User"
                                        disabled={fetcher.state !== "idle"}
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
                        disabled={Number(pagination.page) === 1}
                    >
                        Previous
                    </button>
                    <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
                    <button
                        onClick={() => handlePageChange(Number(pagination.page) + 1)}
                        disabled={Number(pagination.page) === pagination.totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserList;
