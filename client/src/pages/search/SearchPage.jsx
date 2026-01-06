import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Loader from "../../components/Loader";
import ListingCard from "../../components/ListingCard";
import { categories, types, facilities } from "../../data";
import "../../styles/SearchPage.scss";
import { CONFIG, HTTP_METHODS } from "../../constants/api";

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  // Search state
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    query: queryParams.get("query") || "",
    city: queryParams.get("city") || "",
    province: queryParams.get("province") || "",
    country: queryParams.get("country") || "",
    category: queryParams.get("category") || "",
    type: queryParams.get("type") || "",
    minPrice: queryParams.get("minPrice") || "",
    maxPrice: queryParams.get("maxPrice") || "",
    minGuests: queryParams.get("minGuests") || "",
    minBedrooms: queryParams.get("minBedrooms") || "",
    minBathrooms: queryParams.get("minBathrooms") || "",
    amenities: queryParams.getAll("amenities") || [],
    minRating: queryParams.get("minRating") || "",
    sortBy: queryParams.get("sortBy") || "rating",
    page: queryParams.get("page") || "1",
  });

  useEffect(() => {
    performSearch();
    // eslint-disable-next-line
  }, [location.search]);

  const performSearch = async () => {
    try {
      setLoading(true);

      // Build query string
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) {
          if (key === "amenities" && Array.isArray(filters[key])) {
            filters[key].forEach((amenity) => params.append(key, amenity));
          } else {
            params.append(key, filters[key]);
          }
        }
      });

      const url = `${CONFIG.API_BASE_URL}/search?${params.toString()}`;
      console.log("🔍 Search URL:", url);

      const response = await fetch(url, { method: HTTP_METHODS.GET });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Search results:", data);
        setResults(data.listings);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("❌ Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: "1" }));
  };

  const handleAmenityToggle = (amenity) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
      page: "1",
    }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        if (key === "amenities" && Array.isArray(filters[key])) {
          filters[key].forEach((amenity) => params.append(key, amenity));
        } else {
          params.append(key, filters[key]);
        }
      }
    });
    navigate(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      city: "",
      province: "",
      country: "",
      category: "",
      type: "",
      minPrice: "",
      maxPrice: "",
      minGuests: "",
      minBedrooms: "",
      minBathrooms: "",
      amenities: [],
      minRating: "",
      sortBy: "rating",
      page: "1",
    });
    navigate("/search");
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage.toString() }));
    const params = new URLSearchParams(location.search);
    params.set("page", newPage);
    navigate(`/search?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Navbar />
      <div className="search-page">
        {/* Search Header */}
        <div className="search-header">
          <div className="search-header-content">
            <h1>🔍 Search Listings</h1>
            <p>
              {pagination ? (
                <>
                  Found <strong>{pagination.total}</strong> result{pagination.total !== 1 ? "s" : ""}
                </>
              ) : (
                "Search for your perfect stay"
              )}
            </p>

            <div className="quick-search">
              <input
                type="text"
                placeholder="Search by location, title, or description..."
                value={filters.query}
                onChange={(e) => handleFilterChange("query", e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && applyFilters()}
              />
              <button onClick={applyFilters} className="search-btn">
                Search
              </button>
            </div>

            <button
              className="toggle-filters-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? "Hide" : "Show"} Advanced Filters
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="advanced-filters">
            <div className="filters-container">
              {/* Location Filters */}
              <div className="filter-section">
                <h3>📍 Location</h3>
                <div className="filter-inputs">
                  <input
                    type="text"
                    placeholder="City"
                    value={filters.city}
                    onChange={(e) => handleFilterChange("city", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Province/State"
                    value={filters.province}
                    onChange={(e) => handleFilterChange("province", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={filters.country}
                    onChange={(e) => handleFilterChange("country", e.target.value)}
                  />
                </div>
              </div>

              {/* Category & Type */}
              <div className="filter-section">
                <h3>🏷️ Category & Type</h3>
                <div className="category-type-selects">
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.label} value={cat.label}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                  >
                    <option value="">All Types</option>
                    {types.map((type) => (
                      <option key={type.name} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Range */}
              <div className="filter-section">
                <h3>💰 Price Range (per night)</h3>
                <div className="price-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                  />
                </div>
              </div>

              {/* Capacity */}
              <div className="filter-section">
                <h3>👥 Capacity</h3>
                <div className="capacity-inputs">
                  <div className="capacity-item">
                    <label>Min Guests</label>
                    <input
                      type="number"
                      min="1"
                      value={filters.minGuests}
                      onChange={(e) => handleFilterChange("minGuests", e.target.value)}
                    />
                  </div>
                  <div className="capacity-item">
                    <label>Min Bedrooms</label>
                    <input
                      type="number"
                      min="1"
                      value={filters.minBedrooms}
                      onChange={(e) => handleFilterChange("minBedrooms", e.target.value)}
                    />
                  </div>
                  <div className="capacity-item">
                    <label>Min Bathrooms</label>
                    <input
                      type="number"
                      min="1"
                      value={filters.minBathrooms}
                      onChange={(e) => handleFilterChange("minBathrooms", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="filter-section">
                <h3>✨ Amenities</h3>
                <div className="amenities-grid">
                  {facilities.slice(0, 12).map((facility) => (
                    <button
                      key={facility.name}
                      className={`amenity-btn ${
                        filters.amenities.includes(facility.name) ? "selected" : ""
                      }`}
                      onClick={() => handleAmenityToggle(facility.name)}
                    >
                      <span className="icon">{facility.icon}</span>
                      <span className="name">{facility.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="filter-section">
                <h3>⭐ Minimum Rating</h3>
                <div className="rating-selector">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      className={`rating-btn ${
                        filters.minRating === rating.toString() ? "selected" : ""
                      }`}
                      onClick={() =>
                        handleFilterChange(
                          "minRating",
                          filters.minRating === rating.toString() ? "" : rating.toString()
                        )
                      }
                    >
                      {"★".repeat(rating)}{"☆".repeat(5 - rating)} {rating}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="filter-actions">
                <button onClick={clearFilters} className="clear-btn">
                  Clear All
                </button>
                <button onClick={applyFilters} className="apply-btn">
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sort & Results */}
        <div className="search-content">
          {!loading && results.length > 0 && (
            <div className="sort-bar">
              <label>Sort by:</label>
              <select
                value={filters.sortBy}
                onChange={(e) => {
                  handleFilterChange("sortBy", e.target.value);
                  const params = new URLSearchParams(location.search);
                  params.set("sortBy", e.target.value);
                  navigate(`/search?${params.toString()}`);
                }}
              >
                <option value="rating">Highest Rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          )}

          {/* Results */}
          {loading ? (
            <Loader />
          ) : results.length === 0 ? (
            <div className="no-results">
              <div className="icon">🔍</div>
              <h2>No listings found</h2>
              <p>Try adjusting your filters or search query</p>
              <button onClick={clearFilters}>Clear All Filters</button>
            </div>
          ) : (
            <>
              <div className="results-grid">
                {results.map((listing) => (
                  <div key={listing._id} className="result-item">
                    <ListingCard
                      listingId={listing._id}
                      creator={listing.creator}
                      listingPhotoPaths={listing.listingPhotoPaths}
                      city={listing.city}
                      province={listing.province}
                      country={listing.country}
                      category={listing.category}
                      type={listing.type}
                      price={listing.price}
                      booking={false}
                    />
                    {listing.averageRating > 0 && (
                      <div className="listing-rating">
                        ⭐ {listing.averageRating.toFixed(1)} ({listing.reviewCount} reviews)
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    ← Previous
                  </button>
                  <span>
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    disabled={pagination.page === pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SearchPage;

