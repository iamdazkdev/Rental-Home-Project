import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Loader from '../../components/Loader';
import { setLogin } from '../../redux/state';
import { CONFIG } from '../../constants/api';
import '../../styles/EditProfile.scss';
import { Person, Email, PhotoCamera } from '@mui/icons-material';

const EditProfilePage = () => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Initialize form with user data
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
    });

    // Set preview to current profile image
    if (user.profileImagePath) {
      setPreviewImage(
        user.profileImagePath.startsWith('https://')
          ? user.profileImagePath
          : `${CONFIG.API_BASE_URL}/${user.profileImagePath.replace('public/', '')}`
      );
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, image: 'Please select an image file' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, image: 'Image must be less than 5MB' }));
        return;
      }

      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, image: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('email', formData.email);

      if (profileImage) {
        formDataToSend.append('profileImage', profileImage);
      }

      const response = await fetch(`${CONFIG.API_BASE_URL}/user/${user._id || user.id}/profile`, {
        method: 'PATCH',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update Redux state with new user data
      const updatedUser = {
        ...user,
        ...data.user,
      };
      dispatch(setLogin({ user: updatedUser, token: localStorage.getItem('token') }));

      alert('Profile updated successfully!');
      navigate(`/host/${user._id || user.id}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Loader />;
  }

  return (
    <>
      <Navbar />
      <div className="edit-profile-page">
        <div className="edit-profile-container">
          <div className="page-header">
            <h1>Edit Profile</h1>
            <p>Update your personal information</p>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            {/* Profile Image Section */}
            <div className="form-section profile-image-section">
              <div className="image-preview">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" />
                ) : (
                  <div className="image-placeholder">
                    <Person sx={{ fontSize: 80 }} />
                  </div>
                )}
                <label htmlFor="profile-image-input" className="image-upload-button">
                  <PhotoCamera sx={{ fontSize: 20 }} />
                  <span>Change Photo</span>
                  <input
                    type="file"
                    id="profile-image-input"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
              {errors.image && <p className="error-message">{errors.image}</p>}
            </div>

            {/* Personal Information Section */}
            <div className="form-section">
              <h2>Personal Information</h2>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">
                    <Person sx={{ fontSize: 18 }} />
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={errors.firstName ? 'error' : ''}
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && <p className="error-message">{errors.firstName}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">
                    <Person sx={{ fontSize: 18 }} />
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={errors.lastName ? 'error' : ''}
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && <p className="error-message">{errors.lastName}</p>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <Email sx={{ fontSize: 18 }} />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="error-message">{errors.email}</p>}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-save"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditProfilePage;

