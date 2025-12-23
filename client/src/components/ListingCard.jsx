/* eslint-disable jsx-a11y/img-redundant-alt */
import "../styles/ListingCard.scss";
import {CONFIG, DEFAULT_HEADERS} from "../constants";
import { ArrowForwardIos, ArrowBackIosNew, Favorite } from "@mui/icons-material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
// import { API_ENDPOINTS, HTTP_METHODS } from "../../constants";
import {API_ENDPOINTS, HTTP_METHODS} from "../constants/api";
import {setWishList} from "../redux/state";
const ListingCard = ({
  listingId,
  creator,
  listingPhotoPaths,
  city,
  province,
  country,
  category,
  type,
  price,
  startDate,
  endDate,
  totalPrice,
  booking,
  isExtended,
  onCheckout,
  onReview,
  onExtend,
}) => {
  /* SLIDER FOR IMAGES */
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevSlide = () => {
    setCurrentIndex(
      (prevIndex) =>
        (prevIndex - 1 + listingPhotoPaths.length) % listingPhotoPaths.length
    );
  };

  const goToNextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % listingPhotoPaths.length);
  };

  const navigate = useNavigate();
  const handleNavigateToDetails = () => {
    navigate(`/listing/${listingId}`);
  };

  const dispatch = useDispatch();
  // ADD TO WISHLIST
  const user = useSelector((state) => state.user);
  const wishList = user?.wishList || [];

  // Check if listing is in wishlist - handle both object and string formats
  const isLiked = wishList?.find((item) => {
    const itemId = item?._id || item?.id || item;
    return String(itemId) === String(listingId);
  });

  const patchWishList = async () => {
    // Check if user is logged in - check both id and _id
    const userId = user?._id || user?.id;

    if (!userId) {
      console.log("❌ User not logged in - no userId found");
      return;
    }

    console.log(`🔍 User ID found: ${userId}`);

    // Only check creator when ADDING (not when REMOVING)
    if (!isLiked) {
      // We're trying to ADD to wishlist
      const creatorId = creator?._id || creator?.id;

      if (!creatorId) {
        console.log("⚠️ Creator information not available - cannot add to wishlist");
        return;
      }

      if (String(userId) === String(creatorId)) {
        console.log("⚠️ Cannot add own listing to wishlist");
        return;
      }
    }

    // Call API to toggle wishlist
    try {
      const url = API_ENDPOINTS.USERS.PATCH_WIST_LIST(userId, listingId);
      console.log(`🔄 ${isLiked ? 'Removing from' : 'Adding to'} wishlist...`);

      const response = await fetch(url, {
        method: HTTP_METHODS.PATCH,
        headers: DEFAULT_HEADERS,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update wishlist: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ ${data.message}`);

      // Update Redux state
      dispatch(setWishList(data.wishList));
    } catch (error) {
      console.error("❌ Error updating wishlist:", error);
    }
  }
  return (
    <div className="listing-card" onClick={handleNavigateToDetails}>
      <div className="slider-container">
        <div
          className="slider"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {listingPhotoPaths?.map((photo, index) => (
            <div key={index} className="slide">
              <img
                src={(() => {
                  // console.log("ListingCard Image Debug:");
                  // Check if it's already a full Cloudinary URL
                  if (photo?.startsWith("https://")) {
                    // console.log("- Using Cloudinary URL directly:", photo);
                    return photo;
                  }
                  // Legacy local path handling
                  const localPath = `${CONFIG.API_BASE_URL}/${
                    photo?.replace("public/", "") || ""
                  }`;
                  // console.log("- Using local path:", localPath);
                  return localPath;
                })()}
                alt={`photo ${index + 1}`}
              />
              <div
                className="prev-button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevSlide(e);
                }}
              >
                <ArrowBackIosNew sx={{ fontSize: "15px" }} />
              </div>
              <div
                className="next-button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextSlide(e);
                }}
              >
                <ArrowForwardIos sx={{ fontSize: "15px" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <h3>
        {city}, {province}, {country}
      </h3>
      <p>{category}</p>
      {!booking ? (
        <>
          <p>{type}</p>
          <p>
            <span>${price}</span>
            &nbsp;per night
          </p>
        </>
      ) : (
        <>
          {" "}
          <p>
            {startDate} - {endDate}
            {isExtended && (
              <span className="extended-badge"> Extended</span>
            )}
          </p>
          <p>
            <span>${typeof totalPrice === 'number' ? totalPrice.toFixed(2) : totalPrice}</span>
            &nbsp;total
            {isExtended && (
              <span className="updated-badge"> Updated</span>
            )}
          </p>
        </>
      )}

      {/* Action Buttons for Bookings */}
      {booking && (
        <div className="booking-actions">
          {onCheckout && (
            <button
              className="action-btn checkout-btn"
              onClick={(e) => {
                e.stopPropagation();
                onCheckout();
              }}
            >
              🏠 Check Out
            </button>
          )}
          {onReview && (
            <button
              className="action-btn review-btn"
              onClick={(e) => {
                e.stopPropagation();
                onReview();
              }}
            >
              ⭐ Review
            </button>
          )}
          {onExtend && (
            <button
              className="action-btn extend-btn"
              onClick={(e) => {
                e.stopPropagation();
                onExtend();
              }}
            >
              📅 Extend Stay
            </button>
          )}
        </div>
      )}

      <button
        className="favorite"
        disabled={!user}
        onClick={(e) => {
          e.stopPropagation();
          patchWishList();
        }}
      >
        {isLiked ? (
          <Favorite sx={{color: "red"}}/>
        ) : (
          <Favorite sx={{color: "white"}}/>
        )}
      </button>
    </div>
  );
};

export default ListingCard;
