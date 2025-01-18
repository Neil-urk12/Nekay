import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { generateSW } from "workbox-build";

const generateSWConfig = {
  swDest: path.resolve(__dirname, "dist/service-worker.js"),
  globDirectory: path.resolve(__dirname, "dist"),
  globPatterns: ["**/*.{html,js,css,png,jpg,jpeg,gif,svg,webp,wav,mp3,json}"],
  runtimeCaching: [
    {
      urlPattern: /identitytoolkit\.googleapis\.com/,
      handler: "NetworkOnly",
      options: {
        cacheName: "firebase-auth-cache",
      },
    },
    {
      urlPattern: /\/api\//,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache-v1",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24,
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|mp3|wav|webp|json)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "assets-cache-v1",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24,
        },
      },
    },
    {
      urlPattern: /\.(?:js|css|html)$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-resources-cache-v1",
      },
    },
  ],
};
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: "vite-plugin-workbox",
      closeBundle: async () => {
        try {
          await generateSW({
            ...generateSWConfig,
            runtimeCaching: generateSWConfig.runtimeCaching.map((entry) => ({
              ...entry,
              handler: entry.handler as
                | "NetworkFirst"
                | "CacheFirst"
                | "StaleWhileRevalidate"
                | "NetworkOnly",
            })),
          });
          console.log("Service worker generated successfully!");
        } catch (err) {
          console.error("Service worker generation failed: ", err);
        }
      },
    },
  ],
  server: {
    host: true,
    port: 5173,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  },
  build: {
    target: "esnext",
    minify: "terser",
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
      output: {
        manualChunks: {
          vue: ["vue"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["vue"],
  },
  publicDir: "public",
});
