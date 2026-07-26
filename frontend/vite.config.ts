import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

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
});
