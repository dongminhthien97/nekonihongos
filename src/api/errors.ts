import type { AxiosError } from "axios";

export type ApiError = {
  message: string;
  status?: number;
  code?: string;
  data?: unknown;
  isNetworkError?: boolean;
};

export const normalizeApiError = (error: unknown): ApiError => {
  const fallback: ApiError = {
    message: "Request failed",
  };

  const axiosError = error as AxiosError<any> | undefined;
  if (!axiosError) return fallback;

  const status = axiosError.response?.status;
  const data = axiosError.response?.data;
  const message =
    data?.message ||
    data?.error ||
    axiosError.message ||
    fallback.message;

  return {
    message,
    status,
    code: axiosError.code,
    data,
    isNetworkError: !axiosError.response,
  };
};
