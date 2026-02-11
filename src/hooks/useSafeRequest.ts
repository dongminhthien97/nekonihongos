import { useCallback, useRef } from "react";
import { safeRequest, handleAuthError } from "../api/safeRequest";
import { type ApiError } from "../types/api";

export function useSafeRequest() {
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const executeRequest = useCallback(async <T>(
    config: any,
    requestId?: string
  ): Promise<T> => {
    // Create or reuse abort controller
    let controller: AbortController;
    if (requestId && abortControllersRef.current.has(requestId)) {
      controller = abortControllersRef.current.get(requestId)!;
    } else {
      controller = new AbortController();
      if (requestId) {
        abortControllersRef.current.set(requestId, controller);
      }
    }

    try {
      return await safeRequest<T>({
        ...config,
        signal: controller.signal,
      });
    } catch (error: any) {
      // Handle 401 errors specifically
      if (error.status === 401 || error.code === "AUTH_EXPIRED") {
        handleAuthError();
        throw error;
      }
      throw error;
    }
  }, []);

  const abortRequest = useCallback((requestId: string) => {
    const controller = abortControllersRef.current.get(requestId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(requestId);
    }
  }, []);

  const abortAllRequests = useCallback(() => {
    abortControllersRef.current.forEach((controller) => {
      controller.abort();
    });
    abortControllersRef.current.clear();
  }, []);

  return {
    executeRequest,
    abortRequest,
    abortAllRequests,
  };
}