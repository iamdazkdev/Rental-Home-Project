import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Slide from "../../components/Slide";
import Categories from "../../components/Categories";
import Listing from "../../components/Listing";
import { Search, MapPin, Calendar, DollarSign } from "lucide-react";
import "../../styles/HomePage.scss";

const HomePage = () => {
  const [selectedType, setSelectedType] = useState(null);
  const [activeFlow, setActiveFlow] = useState("entire-place"); // Default flow
  const navigate = useNavigate();

  const handleFlowChange = (flow) => {
    setActiveFlow(flow);
  };

  const handleSearch = (flow) => {
    // Navigate to appropriate search page
    if (flow === "room-rental") {
      navigate("/room-rental");
    } else if (flow === "roommate") {
      navigate("/roommate/search");
    } else if (flow === "entire-place") {
      navigate("/entire-place");
    }
  };

  return (
    <div className="home-page">
      <Navbar />
      <Slide />

      {/* Flow Selector Section */}
      <section className="flow-selector-section">
        <div className="container">
          <h2 className="section-title">What are you looking for?</h2>
          <p className="section-subtitle">Choose the option that best fits your needs</p>

          <div className="flow-cards">
            {/* Entire Place Card */}
            <div
              className={`flow-card ${activeFlow === "entire-place" ? "active" : ""}`}
              onClick={() => handleFlowChange("entire-place")}
            >
              <div className="flow-icon">🏠</div>
              <h3>Entire Place</h3>
              <p>Book a whole apartment, house, or villa for your vacation</p>
              <ul className="flow-features">
                <li>✓ Nightly bookings</li>
                <li>✓ Full privacy</li>
                <li>✓ Instant booking available</li>
                <li>✓ Perfect for families & groups</li>
              </ul>
              <button className="flow-btn" onClick={(e) => { e.stopPropagation(); handleSearch("entire-place"); }}>
                Explore Places
              </button>
            </div>

            {/* Room Rental Card */}
            <div
              className={`flow-card ${activeFlow === "room-rental" ? "active" : ""}`}
              onClick={() => handleFlowChange("room-rental")}
            >
              <div className="flow-icon">🚪</div>
              <h3>Rent a Room</h3>
              <p>Find a private room in a shared house for monthly stays</p>
              <ul className="flow-features">
                <li>✓ Monthly rental agreements</li>
                <li>✓ Private furnished rooms</li>
                <li>✓ Flexible move-in dates</li>
                <li>✓ Shared common areas</li>
              </ul>
              <button className="flow-btn" onClick={(e) => { e.stopPropagation(); handleSearch("room-rental"); }}>
                Find Rooms
              </button>
            </div>

            {/* Roommate Matching Card */}
            <div
              className={`flow-card ${activeFlow === "roommate" ? "active" : ""}`}
              onClick={() => handleFlowChange("roommate")}
            >
              <div className="flow-icon">👥</div>
              <h3>Find Roommate</h3>
              <p>Connect with compatible roommates to share living space</p>
              <ul className="flow-features">
                <li>✓ Lifestyle compatibility matching</li>
                <li>✓ Direct messaging platform</li>
                <li>✓ No booking or payment needed</li>
                <li>✓ Safe & verified users</li>
              </ul>
              <button className="flow-btn" onClick={(e) => { e.stopPropagation(); handleSearch("roommate"); }}>
                Find Roommates
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="quick-stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">🏘️</div>
              <div className="stat-number">1,000+</div>
              <div className="stat-label">Active Listings</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">👥</div>
              <div className="stat-number">5,000+</div>
              <div className="stat-label">Happy Users</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">⭐</div>
              <div className="stat-number">4.8/5</div>
              <div className="stat-label">Average Rating</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🌍</div>
              <div className="stat-number">50+</div>
              <div className="stat-label">Cities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Show relevant content based on active flow */}
      {activeFlow === "entire-place" && (
        <>
          <Categories />
          <Listing />
        </>
      )}

      {activeFlow === "room-rental" && (
        <section className="flow-preview room-rental-preview">
          <div className="container">
            <h2>🚪 Monthly Room Rentals</h2>
            <p>Find your perfect private room in shared accommodations</p>

            <div className="preview-search-box">
              <div className="search-input-group">
                <MapPin size={20} />
                <input type="text" placeholder="Enter city or location..." />
              </div>
              <div className="search-input-group">
                <DollarSign size={20} />
                <input type="number" placeholder="Max budget per month..." />
              </div>
              <div className="search-input-group">
                <Calendar size={20} />
                <input type="date" placeholder="Move-in date" />
              </div>
              <button className="search-btn" onClick={() => handleSearch("room-rental")}>
                <Search size={20} />
                Search Rooms
              </button>
            </div>

            <div className="preview-features">
              <div className="feature-tag">✓ Identity Verified Hosts</div>
              <div className="feature-tag">✓ Monthly Agreements</div>
              <div className="feature-tag">✓ Private Rooms Only</div>
            </div>
          </div>
        </section>
      )}

      {activeFlow === "roommate" && (
        <section className="flow-preview roommate-preview">
          <div className="container">
            <h2>👥 Find Your Perfect Roommate</h2>
            <p>Connect with people looking for roommates or seeking shared living</p>

            <div className="preview-search-box">
              <div className="search-input-group">
                <MapPin size={20} />
                <input type="text" placeholder="Preferred location..." />
              </div>
              <div className="search-input-group">
                <DollarSign size={20} />
                <input type="number" placeholder="Budget range..." />
              </div>
              <div className="search-input-group">
                <Calendar size={20} />
                <input type="date" placeholder="When are you moving?" />
              </div>
              <button className="search-btn" onClick={() => handleSearch("roommate")}>
                <Search size={20} />
                Search Roommates
              </button>
            </div>

            <div className="preview-features">
              <div className="feature-tag">✓ Lifestyle Matching</div>
              <div className="feature-tag">✓ Direct Chat</div>
              <div className="feature-tag">✓ Free to Use</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
