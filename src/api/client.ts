import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios";
import { isApiError } from "../types/api";
import { tokenStorage } from "../lib/api";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Create axios instance with standardized configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds as required
  withCredentials: true, // Include cookies for authentication
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors consistently
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // Create standardized ApiError
    const apiError: ApiError = new Error(error.message || "API request failed");
    
    if (error.code === "ERR_NETWORK") {
      apiError.isNetworkError = true;
      apiError.message = "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.";
    } else if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      apiError.isTimeout = true;
      apiError.message = "Request timeout. Vui lòng thử lại.";
    } else if (error.response) {
      apiError.status = error.response.status;
      apiError.message = error.response.data?.message || error.message;
      apiError.code = error.response.data?.errorCode;
    } else if (error.name === "AbortError") {
      apiError.isAbort = true;
      apiError.message = "Request bị hủy.";
    }

    return Promise.reject(apiError);
  },
);

export { api };