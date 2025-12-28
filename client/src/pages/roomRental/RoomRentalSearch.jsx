import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Loader from "../../components/Loader";
import "../../styles/RoomRentalSearch.scss";

const RoomRentalSearch = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const response = await fetch(
        `http://localhost:3001/room-rental/search?${queryParams}`
      );
      const data = await response.json();

      if (data.success) {
        setRooms(data.rooms);
        console.log(`✅ Found ${data.count} available rooms`);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
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

  const handleRoomClick = (roomId) => {
    navigate(`/room-rental/${roomId}`);
  };

  if (loading) return <Loader />;

  return (
    <>
      <Navbar />
      <div className="room-rental-search">
        <div className="search-header">
          <h1>🏠 Find Your Perfect Room</h1>
          <p>Long-term room rentals in shared homes</p>
        </div>

        {/* Search Filters */}
        <div className="search-filters">
          <div className="filter-group">
            <label>📍 Location</label>
            <input
              type="text"
              name="location"
              placeholder="City, province, or country"
              value={filters.location}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label>💰 Min Price (monthly)</label>
            <input
              type="number"
              name="minPrice"
              placeholder="Min"
              value={filters.minPrice}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label>💰 Max Price (monthly)</label>
            <input
              type="number"
              name="maxPrice"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label>✨ Amenities (comma-separated)</label>
            <input
              type="text"
              name="amenities"
              placeholder="WiFi, Kitchen, Laundry"
              value={filters.amenities}
              onChange={handleFilterChange}
            />
          </div>

          <button className="search-btn" onClick={handleSearch}>
            🔍 Search
          </button>
        </div>

        {/* Results */}
        <div className="search-results">
          <h2>
            {rooms.length} Room{rooms.length !== 1 ? "s" : ""} Available
          </h2>

          {rooms.length === 0 ? (
            <div className="no-results">
              <p>No rooms found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="rooms-grid">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className="room-card"
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
                  </div>

                  <div className="room-info">
                    <h3>{room.title}</h3>
                    <p className="location">
                      📍 {room.city}, {room.province}
                    </p>
                    <p className="price">
                      {(room.monthlyRent || room.price)?.toLocaleString("vi-VN")} VND / month
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
                          <span className="amenity-tag">
                            +{room.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="host-info">
                      <img
                        src={
                          room.creator?.profileImagePath ||
                          "https://via.placeholder.com/40"
                        }
                        alt={room.creator?.firstName}
                      />
                      <span>
                        {room.creator?.firstName} {room.creator?.lastName}
                      </span>
                    </div>
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

