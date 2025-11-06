import React from "react";
import "../../styles/CreateListing.scss";
import Navbar from "../../components/Navbar";
import { categories, types, facilities } from "../../data";
import { useState } from "react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSelector } from "react-redux";
import { API_ENDPOINTS, HTTP_METHODS } from "../../constants";
import { useNavigate } from "react-router-dom";

// Simple and Beautiful Photo Item Component
const SortablePhotoItem = ({ id, photo, index, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className={`photo-card ${isDragging ? "dragging" : ""} ${
        index === 0 ? "featured" : ""
      }`}
      ref={setNodeRef}
      style={style}
    >
      <div className="photo-wrapper">
        <img src={photo.url} alt={`Listing ${index + 1}`} />

        {/* Top Controls */}
        <div className="photo-controls-top">
          <span className="photo-number">{index + 1}</span>
          <button
            className="delete-btn"
            onClick={() => onDelete(index)}
            title="Remove photo"
          >
            ×
          </button>
        </div>

        {/* Drag Handle */}
        <button
          className="drag-handle"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
        >
          <span className="drag-dots">⋮⋮</span>
        </button>

        {/* Featured Badge */}
        {index === 0 && <div className="featured-badge">⭐ Cover Photo</div>}
      </div>
    </div>
  );
};

const CreateListingPage = () => {
  // FORM STATE
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [formLocation, setFormLocation] = useState({
    streetAddress: "",
    aptSuite: "",
    city: "",
    province: "",
    country: "",
  });
  const [guestCount, setGuestCount] = useState(1);
  const [bedroomCount, setBedroomCount] = useState(1);
  const [bedCount, setBedCount] = useState(1);
  const [bathroomCount, setBathroomCount] = useState(1);
  const [amenities, setAmenities] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [formDescription, setFormDescription] = useState({
    title: "",
    description: "",
    highlight: "",
    highlightDesc: "",
    price: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // REDUX STATE
  const user = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const creatorId = user?.id || user?._id;
  const navigate = useNavigate();

  // DRAG AND DROP
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = photos.findIndex((photo) => photo.id === active.id);
      const newIndex = photos.findIndex((photo) => photo.id === over.id);
      setPhotos((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  // EVENT HANDLERS
  const handleChangeLocation = (e) => {
    const { name, value } = e.target;
    setFormLocation({
      ...formLocation,
      [name]: value,
    });
  };

  const handleSelectAmenities = (facility) => {
    if (amenities.includes(facility)) {
      setAmenities((prevAmenities) =>
        prevAmenities.filter((option) => option !== facility)
      );
    } else {
      setAmenities((prev) => [...prev, facility]);
    }
  };

  const handleUploadPhotos = (e) => {
    const newPhotos = e.target.files;
    Array.from(newPhotos).forEach((photo) => {
      if (photos.length < 5) {
        // Create URL for preview and store the actual file
        const previewUrl = URL.createObjectURL(photo);
        setPhotos((prev) => [
          ...prev,
          {
            id: `photo-${Date.now()}-${Math.random()}`,
            url: previewUrl,
            file: photo, // Store the actual file for upload
          },
        ]);
      }
    });
  };

  const handleDeletePhoto = (photoIndex) => {
    setPhotos((prevPhotos) => {
      const photoToDelete = prevPhotos[photoIndex];
      if (photoToDelete && photoToDelete.url) {
        // Clean up the object URL to prevent memory leaks
        URL.revokeObjectURL(photoToDelete.url);
      }
      return prevPhotos.filter((_, index) => index !== photoIndex);
    });
  };

  const handleChangeDescription = (e) => {
    const { name, value } = e.target;
    setFormDescription({
      ...formDescription,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!category || category === "All") {
        alert("Please select a category");
        setIsLoading(false);
        return;
      }
      if (!type) {
        alert("Please select a property type");
        setIsLoading(false);
        return;
      }
      if (photos.length === 0) {
        alert("Please upload at least one photo");
        setIsLoading(false);
        return;
      }

      const listingForm = new FormData();
      listingForm.append("creator", creatorId);
      listingForm.append("category", category);
      listingForm.append("type", type);
      listingForm.append("streetAddress", formLocation.streetAddress);
      listingForm.append("aptSuite", formLocation.aptSuite);
      listingForm.append("city", formLocation.city);
      listingForm.append("province", formLocation.province);
      listingForm.append("country", formLocation.country);
      listingForm.append("guestCount", guestCount);
      listingForm.append("bedroomCount", bedroomCount);
      listingForm.append("bedCount", bedCount);
      listingForm.append("bathroomCount", bathroomCount);
      listingForm.append("amenities", JSON.stringify(amenities));
      listingForm.append("title", formDescription.title);
      listingForm.append("description", formDescription.description);
      listingForm.append("highlight", formDescription.highlight);
      listingForm.append("highlightDesc", formDescription.highlightDesc);
      listingForm.append("price", formDescription.price);

      photos.forEach((photo) => {
        if (photo.file) {
          listingForm.append("listingPhotos", photo.file);
        }
      });

      // Debug log
      console.log("Form data being sent:");
      for (let [key, value] of listingForm.entries()) {
        console.log(key, value);
      }

      const response = await fetch(API_ENDPOINTS.LISTINGS.CREATE, {
        method: HTTP_METHODS.POST,
        body: listingForm,
      });

      if (response.ok) {
        console.log("Listing created successfully");
        // Small delay to show success state
        setTimeout(() => {
          navigate("/");
        }, 500);
      } else {
        // Get error details from server
        const errorData = await response.text();
        console.error("Server error:", errorData);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorData}`
        );
      }
    } catch (error) {
      console.error("Error creating listing:", error);
      // Show more detailed error message
      const errorMessage = error.message.includes("HTTP error")
        ? `Server error: ${error.message}`
        : "Network error. Please check your connection and try again.";
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="modern-create-listing">
        {/* Debug Panel */}
        <div className="debug-panel">
          <h4>🚀 Create Listing Dashboard</h4>
          <div className="grid-info">
            <div>
              <strong>👤 User:</strong>{" "}
              {user ? `${user.firstName} ${user.lastName}` : "Not logged in"}
            </div>
            <div>
              <strong>🔑 Token:</strong> {token ? "✅ Active" : "❌ Missing"}
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <strong>🆔 Creator ID:</strong> {creatorId || "undefined"}
            </div>
            <div className="status-info">
              <strong>
                {creatorId
                  ? "✅ Ready to create listing!"
                  : "❌ Please login first"}
              </strong>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="form-background">
          <div className="form-container">
            {/* Header */}
            <div className="header-section">
              <h1>✨ Create Your Dream Listing</h1>
              <p>Share your space with the world</p>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="form-content">
              {/* Step 1: Property Details */}
              <div className="step-section">
                <div className="step-header">
                  <div className="step-number">1</div>
                  <h2>🏠 Tell us about your place</h2>
                </div>

                {/* Categories */}
                <div style={{ marginBottom: "40px" }}>
                  <h3 className="section-title">
                    Which category best describes your place?
                  </h3>
                  <div className="categories-grid">
                    {categories?.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => setCategory(item.label)}
                        className={`category-item ${
                          category === item.label ? "selected" : ""
                        }`}
                      >
                        <div className="icon">{item.icon}</div>
                        <div className="content">
                          <h4>{item.label}</h4>
                          <p>
                            {item.description || "Perfect for your listing"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Property Types */}
                <div style={{ marginBottom: "40px" }}>
                  <h3 className="section-title">
                    What type of place will guests have?
                  </h3>
                  <div className="types-grid">
                    {types?.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => setType(item.name)}
                        className={`type-item ${
                          type === item.name ? "selected" : ""
                        }`}
                      >
                        <div className="icon">{item.icon}</div>
                        <h4>{item.name}</h4>
                        <p>{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2: Location */}
              <div className="step-section">
                <div className="step-header">
                  <div className="step-number">2</div>
                  <h2>📍 Where's your place located?</h2>
                </div>

                <div className="location-grid">
                  <div className="full-width form-group">
                    <label>🏠 Street Address</label>
                    <input
                      type="text"
                      placeholder="Enter your street address"
                      name="streetAddress"
                      value={formLocation.streetAddress}
                      onChange={handleChangeLocation}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>🏢 Apartment, Suite (Optional)</label>
                    <input
                      type="text"
                      placeholder="Apt, Suite, etc."
                      name="aptSuite"
                      value={formLocation.aptSuite}
                      onChange={handleChangeLocation}
                    />
                  </div>

                  <div className="form-group">
                    <label>🏙️ City</label>
                    <input
                      type="text"
                      placeholder="Enter city"
                      name="city"
                      value={formLocation.city}
                      onChange={handleChangeLocation}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>🗺️ Province/State</label>
                    <input
                      type="text"
                      placeholder="Enter province/state"
                      name="province"
                      value={formLocation.province}
                      onChange={handleChangeLocation}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>🌍 Country</label>
                    <input
                      type="text"
                      placeholder="Enter country"
                      name="country"
                      value={formLocation.country}
                      onChange={handleChangeLocation}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Basic Info */}
              <div className="step-section">
                <div className="step-header">
                  <div className="step-number">3</div>
                  <h2>📊 Share some basics about your place</h2>
                </div>

                <div className="basics-grid">
                  {[
                    {
                      label: "👥 Guests",
                      value: guestCount,
                      setter: setGuestCount,
                    },
                    {
                      label: "🛏️ Bedrooms",
                      value: bedroomCount,
                      setter: setBedroomCount,
                    },
                    {
                      label: "🚿 Bathrooms",
                      value: bathroomCount,
                      setter: setBathroomCount,
                    },
                    { label: "🛌 Beds", value: bedCount, setter: setBedCount },
                  ].map((item, index) => (
                    <div key={index} className="basic-item">
                      <div className="label">{item.label}</div>
                      <div className="counter">
                        <button
                          type="button"
                          onClick={() =>
                            item.setter(Math.max(1, item.value - 1))
                          }
                        >
                          -
                        </button>
                        <span className="count">{item.value}</span>
                        <button
                          type="button"
                          onClick={() => item.setter(item.value + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 4: Amenities */}
              <div className="step-section">
                <div className="step-header">
                  <div className="step-number">4</div>
                  <h2>✨ Tell guests what your place has to offer</h2>
                </div>

                <div className="amenities-grid">
                  {facilities?.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectAmenities(item.name)}
                      className={`amenity-item ${
                        amenities.includes(item.name) ? "selected" : ""
                      }`}
                    >
                      <div className="icon">{item.icon}</div>
                      <span className="name">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 5: Photos */}
              <div className="step-section">
                <div className="step-header">
                  <div className="step-number">5</div>
                  <h2>📸 Show off your space with photos</h2>
                </div>

                <div className="photo-section">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="photo-gallery">
                      {photos.length === 0 ? (
                        <div className="upload-placeholder">
                          <div className="upload-icon">📸</div>
                          <div className="upload-text">
                            Upload your property photos
                          </div>
                          <div className="upload-hint">
                            Drag photos here or click below to browse
                          </div>
                        </div>
                      ) : (
                        <SortableContext
                          items={photos.map((photo) => photo.id)}
                          strategy={horizontalListSortingStrategy}
                        >
                          {/* Featured Photo (First) */}
                          {photos.length > 0 && (
                            <SortablePhotoItem
                              key={photos[0].id}
                              id={photos[0].id}
                              photo={photos[0]}
                              index={0}
                              onDelete={handleDeletePhoto}
                            />
                          )}

                          {/* Remaining Photos Grid */}
                          {photos.length > 1 && (
                            <div className="photos-grid">
                              {photos.slice(1).map((photo, index) => (
                                <SortablePhotoItem
                                  key={photo.id}
                                  id={photo.id}
                                  photo={photo}
                                  index={index + 1}
                                  onDelete={handleDeletePhoto}
                                />
                              ))}
                            </div>
                          )}
                        </SortableContext>
                      )}
                    </div>
                  </DndContext>

                  <input
                    id="image"
                    type="file"
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={handleUploadPhotos}
                    multiple
                  />
                  <label htmlFor="image" className="upload-button">
                    <span className="upload-icon">📤</span>
                    Upload Photos ({photos.length}/5)
                  </label>

                  {photos.length > 0 && (
                    <div className="photo-count">
                      {photos.length} photo{photos.length !== 1 ? "s" : ""}{" "}
                      uploaded.
                      {photos.length < 5 &&
                        ` You can add ${5 - photos.length} more.`}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 6: Description */}
              <div className="step-section">
                <div className="step-header">
                  <div className="step-number">6</div>
                  <h2>📝 Create your description</h2>
                </div>

                <div className="description-section">
                  <div className="description-grid">
                    <div className="full-width form-group">
                      <label>📋 Title</label>
                      <input
                        type="text"
                        placeholder="Give your listing a catchy title"
                        name="title"
                        value={formDescription.title}
                        onChange={handleChangeDescription}
                        required
                      />
                    </div>

                    <div className="full-width form-group">
                      <label>📖 Description</label>
                      <textarea
                        placeholder="Describe your space in detail"
                        name="description"
                        value={formDescription.description}
                        onChange={handleChangeDescription}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>⭐ Highlight</label>
                      <input
                        type="text"
                        placeholder="What makes your place special?"
                        name="highlight"
                        value={formDescription.highlight}
                        onChange={handleChangeDescription}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>💫 Highlight Details</label>
                      <input
                        type="text"
                        placeholder="Tell us more about the highlight"
                        name="highlightDesc"
                        value={formDescription.highlightDesc}
                        onChange={handleChangeDescription}
                        required
                      />
                    </div>

                    <div className="full-width form-group price-group">
                      <label>💰 Set your price per night</label>
                      <div className="price-input-wrapper">
                        <span className="currency">$</span>
                        <input
                          type="number"
                          placeholder="100"
                          name="price"
                          value={formDescription.price}
                          onChange={handleChangeDescription}
                          required
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Section */}
              <div className={`submit-section ${isLoading ? "loading" : ""}`}>
                <button
                  type="submit"
                  className={`submit-button ${isLoading ? "loading" : ""}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Creating Your Dream Listing...</span>
                    </>
                  ) : (
                    <>✨ CREATE YOUR DREAM LISTING</>
                  )}
                </button>
                <p className={`note ${isLoading ? "loading" : ""}`}>
                  {isLoading
                    ? "🚀 Almost there! Your listing is being created..."
                    : "🎉 Ready to share your space with the world!"}
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateListingPage;
