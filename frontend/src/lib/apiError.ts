import { isAxiosError } from "axios";

/**
 * Pulls FastAPI's `{ "detail": ... }` payload into a single human-readable
 * string. Handles both plain string details and the validation-error array
 * form (`[{ "msg": "..." }, ...]`).
 */
function extractDetail(data: unknown): string | null {
  if (typeof data === "string" && data.trim().length > 0) {
    return data;
  }
  if (!data || typeof data !== "object") {
    return null;
  }

  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim().length > 0) {
    return detail;
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          const msg = (item as { msg: unknown }).msg;
          return typeof msg === "string" ? msg : null;
        }
        return null;
      })
      .filter((msg): msg is string => Boolean(msg && msg.trim()));
    if (messages.length > 0) {
      return messages.join(" ");
    }
  }
  return null;
}

/**
 * Extracts a human-readable message from a failed API call.
 *
 * - If the backend returned an HTTP response with `{ "detail": "..." }`,
 *   that exact message is shown (including 400/401/403/404/409/422/500).
 * - Only when the request itself failed to get any HTTP response
 *   (network error, timeout, DNS failure, backend offline) do we show
 *   the generic "Unable to reach the backend" message.
 * - HTTP error responses are never treated as network failures.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    // No response at all → genuine connectivity / transport failure.
    if (error.response == null) {
      return "Unable to reach the backend server. Please make sure it is running.";
    }

    const detail = extractDetail(error.response.data);
    if (detail) {
      return detail;
    }

    // We got an HTTP status (400/409/500/…) but no usable detail body —
    // still not a network failure; use the call-site fallback.
    return fallback;
  }

  return fallback;
}
