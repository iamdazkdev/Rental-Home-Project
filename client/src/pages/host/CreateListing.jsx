import React from "react";
import "../../styles/CreateListing.scss";
import Navbar from "../../components/Navbar";
import { categories, types, facilities } from "../../data";
import { useState, useEffect } from "react";

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
import { API_ENDPOINTS, HTTP_METHODS, CONFIG } from "../../constants/api";
import { useNavigate, useParams } from "react-router-dom";

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
  // DETECT EDIT MODE
  const { listingId } = useParams();
  const isEditMode = !!listingId;

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
  const [photoWarning, setPhotoWarning] = useState("");
  const [formDescription, setFormDescription] = useState({
    title: "",
    description: "",
    highlight: "",
    highlightDesc: "",
    price: 0,
  });
  // Pricing type for Room/Shared Room
  const [pricingType, setPricingType] = useState("daily"); // "daily" or "monthly"
  const [dailyPrice, setDailyPrice] = useState(0);
  const [monthlyPrice, setMonthlyPrice] = useState(0);
  // Host Profile for Room/Shared Room
  const [hostProfile, setHostProfile] = useState({
    sleepSchedule: "", // early_bird, night_owl, flexible
    smoking: "", // yes, no, outside_only
    personality: "", // introvert, extrovert, ambivert
    cleanliness: "", // very_clean, moderate, relaxed
    occupation: "",
    hobbies: "",
    houseRules: "",
    additionalInfo: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingListing, setLoadingListing] = useState(isEditMode);

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

  // FETCH LISTING DATA IN EDIT MODE
  useEffect(() => {
    if (isEditMode && listingId) {
      const fetchListing = async () => {
        try {
          setLoadingListing(true);
          const url = `${CONFIG.API_BASE_URL}/listing/${listingId}`;
          const response = await fetch(url, { method: HTTP_METHODS.GET });

          if (response.ok) {
            const data = await response.json();
            console.log("📥 Loaded listing for edit:", data);

            // Populate form with existing data
            setCategory(data.category || "");
            setType(data.type || "");
            setFormLocation({
              streetAddress: data.streetAddress || "",
              aptSuite: data.aptSuite || "",
              city: data.city || "",
              province: data.province || "",
              country: data.country || "",
            });
            setGuestCount(data.guestCount || 1);
            setBedroomCount(data.bedroomCount || 1);
            setBedCount(data.bedCount || 1);
            setBathroomCount(data.bathroomCount || 1);
            setAmenities(data.amenities || []);
            setFormDescription({
              title: data.title || "",
              description: data.description || "",
              highlight: data.highlight || "",
              highlightDesc: data.highlightDesc || "",
              price: data.price || 0,
            });

            // Convert existing photos to display format
            if (data.listingPhotoPaths && data.listingPhotoPaths.length > 0) {
              const existingPhotos = data.listingPhotoPaths.map((path, index) => {
                // Construct proper URL for existing photos
                let photoUrl;
                if (path.startsWith("https://")) {
                  // Cloudinary URL - use directly
                  photoUrl = path;
                } else {
                  // Local path - construct URL
                  photoUrl = `${CONFIG.API_BASE_URL}/${path.replace("public/", "")}`;
                }

                return {
                  id: `existing-${index}`,
                  file: null,
                  url: photoUrl, // Use 'url' not 'preview' for compatibility with SortablePhotoItem
                  isExisting: true,
                  originalPath: path, // Keep original path for backend
                };
              });

              console.log("📷 Loaded existing photos:", existingPhotos);
              setPhotos(existingPhotos);
            }
          }
        } catch (error) {
          console.error("❌ Error loading listing:", error);
          alert("Failed to load listing data");
        } finally {
          setLoadingListing(false);
        }
      };

      fetchListing();
    }
  }, [isEditMode, listingId]);

  const handleUploadPhotos = (e) => {
    const newPhotos = Array.from(e.target.files);
    const currentPhotoCount = photos.length;
    const maxPhotos = 6;

    if (currentPhotoCount >= maxPhotos) {
      setPhotoWarning("⚠️ Bạn đã đủ 6 ảnh rồi! Không thể thêm ảnh nữa.");
      setTimeout(() => setPhotoWarning(""), 3000);
      return;
    }

    const availableSlots = maxPhotos - currentPhotoCount;

    if (newPhotos.length > availableSlots) {
      setPhotoWarning(
        `⚠️ Bạn chỉ có thể thêm ${availableSlots} ảnh nữa. Đã chọn ${availableSlots} ảnh đầu tiên.`
      );
      setTimeout(() => setPhotoWarning(""), 4000);
    } else {
      setPhotoWarning("");
    }

    const photosToAdd = newPhotos.slice(0, availableSlots);

    const processedPhotos = photosToAdd.map((photo) => ({
      id: `photo-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(photo),
      file: photo,
    }));

    setPhotos((prev) => [...prev, ...processedPhotos]);

    e.target.value = "";
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

  const handleHostProfileChange = (e) => {
    const { name, value } = e.target;
    setHostProfile({
      ...hostProfile,
      [name]: value,
    });
  };

  // Handle pricing changes with auto-conversion
  const handleDailyPriceChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setDailyPrice(value);
    setMonthlyPrice(Math.round(value * 30)); // Auto-calculate monthly price
  };

  const handleMonthlyPriceChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setMonthlyPrice(value);
    setDailyPrice(Math.round((value / 30) * 100) / 100); // Auto-calculate daily price (rounded to 2 decimals)
  };

  // Check if host profile is required
  const requiresHostProfile = type === "Room(s)" || type === "A Shared Room";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!category) {
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

      // Validate host profile for Room/Shared Room
      if (requiresHostProfile) {
        if (!hostProfile.sleepSchedule || !hostProfile.smoking || !hostProfile.personality ||
            !hostProfile.cleanliness || !hostProfile.occupation || !hostProfile.hobbies ||
            !hostProfile.houseRules) {
          alert("Please fill in all required host profile fields");
          setIsLoading(false);
          return;
        }
        if (dailyPrice <= 0) {
          alert("Please enter a valid price");
          setIsLoading(false);
          return;
        }
      }

      if (isEditMode) {
        // UPDATE EXISTING LISTING
        const updateData = {
          category,
          type,
          streetAddress: formLocation.streetAddress,
          aptSuite: formLocation.aptSuite,
          city: formLocation.city,
          province: formLocation.province,
          country: formLocation.country,
          guestCount,
          bedroomCount,
          bedCount,
          bathroomCount,
          amenities,
          title: formDescription.title,
          description: formDescription.description,
          highlight: formDescription.highlight,
          highlightDesc: formDescription.highlightDesc,
          price: formDescription.price,
          // Keep existing photos that weren't changed
          listingPhotoPaths: photos.map(p => p.isExisting ? p.originalPath : p.url),
        };

        const url = `${CONFIG.API_BASE_URL}/properties/${listingId}/update`;
        const response = await fetch(url, {
          method: HTTP_METHODS.PATCH,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          console.log("✅ Listing updated successfully");
          navigate("/properties");
        } else {
          const errorData = await response.text();
          throw new Error(`Update failed: ${errorData}`);
        }
      } else {
        // CREATE NEW LISTING
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

        // Add pricing based on type
        if (requiresHostProfile) {
          // Room/Shared Room: Use daily price (will be stored as main price)
          listingForm.append("price", dailyPrice);
          listingForm.append("monthlyPrice", monthlyPrice);
          listingForm.append("pricingType", pricingType);
          // Add host profile
          listingForm.append("hostProfile", JSON.stringify(hostProfile));
          console.log("📋 Sending host profile:", hostProfile);
        } else {
          // Entire Place: Use regular price
          listingForm.append("price", formDescription.price);
        }

        photos.forEach((photo) => {
          if (photo.file) {
            listingForm.append("listingPhotos", photo.file);
          }
        });

        const response = await fetch(API_ENDPOINTS.LISTINGS.CREATE, {
          method: HTTP_METHODS.POST,
          body: listingForm,
        });

        if (response.ok) {
          console.log("✅ Listing created successfully");
          setTimeout(() => {
            navigate("/");
          }, 500);
        } else {
          const errorData = await response.text();
          throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
        }
      }
    } catch (error) {
      console.error("❌ Error submitting listing:", error);
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
      {loadingListing ? (
        <div className="modern-create-listing">
          <div className="form-background">
            <div className="form-container" style={{ textAlign: 'center', padding: '60px' }}>
              <h2>Loading listing data...</h2>
            </div>
          </div>
        </div>
      ) : (
        <div className="modern-create-listing">
          {/* Form Container */}
          <div className="form-background">
            <div className="form-container">
              {/* Header */}
              <div className="header-section">
                <h1>{isEditMode ? "✏️ Edit Your Listing" : "✨ Create Your Dream Listing"}</h1>
                <p>{isEditMode ? "Update your property details" : "Share your space with the world"}</p>
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
                    disabled={photos.length >= 6}
                  />
                  <label
                    htmlFor="image"
                    className={`upload-button ${
                      photos.length >= 6 ? "disabled" : ""
                    }`}
                  >
                    <span className="upload-icon">📤</span>
                    {photos.length >= 6
                      ? "Đã đủ 6 ảnh"
                      : `Upload Photos (${photos.length}/6)`}
                  </label>

                  {photos.length > 0 && (
                    <div className="photo-count">
                      {photos.length} ảnh đã upload{" "}
                      {photos.length < 6 &&
                        `- Bạn có thể thêm ${6 - photos.length} ảnh nữa`}
                      {photos.length === 6 && " - Đã đạt giới hạn tối đa"}
                    </div>
                  )}

                  {/* Warning Message */}
                  {photoWarning && (
                    <div className="photo-warning">{photoWarning}</div>
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

                    {/* Pricing Section - Different for Room/Shared Room */}
                    {requiresHostProfile ? (
                      // Room/Shared Room: Dual pricing
                      <div className="full-width form-group dual-pricing-group">
                        <label>💰 Set your pricing</label>
                        <p className="pricing-hint">Choose your preferred pricing method. The other will be calculated automatically.</p>

                        <div className="pricing-tabs">
                          <button
                            type="button"
                            className={`pricing-tab ${pricingType === "daily" ? "active" : ""}`}
                            onClick={() => setPricingType("daily")}
                          >
                            📅 Daily Price
                          </button>
                          <button
                            type="button"
                            className={`pricing-tab ${pricingType === "monthly" ? "active" : ""}`}
                            onClick={() => setPricingType("monthly")}
                          >
                            📆 Monthly Price
                          </button>
                        </div>

                        <div className="dual-price-inputs">
                          <div className="price-input-box">
                            <label className={pricingType === "daily" ? "primary" : "secondary"}>
                              💵 Daily Rate
                            </label>
                            <div className="price-input-wrapper">
                              <span className="currency">$</span>
                              <input
                                type="number"
                                placeholder="50"
                                value={dailyPrice || ""}
                                onChange={handleDailyPriceChange}
                                required
                                min="1"
                                step="0.01"
                              />
                              <span className="per-unit">/night</span>
                            </div>
                            {pricingType === "daily" && (
                              <p className="price-note">✨ Primary pricing</p>
                            )}
                          </div>

                          <div className="price-arrow">⇄</div>

                          <div className="price-input-box">
                            <label className={pricingType === "monthly" ? "primary" : "secondary"}>
                              💰 Monthly Rate
                            </label>
                            <div className="price-input-wrapper">
                              <span className="currency">$</span>
                              <input
                                type="number"
                                placeholder="1500"
                                value={monthlyPrice || ""}
                                onChange={handleMonthlyPriceChange}
                                required
                                min="1"
                              />
                              <span className="per-unit">/month</span>
                            </div>
                            {pricingType === "monthly" && (
                              <p className="price-note">✨ Primary pricing</p>
                            )}
                          </div>
                        </div>

                        <div className="pricing-info">
                          ℹ️ {pricingType === "daily"
                            ? "Monthly price is automatically calculated (Daily × 30 days)"
                            : "Daily price is automatically calculated (Monthly ÷ 30 days)"}
                        </div>
                      </div>
                    ) : (
                      // Entire Place: Single pricing
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
                    )}
                  </div>
                </div>
              </div>

              {/* Step 7: Host Profile (for Room/Shared Room only) */}
              {requiresHostProfile && (
                <div className="step-section host-profile-section">
                  <div className="step-header">
                    <div className="step-number">7</div>
                    <div>
                      <h2>👤 Tell guests about yourself</h2>
                      <p className="step-subtitle">
                        Help guests understand who they'll be living with
                      </p>
                    </div>
                  </div>

                  <div className="host-profile-grid">
                    {/* Sleep Schedule */}
                    <div className="form-group">
                      <label>🌙 Sleep Schedule</label>
                      <select
                        name="sleepSchedule"
                        value={hostProfile.sleepSchedule}
                        onChange={handleHostProfileChange}
                        required
                      >
                        <option value="">Select your schedule</option>
                        <option value="early_bird">Early Bird (Sleep before 10 PM)</option>
                        <option value="night_owl">Night Owl (Sleep after midnight)</option>
                        <option value="flexible">Flexible</option>
                      </select>
                    </div>

                    {/* Smoking */}
                    <div className="form-group">
                      <label>🚬 Smoking</label>
                      <select
                        name="smoking"
                        value={hostProfile.smoking}
                        onChange={handleHostProfileChange}
                        required
                      >
                        <option value="">Select option</option>
                        <option value="no">Non-smoker</option>
                        <option value="outside_only">Smoke outside only</option>
                        <option value="yes">Smoker</option>
                      </select>
                    </div>

                    {/* Personality */}
                    <div className="form-group">
                      <label>😊 Personality</label>
                      <select
                        name="personality"
                        value={hostProfile.personality}
                        onChange={handleHostProfileChange}
                        required
                      >
                        <option value="">Select personality</option>
                        <option value="introvert">Introvert (Quiet, private)</option>
                        <option value="extrovert">Extrovert (Social, outgoing)</option>
                        <option value="ambivert">Ambivert (Balanced)</option>
                      </select>
                    </div>

                    {/* Cleanliness */}
                    <div className="form-group">
                      <label>🧹 Cleanliness Level</label>
                      <select
                        name="cleanliness"
                        value={hostProfile.cleanliness}
                        onChange={handleHostProfileChange}
                        required
                      >
                        <option value="">Select level</option>
                        <option value="very_clean">Very Clean (Everything organized)</option>
                        <option value="moderate">Moderate (Tidy but lived-in)</option>
                        <option value="relaxed">Relaxed (Clean but casual)</option>
                      </select>
                    </div>

                    {/* Occupation */}
                    <div className="full-width form-group">
                      <label>💼 Occupation</label>
                      <input
                        type="text"
                        name="occupation"
                        placeholder="e.g., Software Engineer, Student, Freelancer"
                        value={hostProfile.occupation}
                        onChange={handleHostProfileChange}
                        required
                      />
                    </div>


                    {/* Hobbies */}
                    <div className="full-width form-group">
                      <label>🎨 Hobbies & Interests</label>
                      <textarea
                        name="hobbies"
                        placeholder="Tell us about your hobbies, interests, and what you like to do in your free time"
                        value={hostProfile.hobbies}
                        onChange={handleHostProfileChange}
                        rows="3"
                        required
                      />
                    </div>

                    {/* House Rules */}
                    <div className="full-width form-group">
                      <label>📋 House Rules</label>
                      <textarea
                        name="houseRules"
                        placeholder="e.g., No loud music after 10 PM, Clean up after yourself, etc."
                        value={hostProfile.houseRules}
                        onChange={handleHostProfileChange}
                        rows="4"
                        required
                      />
                    </div>

                    {/* Additional Info */}
                    <div className="full-width form-group">
                      <label>💬 Additional Information (Optional)</label>
                      <textarea
                        name="additionalInfo"
                        placeholder="Anything else guests should know about you or your home?"
                        value={hostProfile.additionalInfo}
                        onChange={handleHostProfileChange}
                        rows="3"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                      <span>{isEditMode ? "Updating..." : "Creating Your Dream Listing..."}</span>
                    </>
                  ) : (
                    <>{isEditMode ? "💾 UPDATE LISTING" : "✨ CREATE YOUR DREAM LISTING"}</>
                  )}
                </button>
                <p className={`note ${isLoading ? "loading" : ""}`}>
                  {isLoading
                    ? `🚀 Almost there! Your listing is being ${isEditMode ? "updated" : "created"}...`
                    : `🎉 Ready to ${isEditMode ? "update" : "share"} your space with the world!`}
                </p>
              </div>
            </form>
          </div>
        </div>
        </div>
      )}
    </>
  );
};

export default CreateListingPage;
