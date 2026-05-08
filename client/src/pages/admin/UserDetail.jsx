import React from "react";
import { useNavigate, useLoaderData, useFetcher, redirect } from "react-router-dom";
import AdminService from "../../services/admin/AdminService";
import "../../styles/admin/UserDetail.scss";
import { toast } from "../../stores/useNotificationStore";

export const userDetailLoader = async ({ params }) => {
    try {
        const response = await AdminService.getUserById(params.id);
        return response.data;
    } catch (error) {
        toast.error("Failed to fetch user details: " + error.message);
        return redirect("/admin/users");
    }
};

export const userDetailAction = async ({ request, params }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");

    try {
        if (intent === "delete") {
            await AdminService.deleteUser(params.id);
            toast.success("✅ User deleted successfully");
            return redirect("/admin/users");
        } else if (intent === "updateRole") {
            const newRole = formData.get("newRole");
            await AdminService.updateUserRole(params.id, newRole);
            toast.info(`User role updated to ${newRole}`);
            return null;
        }
    } catch (error) {
        toast.error(`Failed to ${intent}: ` + error.message);
        return null;
    }
    return null;
};

const UserDetail = () => {
    const navigate = useNavigate();
    const user = useLoaderData();
    const fetcher = useFetcher();

    const handleRoleChange = async () => {
        const newRole = prompt(
            `Change role for ${user.firstName} ${user.lastName}\nCurrent role: ${user.role}\n\nEnter new role (user/host/admin):`,
            user.role
        );

        if (!newRole || newRole === user.role) return;

        if (!["user", "host", "admin"].includes(newRole.toLowerCase())) {
            toast.info("Invalid role. Must be user, host, or admin");
            return;
        }

        fetcher.submit({ intent: "updateRole", newRole: newRole.toLowerCase() }, { method: "post" });
    };

    const handleDeleteUser = async () => {
        if (
            !window.confirm(
                `⚠️ Delete User?\n\nAre you sure you want to delete ${user.firstName} ${user.lastName}?\n\nThis will:\n• Delete all their properties\n• Cancel all their bookings\n• Remove from wishlists\n• This action CANNOT be undone!\n\nClick OK to confirm.`
            )
        ) {
            return;
        }

        fetcher.submit({ intent: "delete" }, { method: "post" });
    };

    if (!user) {
        return (
            <div className="user-detail-container">
                <div className="error-state">
                    <h2>User not found</h2>
                    <button onClick={() => navigate("/admin/users")}>Back to Users</button>
                </div>
            </div>
        );
    }

    return (
        <div className="user-detail-container">
            {/* Header */}
            <div className="detail-header">
                <button className="btn-back" onClick={() => navigate("/admin/users")}>
                    ← Back to Users
                </button>
                <h1>User Details</h1>
            </div>

            {/* User Profile Card */}
            <div className="profile-card">
                <div className="profile-main">
                    <img
                        src={user.profileImagePath || "/assets/default-avatar.png"}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="profile-avatar"
                    />
                    <div className="profile-info">
                        <h2>{`${user.firstName} ${user.lastName}`}</h2>
                        <p className="email">{user.email}</p>
                        <p className="phone">{user.phone || "No phone number"}</p>
                        <span className={`role-badge ${user.role}`}>
              {user.role.toUpperCase()}
            </span>
                    </div>
                </div>

                <div className="profile-actions">
                    <button className="btn-change-role" onClick={handleRoleChange} disabled={fetcher.state !== "idle"}>
                        ✏️ Change Role
                    </button>
                    <button className="btn-delete" onClick={handleDeleteUser} disabled={fetcher.state !== "idle"}>
                        🗑️ Delete User
                    </button>
                </div>
            </div>

            {/* Host Bio */}
            {user.hostBio && (
                <div className="info-card">
                    <h3>📝 Host Bio</h3>
                    <p>{user.hostBio}</p>
                </div>
            )}

            {/* Statistics */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">🏠</div>
                    <div className="stat-info">
                        <h4>Properties</h4>
                        <p className="stat-value">{user.stats.propertyCount}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✈️</div>
                    <div className="stat-info">
                        <h4>Trips</h4>
                        <p className="stat-value">{user.stats.tripCount}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">❤️</div>
                    <div className="stat-info">
                        <h4>Wishlist</h4>
                        <p className="stat-value">{user.stats.wishlistCount}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-info">
                        <h4>Reservations</h4>
                        <p className="stat-value">{user.stats.reservationCount}</p>
                    </div>
                </div>
            </div>

            {/* Properties */}
            {user.propertyList && user.propertyList.length > 0 && (
                <div className="list-section">
                    <h3>🏠 Properties ({user.propertyList.length})</h3>
                    <div className="items-grid">
                        {user.propertyList.map((property) => (
                            <div key={property._id} className="item-card">
                                {property.listingPhotoPaths && property.listingPhotoPaths[0] && (
                                    <img
                                        src={property.listingPhotoPaths[0]}
                                        alt={property.title}
                                        className="item-image"
                                    />
                                )}
                                <div className="item-info">
                                    <h4>{property.title}</h4>
                                    <p>📍 {property.city}</p>
                                    <p className="item-type">{property.type}</p>
                                    <p className="item-price">
                                        {property.price?.toLocaleString()} VND/night
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trips */}
            {user.tripList && user.tripList.length > 0 && (
                <div className="list-section">
                    <h3>✈️ Trips ({user.tripList.length})</h3>
                    <div className="items-grid">
                        {user.tripList.map((trip) => (
                            <div key={trip._id} className="item-card">
                                <div className="item-info">
                                    <h4>{trip.listingId?.title || "Deleted Listing"}</h4>
                                    <p>📍 {trip.listingId?.city || "N/A"}</p>
                                    <p>
                                        📅 {new Date(trip.startDate).toLocaleDateString()} -{" "}
                                        {new Date(trip.endDate).toLocaleDateString()}
                                    </p>
                                    <p className="item-price">
                                        {trip.totalPrice?.toLocaleString()} VND
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Wishlist */}
            {user.wishList && user.wishList.length > 0 && (
                <div className="list-section">
                    <h3>❤️ Wishlist ({user.wishList.length})</h3>
                    <div className="items-grid">
                        {user.wishList.map((item) => (
                            <div key={item._id} className="item-card">
                                {item.listingPhotoPaths && item.listingPhotoPaths[0] && (
                                    <img
                                        src={item.listingPhotoPaths[0]}
                                        alt={item.title}
                                        className="item-image"
                                    />
                                )}
                                <div className="item-info">
                                    <h4>{item.title}</h4>
                                    <p>📍 {item.city}</p>
                                    <p className="item-price">
                                        {item.price?.toLocaleString()} VND/night
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reservations */}
            {user.reservationList && user.reservationList.length > 0 && (
                <div className="list-section">
                    <h3>📅 Reservations ({user.reservationList.length})</h3>
                    <div className="items-grid">
                        {user.reservationList.map((reservation) => (
                            <div key={reservation._id} className="item-card">
                                <div className="item-info">
                                    <h4>
                                        Guest: {reservation.customerId?.firstName}{" "}
                                        {reservation.customerId?.lastName}
                                    </h4>
                                    <p>📧 {reservation.customerId?.email}</p>
                                    <p>
                                        📅 {new Date(reservation.startDate).toLocaleDateString()} -{" "}
                                        {new Date(reservation.endDate).toLocaleDateString()}
                                    </p>
                                    <p className="item-price">
                                        {reservation.totalPrice?.toLocaleString()} VND
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Account Info */}
            <div className="info-card">
                <h3>📊 Account Information</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <span className="info-label">User ID:</span>
                        <span className="info-value">{user._id}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Created At:</span>
                        <span className="info-value">
              {new Date(user.createdAt).toLocaleString()}
            </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Updated At:</span>
                        <span className="info-value">
              {new Date(user.updatedAt).toLocaleString()}
            </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetail;
