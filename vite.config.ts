import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        "service-worker": "./public/service-worker.js",
      },
    },
  },
  optimizeDeps: {
    include: ['vue']
  },
  publicDir: "public",
})