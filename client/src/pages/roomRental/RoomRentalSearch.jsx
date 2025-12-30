import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Loader from "../../components/Loader";
import { formatVND } from "../../utils/priceFormatter";
import { Search, MapPin, DollarSign, Filter, Grid, List, X } from "lucide-react";
import "../../styles/RoomRentalSearch.scss";

const RoomRentalSearch = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    location: "",
    minPrice: "",
    maxPrice: "",
    amenities: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async (appliedFilters = {}) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(appliedFilters);
      const url = `http://localhost:3001/room-rental/search?${queryParams}`;
      console.log("🔍 Fetching rooms from:", url);

      const response = await fetch(url);
      const data = await response.json();

      console.log("📥 Room search response:", data);

      if (data.success) {
        setRooms(data.rooms);
        console.log(`✅ Found ${data.count} rooms`);
      } else {
        console.error("❌ Room search failed:", data.message);
        setRooms([]);
      }
    } catch (error) {
      console.error("❌ Error fetching rooms:", error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    const appliedFilters = {};
    Object.keys(filters).forEach((key) => {
      if (filters[key]) appliedFilters[key] = filters[key];
    });
    fetchRooms(appliedFilters);
  };

  const clearFilters = () => {
    setFilters({
      location: "",
      minPrice: "",
      maxPrice: "",
      amenities: "",
    });
    fetchRooms();
  };

  const handleRoomClick = (roomId) => {
    navigate(`/room-rental/${roomId}`);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  if (loading) return <Loader />;

  return (
    <>
      <Navbar />
      <div className="room-rental-search">
        <div className="search-header">
          <h1>🏠 Find Your Perfect Room</h1>
          <p>Browse long-term room rentals in shared homes</p>
        </div>

        {/* Search Bar */}
        <div className="search-bar-container">
          <div className="search-bar">
            <div className="search-input-wrapper">
              <MapPin size={20} />
              <input
                type="text"
                name="location"
                placeholder="Search by city, province, or country..."
                value={filters.location}
                onChange={handleFilterChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button className="search-btn" onClick={handleSearch}>
              <Search size={20} />
              Search
            </button>
            <button
              className={`filter-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} />
              Filters
              {hasActiveFilters && <span className="filter-badge"></span>}
            </button>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <div className="filter-group">
                <label>
                  <DollarSign size={16} />
                  Min Price (monthly)
                </label>
                <input
                  type="number"
                  name="minPrice"
                  placeholder="Min VND"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="filter-group">
                <label>
                  <DollarSign size={16} />
                  Max Price (monthly)
                </label>
                <input
                  type="number"
                  name="maxPrice"
                  placeholder="Max VND"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="filter-group">
                <label>✨ Amenities</label>
                <input
                  type="text"
                  name="amenities"
                  placeholder="WiFi, Kitchen, Laundry..."
                  value={filters.amenities}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <div className="filter-actions">
              <button className="apply-btn" onClick={handleSearch}>
                Apply Filters
              </button>
              {hasActiveFilters && (
                <button className="clear-btn" onClick={clearFilters}>
                  <X size={16} />
                  Clear All
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="results-header">
          <h2>
            {rooms.length} Room{rooms.length !== 1 ? "s" : ""} Found
          </h2>
          <div className="view-toggle">
            <button
              className={viewMode === "grid" ? "active" : ""}
              onClick={() => setViewMode("grid")}
            >
              <Grid size={20} />
            </button>
            <button
              className={viewMode === "list" ? "active" : ""}
              onClick={() => setViewMode("list")}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="search-results">
          {rooms.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>No rooms found</h3>
              <p>Try adjusting your filters or search in a different location.</p>
              {hasActiveFilters && (
                <button className="clear-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className={`rooms-grid ${viewMode}`}>
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className={`room-card ${room.roomAvailabilityStatus === 'RENTED' ? 'rented' : ''}`}
                  onClick={() => handleRoomClick(room._id)}
                >
                  <div className="room-image">
                    <img
                      src={
                        room.listingPhotoPaths?.[0] ||
                        "https://via.placeholder.com/400x300?text=No+Image"
                      }
                      alt={room.title}
                    />
                    {room.roomAvailabilityStatus === 'RENTED' ? (
                      <div className="availability-badge rented">
                        🔒 Rented
                      </div>
                    ) : (
                      <div className="availability-badge available">
                        ✅ Available
                      </div>
                    )}
                    <div className="room-type-badge">
                      🚪 Room Rental
                    </div>
                  </div>

                  <div className="room-info">
                    <h3>{room.title}</h3>
                    <p className="location">
                      📍 {room.city}{room.province && `, ${room.province}`}{room.country && `, ${room.country}`}
                    </p>
                    <p className="price">
                      <strong>{formatVND(room.monthlyRent || room.price)}</strong> / month
                    </p>

                    {room.roomArea && (
                      <p className="room-area">
                        📏 {room.roomArea} m²
                      </p>
                    )}

                    {room.amenities && room.amenities.length > 0 && (
                      <div className="amenities">
                        {room.amenities.slice(0, 3).map((amenity, index) => (
                          <span key={index} className="amenity-tag">
                            {amenity}
                          </span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span className="amenity-tag more">
                            +{room.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {room.creator && (
                      <div className="host-info">
                        <img
                          src={
                            room.creator?.profileImagePath ||
                            "https://via.placeholder.com/40"
                          }
                          alt={room.creator?.firstName}
                        />
                        <span>
                          Hosted by {room.creator?.firstName} {room.creator?.lastName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RoomRentalSearch;

