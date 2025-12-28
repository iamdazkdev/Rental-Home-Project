/* eslint-disable jsx-a11y/alt-text */
import React, { useEffect, useState } from "react";
import "../../styles/ListingDetails.scss";
import { useNavigate, useParams } from "react-router-dom";
import { API_ENDPOINTS, HTTP_METHODS, CONFIG } from "../../constants/api";
import Loader from "../../components/Loader";
import Reviews from "../../components/Reviews";
import { facilities } from "../../data";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange } from "react-date-range";
import { enUS } from "date-fns/locale";
import Navbar from "../../components/Navbar";
import { useSelector } from "react-redux";
import { formatVND } from "../../utils/priceFormatter";

const ListingDetails = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { listingId } = useParams();
  const [listing, setListing] = useState(null);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [userBooking, setUserBooking] = useState(null);

  const getListingDetails = async () => {
    try {
      const url = API_ENDPOINTS.LISTINGS.GET_BY_ID(listingId);
      const response = await fetch(url, { method: HTTP_METHODS.GET });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          text || `Request failed with status ${response.status}`
        );
      }

      const data = await response.json();
      console.log("ListingDetails fetch:", { url, data });
      setListing(data);
      setLoading(false);
      setError(null);
    } catch (error) {
      setLoading(false);
      setError(error.message || "Failed to load listing");
      console.error("Error fetching listing details:", error);
      console.log("Fetch listing error message:", error.message);
    }
  };

  useEffect(() => {
    if (listingId) {
      setLoading(true);
      getListingDetails().then(() => {
        console.log("Listing details loaded successfully");
      }).catch((err) => {
        console.error("Failed to load listing details:", err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  // BOOKING CALENDAR
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const handleSelect = (ranges) => {
    // Update the selected date range when user makes a selection
    setDateRange([ranges.selection]);
  };
  const start = new Date(dateRange[0].startDate);
  const end = new Date(dateRange[0].endDate);

  const dayCount = Math.round(end - start) / (1000 * 60 * 60 * 24); // Calculate the diff in the day unit

  // SUBMIT BOOKING
  const user = useSelector((state) => state.user);
  const customerId = user?._id || user?.id || null;
  const customerIdSource = user?._id ? "_id" : user?.id ? "id" : null;
  console.log("Customer ID:", customerId, "(source:", customerIdSource, ")");

  // Check if user has already booked this listing
  const checkExistingBooking = async () => {
    if (!customerId || !listingId) return;

    try {
      const url = API_ENDPOINTS.USERS.GET_TRIPS(customerId);
      const response = await fetch(url, { method: HTTP_METHODS.GET });

      if (response.ok) {
        const bookings = await response.json();

        // Find active booking for this listing (pending/approved/checked_in, not checked out)
        const existingBooking = bookings.find(
          (booking) =>
            (booking.listingId?._id === listingId || booking.listingId?.id === listingId) &&
            (booking.bookingStatus === "pending" || booking.bookingStatus === "approved" || booking.bookingStatus === "checked_in") &&
            !booking.isCheckedOut
        );

        if (existingBooking) {
          console.log("✅ Found existing booking:", existingBooking);
          setHasActiveBooking(true);
          setUserBooking(existingBooking);
        } else {
          setHasActiveBooking(false);
          setUserBooking(null);
        }
      }
    } catch (error) {
      console.error("Error checking existing booking:", error);
    }
  };

  useEffect(() => {
    if (customerId && listingId) {
      checkExistingBooking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, listingId]);

  const navigate = useNavigate();
  const handleSubmit = async () => {
    // Validate dates
    if (dayCount < 1) {
      alert("Please select valid dates (at least 1 night)");
      return;
    }

    // Prepare booking data
    const bookingData = {
      customerId,
      listingId,
      hostId: listing.creator._id || listing.creator.id,
      startDate: dateRange[0].startDate.toDateString(),
      endDate: dateRange[0].endDate.toDateString(),
      totalPrice: listing.price * dayCount,
      dayCount,
      listing: {
        title: listing.title,
        city: listing.city,
        province: listing.province,
        country: listing.country,
        type: listing.type,
        price: listing.price,
        listingPhotoPaths: listing.listingPhotoPaths,
      }
    };

    console.log("🛒 Navigating to checkout with booking data:", bookingData);

    // Navigate to checkout page
    navigate('/booking/checkout', {
      state: { bookingData }
    });
  };

  if (loading) return <Loader />;
  if (error) return <div className="listing-details">{error}</div>;
  if (!listing)
    return <div className="listing-details">Listing not found.</div>;

  return (
    <>
      <Navbar />
      <div className="listing-details">
        <div className="title">
          <h1>{listing.title}</h1>
          <div></div>
        </div>

        <div className="photos">
          {listing.listingPhotoPaths?.map((item) => {
            const src = item?.startsWith("http")
              ? item
              : `${CONFIG.API_BASE_URL}/${item?.replace("public/", "") || ""}`;
            return <img key={item} src={src} alt="listing photos" />;
          })}
        </div>
        <h2>
          {listing.type} in {listing.city}, {listing.province},{" "}
          {listing.country}
        </h2>
        <p>
          {listing.guestCount} guests - {listing.bedroomCount} bedroom(s) -
          {listing.bathroomCount} bathroom(s) - {listing.bedCount} bed(s)
        </p>
        <hr />
        {listing.creator && (
          <div className="profile">
            <img
              src={(() => {
                const path = listing.creator.profileImagePath;
                if (!path) return "";
                return path.startsWith("http")
                  ? path
                  : `${CONFIG.API_BASE_URL}/${path.replace("public/", "")}`;
              })()}
              alt="host profile"
            />
            <div className="host-info-section">
              <h3>
                Hosted by {listing.creator.firstName} {listing.creator.lastName}
              </h3>
              <div className="host-actions">
                <button
                  className="view-host-profile-btn"
                  onClick={() => {
                    // Get creator ID - handle both populated object and plain ID
                    const creatorId = typeof listing.creator === 'string'
                      ? listing.creator
                      : (listing.creator._id || listing.creator.id);
                    console.log("Navigating to host profile:", creatorId);
                    navigate(`/host/${creatorId}`);
                  }}
                >
                  👤 View Profile
                </button>

                {/* Contact Host Button - only show if not own listing */}
                {(() => {
                  const creatorId = typeof listing.creator === 'string'
                    ? listing.creator
                    : (listing.creator._id || listing.creator.id);
                  const isOwnListing = customerId && (String(creatorId) === String(customerId));

                  if (!isOwnListing) {
                    return (
                      <button
                        className="contact-host-btn"
                        onClick={() => {
                          navigate(`/messages`, {
                            state: {
                              receiverId: creatorId,
                              listingId: listing._id,
                              receiverName: `${listing.creator.firstName} ${listing.creator.lastName}`,
                              listingTitle: listing.title,
                            }
                          });
                        }}
                      >
                        💬 Contact Host
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        )}
        <hr />
        <h3>Description</h3>
        <p>{listing.description}</p>
        <hr />

        {/* Host Profile Section for Room/Shared Room */}
        {(listing.type === "Room(s)" || listing.type === "A Shared Room") && (
          <>
            <h3>👤 About Your Host</h3>
            <div className="host-profile-info">
              {/* Host Bio - from User model */}
              {listing.creator?.hostBio && (
                <div className="profile-section host-bio-section">
                  <h4>✍️ About Me</h4>
                  <p className="host-bio">{listing.creator.hostBio}</p>
                </div>
              )}

              {/* Host Profile Details - from Listing model */}
              {listing.hostProfile && (
              <div className="profile-grid">
                <div className="profile-item">
                  <span className="profile-label">🌙 Sleep Schedule</span>
                  <span className="profile-value">
                    {listing.hostProfile.sleepSchedule === "early_bird" && "Early Bird (Sleep before 10 PM)"}
                    {listing.hostProfile.sleepSchedule === "night_owl" && "Night Owl (Sleep after midnight)"}
                    {listing.hostProfile.sleepSchedule === "flexible" && "Flexible"}
                  </span>
                </div>

                <div className="profile-item">
                  <span className="profile-label">🚬 Smoking</span>
                  <span className="profile-value">
                    {listing.hostProfile.smoking === "no" && "Non-smoker"}
                    {listing.hostProfile.smoking === "outside_only" && "Smoke outside only"}
                    {listing.hostProfile.smoking === "yes" && "Smoker"}
                  </span>
                </div>

                <div className="profile-item">
                  <span className="profile-label">😊 Personality</span>
                  <span className="profile-value">
                    {listing.hostProfile.personality === "introvert" && "Introvert (Quiet, private)"}
                    {listing.hostProfile.personality === "extrovert" && "Extrovert (Social, outgoing)"}
                    {listing.hostProfile.personality === "ambivert" && "Ambivert (Balanced)"}
                  </span>
                </div>

                <div className="profile-item">
                  <span className="profile-label">🧹 Cleanliness</span>
                  <span className="profile-value">
                    {listing.hostProfile.cleanliness === "very_clean" && "Very Clean (Everything organized)"}
                    {listing.hostProfile.cleanliness === "moderate" && "Moderate (Tidy but lived-in)"}
                    {listing.hostProfile.cleanliness === "relaxed" && "Relaxed (Clean but casual)"}
                  </span>
                </div>

                <div className="profile-item">
                  <span className="profile-label">💼 Occupation</span>
                  <span className="profile-value">{listing.hostProfile.occupation}</span>
                </div>
              </div>
              )}

              {listing.hostProfile?.hobbies && (
                <div className="profile-section">
                  <h4>🎨 Hobbies & Interests</h4>
                  <p>{listing.hostProfile.hobbies}</p>
                </div>
              )}

              {listing.hostProfile?.houseRules && (
                <div className="profile-section">
                  <h4>📋 House Rules</h4>
                  <p>{listing.hostProfile.houseRules}</p>
                </div>
              )}

              {listing.hostProfile?.additionalInfo && (
                <div className="profile-section">
                  <h4>💬 Additional Information</h4>
                  <p>{listing.hostProfile.additionalInfo}</p>
                </div>
              )}
            </div>
            <hr />
          </>
        )}

        <h3>Highlight</h3>
        <p>{listing.highlightDesc}</p>
        <hr />

        <div className="booking">
          <div>
            <h2>What this place offers</h2>
            <div className="amenities">
              {(() => {
                const raw = listing.amenities;
                let items = [];
                if (Array.isArray(raw)) {
                  items = raw.map((it) =>
                    typeof it === "string" ? { name: it } : it
                  );
                } else if (typeof raw === "string") {
                  try {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                      items = parsed.map((it) =>
                        typeof it === "string" ? { name: it } : it
                      );
                    }
                  } catch (e) {
                    // fallback: comma-separated string
                    items = raw
                      .split(",")
                      .map((s) => ({ name: s.trim() }))
                      .filter(Boolean);
                  }
                }

                return items.map((item, index) => {
                  const facility = facilities.find((f) => f.name === item.name);
                  return (
                    <div className="facility" key={index}>
                      <div>
                        {facility?.icon}
                        <p>{item.name}</p>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        <div>
          <h2>How long do you want to stay?</h2>

          {/* Check if user is viewing their own listing */}
          {(() => {
            const creatorId = listing.creator?._id || listing.creator?.id || listing.creator;
            const isOwnListing = customerId && (String(creatorId) === String(customerId));

            console.log("🔍 Booking visibility check:");
            console.log("   - Creator ID:", creatorId);
            console.log("   - Current User ID:", customerId);
            console.log("   - Is own listing?", isOwnListing);

            // If user is viewing their own listing, don't show booking
            if (isOwnListing) {
              return (
                <div className="already-booked-message own-listing-message">
                  <div className="message-icon">🏠</div>
                  <h3>This is Your Listing</h3>
                  <p>You cannot book your own property</p>
                  <button
                    className="button view-property-btn"
                    onClick={() => navigate("/properties")}
                  >
                    📋 Manage Properties
                  </button>
                </div>
              );
            }

            // Show booking section for other users
            return hasActiveBooking ? (
            // Show message if already booked
            <div className="already-booked-message">
              <div className="message-icon">✓</div>
              <h3>You've Already Booked This Property</h3>
              <p>You have an active booking for this listing.</p>

              <div className="booking-details">
                <p>
                  <strong>Status:</strong>{" "}
                  <span className={`status-badge status-${userBooking?.bookingStatus}`}>
                    {userBooking?.bookingStatus === "pending" && "⏳ Pending Approval"}
                    {userBooking?.bookingStatus === "approved" && "✓ Confirmed"}
                    {userBooking?.bookingStatus === "checked_in" && "🏠 Checked In"}
                  </span>
                </p>
                <p>
                  <strong>Check-in:</strong> {userBooking?.startDate}
                </p>
                <p>
                  <strong>Check-out:</strong> {userBooking?.finalEndDate || userBooking?.endDate}
                </p>
                <p>
                  <strong>Total:</strong> {formatVND(userBooking?.finalTotalPrice || userBooking?.totalPrice)}
                </p>
              </div>

              <button
                className="button view-booking-btn"
                onClick={() => navigate(`/${customerId}/trips`)}
              >
                View My Trips
              </button>
            </div>
          ) : (
            // Show booking form if not booked yet
            <>
              <div className="date-range-calendar"></div>
              <DateRange ranges={dateRange} onChange={handleSelect} locale={enUS} />
              {dayCount > 1 ? (
                <h2>
                  {formatVND(listing.price, false)} x {dayCount} nights
                </h2>
              ) : (
                <h2>
                  {formatVND(listing.price, false)} x {dayCount} night
                </h2>
              )}
              <h2>Total price: {formatVND(listing.price * dayCount)}</h2>
              <p>Start Date: {dateRange[0].startDate.toDateString()}</p>
              <p>End Date: {dateRange[0].endDate.toDateString()}</p>

              <button
                className="button"
                type="submit"
                onClick={handleSubmit}
              >
                BOOKING
              </button>
            </>
          );
          })()}
        </div>

        {/* Reviews Section */}
        <Reviews listingId={listingId} />
      </div>
    </>
  );
};

export default ListingDetails;
