import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  server: {
    // Listen on all interfaces so both http://localhost:5173 and http://127.0.0.1:5173 work
    host: true,
    port: 5173
  }
});
