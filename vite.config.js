import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  plugins: [react()],
  base: '/Tastoria-cicd/',        // <--- ADD this line (use your repo name)
  resolve: {
    alias: [{ find: "@", replacement: "/src" }],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        historyApiFallback: true,
      },
    },
  },
});
