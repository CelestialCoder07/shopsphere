// =====================================================
// API CLIENT
// =====================================================
// A single axios instance owns the base URL, the auth header
// and error normalisation, so no page ever hardcodes a host.

import axios from "axios";
import { readToken, clearSession } from "../utils/storage";

const DEFAULT_BASE_URL = "http://localhost:5000/api";
const REQUEST_TIMEOUT_MS = 20000;
const UNAUTHORIZED = 401;

// Fired when the server rejects our token, so the auth state
// in React can drop the session too.
export const SESSION_EXPIRED_EVENT = "shopsphere:session-expired";

export const API_BASE_URL =
    import.meta.env.VITE_API_URL || DEFAULT_BASE_URL;

// An error carrying the server's message and HTTP status, so
// UI code can just read `error.message`.
export class ApiError extends Error {
    constructor(message, status, payload) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.payload = payload;
    }
}

const isLoginRequest = (config) => {
    return Boolean(config?.url?.includes("/auth/login"));
};

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT_MS
});

// -----------------------------------------------------
// Request: attach the bearer token
// -----------------------------------------------------

api.interceptors.request.use((config) => {
    const token = readToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// -----------------------------------------------------
// Response: normalise failures into ApiError
// -----------------------------------------------------

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status ?? null;
        const payload = error.response?.data ?? null;

        // An expired or revoked token should not keep being
        // sent. A failed login is not an expired session.
        if (status === UNAUTHORIZED && !isLoginRequest(error.config)) {
            clearSession();
            window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
        }

        let message =
            payload?.message ||
            error.message ||
            "Something went wrong. Please try again.";

        if (error.code === "ECONNABORTED") {
            message = "The request timed out. Please try again.";
        } else if (!error.response) {
            message =
                "Cannot reach the ShopSphere server. Is it running on " +
                `${API_BASE_URL}?`;
        }

        return Promise.reject(new ApiError(message, status, payload));
    }
);

// Unwraps `response.data` so callers work with the payload directly.
export const request = async (config) => {
    const response = await api.request(config);
    return response.data;
};

export default api;
