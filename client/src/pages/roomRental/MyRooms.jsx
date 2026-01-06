import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Plus,
  MapPin,
  DollarSign,
  Home,
  Eye,
  Edit,
  EyeOff,
  Trash2,
  Loader
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import '../../styles/MyRooms.scss';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const MyRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyRooms();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMyRooms = async () => {
    try {
      setLoading(true);
      const userId = user?._id || user?.id;
      const response = await fetch(`${API_URL}/room-rental/host/${userId}/rooms`);
      const data = await response.json();

      if (data.success) {
        setRooms(data.rooms || []);
      } else {
        console.error('Failed to fetch rooms:', data.message);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (roomId, currentStatus) => {
    try {
      const response = await fetch(`${API_URL}/room-rental/rooms/${roomId}/toggle-visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      const data = await response.json();
      if (data.success) {
        fetchMyRooms();
      }
    } catch (error) {
      console.error('Error toggling room visibility:', error);
    }
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/room-rental/rooms/${roomId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        fetchMyRooms();
      }
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const filteredRooms = rooms.filter(room => {
    if (filter === 'active') return room.isActive !== false;
    if (filter === 'inactive') return room.isActive === false;
    return true;
  });

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="my-rooms-loading">
          <div className="loader"></div>
          <p>Loading your rooms...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="my-rooms-page">
        <div className="page-header">
          <div className="header-content">
            <h1>My Rooms</h1>
            <p>Manage your room listings</p>
          </div>
          <Link to="/create-listing" className="btn-add-room">
            <Plus size={20} />
            Add New Room
          </Link>
        </div>

        <div className="filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({rooms.length})
          </button>
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({rooms.filter(r => r.isActive !== false).length})
          </button>
          <button
            className={`filter-btn ${filter === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilter('inactive')}
          >
            Inactive ({rooms.filter(r => r.isActive === false).length})
          </button>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="empty-state">
            <Home size={64} />
            <h3>No rooms found</h3>
            <p>
              {filter === 'all'
                ? "You haven't listed any rooms yet."
                : `You don't have any ${filter} rooms.`}
            </p>
            {filter === 'all' && (
              <Link to="/create-listing" className="btn-primary">
                <Plus size={20} />
                Create Your First Room
              </Link>
            )}
          </div>
        ) : (
          <div className="rooms-grid">
            {filteredRooms.map(room => (
              <div key={room._id} className={`room-card ${room.isActive === false ? 'inactive' : ''}`}>
                <div className="room-image-container">
                  <img
                    src={room.listingPhotoPaths?.[0] || '/assets/placeholder.jpg'}
                    alt={room.title}
                    className="room-image"
                  />
                  <span className={`status-badge ${room.isActive === false ? 'inactive' : 'active'}`}>
                    {room.isActive === false ? 'Inactive' : 'Active'}
                  </span>
                </div>

                <div className="room-info">
                  <h3 className="room-title">{room.title}</h3>

                  <div className="room-location">
                    <MapPin size={14} />
                    <span>{room.city}, {room.province || room.country}</span>
                  </div>

                  <div className="room-details">
                    <div className="detail-item">
                      <DollarSign size={16} />
                      <span>{Number(room.monthlyRent || room.price).toLocaleString('vi-VN')} VND/month</span>
                    </div>
                    {room.roomSize && (
                      <div className="detail-item">
                        <Home size={16} />
                        <span>{room.roomSize} m²</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="room-actions">
                  <button
                    className="btn-action btn-view"
                    onClick={() => navigate(`/room-rental/${room._id}`)}
                    title="View"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    className="btn-action btn-edit"
                    onClick={() => navigate(`/room-rental/edit/${room._id}`)}
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    className={`btn-action ${room.isActive === false ? 'btn-show' : 'btn-hide'}`}
                    onClick={() => handleToggleVisibility(room._id, room.isActive !== false)}
                    title={room.isActive === false ? 'Show' : 'Hide'}
                  >
                    {room.isActive === false ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                  <button
                    className="btn-action btn-delete"
                    onClick={() => handleDelete(room._id)}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
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

export default MyRooms;

