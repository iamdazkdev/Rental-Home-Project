import "../../styles/List.scss";
import { API_ENDPOINTS, HTTP_METHODS } from "../../constants";
import { useState } from "react";
import Loader from "../../components/Loader";
import Navbar from "../../components/Navbar";
import { useDispatch, useSelector } from "react-redux";
import { setTripList } from "../../redux/state";
import { useEffect } from "react";
import ListingCard from "../../components/ListingCard";
import Footer from "../../components/Footer";

const TripList = () => {
  const [loading, setLoading] = useState(true);
  const userId = useSelector((state) => state.user?.id || state.user?._id);
  const dispatch = useDispatch();
  const tripList = useSelector((state) => state.user?.tripList || []);
  const getTripList = async () => {
    try {
      const url = API_ENDPOINTS.USERS.GET_TRIPS(userId);
      const response = await fetch(url, { method: HTTP_METHODS.GET });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          text || `Request failed with status ${response.status}`
        );
      }
      const data = await response.json();
      console.log("TripList fetch:", { url, data });
      setTripList({ tripList: data });
      dispatch(setTripList(data));
      setLoading(false);
    } catch (err) {
      console.error("Error fetching trip list:", err);
    }
  };

  useEffect(() => {
    getTripList().then(r => {});
  });

  return loading ? (
    <Loader />
  ) : (
  <>
      <Navbar />
      <h1 className="title-list">Your Trip List</h1>
      <div className="list">
        {tripList?.length === 0 ? (
          <div className="no-listings">
            <p>You haven't booked any trips yet.</p>
          </div>
        ) : (
          tripList?.map((trip) => (
            <div key={trip._id} className="trip-item">
              {trip.status && (
                <div className={`booking-status status-${trip.status}`}>
                  {trip.status === "pending" && "⏳ Pending"}
                  {trip.status === "accepted" && "✓ Accepted"}
                  {trip.status === "rejected" && "✗ Rejected"}
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
                endDate={trip.endDate}
                totalPrice={trip.totalPrice}
                booking={true}
              />
            </div>
          ))
        )}
      </div>
      <Footer />
    </>
  );
};

export default TripList;
