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
        {tripList?.map(
          ({
            listingId,
            hostId,
            startDate,
            endDate,
            totalPrice,
            booking = true,
          }) => (
            <ListingCard
              listingId={listingId._id || listingId.id}
              creator={hostId._id || hostId.id}
              listingPhotoPaths={listingId.listingPhotoPaths}
              city={listingId.city}
              province={listingId.province}
              country={listingId.country}
              category={listingId.category}
              startDate={startDate}
              endDate={endDate}
              totalPrice={totalPrice}
              booking={booking}
            />
          )
        )}
      </div>
      <Footer />
    </>
  );
};

export default TripList;
