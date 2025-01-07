import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import path from 'path'
import { generateSW } from 'workbox-build'

const generateSWConfig = {
  swDest: './dist/service-worker.js',
  globDirectory: path.resolve(__dirname, "dist"),
  globPatterns: ['**/*.{html,js,css,png,jpg,jpeg,gif,svg,webp,wav,mp3,json}'],
  runtimeCaching: [
    {
      urlPattern: /\/api\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: "api-cache-v1",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24,
        }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|mp3|wav|webp|json)/,
      handler: 'CacheFirst',
      options: {
        cacheName: "assets-cache-v1",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24,
        }
      }
    },
    {
      urlPattern: /\.(?:js|css|html)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: "static-resources-cache-v1",
      }
    }
  ]
}
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
            runtimeCaching: generateSWConfig.runtimeCaching.map(entry => ({
              ...entry,
              handler: entry.handler as 'NetworkFirst' | 'CacheFirst' | 'StaleWhileRevalidate'
            }))
          })
          console.log("Service worker generated successfully!")
      
        } catch ( err ) {
          console.error('Service worker generation failed: ', err)
        }
      }
    }
  ],
  server: {
    host: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
  },
  optimizeDeps: {
    include: ['vue']
  },
  publicDir: "public",
})