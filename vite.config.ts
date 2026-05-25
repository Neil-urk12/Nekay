import path from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { generateSW } from 'workbox-build'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const generateSWConfig = {
  swDest: path.resolve(__dirname, 'dist/service-worker.js'),
  globDirectory: path.resolve(__dirname, 'dist'),
  globPatterns: ['**/*.{html,js,css,png,jpg,jpeg,gif,svg,webp,wav,mp3,json}'],
  clientsClaim: true,
  runtimeCaching: [
    {
      urlPattern: /\.supabase\.co\/rest\/v1\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api-cache-v1',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        backgroundSync: {
          name: 'supabaseSync',
          options: {
            maxRetentionTime: 24 * 60, // Retry for up to 24 hours
          },
        },
      },
    },
    {
      urlPattern: /\.supabase\.co\/auth\/v1\//,
      handler: 'NetworkOnly',
      options: {
        cacheName: 'supabase-auth-cache',
      },
    },
    {
      urlPattern: /\/api\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache-v1',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24,
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|mp3|wav|webp|json)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'assets-cache-v1',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /\.(?:js|css|html)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources-cache-v1',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
  ],
}
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'vite-plugin-workbox',
      closeBundle: async () => {
        try {
          await generateSW({
            ...generateSWConfig,
            runtimeCaching: generateSWConfig.runtimeCaching.map(entry => ({
              ...entry,
              handler: entry.handler as
              | 'NetworkFirst'
              | 'CacheFirst'
              | 'StaleWhileRevalidate'
              | 'NetworkOnly',
            })),
          })
          console.log('Service worker generated successfully!')
        }
        catch (err) {
          console.error('Service worker generation failed: ', err)
        }
      },
    },
  ],
  server: {
    host: true,
    port: 5173,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  },
  build: {
    target: 'esnext',
    minify: 'oxc',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-dexie': ['dexie'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['vue'],
  },
  publicDir: 'public',
})
