import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        app: "./index.html",
        "service-worker": "./public/service-worker.js",
      },
    },
  },
  publicDir: "public",
});
