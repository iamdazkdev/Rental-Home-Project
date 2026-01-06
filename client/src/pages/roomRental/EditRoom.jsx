import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  Upload,
  X,
  Save,
  Loader2,
  MapPin,
  DollarSign,
  Home,
  Maximize2
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import '../../styles/EditRoom.scss';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const EditRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [room, setRoom] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    streetAddress: '',
    city: '',
    province: '',
    country: '',
    monthlyRent: '',
    depositAmount: '',
    roomSize: '',
    guestCount: 1,
    bedroomCount: 1,
    bedCount: 1,
    bathroomCount: 1,
    amenities: [],
    isActive: true
  });
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newPhotos, setNewPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchRoomDetails();
  }, [roomId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/listing/${roomId}`);
      const data = await response.json();

      if (data) {
        setRoom(data);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          streetAddress: data.streetAddress || '',
          city: data.city || '',
          province: data.province || '',
          country: data.country || '',
          monthlyRent: data.monthlyRent || data.price * 30 || '',
          depositAmount: data.depositAmount || data.price || '',
          roomSize: data.roomArea || data.roomSize || '',
          guestCount: data.guestCount || 1,
          bedroomCount: data.bedroomCount || 1,
          bedCount: data.bedCount || 1,
          bathroomCount: data.bathroomCount || 1,
          amenities: data.amenities || [],
          isActive: data.isActive !== false
        });
        setExistingPhotos(data.listingPhotoPaths || []);
      }
    } catch (error) {
      console.error('Error fetching room:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setNewPhotos(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreviews(prev => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingPhoto = (index) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewPhoto = (index) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = new FormData();

      // Add form fields
      Object.keys(formData).forEach(key => {
        if (key === 'amenities') {
          updateData.append(key, JSON.stringify(formData[key]));
        } else {
          updateData.append(key, formData[key]);
        }
      });

      // Add existing photos
      updateData.append('existingPhotos', JSON.stringify(existingPhotos));

      // Add new photos
      newPhotos.forEach(photo => {
        updateData.append('roomPhotos', photo);
      });

      const response = await fetch(`${API_URL}/room-rental/rooms/${roomId}`, {
        method: 'PUT',
        body: updateData
      });

      const data = await response.json();

      if (data.success) {
        navigate('/room-rental/my-rooms');
      } else {
        alert(data.message || 'Failed to update room');
      }
    } catch (error) {
      console.error('Error updating room:', error);
      alert('Failed to update room');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="edit-room-loading">
          <Loader2 className="spinner" />
          <p>Loading room details...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="edit-room-page">
        <div className="page-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            Back
          </button>
          <h1>Edit Room</h1>
        </div>

        <form onSubmit={handleSubmit} className="edit-room-form">
          {/* Basic Info */}
          <section className="form-section">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label htmlFor="title">Room Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
              />
            </div>
          </section>

          {/* Location */}
          <section className="form-section">
            <h2><MapPin size={20} /> Location</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="streetAddress">Street Address</label>
                <input
                  type="text"
                  id="streetAddress"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="province">Province/State</label>
                <input
                  type="text"
                  id="province"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="form-section">
            <h2><DollarSign size={20} /> Pricing</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="monthlyRent">Monthly Rent (VND)</label>
                <input
                  type="number"
                  id="monthlyRent"
                  name="monthlyRent"
                  value={formData.monthlyRent}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="depositAmount">Deposit Amount (VND)</label>
                <input
                  type="number"
                  id="depositAmount"
                  name="depositAmount"
                  value={formData.depositAmount}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </section>

          {/* Room Details */}
          <section className="form-section">
            <h2><Home size={20} /> Room Details</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="roomSize">Room Size (m²)</label>
                <input
                  type="number"
                  id="roomSize"
                  name="roomSize"
                  value={formData.roomSize}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="guestCount">Max Guests</label>
                <input
                  type="number"
                  id="guestCount"
                  name="guestCount"
                  value={formData.guestCount}
                  onChange={handleInputChange}
                  min={1}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="bedroomCount">Bedrooms</label>
                <input
                  type="number"
                  id="bedroomCount"
                  name="bedroomCount"
                  value={formData.bedroomCount}
                  onChange={handleInputChange}
                  min={0}
                />
              </div>
              <div className="form-group">
                <label htmlFor="bathroomCount">Bathrooms</label>
                <input
                  type="number"
                  id="bathroomCount"
                  name="bathroomCount"
                  value={formData.bathroomCount}
                  onChange={handleInputChange}
                  min={0}
                />
              </div>
            </div>
          </section>

          {/* Photos */}
          <section className="form-section">
            <h2>Photos</h2>

            <div className="photos-grid">
              {existingPhotos.map((photo, index) => (
                <div key={`existing-${index}`} className="photo-item">
                  <img src={photo} alt={`Room ${index + 1}`} />
                  <button
                    type="button"
                    className="btn-remove-photo"
                    onClick={() => removeExistingPhoto(index)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              {photoPreviews.map((preview, index) => (
                <div key={`new-${index}`} className="photo-item new">
                  <img src={preview} alt={`New ${index + 1}`} />
                  <button
                    type="button"
                    className="btn-remove-photo"
                    onClick={() => removeNewPhoto(index)}
                  >
                    <X size={16} />
                  </button>
                  <span className="new-badge">New</span>
                </div>
              ))}

              <label className="photo-upload">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  hidden
                />
                <Upload size={24} />
                <span>Add Photos</span>
              </label>
            </div>
          </section>

          {/* Status */}
          <section className="form-section">
            <h2>Status</h2>
            <div className="form-check">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
              <label htmlFor="isActive">Room is active and visible to tenants</label>
            </div>
          </section>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate('/room-rental/my-rooms')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="spinner" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default EditRoom;

