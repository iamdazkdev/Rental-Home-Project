import {CONFIG} from "../../constants/api";

const API_BASE_URL = CONFIG.API_BASE_URL || "http://localhost:3001";

/**
 * Admin API Service
 * All methods require admin authentication token
 */
class AdminService {
    /**
     * Get authorization headers with JWT token
     */
    static getHeaders() {
        const token = localStorage.getItem("token");
        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    }

    /**
     * Get dashboard statistics
     */
    static async getStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/stats`, {
                method: "GET",
                headers: this.getHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch stats");
            }

            return data;
        } catch (error) {
            console.error("❌ Error fetching stats:", error);
            throw error;
        }
    }

    /**
     * Get all users with pagination and filters
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number
     * @param {number} params.limit - Items per page
     * @param {string} params.search - Search query
     * @param {string} params.role - Role filter
     * @param {string} params.sortBy - Sort field
     * @param {string} params.sortOrder - Sort order (asc/desc)
     */
    static async getUsers(params = {}) {
        try {
            const queryParams = new URLSearchParams(params).toString();
            const response = await fetch(`${API_BASE_URL}/admin/users?${queryParams}`, {
                method: "GET",
                headers: this.getHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch users");
            }

            return data;
        } catch (error) {
            console.error("❌ Error fetching users:", error);
            throw error;
        }
    }

    /**
     * Get user details by ID
     * @param {string} userId - User ID
     */
    static async getUserById(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                method: "GET",
                headers: this.getHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch user details");
            }

            return data;
        } catch (error) {
            console.error("❌ Error fetching user details:", error);
            throw error;
        }
    }

    /**
     * Update user role
     * @param {string} userId - User ID
     * @param {string} role - New role (user/host/admin)
     */
    static async updateUserRole(userId, role) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
                method: "PATCH",
                headers: this.getHeaders(),
                body: JSON.stringify({role}),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update user role");
            }

            return data;
        } catch (error) {
            console.error("❌ Error updating user role:", error);
            throw error;
        }
    }

    /**
     * Delete user
     * @param {string} userId - User ID
     */
    static async deleteUser(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                method: "DELETE",
                headers: this.getHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to delete user");
            }

            return data;
        } catch (error) {
            console.error("❌ Error deleting user:", error);
            throw error;
        }
    }
}

export default AdminService;

