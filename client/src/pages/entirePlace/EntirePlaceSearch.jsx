import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, MapPin, Calendar, Users } from 'lucide-react';
import '../../styles/EntirePlaceSearch.scss';

const EntirePlaceSearch = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: searchParams.get('guests') || 1,
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    amenities: searchParams.get('amenities')?.split(',') || [],
    propertyType: searchParams.get('propertyType') || ''
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams({
        type: 'An entire place',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v && v.length > 0)
        )
      });

      const response = await fetch(`http://localhost:3001/listing?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || data);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchListings();
  };

  const handleViewDetails = (listingId) => {
    const params = new URLSearchParams({
      checkIn: filters.checkIn,
      checkOut: filters.checkOut,
      guests: filters.guests
    });
    navigate(`/listing/${listingId}?${params}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <div className="entire-place-search">
      {/* Search Bar */}
      <div className="search-bar">
        <div className="search-fields">
          <div className="search-field">
            <MapPin size={20} />
            <input
              type="text"
              placeholder="Where to?"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </div>

          <div className="search-field">
            <Calendar size={20} />
            <input
              type="date"
              placeholder="Check-in"
              value={filters.checkIn}
              onChange={(e) => setFilters({ ...filters, checkIn: e.target.value })}
            />
          </div>

          <div className="search-field">
            <Calendar size={20} />
            <input
              type="date"
              placeholder="Check-out"
              value={filters.checkOut}
              onChange={(e) => setFilters({ ...filters, checkOut: e.target.value })}
            />
          </div>

          <div className="search-field">
            <Users size={20} />
            <input
              type="number"
              min="1"
              placeholder="Guests"
              value={filters.guests}
              onChange={(e) => setFilters({ ...filters, guests: e.target.value })}
            />
          </div>

          <button className="search-btn" onClick={handleSearch}>
            <Search size={20} />
            Search
          </button>
        </div>

        <button
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} />
          Filters
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-section">
            <h3>Price Range</h3>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              />
            </div>
          </div>

          <div className="filter-section">
            <h3>Property Type</h3>
            <select
              value={filters.propertyType}
              onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="House">House</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Condo">Condo</option>
            </select>
          </div>

          <button className="apply-filters" onClick={handleSearch}>
            Apply Filters
          </button>
        </div>
      )}

      {/* Results */}
      <div className="search-results">
        <h2>{listings.length} Entire Places Available</h2>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="listings-grid">
            {listings.map((listing) => (
              <div
                key={listing._id}
                className="listing-card"
                onClick={() => handleViewDetails(listing._id)}
              >
                <div className="listing-image">
                  <img
                    src={listing.listingPhotoPaths?.[0] || '/assets/placeholder.jpg'}
                    alt={listing.title}
                  />
                  {listing.pricingType === 'daily' && (
                    <div className="pricing-badge">Daily</div>
                  )}
                </div>

                <div className="listing-content">
                  <h3>{listing.title}</h3>
                  <p className="location">
                    <MapPin size={16} />
                    {listing.city}, {listing.country}
                  </p>

                  <div className="listing-details">
                    <span>{listing.guestCount} guests</span>
                    <span>{listing.bedroomCount} bedrooms</span>
                    <span>{listing.bathroomCount} baths</span>
                  </div>

                  <div className="listing-footer">
                    <div className="price">
                      <strong>{formatPrice(listing.price)} VND</strong>
                      <span>/night</span>
                    </div>
                    {listing.rating && (
                      <div className="rating">
                        ⭐ {listing.rating} ({listing.reviewCount})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && listings.length === 0 && (
          <div className="no-results">
            <h3>No properties found</h3>
            <p>Try adjusting your search filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntirePlaceSearch;

