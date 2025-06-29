import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "production" ? "/FlightTracker/" : "/", // Use base path only in production
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
