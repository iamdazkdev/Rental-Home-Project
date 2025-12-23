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

const ListingDetails = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { listingId } = useParams();
  const [listing, setListing] = useState(null);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [userBooking, setUserBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

        // Find active booking for this listing (pending or accepted, not checked out)
        const existingBooking = bookings.find(
          (booking) =>
            (booking.listingId?._id === listingId || booking.listingId?.id === listingId) &&
            (booking.status === "pending" || booking.status === "accepted") &&
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
    // Prevent double submission
    if (submitting) {
      console.log("⚠️ Already submitting, please wait...");
      return;
    }

    try {
      setSubmitting(true);

      const bookingForm = {
        customerId,
        listingId,
        hostId: listing.creator._id || listing.creator.id,
        startDate: dateRange[0].startDate.toDateString(),
        endDate: dateRange[0].endDate.toDateString(),
        totalPrice: listing.price * dayCount,
      };

      console.log("📤 Submitting booking:", bookingForm);

      const url = API_ENDPOINTS.BOOKINGS.CREATE;
      const response = await fetch(url, {
        method: HTTP_METHODS.POST,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingForm),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Booking successful:", data);
        navigate(`/${customerId}/trips`);
      } else {
        const errorData = await response.json();
        console.error("❌ Booking failed:", errorData);
        // Only show error, no success alert
        alert(errorData.message || "Failed to create booking");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("❌ Error submitting booking:", err);
      setSubmitting(false);
    }
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
                👤 View Host Profile
              </button>
            </div>
          </div>
        )}
        <hr />
        <h3>Description</h3>
        <p>{listing.description}</p>
        <hr />
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

          {hasActiveBooking ? (
            // Show message if already booked
            <div className="already-booked-message">
              <div className="message-icon">✓</div>
              <h3>You've Already Booked This Property</h3>
              <p>You have an active booking for this listing.</p>

              <div className="booking-details">
                <p>
                  <strong>Status:</strong>{" "}
                  <span className={`status-badge status-${userBooking?.status}`}>
                    {userBooking?.status === "pending" && "⏳ Pending Approval"}
                    {userBooking?.status === "accepted" && "✓ Confirmed"}
                  </span>
                </p>
                <p>
                  <strong>Check-in:</strong> {userBooking?.startDate}
                </p>
                <p>
                  <strong>Check-out:</strong> {userBooking?.finalEndDate || userBooking?.endDate}
                </p>
                <p>
                  <strong>Total:</strong> ${(userBooking?.finalTotalPrice || userBooking?.totalPrice)?.toFixed(2)}
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
                  ${listing.price} x {dayCount} nights
                </h2>
              ) : (
                <h2>
                  ${listing.price} x {dayCount} night
                </h2>
              )}
              <h2>Total price: ${listing.price * dayCount}</h2>
              <p>Start Date: {dateRange[0].startDate.toDateString()}</p>
              <p>End Date: {dateRange[0].endDate.toDateString()}</p>

              <button
                className="button"
                type="submit"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "BOOKING"}
              </button>
            </>
          )}
        </div>

        {/* Reviews Section */}
        <Reviews listingId={listingId} />
      </div>
    </>
  );
};

export default ListingDetails;
