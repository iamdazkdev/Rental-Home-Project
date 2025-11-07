/* eslint-disable no-unused-vars */
import { useEffect, useState, useCallback } from "react";
import { categories } from "../data";
import "../styles/Listings.scss";
import ListingCard from "./ListingCard";
import Loader from "./Loader";
import { useDispatch, useSelector } from "react-redux";
import { API_ENDPOINTS, HTTP_METHODS, CONFIG } from "../constants/api";
import { setListings } from "../redux/state";
const Listing = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const listings = useSelector((state) => state.listings);
  const getFeedListing = useCallback(async () => {
    try {
      setLoading(true);
      const url =
        selectedCategory !== "All"
          ? `${CONFIG.API_BASE_URL}/listing?category=${selectedCategory}`
          : `${CONFIG.API_BASE_URL}/listing`;

      console.log("Fetching from URL:", url);

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
      // Set empty array on error
      dispatch(setListings({ listings: [] }));
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, dispatch]);

  useEffect(() => {
    getFeedListing();
  }, [getFeedListing]);
  return (
    <div className="category-list">
      {categories?.map((category, index) => (
        <div
          className={`category`}
          key={index}
          onClick={() => setSelectedCategory(category.label)}
        >
          <div className="category_icon">{category.icon}</div>
          <p>{category.label}</p>
        </div>
      ))}
    </div>
  );
};

export default Listing;
