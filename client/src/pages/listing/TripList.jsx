import "../../styles/List.scss";
import { API_ENDPOINTS, HTTP_METHODS } from "../../constants/api";
import { useState, useEffect } from "react";
import Loader from "../../components/Loader";
import Navbar from "../../components/Navbar";
import { useDispatch, useSelector } from "react-redux";
import { setTripList } from "../../redux/state";
import ListingCard from "../../components/ListingCard";
import Footer from "../../components/Footer";
import ExtendStayModal from "../../components/ExtendStayModal";
import CheckoutModal from "../../components/CheckoutModal";
import CancelBookingModal from "../../components/CancelBookingModal";

const TripList = () => {
  const [loading, setLoading] = useState(true);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Get user from Redux
  const user = useSelector((state) => state.user);
  const userId = user?._id || user?.id;

  // Debug logging
  console.log("🔍 TripList - User state:", {
    user,
    userId,
    hasUser: !!user,
    userKeys: user ? Object.keys(user) : []
  });

  const dispatch = useDispatch();
  const tripList = useSelector((state) => state.user?.tripList || []);

  const getTripList = async () => {
    try {
      // Validate userId before making API call
      if (!userId) {
        console.error("❌ User ID is undefined, cannot fetch trips");
        setLoading(false);
        return;
      }

      const url = API_ENDPOINTS.USERS.GET_TRIPS(userId);
      console.log(`🔄 Fetching trips for user: ${userId}`);

      const response = await fetch(url, { method: HTTP_METHODS.GET });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          text || `Request failed with status ${response.status}`
        );
      }
      const data = await response.json();
      console.log("✅ TripList fetch:", { url, data });
      dispatch(setTripList(data));
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching trip list:", err);
      setLoading(false);
    }
  };

  const handleCheckout = (booking) => {
    setSelectedBooking(booking);
    setCheckoutModalOpen(true);
  };

  const handleCheckoutConfirm = async (feedback, reviewData) => {
    if (!selectedBooking) return;

    try {
      console.log(`🔄 Checking out booking ${selectedBooking._id}...`);

      // 1. Checkout
      const checkoutUrl = `${API_ENDPOINTS.BOOKINGS.ACCEPT}/${selectedBooking._id}/checkout`;
      const checkoutResponse = await fetch(checkoutUrl, {
        method: HTTP_METHODS.PATCH,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });

      if (!checkoutResponse.ok) {
        throw new Error(`Failed to checkout: ${checkoutResponse.status}`);
      }

      const checkoutData = await checkoutResponse.json();
      console.log(`✅ ${checkoutData.message}`);

      // 2. Submit review if provided
      if (reviewData && reviewData.listingRating > 0) {
        console.log(`🔄 Submitting review...`);
        const reviewPayload = {
          bookingId: selectedBooking._id,
          reviewerId: userId,
          listingRating: reviewData.listingRating,
          listingComment: reviewData.listingComment,
          hostRating: reviewData.hostRating || 0,
          hostComment: reviewData.hostComment,
        };

        const reviewResponse = await fetch(API_ENDPOINTS.REVIEWS.CREATE, {
          method: HTTP_METHODS.POST,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reviewPayload),
        });

        if (reviewResponse.ok) {
          console.log(`✅ Review submitted successfully!`);
        } else {
          console.warn(`⚠️ Review submission failed, but checkout succeeded`);
        }
      }

      // 3. Refresh trips
      await getTripList();
      // Success - modal will close automatically
    } catch (error) {
      console.error("❌ Error checking out:", error);
      // Just log error, modal will handle it
      throw error;
    }
  };

  const handleExtensionRequest = (booking) => {
    setSelectedBooking(booking);
    setExtendModalOpen(true);
  };

  const handleExtensionSubmit = async (additionalDays) => {
    if (!selectedBooking) return;

    try {
      console.log(`🔄 Requesting extension for booking ${selectedBooking._id}...`);
      const url = `${API_ENDPOINTS.BOOKINGS.ACCEPT}/${selectedBooking._id}/extension`;
      const response = await fetch(url, {
        method: HTTP_METHODS.POST,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ additionalDays }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to request extension: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ ${data.message}`);

      // Refresh trips to show updated extension request
      await getTripList();
      // Success - modal will close automatically
    } catch (error) {
      console.error("❌ Error requesting extension:", error);
      throw error; // Re-throw to let modal handle it
    }
  };

  const handleCancelBooking = (booking) => {
    setSelectedBooking(booking);
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = async (cancellationReason) => {
    if (!selectedBooking) return;

    try {
      console.log(`🔄 Cancelling booking ${selectedBooking._id}...`);
      const url = API_ENDPOINTS.BOOKINGS.CANCEL(selectedBooking._id);
      const response = await fetch(url, {
        method: HTTP_METHODS.PATCH,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: userId,
          cancellationReason: cancellationReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to cancel booking: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ ${data.message}`);

      // Refresh trips to show updated status
      await getTripList();
      // Success - modal will close automatically
    } catch (error) {
      console.error("❌ Error cancelling booking:", error);
      alert(error.message || "Failed to cancel booking. Please try again.");
      throw error; // Re-throw to let modal handle it
    }
  };

  const canCheckout = (booking) => {
    // User có thể checkout bất kỳ lúc nào sau khi booking được accept
    // Không cần chờ đến endDate
    return booking.bookingStatus === "approved" && !booking.isCheckedOut;
  };

  const canExtend = (booking) => {
    return booking.bookingStatus === "approved" && !booking.isCheckedOut;
  };

  const canCancel = (booking) => {
    // Guest can only cancel pending bookings
    // BUT cannot cancel if already paid full amount (paymentType = 'full')
    if (booking.paymentType === "full") {
      return false; // ❌ Cannot cancel - already paid 100%
    }
    return booking.bookingStatus === "pending";
  };

  useEffect(() => {
    if (userId) {
      console.log(`🔄 TripList mounted, userId: ${userId}`);
      getTripList();
    } else {
      console.warn("⚠️ No userId found, skipping trip fetch");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return loading ? (
    <Loader />
  ) : (
    <>
      <Navbar />
      <h1 className="title-list">Your Trip List</h1>
      <div className="list">
        {!userId ? (
          <div className="no-listings">
            <p>Please log in to view your trips.</p>
          </div>
        ) : tripList?.length === 0 ? (
          <div className="no-listings">
            <p>You haven't booked any trips yet.</p>
          </div>
        ) : (
          tripList?.map((trip) => (
            <div key={trip._id} className="trip-item">
              {trip.bookingStatus && (
                <div className={`booking-status status-${trip.bookingStatus}`}>
                  {trip.bookingStatus === "pending" && "⏳ Pending"}
                  {trip.bookingStatus === "approved" && "✓ Approved"}
                  {trip.bookingStatus === "checked_in" && "🏠 Checked In"}
                  {trip.bookingStatus === "rejected" && "✗ Rejected"}
                  {trip.bookingStatus === "cancelled" && "🚫 Cancelled"}
                  {trip.bookingStatus === "checked_out" && "✅ Checked Out"}
                  {trip.bookingStatus === "completed" && "✅ Completed"}
                </div>
              )}
              <ListingCard
                listingId={trip.listingId?._id || trip.listingId?.id}
                creator={trip.hostId?._id || trip.hostId?.id}
                listingPhotoPaths={trip.listingId?.listingPhotoPaths}
                city={trip.listingId?.city}
                province={trip.listingId?.province}
                country={trip.listingId?.country}
                category={trip.listingId?.category}
                startDate={trip.startDate}
                endDate={trip.finalEndDate || trip.endDate}
                totalPrice={trip.finalTotalPrice || trip.totalPrice}
                booking={true}
                isExtended={!!trip.finalEndDate}
                onCheckout={canCheckout(trip) ? () => handleCheckout(trip) : null}
                onExtend={canExtend(trip) ? () => handleExtensionRequest(trip) : null}
                onCancel={canCancel(trip) ? () => handleCancelBooking(trip) : null}
                paymentMethod={trip.paymentMethod}
                depositAmount={trip.depositAmount}
                paymentStatus={trip.paymentStatus}
              />
            </div>
          ))
        )}
      </div>
      <Footer />
      {extendModalOpen && (
        <ExtendStayModal
          booking={selectedBooking}
          onClose={() => setExtendModalOpen(false)}
          onSubmit={handleExtensionSubmit}
        />
      )}
      {checkoutModalOpen && (
        <CheckoutModal
          booking={selectedBooking}
          onClose={() => setCheckoutModalOpen(false)}
          onConfirm={handleCheckoutConfirm}
        />
      )}
      {cancelModalOpen && (
        <CancelBookingModal
          booking={selectedBooking}
          onClose={() => setCancelModalOpen(false)}
          onConfirm={handleCancelConfirm}
        />
      )}
    </>
  );
};

export default TripList;
