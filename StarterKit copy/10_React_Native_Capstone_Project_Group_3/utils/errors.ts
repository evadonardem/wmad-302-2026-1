/**
 * Turns any thrown value into a message that is safe to show to users.
 */
import { isAxiosError } from 'axios';

export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (isAxiosError<{ message?: string }>(error)) {
    const apiMessage = error.response?.data?.message;
    if (apiMessage) return apiMessage;
    if (!error.response) return 'Network error. Check your connection and try again.';
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** True when the request never reached the server (offline, DNS failure, timeout). */
export function isNetworkError(error: unknown): boolean {
  return isAxiosError(error) && !error.response;
}
