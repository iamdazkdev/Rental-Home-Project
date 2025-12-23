import "../../styles/List.scss";
import { API_ENDPOINTS, HTTP_METHODS } from "../../constants";
import { useState, useEffect, useMemo } from "react";
import Loader from "../../components/Loader";
import Navbar from "../../components/Navbar";
import { useSelector } from "react-redux";
import ListingCard from "../../components/ListingCard";
import Footer from "../../components/Footer";

const WishList = () => {
  const [loading, setLoading] = useState(true);
  const [wishListListings, setWishListListings] = useState([]);
  const user = useSelector((state) => state.user);
  const wishList = user?.wishList || [];

  // Create a stable reference for wishlist IDs
  const wishListIds = useMemo(() => {
    return wishList.map(item => {
      const id = item?._id || item?.id || item;
      return String(id);
    }).join(',');
  }, [wishList]);

  const getWishListDetails = async () => {
    try {
      setLoading(true);

      if (!wishList || wishList.length === 0) {
        setWishListListings([]);
        setLoading(false);
        return;
      }

      console.log(`📋 Fetching details for ${wishList.length} wishlist items...`);

      // Fetch details for each listing in wishlist
      const listingPromises = wishList.map(async (item) => {
        const listingId = item?._id || item?.id || item;
        try {
          const url = API_ENDPOINTS.LISTINGS.GET_BY_ID(listingId);
          const response = await fetch(url, { method: HTTP_METHODS.GET });
          if (!response.ok) {
            console.error(`❌ Failed to fetch listing ${listingId}`);
            return null;
          }
          const data = await response.json();
          console.log(`✅ Fetched listing: ${data.title || listingId}`);
          return data;
        } catch (err) {
          console.error(`❌ Error fetching listing ${listingId}:`, err);
          return null;
        }
      });

      const listings = await Promise.all(listingPromises);
      // Filter out null values (failed fetches)
      const validListings = listings.filter((listing) => listing !== null);
      console.log(`✅ Successfully loaded ${validListings.length} wishlist items`);
      setWishListListings(validListings);
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching wishlist details:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(`🔄 WishList changed, re-fetching... (${wishList.length} items)`);
    getWishListDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishListIds]); // Re-fetch when wishlist IDs change

  return loading ? (
    <Loader />
  ) : (
    <>
      <Navbar />
      <h1 className="title-list">Your Wish List</h1>
      <div className="list">
        {wishListListings?.length === 0 ? (
          <div className="no-listings">
            <p>Your wish list is empty. Start adding your favorite listings!</p>
          </div>
        ) : (
          wishListListings?.map((listing) => {
            // Validate listing has required data
            if (!listing || !listing._id && !listing.id) {
              console.warn("Invalid listing data:", listing);
              return null;
            }

            return (
              <ListingCard
                key={listing._id || listing.id}
                listingId={listing._id || listing.id}
                creator={listing.creator || {}}
                listingPhotoPaths={listing.listingPhotoPaths || []}
                city={listing.city}
                province={listing.province}
                country={listing.country}
                category={listing.category}
                type={listing.type}
                price={listing.price}
                booking={false}
              />
            );
          })
        )}
      </div>
      <Footer />
    </>
  );
};

export default WishList;

