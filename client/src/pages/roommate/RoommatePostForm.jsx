import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../../styles/RoommatePostForm.scss";

const RoommatePostForm = () => {
  const navigate = useNavigate();
  const { postId } = useParams(); // Get postId from URL if editing
  const isEditMode = Boolean(postId);
  const user = useSelector((state) => state.user);
  const userId = user?._id || user?.id;

  // Verification state
  const [checkingVerification, setCheckingVerification] = useState(true);

  const [formData, setFormData] = useState({
    postType: "SEEKER",
    title: "",
    description: "",
    city: "",
    province: "",
    country: "Vietnam",
    budgetMin: "",
    budgetMax: "",
    moveInDate: "",
    genderPreference: "ANY",
    ageRangeMin: 18,
    ageRangeMax: 100,
    lifestyle: {
      sleepSchedule: "FLEXIBLE",
      smoking: "NO",
      pets: "NEGOTIABLE",
      cleanliness: "MODERATE",
      occupation: "STUDENT",
    },
    preferredContact: "CHAT",
    contactEmail: "",
    contactPhone: "",
  });

  const [photos, setPhotos] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // Store existing image URLs in edit mode
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch post data if in edit mode
  useEffect(() => {
    const fetchPostData = async () => {
      if (isEditMode && postId) {
        try {
          console.log(`📥 Fetching post data for ID: ${postId}`);
          const response = await fetch(`http://localhost:3001/roommate/posts/${postId}`);

          if (!response.ok) {
            throw new Error("Failed to fetch post data");
          }

          const data = await response.json();
          console.log("✅ Post data loaded:", data.post);

          const post = data.post;

          // Verify ownership
          if (post.userId?._id !== userId && post.userId !== userId) {
            console.error("❌ User does not own this post");
            navigate("/roommate/my-posts");
            return;
          }

          // Populate form with existing data
          setFormData({
            postType: post.postType || "SEEKER",
            title: post.title || "",
            description: post.description || "",
            city: post.location?.city || "",
            province: post.location?.province || "",
            country: post.location?.country || "Vietnam",
            budgetMin: post.budgetMin || "",
            budgetMax: post.budgetMax || "",
            moveInDate: post.moveInDate ? post.moveInDate.split('T')[0] : "",
            genderPreference: post.genderPreference || "ANY",
            ageRangeMin: post.ageRange?.min || 18,
            ageRangeMax: post.ageRange?.max || 100,
            lifestyle: {
              sleepSchedule: post.lifestyle?.sleepSchedule || "FLEXIBLE",
              smoking: post.lifestyle?.smoking || "NO",
              pets: post.lifestyle?.pets || "NEGOTIABLE",
              cleanliness: post.lifestyle?.cleanliness || "MODERATE",
              occupation: post.lifestyle?.occupation || "STUDENT",
            },
            preferredContact: post.contactPreference?.method || "CHAT",
            contactEmail: post.contactPreference?.email || "",
            contactPhone: post.contactPreference?.phone || "",
          });

          // Set existing images
          if (post.images && post.images.length > 0) {
            setExistingImages(post.images);
          }
        } catch (error) {
          console.error("❌ Error fetching post data:", error);
          setError("Failed to load post data");
        }
      }
    };

    fetchPostData();
  }, [isEditMode, postId, userId, navigate]);

  // Fetch user's email and phone to pre-populate
  useEffect(() => {
    const fetchUserContact = async () => {
      if (userId) {
        try {
          const response = await fetch(`http://localhost:3001/user/${userId}`);
          if (response.ok) {
            const userData = await response.json();
            setFormData((prev) => ({
              ...prev,
              contactEmail: userData.email || "",
              contactPhone: userData.phone || "",
            }));
          }
        } catch (error) {
          console.error("❌ Error fetching user contact:", error);
        }
      }
    };

    fetchUserContact();
  }, [userId]);

  // Check verification status on mount
  useEffect(() => {
    const checkVerification = async () => {
      if (!userId) {
        console.log("❌ No user ID found");
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3001/identity-verification/${userId}/status`
        );

        if (response.ok) {
          const data = await response.json();
          console.log("📥 Verification status:", data);

          if (data.exists && data.status === "approved") {
            // Verification approved - continue
          } else {
            // Not verified - redirect to verification page
            console.log("🚨 Identity verification required");
            navigate("/identity-verification");
          }
        } else {
          console.log("❌ Failed to check verification");
          navigate("/identity-verification");
        }
      } catch (error) {
        console.error("❌ Error checking verification:", error);
        navigate("/identity-verification");
      } finally {
        setCheckingVerification(false);
      }
    };

    checkVerification();
  }, [userId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("lifestyle.")) {
      const lifestyleField = name.split(".")[1];
      setFormData({
        ...formData,
        lifestyle: {
          ...formData.lifestyle,
          [lifestyleField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleFileChange = (e) => {
    const newPhotos = Array.from(e.target.files);

    // Validate file types
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const invalidFiles = newPhotos.filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      setError("Only JPEG, PNG, and WebP images are allowed");
      return;
    }

    // Validate total number of photos (max 5)
    if (photos.length + newPhotos.length > 5) {
      setError("Maximum 5 photos allowed");
      return;
    }

    // Validate file size (max 5MB per file)
    const oversizedFiles = newPhotos.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError("Each photo must be less than 5MB");
      return;
    }

    setPhotos([...photos, ...newPhotos]);
    setError("");
  };

  const handleRemovePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validation
      if (parseInt(formData.budgetMax) < parseInt(formData.budgetMin)) {
        throw new Error("Maximum budget must be greater than minimum budget");
      }

      // Validate contact info based on preferred contact method
      if (formData.preferredContact === "EMAIL" && !formData.contactEmail) {
        throw new Error("Please provide a contact email address");
      }
      if (formData.preferredContact === "PHONE" && !formData.contactPhone) {
        throw new Error("Please provide a contact phone number");
      }

      // Upload photos to Cloudinary first
      let uploadedImageUrls = [];

      if (photos.length > 0) {
        console.log(`📤 Uploading ${photos.length} photos...`);

        const uploadPromises = photos.map(async (photo, index) => {
          const photoFormData = new FormData();
          photoFormData.append("image", photo);

          console.log(`📸 Uploading photo ${index + 1}:`, {
            name: photo.name,
            type: photo.type,
            size: photo.size
          });

          const uploadResponse = await fetch("http://localhost:3001/upload", {
            method: "POST",
            body: photoFormData,
          });

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error(`❌ Upload failed for photo ${index + 1}:`, errorText);
            throw new Error(`Failed to upload photo ${photo.name}: ${errorText}`);
          }

          const uploadData = await uploadResponse.json();

          if (!uploadData.success) {
            throw new Error(`Failed to upload photo ${photo.name}`);
          }

          console.log(`✅ Photo ${index + 1} uploaded:`, uploadData.imageUrl);
          return uploadData.imageUrl;
        });

        try {
          uploadedImageUrls = await Promise.all(uploadPromises);
          console.log("✅ All photos uploaded:", uploadedImageUrls);
        } catch (uploadError) {
          console.error("❌ Error during photo upload:", uploadError);
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }
      }

      // Combine existing images with newly uploaded images
      const allImages = [...existingImages, ...uploadedImageUrls];

      // Determine API endpoint and method based on mode
      const endpoint = isEditMode
        ? `http://localhost:3001/roommate/posts/${postId}/update`
        : "http://localhost:3001/roommate/posts/create";
      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userId,
          images: allImages,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || `Failed to ${isEditMode ? 'update' : 'create'} post`);
      }

      console.log(`✅ Roommate post ${isEditMode ? 'updated' : 'created'}:`, data.post);

      // Navigate to post detail or posts list
      navigate(`/roommate/posts/${data.post._id}`);
    } catch (error) {
      console.error(`❌ Error ${isEditMode ? 'updating' : 'creating'} post:`, error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get tomorrow's date for min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  // Show loading while checking verification
  if (checkingVerification) {
    return (
      <>
        <Navbar />
        <div className="roommate-post-form-container">
          <div className="verification-loading">
            <div className="loader"></div>
            <p>Checking identity verification status...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
    <Navbar />
    <div className="roommate-post-form-container">
      <div className="roommate-post-form">
        <h1>{isEditMode ? "Edit Your Roommate Post" : "Find Your Roommate"}</h1>
        <p className="subtitle">
          {isEditMode
            ? "Update your roommate search details"
            : "Post your roommate search and connect with compatible people"
          }
        </p>

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Post Type */}
          <div className="form-section">
            <h3>What are you looking for?</h3>
            <div className="post-type-selector">
              <label className={formData.postType === "SEEKER" ? "active" : ""}>
                <input
                  type="radio"
                  name="postType"
                  value="SEEKER"
                  checked={formData.postType === "SEEKER"}
                  onChange={handleChange}
                />
                <div className="option-card">
                  <span className="icon">🔍</span>
                  <h4>Looking for a Place</h4>
                  <p>I need a room to rent</p>
                </div>
              </label>
              <label className={formData.postType === "PROVIDER" ? "active" : ""}>
                <input
                  type="radio"
                  name="postType"
                  value="PROVIDER"
                  checked={formData.postType === "PROVIDER"}
                  onChange={handleChange}
                />
                <div className="option-card">
                  <span className="icon">🏠</span>
                  <h4>Have a Place</h4>
                  <p>I have a room to share</p>
                </div>
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="form-section">
            <h3>Basic Information</h3>

            <div className="form-group">
              <label>Post Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Looking for a clean and quiet roommate"
                required
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell potential roommates about yourself, your lifestyle, and what you're looking for..."
                required
                rows={6}
                maxLength={1000}
              />
              <small>{formData.description.length}/1000 characters</small>
            </div>

            {/* Photo Upload Section */}
            <div className="form-group">
              <label>Photos (Optional)</label>
              <p className="help-text">Upload photos of yourself or the room (max 5 photos, 5MB each)</p>

              <div className="photo-upload-section">
                <input
                  type="file"
                  id="roommate-photos"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                <div className="photos-grid">
                  {/* Show existing images in edit mode */}
                  {existingImages.map((imageUrl, index) => (
                    <div key={`existing-${index}`} className="photo-preview">
                      <img
                        src={imageUrl}
                        alt={`Existing ${index + 1}`}
                      />
                      <button
                        type="button"
                        className="remove-photo"
                        onClick={() => handleRemoveExistingImage(index)}
                        title="Remove photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Show new photos */}
                  {photos.map((photo, index) => (
                    <div key={`new-${index}`} className="photo-preview">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Preview ${index + 1}`}
                      />
                      <button
                        type="button"
                        className="remove-photo"
                        onClick={() => handleRemovePhoto(index)}
                        title="Remove photo"
                      >
                        ✕
                      </button>
                      <span className="new-badge">New</span>
                    </div>
                  ))}

                  {(existingImages.length + photos.length) < 5 && (
                    <label htmlFor="roommate-photos" className="add-photo-btn">
                      <span className="icon">📷</span>
                      <span className="text">Add Photo</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="form-section">
            <h3>Location</h3>
            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Ho Chi Minh City"
                  required
                />
              </div>
              <div className="form-group">
                <label>Province/State *</label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  placeholder="e.g., Ho Chi Minh"
                  required
                />
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="form-section">
            <h3>Budget (VND/month)</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Minimum Budget *</label>
                <input
                  type="number"
                  name="budgetMin"
                  value={formData.budgetMin}
                  onChange={handleChange}
                  placeholder="1000000"
                  required
                  min={0}
                />
              </div>
              <div className="form-group">
                <label>Maximum Budget *</label>
                <input
                  type="number"
                  name="budgetMax"
                  value={formData.budgetMax}
                  onChange={handleChange}
                  placeholder="3000000"
                  required
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* Move-in Date */}
          <div className="form-section">
            <h3>Timeline</h3>
            <div className="form-group">
              <label>Preferred Move-in Date *</label>
              <input
                type="date"
                name="moveInDate"
                value={formData.moveInDate}
                onChange={handleChange}
                min={minDate}
                required
              />
            </div>
          </div>

          {/* Preferences */}
          <div className="form-section">
            <h3>Preferences</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Gender Preference</label>
                <select
                  name="genderPreference"
                  value={formData.genderPreference}
                  onChange={handleChange}
                >
                  <option value="ANY">No Preference</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div className="form-group">
                <label>Age Range</label>
                <div className="age-range">
                  <input
                    type="number"
                    name="ageRangeMin"
                    value={formData.ageRangeMin}
                    onChange={handleChange}
                    min={18}
                    max={100}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    name="ageRangeMax"
                    value={formData.ageRangeMax}
                    onChange={handleChange}
                    min={18}
                    max={100}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lifestyle */}
          <div className="form-section">
            <h3>Lifestyle</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Sleep Schedule</label>
                <select
                  name="lifestyle.sleepSchedule"
                  value={formData.lifestyle.sleepSchedule}
                  onChange={handleChange}
                >
                  <option value="EARLY_BIRD">Early Bird (before 10 PM)</option>
                  <option value="NIGHT_OWL">Night Owl (after 12 AM)</option>
                  <option value="FLEXIBLE">Flexible</option>
                </select>
              </div>
              <div className="form-group">
                <label>Smoking</label>
                <select
                  name="lifestyle.smoking"
                  value={formData.lifestyle.smoking}
                  onChange={handleChange}
                >
                  <option value="NO">No Smoking</option>
                  <option value="OUTSIDE_ONLY">Outside Only</option>
                  <option value="YES">Yes</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Pets</label>
                <select
                  name="lifestyle.pets"
                  value={formData.lifestyle.pets}
                  onChange={handleChange}
                >
                  <option value="NO">No Pets</option>
                  <option value="NEGOTIABLE">Negotiable</option>
                  <option value="YES">Pets Welcome</option>
                </select>
              </div>
              <div className="form-group">
                <label>Cleanliness</label>
                <select
                  name="lifestyle.cleanliness"
                  value={formData.lifestyle.cleanliness}
                  onChange={handleChange}
                >
                  <option value="VERY_CLEAN">Very Clean</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="RELAXED">Relaxed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Occupation</label>
              <select
                name="lifestyle.occupation"
                value={formData.lifestyle.occupation}
                onChange={handleChange}
              >
                <option value="STUDENT">Student</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="FREELANCER">Freelancer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Contact Preference */}
          <div className="form-section">
            <h3>Contact Preference</h3>
            <div className="form-group">
              <label>How would you like to be contacted?</label>
              <select
                name="preferredContact"
                value={formData.preferredContact}
                onChange={handleChange}
              >
                <option value="CHAT">In-App Chat</option>
                <option value="PHONE">Phone</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>

            {/* Show email input when EMAIL is selected */}
            {formData.preferredContact === "EMAIL" && (
              <div className="form-group contact-detail-box">
                <label>Contact Email *</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  required
                />
                <small className="form-hint">
                  This email will be shown to interested roommates
                </small>
              </div>
            )}

            {/* Show phone input when PHONE is selected */}
            {formData.preferredContact === "PHONE" && (
              <div className="form-group contact-detail-box">
                <label>Contact Phone *</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required
                />
                <small className="form-hint">
                  This phone number will be shown to interested roommates
                </small>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? (isEditMode ? "Updating Post..." : "Creating Post...")
                : (isEditMode ? "Update Post" : "Create Post")
              }
            </button>
          </div>
        </form>
      </div>
    </div>
    <Footer />
    </>
  );
};

export default RoommatePostForm;

