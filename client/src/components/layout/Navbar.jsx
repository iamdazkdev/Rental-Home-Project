import React, {useCallback, useEffect, useRef, useState} from "react";
import {IconButton} from "@mui/material";
import {
    Assessment,
    EventNote,
    FavoriteBorder,
    History,
    Home,
    ListAlt,
    Login,
    Logout,
    Menu,
    Person,
    PersonAdd,
    Search,
    Settings,
} from "@mui/icons-material";
import variables from "../../styles/variables.scss";
import {CONFIG} from "../../constants/api";
import {useDispatch, useSelector} from "react-redux";
import "../../styles/Navbar.scss";
import {Link, useNavigate} from "react-router-dom";
import { clearUser } from "../../redux/slices/userSlice";
import { clearToken } from "../../redux/slices/authSlice";
import NotificationDropdown from "../common/NotificationDropdown";
import { useSocket } from "../../context/SocketContext";

const Navbar = () => {
    const [dropdownMenu, setDropdownMenu] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const [expandedSections, setExpandedSections] = useState({
        entirePlace: false,
        roomRental: false,
        roommate: false,
    });
    const dropdownRef = useRef(null);
    const user = useSelector((state) => state.user.profile);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { socket } = useSocket();

    const toggleSection = useCallback((section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    }, []);

    // Fetch unread message count
    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;

        try {
            const userId = user?._id || user?.id;

            if (!userId) {
                console.warn("⚠️ Cannot fetch unread count: userId is undefined. User object:", user);
                return;
            }

            const response = await fetch(
                `${CONFIG.API_BASE_URL}/messages/unread/${userId}`
            );

            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.totalUnread || 0);
            }
        } catch (error) {
            console.error("Error fetching unread count:", error);
            setUnreadCount(0);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            
            if (socket) {
                socket.on("receive_message", fetchUnreadCount);
                return () => socket.off("receive_message", fetchUnreadCount);
            }
        }
    }, [user, fetchUnreadCount, socket]);

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

    const handleLogout = useCallback(() => {
        dispatch(clearUser());
        dispatch(clearToken());
        setDropdownMenu(false);
        navigate("/login");
    }, [dispatch, navigate]);

    const handleSearch = useCallback((e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            navigate("/search");
        }
    }, [searchQuery, navigate]);
    return (
        <div className="navbar">
            <div className="navbar_left">
                <Link to="/" className="navbar_logo">
                    <img src="/assets/logo/rento_logo.jpeg" alt="Rento Logo" className="logo"/>
                    <span className="brand_name">Rento</span>
                </Link>
            </div>

            <div className={`navbar_search ${searchFocused ? "focused" : ""}`}>
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Search ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                    />
                    <IconButton className="search_btn" type="submit">
                        <Search sx={{color: variables.pinkred}}/>
                    </IconButton>
                </form>
            </div>

            <div className="navbar_right">
                <Link to={user ? "/create-listing" : "/login"} className="host_btn">
                    <Home sx={{fontSize: 18, marginRight: 1}}/>
                    Become A Host
                </Link>

                {/* Notification Bell */}
                {user && <NotificationDropdown user={user}/>}

                <div className="account_section" ref={dropdownRef}>
                    <button
                        className={`navbar_right_account ${dropdownMenu ? "active" : ""}`}
                        onClick={() => setDropdownMenu(!dropdownMenu)}
                    >
                        <Menu sx={{color: variables.darkgrey, fontSize: 20}}/>
                        {!user ? (
                            <Person sx={{color: variables.darkgrey, fontSize: 24}}/>
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
                                    <Link
                                        to={`/host/${user._id}`}
                                        className="user_info clickable"
                                        onClick={() => setDropdownMenu(false)}
                                        title="View my profile"
                                    >
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
                                    </Link>
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
                                        <Login sx={{fontSize: 20}}/>
                                        <span>Login</span>
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="menu_item"
                                        onClick={() => setDropdownMenu(false)}
                                    >
                                        <PersonAdd sx={{fontSize: 20}}/>
                                        <span>Sign Up</span>
                                    </Link>
                                </div>
                            ) : (
                                <div className="menu_section">
                                    {/* Admin-only menu - Only Admin Dashboard + Logout */}
                                    {user.role === 'admin' ? (
                                        <>
                                            <Link
                                                to="/admin/dashboard"
                                                className="menu_item admin-only"
                                                onClick={() => setDropdownMenu(false)}
                                            >
                                                <Settings sx={{fontSize: 20}}/>
                                                <span>🔐 Admin Dashboard</span>
                                            </Link>

                                            <div className="menu_divider"></div>

                                            <button
                                                className="menu_item logout_btn"
                                                onClick={handleLogout}
                                            >
                                                <Logout sx={{fontSize: 20}}/>
                                                <span>Logout</span>
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {/* Quick Access Section */}
                                            <Link
                                                to="/messages"
                                                className="menu_item"
                                                onClick={() => setDropdownMenu(false)}
                                            >
                                                <span className="menu_icon">💬</span>
                                                <span>Messages</span>
                                                {unreadCount > 0 && (
                                                    <span className="unread_badge">{unreadCount}</span>
                                                )}
                                            </Link>
                                            <Link
                                                to={`/${user._id}/wishlist`}
                                                className="menu_item"
                                                onClick={() => setDropdownMenu(false)}
                                            >
                                                <FavoriteBorder sx={{fontSize: 20}}/>
                                                <span>Wish List</span>
                                            </Link>

                                            <div className="menu_divider"></div>

                                            {/* Entire Place Rental Section - Collapsible */}
                                            <div className="menu_section_collapsible">
                                                <div
                                                    className="menu_item menu_section_header"
                                                    onClick={() => toggleSection('entirePlace')}
                                                >
                                                    <Home sx={{fontSize: 20}}/>
                                                    <span>🏡 Entire Place Rental</span>
                                                    <span
                                                        className="expand_icon">{expandedSections.entirePlace ? '▼' : '▶'}</span>
                                                </div>

                                                {expandedSections.entirePlace && (
                                                    <div className="menu_subsection">
                                                        <div className="menu_subgroup_title">Guest</div>
                                                        <Link
                                                            to={`/${user._id}/trips`}
                                                            className="menu_item menu_subitem"
                                                            onClick={() => setDropdownMenu(false)}
                                                        >
                                                            <ListAlt sx={{fontSize: 18}}/>
                                                            <span>My Trips</span>
                                                        </Link>
                                                        <Link
                                                            to="/booking-history"
                                                            className="menu_item menu_subitem"
                                                            onClick={() => setDropdownMenu(false)}
                                                        >
                                                            <History sx={{fontSize: 18}}/>
                                                            <span>Booking History</span>
                                                        </Link>

                                                        <div className="menu_subgroup_divider"></div>
                                                        <div className="menu_subgroup_title">Host</div>
                                                        <Link
                                                            to="/properties"
                                                            className="menu_item menu_subitem"
                                                            onClick={() => setDropdownMenu(false)}
                                                        >
                                                            <Home sx={{fontSize: 18}}/>
                                                            <span>Entire Place Listings</span>
                                                        </Link>
                                                        <Link
                                                            to="/reservations"
                                                            className="menu_item menu_subitem"
                                                            onClick={() => setDropdownMenu(false)}
                                                        >
                                                            <EventNote sx={{fontSize: 18}}/>
                                                            <span>Booking Requests</span>
                                                        </Link>
                                                        <Link
                                                            to="/hosting-history"
                                                            className="menu_item menu_subitem"
                                                            onClick={() => setDropdownMenu(false)}
                                                        >
                                                            <Assessment sx={{fontSize: 18}}/>
                                                            <span>Revenue</span>
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="menu_divider"></div>

                                            {/* Room Rental Section - Collapsible */}
                                            <div className="menu_section_collapsible">
                                                <div
                                                    className="menu_item menu_section_header"
                                                    onClick={() => toggleSection('roomRental')}
                                                >
                                                    <Home sx={{fontSize: 20}}/>
                                                    <span>🏠 Room Rental</span>
                                                    <span
                                                        className="expand_icon">{expandedSections.roomRental ? '▼' : '▶'}</span>
                                                </div>

                                                {expandedSections.roomRental && (
                                                    <div className="menu_subsection">
                                                        <div className="menu_subgroup_title">Tenant</div>
                                                        {/*<Link*/}
                                                        {/*  to="/room-rental"*/}
                                                        {/*  className="menu_item menu_subitem"*/}
                                                        {/*  onClick={() => setDropdownMenu(false)}*/}
                                                        {/*>*/}
                                                        {/*  <Search sx={{ fontSize: 18 }} />*/}
                                                        {/*  <span>Browse Rooms</span>*/}
                                                        {/*</Link>*/}
                                                        <Link
                                                            to="/room-rental/my-requests"
                                                            className="menu_item menu_subitem"
                                                            onClick={() => setDropdownMenu(false)}
                                                        >
                                                            <ListAlt sx={{fontSize: 18}}/>
                                                            <span>My Requests</span>
                                                        </Link>
                                                        <Link
                                                            to="/room-rental/my-agreements"
                                                            className="menu_item menu_subitem"
                                                            onClick={() => setDropdownMenu(false)}
                                                        >
                                                            <EventNote sx={{fontSize: 18}}/>
                                                            <span>My Agreements</span>
                                                        </Link>
                                                        <Link
                                                            to="/room-rental/my-rentals"
                                                            className="menu_item menu_subitem"
                                                            onClick={() => setDropdownMenu(false)}
                                                        >
                                                            <Home sx={{fontSize: 18}}/>
                                                            <span>My Rentals</span>
                                                        </Link>
                                                        <Link
                                                            to="/room-rental/my-payments"
                                                            className="menu_item menu_subitem"
                                                            onClick={() => setDropdownMenu(false)}
                                                        >
                                                            <Assessment sx={{fontSize: 18}}/>
                                                            <span>Payments</span>
                                                        </Link>

                                                        <div className="menu_subgroup_divider"></div>
                                                        <div className="menu_subgroup_title">Host</div>
                                                        <Link
                                                            to="/room-rental/my-rooms"
                                                            className="menu_item menu_subitem"
                                                            onClick={() => setDropdownMenu(false)}
                                                        >
                                                            <Home sx={{fontSize: 18}}/>
                                                            <span>My Rooms</span>
                                                        </Link>
                                                        <Link
                                                            to="/room-rental/host/requests"
                                                            className="menu_item menu_subitem"
                                                            onClick={() => setDropdownMenu(false)}
                                                        >
                                                            <ListAlt sx={{fontSize: 18}}/>
                                                            <span>Rental Requests</span>
                                                        </Link>
                                                        <Link
                                                            to="/room-rental/host/agreements"
                                                            className="menu_item menu_subitem"
                                                            onClick={() => setDropdownMenu(false)}
                                                        >
                                                            <EventNote sx={{fontSize: 18}}/>
                                                            <span>Agreements</span>
                                                        </Link>
                                                        <Link
                                                            to="/room-rental/host/rentals"
                                                            className="menu_item menu_subitem"
                                                            onClick={() => setDropdownMenu(false)}
                                                        >
                                                            <Home sx={{fontSize: 18}}/>
                                                            <span>Active Rentals</span>
                                                        </Link>
                                                        <Link
                                                            to="/room-rental/host/payments"
                                                            className="menu_item menu_subitem"
                                                            onClick={() => setDropdownMenu(false)}
                                                        >
                                                            <Assessment sx={{fontSize: 18}}/>
                                                            <span>Payments</span>
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="menu_divider"></div>

                                            {/* Roommate Section - Collapsible */}
                                            <div className="menu_section_collapsible">
                                                <div
                                                    className="menu_item menu_section_header"
                                                    onClick={() => toggleSection('roommate')}
                                                >
                                                    <span className="menu_icon">👥</span>
                                                    <span>Find Roommate</span>
                                                    <span
                                                        className="expand_icon">{expandedSections.roommate ? '▼' : '▶'}</span>
                                                </div>

                                                {expandedSections.roommate && (
                                                    <div className="menu_subsection">
                                                        {/*<Link*/}
                                                        {/*    to="/roommate/search"*/}
                                                        {/*    className="menu_item menu_subitem"*/}
                                                        {/*    onClick={() => setDropdownMenu(false)}*/}
                                                        {/*>*/}
                                                        {/*    <Search sx={{fontSize: 18}}/>*/}
                                                        {/*    <span>Find Roommates</span>*/}
                                                        {/*</Link>*/}
                                                        <Link
                                                            to="/roommate/my-posts"
                                                            className="menu_item menu_subitem"
                                                            onClick={() => setDropdownMenu(false)}
                                                        >
                                                            <ListAlt sx={{fontSize: 18}}/>
                                                            <span>My Posts</span>
                                                        </Link>
                                                        <Link
                                                            to="/roommate/my-requests"
                                                            className="menu_item menu_subitem"
                                                            onClick={() => setDropdownMenu(false)}
                                                        >
                                                            <EventNote sx={{fontSize: 18}}/>
                                                            <span>My Requests</span>
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="menu_divider"></div>

                                            <Link
                                                to="/profile/edit"
                                                className="menu_item"
                                                onClick={() => setDropdownMenu(false)}
                                            >
                                                <Settings sx={{fontSize: 20}}/>
                                                <span>Settings</span>
                                            </Link>

                                            <Link
                                                to="/admin/manage"
                                                className="menu_item"
                                                onClick={() => setDropdownMenu(false)}
                                            >
                                                <Settings sx={{fontSize: 20}}/>
                                                <span>📊 Manage Data</span>
                                            </Link>

                                            <div className="menu_divider"></div>

                                            <button
                                                className="menu_item logout_btn"
                                                onClick={handleLogout}
                                            >
                                                <Logout sx={{fontSize: 20}}/>
                                                <span>Logout</span>
                                            </button>
                                        </>
                                    )}
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
