import axios from "axios";
import API_BASE_URL from "../config/api";
import { store } from "../redux/store";
import { clearUser } from "../redux/slices/userSlice";
import { clearToken } from "../redux/slices/authSlice";

/**
 * Configured Axios instance with:
 * - Base URL from config
 * - Automatic Authorization header from Redux store
 * - 401 response interceptor (auto-logout on expired token)
 */
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor — attach token
api.interceptors.request.use(
    (config) => {
        const state = store.getState();
        const token = state.auth.token;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (expired token)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid — logout user
            store.dispatch(clearUser());
            store.dispatch(clearToken());
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;
