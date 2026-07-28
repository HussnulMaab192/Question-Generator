import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, "package.json"), "utf-8")) as {
  version: string;
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Listen on all network interfaces so the dev server can be reached
    // from tablets/iPads on the same network (e.g. http://<lan-ip>:5173).
    host: true,
    port: 5173,
  },
  preview: {
    // Same as `server` above, but for `vite preview` (serving a
    // production build) - see the README's Deployment section.
    host: true,
    port: 4173,
  },
  define: {
    // Exposes the app version (from package.json) at build time, without
    // shipping the whole file - see `src/config/env.ts` / the footer.
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
});
