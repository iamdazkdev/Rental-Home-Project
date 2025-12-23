import React, { useState, useRef, useEffect } from "react";
import { IconButton } from "@mui/material";
import {
  Search,
  Person,
  Menu,
  Home,
  FavoriteBorder,
  ListAlt,
  EventNote,
  Logout,
  Login,
  PersonAdd,
  History,
  Assessment,
} from "@mui/icons-material";
import variables from "../styles/variables.scss";
import { CONFIG } from "../constants/api";
import { useSelector, useDispatch } from "react-redux";
import "../styles/Navbar.scss";
import { Link, useNavigate } from "react-router-dom";
import { setLogout } from "../redux/state";

const Navbar = () => {
  const [dropdownMenu, setDropdownMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const dropdownRef = useRef(null);
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(setLogout());
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setDropdownMenu(false);
    navigate("/login");
  };
  return (
    <div className="navbar">
      <div className="navbar_left">
        <Link to="/" className="navbar_logo">
          <img src="/assets/logo.png" alt="Dream Nest Logo" className="logo" />
          <span className="brand_name">Dream Nest</span>
        </Link>
      </div>

      <div className={`navbar_search ${searchFocused ? "focused" : ""}`}>
        <input
          type="text"
          placeholder="Search ..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <IconButton className="search_btn">
          <Search sx={{ color: variables.pinkred }} />
        </IconButton>
      </div>

      <div className="navbar_right">
        <Link to={user ? "/create-listing" : "/login"} className="host_btn">
          <Home sx={{ fontSize: 18, marginRight: 1 }} />
          Become A Host
        </Link>

        <div className="account_section" ref={dropdownRef}>
          <button
            className={`navbar_right_account ${dropdownMenu ? "active" : ""}`}
            onClick={() => setDropdownMenu(!dropdownMenu)}
          >
            <Menu sx={{ color: variables.darkgrey, fontSize: 20 }} />
            {!user ? (
              <Person sx={{ color: variables.darkgrey, fontSize: 24 }} />
            ) : (
              <div className="profile_image_container">
                <img
                  src={(() => {
                    // Check if it's already a full Cloudinary URL
                    if (user.profileImagePath?.startsWith("https://")) {
                      return user.profileImagePath;
                    }

                    // Legacy local path handling
                    const localPath = `${CONFIG.API_BASE_URL}/${
                      user.profileImagePath?.replace("public/", "") || ""
                    }`;
                    return localPath;
                  })()}
                  alt="Profile"
                  className="profile_image"
                />
                <div className="online_indicator"></div>
              </div>
            )}
          </button>

          {dropdownMenu && (
            <div className="navbar_right_accountmenu">
              <div className="menu_header">
                {user && (
                  <div className="user_info">
                    <div className="user_avatar">
                      <img
                        src={(() => {
                          console.log("Dropdown Profile Image Debug:");
                          console.log(
                            "- user.profileImagePath:",
                            user.profileImagePath
                          );

                          // Check if it's already a full Cloudinary URL
                          if (user.profileImagePath?.startsWith("https://")) {
                            console.log(
                              "- Using Cloudinary URL directly:",
                              user.profileImagePath
                            );
                            return user.profileImagePath;
                          }

                          // Legacy local path handling
                          const localPath = `${CONFIG.API_BASE_URL}/${
                            user.profileImagePath?.replace("public/", "") || ""
                          }`;
                          console.log("- Using local path:", localPath);
                          return localPath;
                        })()}
                        alt="Profile"
                      />
                    </div>
                    <div className="user_details">
                      <h4>
                        {user.firstName} {user.lastName}
                      </h4>
                      <p>{user.email}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="menu_divider"></div>

              {!user ? (
                <div className="menu_section">
                  <Link
                    to="/login"
                    className="menu_item"
                    onClick={() => setDropdownMenu(false)}
                  >
                    <Login sx={{ fontSize: 20 }} />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/register"
                    className="menu_item"
                    onClick={() => setDropdownMenu(false)}
                  >
                    <PersonAdd sx={{ fontSize: 20 }} />
                    <span>Sign Up</span>
                  </Link>
                </div>
              ) : (
                <div className="menu_section">
                  <Link
                    to={`/${user._id || user.id}/trips`}
                    className="menu_item"
                    onClick={() => setDropdownMenu(false)}
                  >
                    <ListAlt sx={{ fontSize: 20 }} />
                    <span>Trip List</span>
                  </Link>
                  <Link
                    to="/booking-history"
                    className="menu_item"
                    onClick={() => setDropdownMenu(false)}
                  >
                    <History sx={{ fontSize: 20 }} />
                    <span>Booking History</span>
                  </Link>
                  <Link
                    to={`/${user._id || user.id}/wishlist`}
                    className="menu_item"
                    onClick={() => setDropdownMenu(false)}
                  >
                    <FavoriteBorder sx={{ fontSize: 20 }} />
                    <span>Wish List</span>
                  </Link>

                  <div className="menu_divider"></div>

                  <Link
                    to="/properties"
                    className="menu_item"
                    onClick={() => setDropdownMenu(false)}
                  >
                    <Home sx={{ fontSize: 20 }} />
                    <span>Property List</span>
                  </Link>
                  <Link
                    to="/reservations"
                    className="menu_item"
                    onClick={() => setDropdownMenu(false)}
                  >
                    <EventNote sx={{ fontSize: 20 }} />
                    <span>Reservation List</span>
                  </Link>
                  <Link
                    to="/hosting-history"
                    className="menu_item"
                    onClick={() => setDropdownMenu(false)}
                  >
                    <Assessment sx={{ fontSize: 20 }} />
                    <span>Hosting History</span>
                  </Link>

                  <div className="menu_divider"></div>

                  {/* <Link
                    to="/create-listing"
                    className="menu_item"
                    onClick={() => setDropdownMenu(false)}
                  >
                    <Home sx={{ fontSize: 20 }} />
                    <span>Become A Host</span>
                  </Link> */}

                  <div className="menu_divider"></div>

                  <button
                    className="menu_item logout_btn"
                    onClick={handleLogout}
                  >
                    <Logout sx={{ fontSize: 20 }} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
