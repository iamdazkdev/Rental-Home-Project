import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import '../../styles/AdminDashboard.scss';

const AdminDashboard = () => {
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [activeSection, setActiveSection] = useState('overview'); // overview, users, listings
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Check admin role
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      alert('Access denied. Admin only.');
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/admin/stats/${user._id}`);
      const data = await response.json();
      setStats(data);
      console.log('✅ Stats loaded:', data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      alert('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch users
  const fetchUsers = useCallback(async (page = 1, search = '') => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/admin/users/${user._id}?page=${page}&limit=20&search=${search}`
      );
      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
      console.log('✅ Users loaded:', data.users.length);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch listings
  const fetchListings = useCallback(async (page = 1, status = '') => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/admin/listings/${user._id}?page=${page}&limit=20&status=${status}`
      );
      const data = await response.json();
      setListings(data.listings);
      setPagination(data.pagination);
      console.log('✅ Listings loaded:', data.listings.length);
    } catch (error) {
      console.error('Error fetching listings:', error);
      alert('Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update user role
  const handleUpdateUserRole = async (userId, newRole) => {
    if (!window.confirm(`Change user role to ${newRole}?`)) return;

    try {
      const response = await fetch(
        `http://localhost:3001/admin/users/${user._id}/${userId}/role`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        }
      );
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update user role');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('⚠️ DELETE USER PERMANENTLY? This cannot be undone!')) return;

    try {
      const response = await fetch(
        `http://localhost:3001/admin/users/${user._id}/${userId}`,
        {
          method: 'DELETE',
        }
      );
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  // Toggle listing status
  const handleToggleListing = async (listingId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/admin/listings/${user._id}/${listingId}/toggle`,
        {
          method: 'PATCH',
        }
      );
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchListings();
      } else {
        alert(data.message || 'Failed to toggle listing');
      }
    } catch (error) {
      console.error('Error toggling listing:', error);
      alert('Failed to toggle listing');
    }
  };

  // Delete listing
  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('⚠️ DELETE LISTING PERMANENTLY? This cannot be undone!')) return;

    try {
      const response = await fetch(
        `http://localhost:3001/admin/listings/${user._id}/${listingId}`,
        {
          method: 'DELETE',
        }
      );
      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchListings();
      } else {
        alert(data.message || 'Failed to delete listing');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing');
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      if (activeSection === 'overview') {
        fetchStats();
      } else if (activeSection === 'users') {
        fetchUsers();
      } else if (activeSection === 'listings') {
        fetchListings();
      }
    }
  }, [activeSection, user, fetchStats, fetchUsers, fetchListings]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>🔐 Admin Dashboard</h1>
        <p>System-wide management and statistics</p>
      </div>

      {/* Navigation */}
      <div className="dashboard-nav">
        <button
          className={activeSection === 'overview' ? 'active' : ''}
          onClick={() => setActiveSection('overview')}
        >
          📊 Overview
        </button>
        <button
          className={activeSection === 'users' ? 'active' : ''}
          onClick={() => setActiveSection('users')}
        >
          👥 Users
        </button>
        <button
          className={activeSection === 'listings' ? 'active' : ''}
          onClick={() => setActiveSection('listings')}
        >
          🏠 Listings
        </button>
      </div>

      {loading && <div className="loading">Loading...</div>}

      {/* Overview Section */}
      {activeSection === 'overview' && stats && (
        <div className="overview-section">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{stats.users.total}</h3>
                <p>Total Users</p>
                <span className="stat-change">+{stats.users.newThisMonth} this month</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🏠</div>
              <div className="stat-info">
                <h3>{stats.listings.total}</h3>
                <p>Total Listings</p>
                <span className="stat-change">{stats.listings.active} active</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <h3>{stats.bookings.total}</h3>
                <p>Total Bookings</p>
                <span className="stat-change">{stats.bookings.pending} pending</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h3>{formatCurrency(stats.revenue.total)}</h3>
                <p>Total Revenue</p>
                <span className="stat-change">{formatCurrency(stats.revenue.thisMonth)} this month</span>
              </div>
            </div>
          </div>

          {/* Top Hosts */}
          <div className="section-card">
            <h2>🏆 Top Hosts</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Host</th>
                    <th>Email</th>
                    <th>Listings</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topHosts.map((host) => (
                    <tr key={host.hostId}>
                      <td>{host.hostName}</td>
                      <td>{host.email}</td>
                      <td>{host.listingCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="section-card">
            <h2>📅 Recent Bookings</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Listing</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>{booking.customerId ? `${booking.customerId.firstName} ${booking.customerId.lastName}` : 'N/A'}</td>
                      <td>{booking.listingId?.title || 'N/A'}</td>
                      <td><span className={`status-badge ${booking.bookingStatus}`}>{booking.bookingStatus}</span></td>
                      <td>{new Date(booking.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Section */}
      {activeSection === 'users' && (
        <div className="users-section">
          <div className="section-header">
            <h2>👥 User Management</h2>
            <button className="btn-refresh" onClick={() => fetchUsers()}>
              🔃 Refresh
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>{u.firstName} {u.lastName}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge ${u.role}`}>{u.role}</span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="action-buttons">
                      {u.role === 'user' ? (
                        <button
                          className="btn-promote"
                          onClick={() => handleUpdateUserRole(u._id, 'admin')}
                        >
                          ⬆️ Promote
                        </button>
                      ) : (
                        <button
                          className="btn-demote"
                          onClick={() => handleUpdateUserRole(u._id, 'user')}
                        >
                          ⬇️ Demote
                        </button>
                      )}
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteUser(u._id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button
              disabled={pagination.page === 1}
              onClick={() => fetchUsers(pagination.page - 1)}
            >
              Previous
            </button>
            <span>Page {pagination.page} of {pagination.pages}</span>
            <button
              disabled={pagination.page === pagination.pages}
              onClick={() => fetchUsers(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Listings Section */}
      {activeSection === 'listings' && (
        <div className="listings-section">
          <div className="section-header">
            <h2>🏠 Listing Management</h2>
            <button className="btn-refresh" onClick={() => fetchListings()}>
              🔃 Refresh
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Host</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr key={listing._id}>
                    <td>{listing.title}</td>
                    <td>
                      {listing.creator
                        ? `${listing.creator.firstName} ${listing.creator.lastName}`
                        : 'N/A'}
                    </td>
                    <td>{formatCurrency(listing.price)}</td>
                    <td>
                      <span className={`status-badge ${listing.isActive ? 'active' : 'inactive'}`}>
                        {listing.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(listing.createdAt).toLocaleDateString()}</td>
                    <td className="action-buttons">
                      <button
                        className="btn-toggle"
                        onClick={() => handleToggleListing(listing._id)}
                      >
                        {listing.isActive ? '🚫 Disable' : '✅ Enable'}
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteListing(listing._id)}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button
              disabled={pagination.page === 1}
              onClick={() => fetchListings(pagination.page - 1)}
            >
              Previous
            </button>
            <span>Page {pagination.page} of {pagination.pages}</span>
            <button
              disabled={pagination.page === pagination.pages}
              onClick={() => fetchListings(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

