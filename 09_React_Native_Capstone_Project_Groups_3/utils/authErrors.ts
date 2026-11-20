/**
 * Turn a failed auth request into a message people can act on.
 * Axios only says "Request failed with status code 400"; DummyJSON puts the
 * real reason in the response body ({ message: "Invalid credentials" }).
 */
import axios from 'axios';

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'The server is taking too long to answer. Please try again.';
    }
    if (!error.response) {
      return "Can't reach the server. Check your internet connection and try again.";
    }
    const { status, data } = error.response;
    const serverMessage = (data as { message?: unknown } | undefined)?.message;
    if (serverMessage === 'Invalid credentials') {
      return 'Incorrect username or password.';
    }
    if (status >= 500) {
      return 'The server is having trouble right now. Please try again in a moment.';
    }
    if (typeof serverMessage === 'string' && serverMessage.trim()) {
      return serverMessage;
    }
    return fallback;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}
