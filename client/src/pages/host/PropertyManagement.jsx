import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Loader from "../../components/Loader";
import "../../styles/PropertyManagement.scss";
import { CONFIG, HTTP_METHODS } from "../../constants/api";

const PropertyManagement = () => {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]); // Store raw data
  const [filter, setFilter] = useState("active"); // active, hidden, all

  const user = useSelector((state) => state.user);
  const userId = user?._id || user?.id;
  const navigate = useNavigate();

  console.log("🔍 PropertyManagement - Debug:", {
    user,
    userId,
    hasUser: !!user,
    loading,
    propertiesCount: properties.length,
  });

  useEffect(() => {
    if (userId) {
      fetchProperties();
    }
    // eslint-disable-next-line
  }, [userId, filter]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const includeHidden = filter === "all" || filter === "hidden";
      const url = `${CONFIG.API_BASE_URL}/properties/${userId}/properties?includeHidden=${includeHidden}`;

      console.log("📡 Fetching properties:", { url, userId, filter, includeHidden });

      const response = await fetch(url, { method: HTTP_METHODS.GET });

      console.log("📥 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Properties data:", data);

        // Store raw data
        setAllProperties(data);

        // Debug: Check isActive values
        data.forEach((p, i) => {
          console.log(`Property ${i}:`, {
            title: p.title,
            isActive: p.isActive,
            hasActiveBooking: p.hasActiveBooking
          });
        });

        // Filter based on selected tab
        let filteredData = data;
        if (filter === "active") {
          // Show active listings (isActive === true OR isActive is undefined/null)
          filteredData = data.filter(p => p.isActive !== false);
        } else if (filter === "hidden") {
          // Show hidden listings (isActive === false)
          filteredData = data.filter(p => p.isActive === false);
        }
        // "all" tab shows everything (no filtering)

        console.log("✅ Filtered properties:", filteredData.length);
        console.log("Filter mode:", filter);
        setProperties(filteredData);
      } else {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
      }
    } catch (error) {
      console.error("❌ Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (propertyId) => {
    try {
      const url = `${CONFIG.API_BASE_URL}/properties/${propertyId}/toggle-visibility`;
      const response = await fetch(url, {
        method: HTTP_METHODS.PATCH,
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        await fetchProperties(); // Just refresh
      }
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  const handleDelete = async (propertyId, hasActiveBooking) => {
    if (hasActiveBooking) {
      // Keep this alert as it's important warning
      alert("Cannot delete property with active bookings. Please wait until all bookings are completed.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      return;
    }

    try {
      const url = `${CONFIG.API_BASE_URL}/properties/${propertyId}/delete`;
      const response = await fetch(url, { method: HTTP_METHODS.DELETE });

      if (response.ok) {
        await fetchProperties(); // Just refresh
      } else {
        const errorData = await response.json();
        // Only show error message
        alert(errorData.message || "Failed to delete property");
      }
    } catch (error) {
      console.error("Error deleting property:", error);
    }
  };

  const handleEdit = (propertyId) => {
    navigate(`/edit-listing/${propertyId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format VND with Vietnamese thousand separator (dots)
  const formatVND = (amount) => {
    if (!amount && amount !== 0) return '0';
    const rounded = Math.round(amount);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  if (!userId) {
    return (
      <>
        <Navbar />
        <div className="property-management">
          <div className="no-access">
            <h2>Please log in to manage your properties</h2>
            <button onClick={() => navigate("/login")}>Go to Login</button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="property-management">
        <div className="management-header">
          <h1>🏠 My Properties</h1>
          <p>Manage your listings</p>
          <button className="create-new-btn" onClick={() => navigate("/create-listing")}>
            + Create New Listing
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={filter === "active" ? "active" : ""}
            onClick={() => setFilter("active")}
          >
            ✓ Active ({allProperties.filter(p => p.isActive !== false).length})
          </button>
          <button
            className={filter === "hidden" ? "active" : ""}
            onClick={() => setFilter("hidden")}
          >
            👁️ Hidden ({allProperties.filter(p => p.isActive === false).length})
          </button>
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            📊 All ({allProperties.length})
          </button>
        </div>

        {loading ? (
          <Loader />
        ) : properties.length === 0 ? (
          <div className="no-properties">
            <div className="empty-icon">🏠</div>
            <h2>No properties found</h2>
            <p>Start by creating your first listing!</p>
            <button onClick={() => navigate("/create-listing")}>Create Listing</button>
          </div>
        ) : (
          <div className="properties-grid">
            {properties.map((property) => (
              <div key={property._id} className="property-card">
                {/* Property Image */}
                <div className="property-image">
                  <img
                    src={
                      property.listingPhotoPaths?.[0]?.startsWith("https://")
                        ? property.listingPhotoPaths[0]
                        : `${CONFIG.API_BASE_URL}/${property.listingPhotoPaths?.[0]?.replace("public/", "")}`
                    }
                    alt={property.title}
                  />

                  {/* Status Badges */}
                  <div className="status-badges">
                    {!property.isActive && (
                      <span className="badge hidden">👁️ Hidden</span>
                    )}
                    {property.hasActiveBooking && (
                      <span className="badge occupied">🔒 Occupied</span>
                    )}
                  </div>
                </div>

                {/* Property Info */}
                <div className="property-info">
                  <h3>{property.title}</h3>
                  <p className="location">
                    📍 {property.city}, {property.province}
                  </p>
                  <p className="category">
                    🏷️ {property.category} • {property.type}
                  </p>

                  <div className="property-stats">
                    <span>👥 {property.guestCount}</span>
                    <span>🛏️ {property.bedroomCount}</span>
                    <span>🛁 {property.bathroomCount}</span>
                  </div>

                  <div className="price-info">
                    <span className="price">{formatVND(property.price)} VND</span>
                    <span className="period">/ đêm</span>
                  </div>

                  {property.hasActiveBooking && (
                    <div className="active-booking-info">
                      <p className="booking-warning">
                        ⚠️ Has active booking - Cannot delete
                      </p>
                      <p className="booking-dates">
                        {property.activeBooking?.startDate} - {property.activeBooking?.endDate}
                      </p>
                    </div>
                  )}

                  <p className="created-date">
                    Created: {formatDate(property.createdAt)}
                  </p>

                  {/* Action Buttons */}
                  <div className="action-buttons">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(property._id)}
                      title="Edit property"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      className="btn-toggle"
                      onClick={() => handleToggleVisibility(property._id)}
                      title={property.isActive ? "Hide property" : "Show property"}
                    >
                      {property.isActive ? "👁️ Hide" : "👁️‍🗨️ Show"}
                    </button>

                    <button
                      className={`btn-delete ${property.hasActiveBooking ? "disabled" : ""}`}
                      onClick={() => handleDelete(property._id, property.hasActiveBooking)}
                      disabled={property.hasActiveBooking}
                      title={property.hasActiveBooking ? "Cannot delete with active bookings" : "Delete property"}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default PropertyManagement;

