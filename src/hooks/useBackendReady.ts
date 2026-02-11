import { useState, useEffect, useCallback } from "react";

interface HealthCheckOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  timeout?: number;
  onReady?: () => void;
  onNotReady?: () => void;
}

export interface BackendReadyState {
  isReady: boolean;
  isChecking: boolean;
  error: string | null;
  lastCheck: number | null;
}

export function useBackendReady(options: HealthCheckOptions = {}) {
  const {
    maxRetries = 5,
    initialDelay = 1000,
    maxDelay = 16000,
    timeout = 10000,
    onReady,
    onNotReady,
  } = options;

  const [state, setState] = useState<BackendReadyState>({
    isReady: false,
    isChecking: true,
    error: null,
    lastCheck: null,
  });

  const checkHealth = useCallback(async (): Promise<boolean> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/health`, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return true;
      }

      // Nếu không phải 200, coi như chưa ready
      return false;
    } catch (error: any) {
      clearTimeout(timeoutId);
      // Network error hoặc timeout đều coi là chưa ready
      return false;
    }
  }, [timeout]);

  const exponentialBackoff = useCallback(
    async (attempt: number): Promise<boolean> => {
      if (attempt >= maxRetries) {
        return false;
      }

      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));

      const isHealthy = await checkHealth();
      if (isHealthy) {
        return true;
      }

      return exponentialBackoff(attempt + 1);
    },
    [checkHealth, maxRetries, initialDelay, maxDelay],
  );

  const startHealthCheck = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isChecking: true,
      error: null,
    }));

    try {
      const isHealthy = await exponentialBackoff(0);

      if (isHealthy) {
        setState({
          isReady: true,
          isChecking: false,
          error: null,
          lastCheck: Date.now(),
        });
        onReady?.();
      } else {
        setState({
          isReady: false,
          isChecking: false,
          error: "Hệ thống đang khởi động, vui lòng chờ...",
          lastCheck: Date.now(),
        });
        onNotReady?.();
      }
    } catch (error) {
      setState({
        isReady: false,
        isChecking: false,
        error: "Không thể kết nối đến hệ thống",
        lastCheck: Date.now(),
      });
      onNotReady?.();
    }
  }, [exponentialBackoff, onReady, onNotReady]);

  const reset = useCallback(() => {
    setState({
      isReady: false,
      isChecking: true,
      error: null,
      lastCheck: null,
    });
    startHealthCheck();
  }, [startHealthCheck]);

  useEffect(() => {
    startHealthCheck();
  }, [startHealthCheck]);

  return {
    ...state,
    startHealthCheck,
    reset,
  };
}