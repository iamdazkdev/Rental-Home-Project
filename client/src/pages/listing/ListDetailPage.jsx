/* eslint-disable jsx-a11y/alt-text */
import React, { useEffect, useState } from "react";
import "../../styles/ListingDetails.scss";
import { useParams } from "react-router-dom";
import { API_ENDPOINTS, HTTP_METHODS, CONFIG } from "../../constants/api";
import Loader from "../../components/Loader";

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

  if (loading) return <Loader />;
  if (error) return <div className="listing-details">{error}</div>;
  if (!listing)
    return <div className="listing-details">Listing not found.</div>;

  return (
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
        {listing.type} in {listing.city}, {listing.province}, {listing.country}
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
    </div>
  );
};

export default ListingDetails;
