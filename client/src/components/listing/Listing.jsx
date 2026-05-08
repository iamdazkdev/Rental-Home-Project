/* eslint-disable no-unused-vars */
import { useEffect, useState, useCallback, useMemo } from "react";
import { categories } from "../../data";
import "../../styles/Listings.scss";
import ListingCard from "./ListingCard";
import Loader from "../ui/Loader";
import { useDispatch, useSelector } from "react-redux";
import { HTTP_METHODS, CONFIG } from "../../constants/api";
import { setListings } from "../../redux/slices/listingsSlice";
const Listing = ({ selectedType }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const listings = useSelector((state) => state.listings.listings);
  const user = useSelector((state) => state.user.profile);
  const currentUserId = user?._id || user?.id;
  const getFeedListing = useCallback(async () => {
    try {
      setLoading(true);
      const url =
        selectedCategory !== "All"
          ? `${CONFIG.API_BASE_URL}/listing?category=${selectedCategory}`
          : `${CONFIG.API_BASE_URL}/listing`;
      const response = await fetch(url, {
        method: HTTP_METHODS.GET,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched listings:", data);
      dispatch(setListings({ listings: data }));
    } catch (error) {
      console.error("Error fetching listings:", error.message);
      dispatch(setListings({ listings: [] }));
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, dispatch]);

  useEffect(() => {
    getFeedListing();
  }, [getFeedListing]);
  const filteredListings = useMemo(() => {
    if (!listings || listings.length === 0) return [];
    
    return listings.filter((listing) => {
      // Filter out user's own listings
      const creatorId = listing.creator?._id || listing.creator?.id || listing.creator;
      const notOwnListing = currentUserId ? String(creatorId) !== String(currentUserId) : true;

      // Filter by selected type
      const matchesType = selectedType ? listing.type === selectedType : true;

      return notOwnListing && matchesType;
    });
  }, [listings, currentUserId, selectedType]);

  return (
    <>
      <div className="category-list">
        {categories?.map((category, index) => {
          const isSelected = selectedCategory === category.label;
          return (
            <div
              className={`category ${isSelected ? "selected" : ""}`}
              key={index}
              onClick={() => setSelectedCategory(category.label)}
              role="button"
              aria-pressed={isSelected}
            >
              <div className="category_icon">{category.icon}</div>
              <p>{category.label}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="listings">
          {filteredListings.length > 0 ? (
            filteredListings.map(
              ({
                _id,
                id,
                creator,
                listingPhotoPaths,
                city,
                province,
                country,
                category,
                type,
                price,
                booking = false,
              }) => {
                const listingId = id || _id;
                if (!listingId) return null;
                return (
                  <ListingCard
                    key={listingId}
                    listingId={listingId}
                    creator={creator}
                    listingPhotoPaths={listingPhotoPaths}
                    city={city}
                    province={province}
                    country={country}
                    category={category}
                    type={type}
                    price={price}
                    booking={booking}
                  />
                );
              }
            )
          ) : (
            <div className="no-listings">
              <p>No listings found. Try a different category.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Listing;
