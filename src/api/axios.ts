import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { normalizeApiError, type ApiError } from "./errors";
import { env } from "../utils/env";
import { logError } from "../utils/logger";
import { clearAuthStorage, tokenStorage } from "../auth/storage";

const baseURL = env.apiUrl;

const attachToken = (config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

const handleUnauthorized = () => {
  clearAuthStorage();
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: false,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const nextConfig = attachToken(config);

  if (import.meta.env.DEV) {
    const method = (nextConfig.method || "GET").toUpperCase();
    logError(`[API REQUEST] ${method} ${nextConfig.baseURL || ""}${nextConfig.url || ""}`);
  }

  return nextConfig;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const normalized = normalizeApiError(error);
    (error as AxiosError & { normalized?: ApiError }).normalized = normalized;

    const method = (error.config?.method || "GET").toUpperCase();
    const url = `${error.config?.baseURL || ""}${error.config?.url || ""}`;
    const status = error.response?.status;
    const responseData = error.response?.data;

    logError("[API ERROR]", {
      method,
      url,
      status,
      message: normalized.message,
      response: responseData,
    });

    if (status === 401 || status === 403) {
      handleUnauthorized();
    } else if (normalized.isNetworkError) {
      logError("Network error:", normalized.message);
    }

    return Promise.reject(error);
  }
);

export default api;
