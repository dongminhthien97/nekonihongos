export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  errorCode: string | null;
  timestamp: number;
}

export interface ApiError extends Error {
  code?: string;
  status?: number;
  isNetworkError?: boolean;
  isTimeout?: boolean;
  isAbort?: boolean;
}

export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.success === "boolean" &&
    "data" in obj &&
    "timestamp" in obj
  );
}

export function isApiError(error: any): error is ApiError {
  return error && typeof error === "object" && "isNetworkError" in error;
}