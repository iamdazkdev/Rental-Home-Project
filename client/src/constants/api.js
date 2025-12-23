/**
 * API Constants for Rental Home Project Client
 * Centralized API configuration and endpoints
 */

// Environment Variables
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://your-railway-app.railway.app"
    : "http://localhost:3001");
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT);
const MAX_FILE_SIZE = parseInt(process.env.REACT_APP_MAX_FILE_SIZE); // 10MB
const MAX_FILES_PER_LISTING =
  parseInt(process.env.REACT_APP_MAX_FILES_PER_LISTING) || 10;
const ALLOWED_FILE_TYPES = process.env.REACT_APP_ALLOWED_FILE_TYPES?.split(
  ","
) || ["image/jpeg", "image/png", "image/webp"];
const PAGINATION_LIMIT = parseInt(process.env.REACT_APP_PAGINATION_LIMIT) || 12;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    VERIFY_TOKEN: `${API_BASE_URL}/auth/verify-reset-token`,
    REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  },

  // Listing endpoints
  LISTINGS: {
    CREATE: `${API_BASE_URL}/listing/create`,
    GET_ALL: `${API_BASE_URL}/listing`,
    GET_BY_ID: (id) => `${API_BASE_URL}/listing/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/listing/${id}`,
    DELETE: (id) => `${API_BASE_URL}/listing/${id}`,
    GET_BY_CATEGORY: (category) =>
      `${API_BASE_URL}/listing/category/${category}`,
    GET_BY_SEARCH: `${API_BASE_URL}/listing/search`,
    GET_USER_LISTINGS: (userId) => `${API_BASE_URL}/listing/user/${userId}`,
  },
  // User endpoints
  USERS: {
    PROFILE: `${API_BASE_URL}/user/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/user/profile`,
    GET_TRIPS: (id) => `${API_BASE_URL}/user/${id}/trips`,
    UPLOAD_AVATAR: `${API_BASE_URL}/user/avatar`,
    PATCH_WIST_LIST: (userId, listingId) => `${API_BASE_URL}/user/${userId}/${listingId}`,
  },

  WISHLISTS: {
    PROFILE: `${API_BASE_URL}/user/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/user/profile`,
    GET_TRIPS: (id) => `${API_BASE_URL}/user/${id}/trips`,
    UPLOAD_AVATAR: `${API_BASE_URL}/user/avatar`,
  },
  // Booking endpoints
  BOOKINGS: {
    CREATE: `${API_BASE_URL}/booking/create`,
    GET_USER_BOOKINGS: (userId) => `${API_BASE_URL}/booking/user/${userId}`,
    GET_BOOKING: (id) => `${API_BASE_URL}/booking/${id}`,
    GET_HOST_RESERVATIONS: `${API_BASE_URL}/booking/host`,
    ACCEPT: `${API_BASE_URL}/booking`,
    REJECT: `${API_BASE_URL}/booking`,
    UPDATE_STATUS: (id) => `${API_BASE_URL}/booking/${id}/status`,
    CANCEL: (id) => `${API_BASE_URL}/booking/${id}/cancel`,
  },

  // Notification endpoints
  NOTIFICATIONS: {
    GET_USER: (userId) => `${API_BASE_URL}/notifications/${userId}`,
    MARK_READ: (notificationId) => `${API_BASE_URL}/notifications/${notificationId}/read`,
    MARK_ALL_READ: (userId) => `${API_BASE_URL}/notifications/user/${userId}/read-all`,
    DELETE: (notificationId) => `${API_BASE_URL}/notifications/${notificationId}`,
  },

  // Review endpoints
  REVIEWS: {
    CREATE: `${API_BASE_URL}/reviews`,
    GET_LISTING: (listingId) => `${API_BASE_URL}/reviews/listing/${listingId}`,
    GET_USER: (userId) => `${API_BASE_URL}/reviews/user/${userId}`,
    UPDATE: (reviewId) => `${API_BASE_URL}/reviews/${reviewId}`,
    DELETE: (reviewId) => `${API_BASE_URL}/reviews/${reviewId}`,
  },

  // Upload endpoints
  UPLOADS: {
    IMAGES: `${API_BASE_URL}/upload/images`,
    PROFILE_IMAGE: `${API_BASE_URL}/upload/profile`,
  },

  // Base URL for images
  API_BASE_URL: API_BASE_URL,
};

// HTTP Methods
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
};

// Request Headers
export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// File Upload Headers
export const UPLOAD_HEADERS = {
  // Don't set Content-Type for multipart/form-data - let browser set it
  Accept: "application/json",
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Response Status
export const RESPONSE_STATUS = {
  SUCCESS: "success",
  ERROR: "error",
  LOADING: "loading",
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER_DATA: "userData",
  THEME: "theme",
  LANGUAGE: "language",
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  SERVER_ERROR: "Server error. Please try again later.",
  UNAUTHORIZED: "You are not authorized. Please login again.",
  FORBIDDEN: "You do not have permission to access this resource.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  TIMEOUT_ERROR: "Request timeout. Please try again.",
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Login successful!",
  REGISTER_SUCCESS: "Registration successful! Please verify your email.",
  LOGOUT_SUCCESS: "Logged out successfully.",
  PROFILE_UPDATE_SUCCESS: "Profile updated successfully.",
  LISTING_CREATE_SUCCESS: "Listing created successfully.",
  LISTING_UPDATE_SUCCESS: "Listing updated successfully.",
  LISTING_DELETE_SUCCESS: "Listing deleted successfully.",
};

// Configuration Constants
export const CONFIG = {
  API_TIMEOUT,
  MAX_FILE_SIZE,
  MAX_FILES_PER_LISTING,
  ALLOWED_FILE_TYPES,
  PAGINATION_LIMIT,
  API_BASE_URL,
};

const constants = {
  API_ENDPOINTS,
  HTTP_METHODS,
  DEFAULT_HEADERS,
  UPLOAD_HEADERS,
  API_CONFIG,
  RESPONSE_STATUS,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CONFIG,
};

export default constants;
