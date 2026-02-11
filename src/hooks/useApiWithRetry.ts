import { useCallback, useRef } from "react";

export type ApiErrorType =
  | "network"
  | "timeout"
  | "abort"
  | "server"
  | "client"
  | "auth"
  | "forbidden"
  | "validation";

export interface ApiError {
  type: ApiErrorType;
  message: string;
  status?: number;
  originalError?: any;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  timeout?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: ApiError) => void;
  onAbort?: () => void;
}

export interface UseApiWithRetryReturn {
  execute: <T>(
    requestFn: (signal: AbortSignal) => Promise<T>,
    options?: RetryOptions,
  ) => Promise<T>;
  abort: () => void;
  isRetrying: boolean;
}

export function useApiWithRetry(): UseApiWithRetryReturn {
  const abortControllerRef = useRef<AbortController | null>(null);
  const isRetryingRef = useRef(false);

  const isRetryableError = useCallback((error: ApiError): boolean => {
    // Không retry các lỗi client
    if (
      error.type === "client" ||
      error.type === "auth" ||
      error.type === "forbidden" ||
      error.type === "validation"
    ) {
      return false;
    }

    // Retry các lỗi network, timeout, abort và server error 5xx
    if (
      error.type === "network" ||
      error.type === "timeout" ||
      error.type === "abort" ||
      error.type === "server"
    ) {
      return true;
    }

    return false;
  }, []);

  const execute = useCallback(
    async <T>(
      requestFn: (signal: AbortSignal) => Promise<T>,
      options: RetryOptions = {},
    ): Promise<T> => {
      const {
        maxRetries = 5,
        initialDelay = 1000,
        maxDelay = 16000,
        timeout = 65000,
        retryableStatuses = [502, 503, 504],
        onRetry,
        onAbort,
      } = options;

      // Hủy request trước đó nếu có
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const retryWithBackoff = async (
        attempt: number,
      ): Promise<T> => {
        try {
          const result = await requestFn(controller.signal);
          clearTimeout(timeoutId);
          isRetryingRef.current = false;
          return result;
        } catch (error: any) {
          clearTimeout(timeoutId);

          // Kiểm tra xem có phải là abort không
          if (error.name === "AbortError" || controller.signal.aborted) {
            isRetryingRef.current = false;
            const apiError: ApiError = {
              type: "abort",
              message: "Hệ thống đang khởi động, vui lòng chờ...",
              originalError: error,
            };
            onAbort?.();
            throw apiError;
          }

          // Chuyển đổi error thành ApiError
          const apiError = convertToApiError(error);

          // Nếu không retry được hoặc đã hết số lần retry
          if (!isRetryableError(apiError) || attempt >= maxRetries) {
            isRetryingRef.current = false;
            throw apiError;
          }

          // Tính delay theo exponential backoff
          const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
          onRetry?.(attempt + 1, apiError);

          // Chờ trước khi retry
          await new Promise((resolve) => setTimeout(resolve, delay));

          // Kiểm tra xem có bị abort không
          if (controller.signal.aborted) {
            const abortError: ApiError = {
              type: "abort",
              message: "Hệ thống đang khởi động, vui lòng chờ...",
              originalError: error,
            };
            onAbort?.();
            throw abortError;
          }

          // Retry
          return retryWithBackoff(attempt + 1);
        }
      };

      isRetryingRef.current = true;
      return retryWithBackoff(0);
    },
    [isRetryableError],
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isRetryingRef.current = false;
  }, []);

  return {
    execute,
    abort,
    isRetrying: isRetryingRef.current,
  };
}

function convertToApiError(error: any): ApiError {
  // Nếu là fetch error (network error)
  if (!error.response) {
    return {
      type: "network",
      message: "Không thể kết nối đến máy chủ",
      originalError: error,
    };
  }

  const status = error.response?.status;

  // Xử lý các status cụ thể
  switch (status) {
    case 400:
      return {
        type: "client",
        message: "Dữ liệu không hợp lệ",
        status,
        originalError: error,
      };
    case 401:
      return {
        type: "auth",
        message: "Email hoặc mật khẩu không đúng",
        status,
        originalError: error,
      };
    case 403:
      return {
        type: "forbidden",
        message: "Bạn không có quyền truy cập",
        status,
        originalError: error,
      };
    case 422:
      return {
        type: "validation",
        message: "Dữ liệu không hợp lệ",
        status,
        originalError: error,
      };
    case 500:
      return {
        type: "server",
        message: "Lỗi hệ thống",
        status,
        originalError: error,
      };
    case 502:
    case 503:
    case 504:
      return {
        type: "server",
        message: "Hệ thống đang bảo trì, vui lòng thử lại sau",
        status,
        originalError: error,
      };
    default:
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        return {
          type: "timeout",
          message: "Yêu cầu quá thời gian chờ",
          originalError: error,
        };
      }
      return {
        type: "server",
        message: error.message || "Lỗi không xác định",
        status,
        originalError: error,
      };
  }
}