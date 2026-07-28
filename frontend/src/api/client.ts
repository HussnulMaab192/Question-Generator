import axios from "axios";

import { env } from "@/config/env";

/**
 * Shared Axios instance for all backend calls. Import this in
 * `src/api/endpoints/*` modules rather than creating new clients.
 */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  // No blanket `Content-Type` here: axios's default request transform
  // already sets `application/json` automatically for plain-object
  // payloads (every existing JSON endpoint keeps working unchanged). A
  // fixed instance-level header would instead break `FormData` uploads
  // (e.g. the admin workbook upload) by overriding the multipart
  // boundary the browser needs to set itself.
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);
