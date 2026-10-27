import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach Bearer token
api.interceptors.request.use(
  (config) => {
    // Skip token for login endpoint
    if (!config.url?.includes("/api/auth/login")) {
      const token = localStorage.getItem("smartroad_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/api/auth/login");
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem("smartroad_token");
      localStorage.removeItem("smartroad_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?expired=1";
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Extracts a user-friendly error message from an API error response.
 * @param {any} error
 * @returns {string}
 */
export function getErrorMessage(error) {
  if (!error) return "An unknown error occurred.";
  if (typeof error === "string") return error;
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return "Unable to connect to the server. Please verify your connection.";
}

/**
 * Extracts validation field error messages from an API error response.
 * @param {any} error
 * @returns {Record<string, string>}
 */
export function getFieldErrors(error) {
  if (error?.response?.data?.errors && typeof error.response.data.errors === "object") {
    return error.response.data.errors;
  }
  return {};
}

export default api;
