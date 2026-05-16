import React, { useState, useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import { HomeWork, ArrowForward, LightbulbOutlined } from "@mui/icons-material";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { listingSchema } from "../../utils/validations/listingSchema";
import CreateListingLocationForm from "../../components/host/CreateListingLocationForm";
import CreateListingBasics from "../../components/host/CreateListingBasics";
import CreateListingAmenitiesSelector from "../../components/host/CreateListingAmenitiesSelector";
import CreateListingPhotoUpload from "../../components/host/CreateListingPhotoUpload";
import CreateListingDescriptionForm from "../../components/host/CreateListingDescriptionForm";
import CreateListingPricing from "../../components/host/CreateListingPricing";
import CreateListingHostProfile from "../../components/host/CreateListingHostProfile";

import "../../styles/CreateListing.scss";
import Navbar from "../../components/layout/Navbar";
import IdentityVerificationForm from "../../components/verification/IdentityVerificationForm";
// Removed static imports - will fetch from API
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
import { toast } from "../../stores/useNotificationStore";
import { useCreateListingStore } from "../../stores/useCreateListingStore";


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

  // ZUSTAND STORE
  const {
    category, setCategory,
    type, setType,
    formLocation, setFormLocation,
    guestCount, setGuestCount,
    bedroomCount, setBedroomCount,
    bedCount, setBedCount,
    bathroomCount, setBathroomCount,
    roomArea, setRoomArea,
    amenities, setAmenities,
    photos, setPhotos,
    photoWarning, setPhotoWarning,
    formDescription, setFormDescription,
    dailyPrice, setDailyPrice,
    monthlyPrice, setMonthlyPrice,
    hostProfile, setHostProfile,
    hostBio, setHostBio,
    clearStore
  } = useCreateListingStore();

  // REDUX STATE
  const user = useSelector((state) => state.user.profile);
  const creatorId = user?.id || user?._id;
  const navigate = useNavigate();

  // Sync initial hostBio if missing
  useEffect(() => {
    if (user?.hostBio && !hostBio) {
      setHostBio(user.hostBio);
    }
  }, [user, hostBio, setHostBio]);

  // Clean up store on unmount
  useEffect(() => {
    return () => clearStore();
  }, [clearStore]);
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
          toast.error("Failed to load categories, types, and facilities. Please refresh.");
        }
      } catch (error) {
        console.error("❌ Error fetching static data:", error);
        toast.error("Failed to connect to server. Please check your connection.");
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
          toast.error("Failed to load listing data");
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

    // PROCESS 3: Roommate Matching - redirect to Roommate Post Form
    if (selectedType === "A Shared Room") {
      console.log("🏠 Redirecting to Roommate Post Form (Process 3)...");
      navigate("/roommate/create");
      return;
    }

    // Check if verification is required for Room Rental (Process 2)
    const requiresVerification = selectedType === "Room(s)";

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
  const isEntirePlaceRental = type === "An entire place"; // Full property, nightly booking
  const isRoommateMatching = type === "A Shared Room"; // Roommate finding (future feature)


  // INITIALIZE REACT-HOOK-FORM
  const methods = useForm({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      category: category,
      type: type,
      formLocation: formLocation,
      guestCount: guestCount,
      bedroomCount: bedroomCount,
      bedCount: bedCount,
      bathroomCount: bathroomCount,
      roomArea: roomArea,
      amenities: amenities,
      photos: photos,
      formDescription: formDescription,
      dailyPrice: dailyPrice,
      monthlyPrice: monthlyPrice,
      hostProfile: hostProfile,
      hostBio: hostBio,
    }
  });

  const onSubmit = async (data) => {
    // We will use `data` directly to ensure we use validated inputs
    // but we can also rely on Zustand store if needed.
    // For now, let's sync react-hook-form data back to Zustand before submitting
    setCategory(data.category);
    setType(data.type);
    setFormLocation(data.formLocation);
    setGuestCount(data.guestCount);
    setBedroomCount(data.bedroomCount);
    setBedCount(data.bedCount);
    setBathroomCount(data.bathroomCount);
    setRoomArea(data.roomArea);
    setAmenities(data.amenities);
    setPhotos(data.photos);
    setFormDescription(data.formDescription);
    setDailyPrice(data.dailyPrice);
    setMonthlyPrice(data.monthlyPrice);
    setHostProfile(data.hostProfile);
    setHostBio(data.hostBio);
    
    // Call original logic via a mock event
    await handleSubmit({ preventDefault: () => {} });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Common validation
      if (!category) {
        toast.info("Please select a category");
        setIsLoading(false);
        return;
      }
      if (!type) {
        toast.info("Please select a property type");
        setIsLoading(false);
        return;
      }
      if (photos.length === 0) {
        toast.info("Please upload at least one photo");
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
          toast.info("Please tell guests about yourself");
          setIsLoading(false);
          return;
        }
        if (!hostProfile.sleepSchedule || !hostProfile.smoking || !hostProfile.personality ||
            !hostProfile.cleanliness || !hostProfile.occupation || !hostProfile.hobbies ||
            !hostProfile.houseRules) {
          toast.info("Please fill in all required host profile fields");
          setIsLoading(false);
          return;
        }
        if (dailyPrice <= 0 || monthlyPrice <= 0) {
          toast.info("Please enter valid daily and monthly prices");
          setIsLoading(false);
          return;
        }
      } else {
        // Entire Place validation
        if (formDescription.price <= 0) {
          toast.info("Please enter a valid price");
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
            toast.success("🎉 Your property has been listed successfully!");
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
          if (roomArea > 0) {
            roomData.append("roomArea", roomArea); // Room area in m²
          }

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

            toast.success("🎉 Your room has been listed successfully!");
            navigate("/properties");
          } else {
            const errorText = await response.text();
            console.error("❌ Room Rental creation failed:", errorText);
            throw new Error(`Failed to create room rental: ${errorText}`);
          }
        }

        // PROCESS 3: ROOMMATE MATCHING (Future feature)
        else if (isRoommateMatching) {
          toast.info("🚧 Roommate matching feature is coming soon!");
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
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      {/* Type Selection Modal - Full Screen, Mandatory */}
      {/* Type Selection UI - Replaces the old Modal */}
      {showTypeModal && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          bgcolor: 'background.default',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Main Content Canvas */}
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, md: 6 }, position: 'relative', zIndex: 10, pt: { xs: 12, md: 6 } }}>
            {/* Intentional Asymmetry Background */}
            <Box sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '614px', 
              background: 'linear-gradient(135deg, #424666 0%, #595e7f 100%)', 
              zIndex: -1, 
              clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0% 100%)' 
            }} />
            
            <Box sx={{ 
              bgcolor: 'background.paper', 
              borderRadius: '2rem', 
              p: { xs: 4, md: 8 }, 
              maxWidth: 'lg', 
              width: '100%', 
              mx: 'auto', 
              boxShadow: '0px 40px 80px rgba(26,28,30,0.08)' 
            }}>
              <Box sx={{ textAlign: 'center', mb: 8, maxWidth: 'md', mx: 'auto' }}>
                <Box sx={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: 64, 
                  height: 64, 
                  borderRadius: '50%', 
                  bgcolor: 'rgba(248,57,90,0.1)', 
                  color: 'primary.main', 
                  mb: 3 
                }}>
                  <HomeWork sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="h3" sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, mb: 2, color: '#1a1c1e', letterSpacing: '-0.02em', fontSize: { xs: '2.25rem', md: '3.5rem' } }}>
                  Choose Your Property Type
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.125rem', opacity: 0.8 }}>
                  Select what type of place guests will have access to. This helps us tailor the experience for your future guests.
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4, mb: 6 }}>
                {types?.map((item, index) => (
                  <Box 
                    key={index} 
                    onClick={() => handleTypeSelection(item.name)}
                    sx={{ 
                      bgcolor: 'background.default', 
                      borderRadius: 3, 
                      p: 4, 
                      border: '1px solid', 
                      borderColor: 'rgba(199, 196, 216, 0.15)', 
                      transition: 'all 0.3s', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      textAlign: 'center', 
                      height: '100%', 
                      '&:hover': { 
                        bgcolor: 'background.paper',
                        borderColor: 'primary.main', 
                        boxShadow: '0px 20px 40px rgba(26,28,30,0.06)',
                        '& .icon-container': { bgcolor: 'rgba(248,57,90,0.1)', color: 'primary.main' },
                        '& .select-btn': { bgcolor: 'primary.main', color: 'white', borderColor: 'transparent' },
                        '& .card-title': { color: 'primary.main' }
                      } 
                    }}
                  >
                    <Box className="icon-container" sx={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: '50%', 
                      bgcolor: 'rgba(226, 226, 229, 0.5)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      mb: 3, 
                      transition: 'all 0.3s', 
                      color: 'text.primary',
                      '& svg': { fontSize: 40 }
                    }}>
                      {item.icon}
                    </Box>
                    <Typography className="card-title" variant="h5" sx={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, mb: 1.5, color: '#1a1c1e', transition: 'color 0.3s' }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, flexGrow: 1, lineHeight: 1.6 }}>
                      {item.description}
                    </Typography>
                    <Button 
                      className="select-btn" 
                      variant="outlined" 
                      color="primary" 
                      fullWidth 
                      sx={{ 
                        py: 1.5, 
                        transition: 'all 0.3s', 
                        borderColor: 'rgba(199, 196, 216, 0.5)',
                        color: 'primary.main',
                        textTransform: 'none',
                        fontWeight: 500
                      }} 
                      endIcon={<ArrowForward sx={{ fontSize: 18 }} />}
                    >
                      Select
                    </Button>
                  </Box>
                ))}
              </Box>

              <Box sx={{ textAlign: 'center', borderTop: '1px solid', borderColor: 'rgba(199, 196, 216, 0.15)', pt: 4 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, fontStyle: 'italic' }}>
                  <LightbulbOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
                  You must select a type to continue
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
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
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)} className="form-content">
                
                {/* Step 1: Property Details */}
                <div className="step-section">
                  <div className="step-header">
                    <div className="step-number">1</div>
                    <h2>🏠 Tell us about your place</h2>
                  </div>
                  {type && (
                    <div className="selected-type-info">
                      <div className="info-label">Selected Property Type:</div>
                      <div className="selected-type-badge">
                        {types?.find(t => t.name === type)?.icon} <strong>{type}</strong>
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom: "40px" }}>
                    <h3 className="section-title">Which category best describes your place?</h3>
                    <div className="categories-grid">
                      {categories?.filter(item => item.label !== "All").map((item, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setCategory(item.label);
                            methods.setValue("category", item.label, { shouldValidate: true });
                          }}
                          className={`category-item ${
                            category === item.label ? "selected" : ""
                          }`}
                        >
                          <div className="icon">{item.icon}</div>
                          <div className="content">
                            <h4>{item.label}</h4>
                            <p>{item.description || "Perfect for your listing"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <CreateListingLocationForm />
                <CreateListingBasics type={type} />
                <CreateListingAmenitiesSelector />
                <CreateListingPhotoUpload />
                <CreateListingDescriptionForm />
                <CreateListingPricing type={type} />
                {requiresHostProfile && <CreateListingHostProfile />}

                <button className="submit_btn" type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : isEditMode ? "Update Listing" : "Create Listing"}
                </button>
              </form>
            </FormProvider>
          </div>
        </div>
        </div>
      )}
    </>
  );
};

export default CreateListingPage;
