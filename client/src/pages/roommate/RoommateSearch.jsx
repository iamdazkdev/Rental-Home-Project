import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/RoommateSearch.scss";

const RoommateSearch = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: searchParams.get("city") || "",
    postType: searchParams.get("postType") || "",
    budgetMin: searchParams.get("budgetMin") || "",
    budgetMax: searchParams.get("budgetMax") || "",
    moveInDate: searchParams.get("moveInDate") || "",
    genderPreference: searchParams.get("genderPreference") || "",
    smoking: searchParams.get("smoking") || "",
    pets: searchParams.get("pets") || "",
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    pages: 0,
  });

  useEffect(() => {
    fetchPosts();
  }, [searchParams]);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      const queryString = new URLSearchParams({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      }).toString();

      const response = await fetch(
        `http://localhost:3001/roommate/posts/search?${queryString}`
      );

      const data = await response.json();

      if (data.success) {
        setPosts(data.posts);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("❌ Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: value,
    };
    setFilters(newFilters);
  };

  const handleSearch = () => {
    // Update URL params
    const params = {};
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        params[key] = filters[key];
      }
    });
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setFilters({
      city: "",
      postType: "",
      budgetMin: "",
      budgetMax: "",
      moveInDate: "",
      genderPreference: "",
      smoking: "",
      pets: "",
    });
    setSearchParams({});
  };

  const formatBudget = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <Navbar />
      <div className="roommate-search-container">
      <div className="search-header">
        <h1>Find Your Perfect Roommate</h1>
        <p>Connect with people looking for shared living arrangements</p>
      </div>

      <div className="search-content">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h3>Filters</h3>
            <button className="clear-btn" onClick={handleClearFilters}>
              Clear All
            </button>
          </div>

          <div className="filter-group">
            <label>Location</label>
            <input
              type="text"
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
              placeholder="Enter city name"
            />
          </div>

          <div className="filter-group">
            <label>Looking For</label>
            <select name="postType" value={filters.postType} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="SEEKER">Looking for a Place</option>
              <option value="PROVIDER">Have a Place</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Budget (VND/month)</label>
            <div className="budget-inputs">
              <input
                type="number"
                name="budgetMin"
                value={filters.budgetMin}
                onChange={handleFilterChange}
                placeholder="Min"
              />
              <span>-</span>
              <input
                type="number"
                name="budgetMax"
                value={filters.budgetMax}
                onChange={handleFilterChange}
                placeholder="Max"
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Move-in Date</label>
            <input
              type="date"
              name="moveInDate"
              value={filters.moveInDate}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-group">
            <label>Gender Preference</label>
            <select
              name="genderPreference"
              value={filters.genderPreference}
              onChange={handleFilterChange}
            >
              <option value="">Any</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="ANY">No Preference</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Smoking</label>
            <select name="smoking" value={filters.smoking} onChange={handleFilterChange}>
              <option value="">Any</option>
              <option value="NO">No Smoking</option>
              <option value="OUTSIDE_ONLY">Outside Only</option>
              <option value="YES">Yes</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Pets</label>
            <select name="pets" value={filters.pets} onChange={handleFilterChange}>
              <option value="">Any</option>
              <option value="NO">No Pets</option>
              <option value="NEGOTIABLE">Negotiable</option>
              <option value="YES">Pets Welcome</option>
            </select>
          </div>

          <button className="apply-filters-btn" onClick={handleSearch}>
            Apply Filters
          </button>
        </aside>

        {/* Results */}
        <main className="search-results">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Searching for roommates...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <span className="icon">🔍</span>
              <h3>No posts found</h3>
              <p>Try adjusting your filters or create a new post</p>
              <button className="create-post-btn" onClick={() => navigate("/roommate/create")}>
                Create Post
              </button>
            </div>
          ) : (
            <>
              <div className="results-header">
                <p>
                  Found <strong>{pagination.total}</strong> {pagination.total === 1 ? "post" : "posts"}
                </p>
              </div>

              <div className="posts-grid">
                {posts.map((post) => (
                  <div
                    key={post._id}
                    className="post-card"
                    onClick={() => navigate(`/roommate/posts/${post._id}`)}
                  >
                    <div className="post-type-badge">
                      {post.postType === "SEEKER" ? "🔍 Looking for Place" : "🏠 Have Place"}
                    </div>

                    <h3 className="post-title">
                      {post.title || `${post.postType === 'SEEKER' ? 'Looking for' : 'Offering'} room in ${post.city}`}
                    </h3>

                    <div className="post-meta">
                      <div className="meta-item">
                        <span className="icon">📍</span>
                        <span>{post.city}, {post.province}</span>
                      </div>
                      <div className="meta-item">
                        <span className="icon">💰</span>
                        <span>
                          {formatBudget(post.budgetMin)} - {formatBudget(post.budgetMax)} VND/month
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="icon">📅</span>
                        <span>Move-in: {formatDate(post.moveInDate)}</span>
                      </div>
                    </div>

                    <p className="post-description">
                      {post.description.length > 120
                        ? post.description.substring(0, 120) + "..."
                        : post.description}
                    </p>

                    <div className="lifestyle-tags">
                      {post.lifestyle?.smoking === "NO" && (
                        <span className="tag">🚭 No Smoking</span>
                      )}
                      {post.lifestyle?.pets === "YES" && (
                        <span className="tag">🐾 Pets OK</span>
                      )}
                      {post.lifestyle?.cleanliness === "VERY_CLEAN" && (
                        <span className="tag">✨ Very Clean</span>
                      )}
                    </div>

                    <div className="post-footer">
                      <div className="user-info">
                        <img
                          src={
                            post.userId?.profileImagePath
                              ? post.userId.profileImagePath.startsWith('http')
                                ? post.userId.profileImagePath
                                : `http://localhost:3001/${post.userId.profileImagePath.replace("public/", "")}`
                              : `https://ui-avatars.com/api/?name=${post.userId?.firstName || 'User'}&background=667eea&color=fff&size=128`
                          }
                          alt={post.userId?.firstName}
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${post.userId?.firstName || 'User'}&background=667eea&color=fff&size=128`;
                          }}
                        />
                        <span>
                          {post.userId?.firstName} {post.userId?.lastName}
                        </span>
                      </div>
                      <div className="view-count">
                        👁️ {post.viewCount || 0} views
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => {
                      setPagination({ ...pagination, page: pagination.page - 1 });
                      const params = { ...Object.fromEntries(searchParams), page: pagination.page - 1 };
                      setSearchParams(params);
                    }}
                  >
                    Previous
                  </button>
                  <span>
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    disabled={pagination.page === pagination.pages}
                    onClick={() => {
                      setPagination({ ...pagination, page: pagination.page + 1 });
                      const params = { ...Object.fromEntries(searchParams), page: pagination.page + 1 };
                      setSearchParams(params);
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default RoommateSearch;

