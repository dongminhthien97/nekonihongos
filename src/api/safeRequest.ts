import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { env } from "../utils/env";
import { refreshTokenStorage, tokenStorage, userStorage } from "../auth/storage";
import { isApiResponse, type ApiResponse, type ApiError } from "../types/api";

export type SafeRequestConfig = AxiosRequestConfig & {
  retries?: number;
  retryDelayMs?: number;
  requireBackendReady?: boolean;
};

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 500;
const BACKEND_READY_TIMEOUT_MS = 60000;

const API_BASE_URL = env.apiUrl;
const ROOT_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

let backendReady = false;
let backendReadyPromise: Promise<void> | null = null;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timerId = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timerId);
        reject(createAbortError());
      },
      { once: true },
    );
  });
}

function backoffMs(attempt: number, baseDelayMs: number): number {
  const exp = Math.pow(2, attempt);
  const raw = baseDelayMs * exp;
  const capped = Math.min(raw, 8000);
  const jitter = Math.floor(Math.random() * 250);
  return capped + jitter;
}

function createAbortError(): ApiError {
  const err: ApiError = new Error("Request aborted");
  err.isAbort = true;
  err.code = "ABORTED";
  return err;
}

function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<any>;
    const apiErr: ApiError = new Error(ax.message || "Request failed");

    apiErr.status = ax.response?.status;
    apiErr.code = ax.code;
    apiErr.isNetworkError = !ax.response;

    const isCanceled =
      ax.code === "ERR_CANCELED" ||
      (ax as any).name === "CanceledError" ||
      ax.message?.toLowerCase().includes("canceled");
    if (isCanceled) {
      apiErr.isAbort = true;
      apiErr.code = "ABORTED";
      apiErr.message = "Request aborted";
    }

    const isTimeout =
      ax.code === "ECONNABORTED" || ax.message?.toLowerCase().includes("timeout");
    if (isTimeout) {
      apiErr.isTimeout = true;
      apiErr.code = "TIMEOUT";
      apiErr.message = "Request timed out";
    }

    const data = ax.response?.data;
    if (isApiResponse<unknown>(data)) {
      const envelope = data as ApiResponse<unknown>;
      if (envelope.message) apiErr.message = envelope.message;
      if (envelope.errorCode) apiErr.code = envelope.errorCode;
    } else if (data?.message && typeof data.message === "string") {
      apiErr.message = data.message;
    }

    return apiErr;
  }

  if (error && typeof error === "object") {
    const e = error as any;
    const looksLikeApiError =
      "status" in e ||
      "code" in e ||
      "isNetworkError" in e ||
      "isTimeout" in e ||
      "isAbort" in e;
    if (looksLikeApiError) {
      return e as ApiError;
    }
  }

  if (error && typeof error === "object" && (error as any).name === "AbortError") {
    return createAbortError();
  }

  const fallback: ApiError = new Error("Request failed");
  return fallback;
}

function shouldRetry(error: ApiError, attempt: number, retries: number): boolean {
  if (attempt >= retries) return false;
  if (error.isAbort) return false;
  if (error.status === 401 || error.status === 403) return false;
  if (error.isTimeout) return true;
  if (error.isNetworkError) return true;
  if (!error.status) return true;

  return [408, 429, 500, 502, 503, 504].includes(error.status);
}

async function pingHealth(signal?: AbortSignal): Promise<boolean> {
  const urls = [`${ROOT_BASE_URL}/health`, `${API_BASE_URL}/health`];

  for (const url of urls) {
    try {
      const res = await axios.get(url, {
        timeout: 5000,
        signal,
        validateStatus: () => true,
      });
      if (res.status >= 200 && res.status < 300) return true;
    } catch (e) {
      const err = toApiError(e);
      if (err.isAbort) throw err;
    }
  }

  return false;
}

async function waitForBackendReady(): Promise<void> {
  if (backendReady) return;
  if (backendReadyPromise) return backendReadyPromise;

  backendReadyPromise = (async () => {
    const started = Date.now();
    let attempt = 0;

    while (Date.now() - started < BACKEND_READY_TIMEOUT_MS) {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 5500);

      try {
        const ok = await pingHealth(controller.signal);
        if (ok) {
          backendReady = true;
          return;
        }
      } finally {
        window.clearTimeout(timeoutId);
      }

      await sleep(backoffMs(attempt, 1000));
      attempt += 1;
    }

    throw new Error("Backend is not ready");
  })()
    .catch((err) => {
      backendReady = false;
      throw err;
    })
    .finally(() => {
      if (!backendReady) backendReadyPromise = null;
    });

  return backendReadyPromise;
}

export async function safeRequest<T>(config: SafeRequestConfig): Promise<T> {
  const {
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    requireBackendReady = true,
    ...axiosConfig
  } = config;

  if (requireBackendReady) {
    await waitForBackendReady();
  }

  const token = tokenStorage.get();
  const headers = {
    ...axiosConfig.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios({
        ...axiosConfig,
        baseURL: axiosConfig.baseURL ?? API_BASE_URL,
        timeout: axiosConfig.timeout ?? DEFAULT_TIMEOUT_MS,
        withCredentials: axiosConfig.withCredentials ?? false,
        headers,
      });

      if (!isApiResponse<T>(response.data)) {
        const contractError: ApiError = new Error(
          "Invalid API contract: response is not ApiResponse<T>",
        );
        contractError.code = "INVALID_CONTRACT";
        contractError.status = response.status;
        throw contractError;
      }

      const apiResponse = response.data as ApiResponse<T>;
      if (!apiResponse.success) {
        const apiError: ApiError = new Error(apiResponse.message || "Request failed");
        apiError.code = apiResponse.errorCode || "API_ERROR";
        apiError.status = response.status;
        throw apiError;
      }

      return apiResponse.data;
    } catch (error) {
      const apiError = toApiError(error);
      lastError = apiError;

      if (!shouldRetry(apiError, attempt, retries)) {
        throw apiError;
      }

      await sleep(backoffMs(attempt, retryDelayMs), config.signal as AbortSignal | undefined);
    }
  }

  if (lastError) throw lastError;
  throw new Error("Request failed");
}

export function handleAuthError() {
  tokenStorage.clear();
  refreshTokenStorage.clear();
  userStorage.clear();

  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
