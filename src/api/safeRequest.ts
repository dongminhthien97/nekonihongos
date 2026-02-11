import axios, { type AxiosRequestConfig, type CancelToken } from "axios";
import { isApiResponse, type ApiResponse, type ApiError } from "../types/api";
import { tokenStorage } from "../lib/api";

// Backend readiness state
let backendReady = false;
let backendReadyPromise: Promise<void> | null = null;

/**
 * Wait for backend to be ready before making requests
 */
async function waitForBackendReady(): Promise<void> {
  if (backendReady) return;

  if (backendReadyPromise) {
    return backendReadyPromise;
  }

  backendReadyPromise = new Promise<void>((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error("Backend readiness check timeout after 60s"));
    }, 60000);

    const checkHealth = async () => {
      try {
        const response = await axios.get("/health", {
          baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
          timeout: 5000,
          signal: controller.signal,
        });

        if (response.status === 200) {
          clearTimeout(timeoutId);
          backendReady = true;
          resolve();
        } else {
          throw new Error("Backend not ready");
        }
      } catch (error: any) {
        if (error.name === "AbortError" || error.code === "ECONNABORTED") {
          clearTimeout(timeoutId);
          reject(new Error("Backend readiness check aborted"));
          return;
        }

        // Retry after 2 seconds
        setTimeout(checkHealth, 2000);
      }
    };

    checkHealth();
  });

  return backendReadyPromise;
}

/**
 * Standardized safe request wrapper with retry logic and validation
 */
export async function safeRequest<T>(
  config: AxiosRequestConfig
): Promise<T> {
  // Wait for backend to be ready
  await waitForBackendReady();

  const maxRetries = 3;
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add auth token if available
      const token = tokenStorage.getAccessToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      // Make the request
      const response = await axios({
        ...config,
        baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
        timeout: 15000,
        withCredentials: true,
      });

      // Validate response shape
      if (!isApiResponse(response.data)) {
        throw new Error("Invalid API contract: Response does not match expected shape");
      }

      const apiResponse = response.data as ApiResponse<T>;

      // Handle API-level errors
      if (!apiResponse.success) {
        const error = new Error(apiResponse.message || "API request failed") as ApiError;
        error.code = apiResponse.errorCode || "API_ERROR";
        error.status = response.status;
        
        // Handle 401/403 - don't retry
        if (response.status === 401 || response.status === 403) {
          throw error;
        }

        throw error;
      }

      return apiResponse.data;

    } catch (error: any) {
      lastError = error;

      // Don't retry on certain errors
      if (
        error.isAbort ||
        error.isTimeout ||
        error.status === 401 ||
        error.status === 403 ||
        error.code === "ECONNABORTED"
      ) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Handle 401 errors by clearing tokens and redirecting to login
 */
export function handleAuthError() {
  tokenStorage.clearTokens();
  localStorage.removeItem("nekoUser");
  
  // Redirect to login page
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}