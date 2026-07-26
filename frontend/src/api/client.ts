import axios from "axios";

import { env } from "@/config/env";

/**
 * Shared Axios instance for all backend calls. Import this in
 * `src/api/endpoints/*` modules rather than creating new clients.
 */
export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: Centralize error normalization/toasts once UX for errors is designed.
    return Promise.reject(error);
  },
);
