/**
 * Centralized access to build-time environment variables.
 * Add new `VITE_*` variables here (and to `.env.example` / `vite-env.d.ts`)
 * rather than reading `import.meta.env` directly throughout the app.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  /** App version from `package.json`, injected at build time (see `vite.config.ts`). */
  appVersion: __APP_VERSION__,
} as const;
