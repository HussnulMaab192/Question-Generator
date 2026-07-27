import { isAxiosError } from "axios";

/**
 * Extracts a human-readable message from a failed API call.
 *
 * The backend returns errors as `{ "detail": "..." }` (FastAPI convention),
 * e.g. "Questions workbook not found at '...'." — surface that verbatim
 * when available so users see the real, specific reason instead of a
 * generic failure message.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === "string" && detail.trim().length > 0) {
      return detail;
    }
    if (error.response?.status === undefined) {
      return "Unable to reach the backend server. Please make sure it is running.";
    }
  }

  return fallback;
}
