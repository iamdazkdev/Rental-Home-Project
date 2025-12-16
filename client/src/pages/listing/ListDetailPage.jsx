/* eslint-disable jsx-a11y/alt-text */
import React, { useEffect, useState } from "react";
import "../../styles/ListingDetails.scss";
import { useParams } from "react-router-dom";
import { API_ENDPOINTS, HTTP_METHODS, CONFIG } from "../../constants/api";
import Loader from "../../components/Loader";
import { facilities } from "../../data";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { DateRange } from "react-date-range";
import { enUS } from "date-fns/locale";
import Navbar from "../../components/Navbar";

const ListingDetails = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { listingId } = useParams();
  const [listing, setListing] = useState(null);

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
      getListingDetails();
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
            <h3>
              Hosted by {listing.creator.firstName} {listing.creator.lastName}
            </h3>
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

          <button className="button" type="submit">
            BOOKING
          </button>
        </div>
      </div>
    </>
  );
};

export default ListingDetails;
