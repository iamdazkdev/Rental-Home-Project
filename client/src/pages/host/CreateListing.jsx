import React from "react";
import "../../styles/CreateListing.scss";
import Navbar from "../../components/Navbar";
import IdentityVerificationForm from "../../components/IdentityVerificationForm";
// Removed static imports - will fetch from API
import { useState, useEffect } from "react";
import { getIcon } from "../../utils/iconMapper";

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

  // STATIC DATA FROM API
  const [categories, setCategories] = useState([]);
  const [types, setTypes] = useState([]);
  const [facilities, setFacilities] = useState([]);

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

  // REDUX STATE - moved up before hostBio
  const user = useSelector((state) => state.user);
  const creatorId = user?.id || user?._id;
  const navigate = useNavigate();

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
  // Host Bio - stored in User model for display on Room/Shared Room listings
  const [hostBio, setHostBio] = useState(user?.hostBio || "");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingListing, setLoadingListing] = useState(isEditMode);

  // Type selection modal - only show in create mode
  const [showTypeModal, setShowTypeModal] = useState(!isEditMode);

  // Identity Verification (for Shared Room & Roommate)
  const [verificationStatus, setVerificationStatus] = useState(null); // null, pending, approved, rejected
  const [verificationData, setVerificationData] = useState(null);
  const [loadingVerification, setLoadingVerification] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);

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

  // FETCH STATIC DATA FROM API ON MOUNT
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const url = `${CONFIG.API_BASE_URL}/static-data/all`;
        const response = await fetch(url, { method: HTTP_METHODS.GET });

        if (response.ok) {
          const data = await response.json();
          console.log("📦 Loaded static data from API:", data);

          // Transform data to include icon components
          const transformedCategories = data.categories.map(cat => ({
            ...cat,
            icon: getIcon(cat.icon)
          }));

          const transformedTypes = data.types.map(type => ({
            ...type,
            icon: getIcon(type.icon)
          }));

          const transformedFacilities = data.facilities.map(facility => ({
            ...facility,
            icon: getIcon(facility.icon)
          }));

          setCategories(transformedCategories);
          setTypes(transformedTypes);
          setFacilities(transformedFacilities);
        } else {
          console.error("❌ Failed to fetch static data");
          alert("Failed to load categories, types, and facilities. Please refresh.");
        }
      } catch (error) {
        console.error("❌ Error fetching static data:", error);
        alert("Failed to connect to server. Please check your connection.");
      }
    };

    fetchStaticData();
  }, []); // Run once on mount

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

  // Handle type selection from modal
  const handleTypeSelection = (selectedType) => {
    console.log("🎯 Type selected:", selectedType);
    setType(selectedType);
    setShowTypeModal(false);

    // Check if verification is required for Shared Room and Roommate
    const requiresVerification =
      selectedType === "Room(s)" ||        // Shared Room (living with host)
      selectedType === "A Shared Room";    // Roommate (finding roommates)

    console.log("🔐 Requires verification?", requiresVerification);

    if (requiresVerification && !isEditMode) {
      console.log("✅ Checking verification status...");
      checkVerificationStatus();
    }
  };

  // Check verification status
  const checkVerificationStatus = async () => {
    if (!creatorId) {
      console.log("❌ No creatorId found");
      return;
    }

    console.log("🔍 Checking verification for user:", creatorId);
    setLoadingVerification(true);
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/identity-verification/${creatorId}/status`,
        { method: HTTP_METHODS.GET }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("📥 Verification status response:", data);

        if (data.exists) {
          setVerificationStatus(data.status);
          setVerificationData(data.verification);
          console.log("✅ Verification exists, status:", data.status);

          // Show form if not approved (pending, rejected, or null)
          if (data.status !== "approved") {
            setShowVerificationForm(true);
            console.log("🚨 Verification not approved, showing fullscreen form");
          }
        } else {
          setVerificationStatus(null);
          setShowVerificationForm(true); // Show form if no verification exists
          console.log("📝 No verification found, showing form");
        }
      } else {
        console.log("❌ API response not OK:", response.status);
        // On error, show form to be safe
        setShowVerificationForm(true);
      }
    } catch (error) {
      console.error("❌ Error checking verification:", error);
      // On error, show form to be safe
      setShowVerificationForm(true);
    } finally {
      setLoadingVerification(false);
    }
  };

  // Handle verification form success
  const handleVerificationSuccess = () => {
    setShowVerificationForm(false);
    checkVerificationStatus(); // Refresh status
  };

  // Check if host profile is required
  const requiresHostProfile = type === "Room(s)" || type === "A Shared Room";

  // Determine if this is a Room Rental (monthly-based) vs Entire Place Rental (nightly-based)
  const isRoomRental = type === "Room(s)"; // Shared living, monthly rent
  const isEntirePlaceRental = type === "An Entire Place"; // Full property, nightly booking
  const isRoommateMatching = type === "A Shared Room"; // Roommate finding (future feature)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Common validation
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

      // Validate host profile for Room Rental/Roommate Matching
      if (requiresHostProfile) {
        // Check verification status first
        if (verificationStatus !== "approved") {
          alert(
            verificationStatus === "pending"
              ? "Please wait for identity verification approval before publishing."
              : verificationStatus === "rejected"
              ? "Your verification was rejected. Please resubmit with correct information."
              : "Please complete identity verification before creating a listing."
          );
          setIsLoading(false);
          return;
        }

        if (!hostBio.trim()) {
          alert("Please tell guests about yourself");
          setIsLoading(false);
          return;
        }
        if (!hostProfile.sleepSchedule || !hostProfile.smoking || !hostProfile.personality ||
            !hostProfile.cleanliness || !hostProfile.occupation || !hostProfile.hobbies ||
            !hostProfile.houseRules) {
          alert("Please fill in all required host profile fields");
          setIsLoading(false);
          return;
        }
        if (dailyPrice <= 0 || monthlyPrice <= 0) {
          alert("Please enter valid daily and monthly prices");
          setIsLoading(false);
          return;
        }
      } else {
        // Entire Place validation
        if (formDescription.price <= 0) {
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

        // PROCESS 1: ENTIRE PLACE RENTAL (Nightly booking)
        if (isEntirePlaceRental) {
          console.log("🏠 Creating Entire Place Rental listing...");

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

          const response = await fetch(API_ENDPOINTS.LISTINGS.CREATE, {
            method: HTTP_METHODS.POST,
            body: listingForm,
          });

          if (response.ok) {
            console.log("✅ Entire Place listing created successfully");
            alert("🎉 Your property has been listed successfully!");
            navigate("/properties");
          } else {
            const errorData = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
          }
        }

        // PROCESS 2: ROOM RENTAL (Monthly rental with host profile)
        else if (isRoomRental) {
          console.log("🚪 Creating Room Rental listing...");

          const roomData = new FormData();

          // Basic info
          roomData.append("hostId", creatorId);
          roomData.append("category", category);
          roomData.append("type", type);

          // Location
          roomData.append("streetAddress", formLocation.streetAddress);
          roomData.append("aptSuite", formLocation.aptSuite);
          roomData.append("city", formLocation.city);
          roomData.append("province", formLocation.province);
          roomData.append("country", formLocation.country);

          // Room details
          roomData.append("maxOccupancy", guestCount);
          roomData.append("amenities", JSON.stringify(amenities));

          // Description
          roomData.append("title", formDescription.title);
          roomData.append("description", formDescription.description);

          // Pricing - Room Rental uses MONTHLY rent as primary
          roomData.append("monthlyRent", monthlyPrice);
          roomData.append("depositAmount", monthlyPrice); // Default: 1 month deposit

          // Host Profile
          roomData.append("hostBio", hostBio);
          roomData.append("hostProfile", JSON.stringify(hostProfile));

          // Photos
          photos.forEach((photo) => {
            if (photo.file) {
              roomData.append("roomPhotos", photo.file);
            }
          });

          console.log("📤 Sending Room Rental data to API...");

          const response = await fetch(`${CONFIG.API_BASE_URL}/room-rental/rooms/create`, {
            method: HTTP_METHODS.POST,
            body: roomData,
          });

          if (response.ok) {
            const data = await response.json();
            console.log("✅ Room Rental created successfully:", data);

            // Save host bio to user profile
            if (hostBio.trim()) {
              try {
                console.log("💾 Saving host bio to user profile...");
                const userUpdateForm = new FormData();
                userUpdateForm.append('hostBio', hostBio);

                const userResponse = await fetch(`${CONFIG.API_BASE_URL}/user/${creatorId}/profile`, {
                  method: 'PATCH',
                  body: userUpdateForm,
                });

                if (userResponse.ok) {
                  console.log("✅ Host bio saved successfully");
                }
              } catch (error) {
                console.warn("⚠️ Error saving host bio:", error);
              }
            }

            alert("🎉 Your room has been listed successfully!");
            navigate("/properties");
          } else {
            const errorText = await response.text();
            console.error("❌ Room Rental creation failed:", errorText);
            throw new Error(`Failed to create room rental: ${errorText}`);
          }
        }

        // PROCESS 3: ROOMMATE MATCHING (Future feature)
        else if (isRoommateMatching) {
          alert("🚧 Roommate matching feature is coming soon!");
          setIsLoading(false);
          return;
        }

        else {
          throw new Error("Invalid property type selected");
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

      {/* Type Selection Modal - Full Screen, Mandatory */}
      {showTypeModal && (
        <div className="type-selection-modal-overlay">
          <div className="type-selection-modal">
            <div className="modal-header">
              <h1>🏠 Choose Your Property Type</h1>
              <p className="modal-subtitle">Select what type of place guests will have access to</p>
            </div>

            <div className="type-selection-grid">
              {types?.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleTypeSelection(item.name)}
                  className="type-selection-card"
                >
                  <div className="type-icon-large">{item.icon}</div>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className="select-button">Select →</div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <p>💡 You must select a type to continue</p>
            </div>
          </div>
        </div>
      )}

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

              {/* Identity Verification Section (for Shared Room/Roommate) */}
              {requiresHostProfile && !isEditMode && (
                <>
                  {loadingVerification ? (
                    <div className="verification-status-banner pending">
                      <div className="status-icon">⏳</div>
                      <div className="status-content">
                        <h3>Checking verification status...</h3>
                      </div>
                    </div>
                  ) : verificationStatus === "pending" ? (
                    <div className="verification-status-banner pending">
                      <div className="status-icon">⏳</div>
                      <div className="status-content">
                        <h3>Verification Pending</h3>
                        <p>
                          Your identity verification is under review. We'll notify you once it's approved.
                          This usually takes 1-2 business days.
                        </p>
                        <p style={{ marginTop: '0.75rem', fontWeight: 600 }}>
                          You can continue filling out the form, but you won't be able to publish
                          until verification is approved.
                        </p>
                      </div>
                    </div>
                  ) : verificationStatus === "approved" ? (
                    <div className="verification-status-banner approved">
                      <div className="status-icon">✅</div>
                      <div className="status-content">
                        <h3>Identity Verified</h3>
                        <p>Your identity has been verified. You can now create listings!</p>
                      </div>
                    </div>
                  ) : verificationStatus === "rejected" ? (
                    <div className="verification-status-banner rejected">
                      <div className="status-icon">❌</div>
                      <div className="status-content">
                        <h3>Verification Rejected</h3>
                        <p>
                          Unfortunately, your verification was rejected. Please review the reason below
                          and resubmit with correct information.
                        </p>
                        {verificationData?.rejectionReason && (
                          <div className="rejection-reason">
                            Reason: {verificationData.rejectionReason}
                          </div>
                        )}
                        <button
                          type="button"
                          className="resubmit-btn"
                          onClick={() => setShowVerificationForm(true)}
                          style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1.5rem',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          📝 Resubmit Verification
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Show verification form as full screen - CANNOT BE CLOSED */}
                  {loadingVerification && (
                    <div className="verification-loading-overlay">
                      <div className="loading-content">
                        <div className="loading-spinner"></div>
                        <p>Checking verification status...</p>
                      </div>
                    </div>
                  )}

                  {showVerificationForm && !loadingVerification && (
                    <div className="verification-fullscreen-wrapper">
                      <IdentityVerificationForm
                        userId={creatorId}
                        onSuccess={handleVerificationSuccess}
                        existingVerification={verificationData}
                      />
                    </div>
                  )}
                </>
              )}

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="form-content">
              {/* Step 1: Property Details */}
              <div className="step-section">
                <div className="step-header">
                  <div className="step-number">1</div>
                  <h2>🏠 Tell us about your place</h2>
                </div>

                {/* Show selected type info only (not selectable again) */}
                {type && (
                  <div className="selected-type-info">
                    <div className="info-label">Selected Property Type:</div>
                    <div className="selected-type-badge">
                      {types?.find(t => t.name === type)?.icon} <strong>{type}</strong>
                    </div>
                  </div>
                )}

                {/* Categories - Filter out "All" category */}
                <div style={{ marginBottom: "40px" }}>
                  <h3 className="section-title">
                    Which category best describes your place?
                  </h3>
                  <div className="categories-grid">
                    {categories?.filter(item => item.label !== "All").map((item, index) => (
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

                    {/* Pricing Section - Different for Room Rental vs Entire Place */}
                    {isRoomRental ? (
                      // Room Rental: Monthly pricing (with daily equivalent shown)
                      <div className="full-width form-group dual-pricing-group">
                        <label>💰 Set your monthly rent</label>
                        <p className="pricing-hint">
                          💡 <strong>Room Rental</strong> - Set your monthly rent. Daily rate will be calculated automatically for display purposes.
                        </p>

                        <div className="pricing-tabs">
                          <button
                            type="button"
                            className={`pricing-tab ${pricingType === "monthly" ? "active" : ""}`}
                            onClick={() => setPricingType("monthly")}
                          >
                            📆 Monthly Rent (Primary)
                          </button>
                          <button
                            type="button"
                            className={`pricing-tab ${pricingType === "daily" ? "active" : ""}`}
                            onClick={() => setPricingType("daily")}
                          >
                            📅 Daily Equivalent
                          </button>
                        </div>

                        <div className="dual-price-inputs">
                          <div className="price-input-box">
                            <label className={pricingType === "monthly" ? "primary" : "secondary"}>
                              💰 Monthly Rent
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
                              <p className="price-note">✨ This is your actual rent</p>
                            )}
                          </div>

                          <div className="price-arrow">⇄</div>

                          <div className="price-input-box">
                            <label className={pricingType === "daily" ? "primary" : "secondary"}>
                              💵 Daily Equivalent
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
                              <span className="per-unit">/day</span>
                            </div>
                            {pricingType === "daily" && (
                              <p className="price-note">ℹ️ For reference only</p>
                            )}
                          </div>
                        </div>

                        <div className="pricing-info room-rental-info">
                          ℹ️ <strong>Room Rental Model:</strong> Tenants pay monthly rent.
                          {pricingType === "monthly"
                            ? " Daily equivalent is calculated as (Monthly ÷ 30) for display."
                            : " Monthly rent is calculated as (Daily × 30)."}
                          <br />
                          💡 Default deposit: 1 month's rent (${monthlyPrice.toLocaleString()})
                        </div>
                      </div>
                    ) : isEntirePlaceRental ? (
                      // Entire Place: Nightly pricing
                      <div className="full-width form-group price-group">
                        <label>💰 Set your price per night</label>
                        <p className="pricing-hint">
                          🏠 <strong>Entire Place Rental</strong> - Guests book nightly and pay per night.
                        </p>
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
                          <span className="per-unit">/night</span>
                        </div>
                      </div>
                    ) : (
                      // Roommate Matching or other types
                      <div className="full-width form-group price-group">
                        <label>💰 Pricing</label>
                        <p className="pricing-hint">This feature is under development.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 7: Host Profile (for Room Rental only - where host lives with tenant) */}
              {isRoomRental && (
                <div className="step-section host-profile-section">
                  <div className="step-header">
                    <div className="step-number">7</div>
                    <div>
                      <h2>👤 Tell guests about yourself</h2>
                      <p className="step-subtitle">
                        🏠 <strong>Important for Room Rental:</strong> You'll be living with your tenant.
                        Help them understand your lifestyle and expectations.
                      </p>
                    </div>
                  </div>

                  <div className="host-profile-grid">
                    {/* About Yourself - Host Bio */}
                    <div className="full-width form-group highlight-field">
                      <label>✍️ About Yourself</label>
                      <textarea
                        value={hostBio}
                        onChange={(e) => setHostBio(e.target.value)}
                        placeholder="Introduce yourself to potential guests. Share what makes you a great host, your lifestyle, what you're looking for in a guest, etc. This will be displayed on all your Room/Shared Room listings."
                        rows="5"
                        required
                      />
                      <p className="field-note">💡 This introduction will be saved to your profile and displayed on all Room/Shared Room listings you create.</p>
                    </div>

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
