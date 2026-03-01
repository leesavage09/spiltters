export interface ErrorResponse {
  message: string;
  statusCode: number;
}

export const extractErrorMessage = (
  error: { response?: { data?: { message?: string } } },
  fallback: string,
): string => error.response?.data?.message ?? fallback;
