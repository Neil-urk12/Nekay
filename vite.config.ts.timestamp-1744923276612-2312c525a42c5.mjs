// vite.config.ts
import { defineConfig } from "file:///home/imisenak/Documents/Projects/Nekay/node_modules/vite/dist/node/index.js";
import vue from "file:///home/imisenak/Documents/Projects/Nekay/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
import { generateSW } from "file:///home/imisenak/Documents/Projects/Nekay/node_modules/workbox-build/build/index.js";
var __vite_injected_original_dirname = "/home/imisenak/Documents/Projects/Nekay";
var generateSWConfig = {
  swDest: path.resolve(__vite_injected_original_dirname, "dist/service-worker.js"),
  globDirectory: path.resolve(__vite_injected_original_dirname, "dist"),
  globPatterns: ["**/*.{html,js,css,png,jpg,jpeg,gif,svg,webp,wav,mp3,json}"],
  runtimeCaching: [
    {
      urlPattern: /firestore\.googleapis\.com/,
      handler: "NetworkFirst",
      options: {
        cacheName: "firestore-cache-v1",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60
          // 24 hours
        },
        backgroundSync: {
          name: "firestoreSync",
          options: {
            maxRetentionTime: 24 * 60
            // Retry for up to 24 hours
          }
        }
      }
    },
    {
      urlPattern: /identitytoolkit\.googleapis\.com/,
      handler: "NetworkOnly",
      options: {
        cacheName: "firebase-auth-cache"
      }
    },
    {
      urlPattern: /\/api\//,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache-v1",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24
        }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|mp3|wav|webp|json)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "assets-cache-v1",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60
        }
      }
    },
    {
      urlPattern: /\.(?:js|css|html)$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-resources-cache-v1",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60
        }
      }
    }
  ]
};
var vite_config_default = defineConfig({
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
              handler: entry.handler
            }))
          });
          console.log("Service worker generated successfully!");
        } catch (err) {
          console.error("Service worker generation failed: ", err);
        }
      }
    }
  ],
  server: {
    host: true,
    port: 5173,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  },
  build: {
    target: "esnext",
    minify: "terser",
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: path.resolve(__vite_injected_original_dirname, "index.html")
      },
      output: {
        manualChunks: {
          vue: ["vue"]
        }
      }
    }
  },
  optimizeDeps: {
    include: ["vue"]
  },
  publicDir: "public"
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9pbWlzZW5hay9Eb2N1bWVudHMvUHJvamVjdHMvTmVrYXlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL2ltaXNlbmFrL0RvY3VtZW50cy9Qcm9qZWN0cy9OZWtheS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9pbWlzZW5hay9Eb2N1bWVudHMvUHJvamVjdHMvTmVrYXkvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHZ1ZSBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tdnVlXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgZ2VuZXJhdGVTVyB9IGZyb20gXCJ3b3JrYm94LWJ1aWxkXCI7XG5cbmNvbnN0IGdlbmVyYXRlU1dDb25maWcgPSB7XG4gIHN3RGVzdDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJkaXN0L3NlcnZpY2Utd29ya2VyLmpzXCIpLFxuICBnbG9iRGlyZWN0b3J5OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcImRpc3RcIiksXG4gIGdsb2JQYXR0ZXJuczogW1wiKiovKi57aHRtbCxqcyxjc3MscG5nLGpwZyxqcGVnLGdpZixzdmcsd2VicCx3YXYsbXAzLGpzb259XCJdLFxuICBydW50aW1lQ2FjaGluZzogW1xuICAgIHtcbiAgICAgIHVybFBhdHRlcm46IC9maXJlc3RvcmVcXC5nb29nbGVhcGlzXFwuY29tLyxcbiAgICAgIGhhbmRsZXI6IFwiTmV0d29ya0ZpcnN0XCIsXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIGNhY2hlTmFtZTogXCJmaXJlc3RvcmUtY2FjaGUtdjFcIixcbiAgICAgICAgbmV0d29ya1RpbWVvdXRTZWNvbmRzOiAxMCxcbiAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgICAgICAgIG1heEVudHJpZXM6IDEwMCxcbiAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiAyNCAqIDYwICogNjAgLy8gMjQgaG91cnNcbiAgICAgICAgfSxcbiAgICAgICAgYmFja2dyb3VuZFN5bmM6IHtcbiAgICAgICAgICBuYW1lOiAnZmlyZXN0b3JlU3luYycsXG4gICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgbWF4UmV0ZW50aW9uVGltZTogMjQgKiA2MCAvLyBSZXRyeSBmb3IgdXAgdG8gMjQgaG91cnNcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIHVybFBhdHRlcm46IC9pZGVudGl0eXRvb2xraXRcXC5nb29nbGVhcGlzXFwuY29tLyxcbiAgICAgIGhhbmRsZXI6IFwiTmV0d29ya09ubHlcIixcbiAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgY2FjaGVOYW1lOiBcImZpcmViYXNlLWF1dGgtY2FjaGVcIixcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICB1cmxQYXR0ZXJuOiAvXFwvYXBpXFwvLyxcbiAgICAgIGhhbmRsZXI6IFwiTmV0d29ya0ZpcnN0XCIsXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIGNhY2hlTmFtZTogXCJhcGktY2FjaGUtdjFcIixcbiAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgICAgICAgIG1heEVudHJpZXM6IDUwLFxuICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICB7XG4gICAgICB1cmxQYXR0ZXJuOiAvXFwuKD86cG5nfGpwZ3xqcGVnfHN2Z3xnaWZ8bXAzfHdhdnx3ZWJwfGpzb24pJC8sXG4gICAgICBoYW5kbGVyOiBcIkNhY2hlRmlyc3RcIixcbiAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgY2FjaGVOYW1lOiBcImFzc2V0cy1jYWNoZS12MVwiLFxuICAgICAgICBleHBpcmF0aW9uOiB7XG4gICAgICAgICAgbWF4RW50cmllczogMTAwLFxuICAgICAgICAgIG1heEFnZVNlY29uZHM6IDcgKiAyNCAqIDYwICogNjAsIFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICAgIHtcbiAgICAgIHVybFBhdHRlcm46IC9cXC4oPzpqc3xjc3N8aHRtbCkkLyxcbiAgICAgIGhhbmRsZXI6IFwiU3RhbGVXaGlsZVJldmFsaWRhdGVcIixcbiAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgY2FjaGVOYW1lOiBcInN0YXRpYy1yZXNvdXJjZXMtY2FjaGUtdjFcIixcbiAgICAgICAgZXhwaXJhdGlvbjoge1xuICAgICAgICAgIG1heEVudHJpZXM6IDEwMCxcbiAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA3ICogMjQgKiA2MCAqIDYwLCBcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICBdLFxufTtcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgdnVlKCksXG4gICAge1xuICAgICAgbmFtZTogXCJ2aXRlLXBsdWdpbi13b3JrYm94XCIsXG4gICAgICBjbG9zZUJ1bmRsZTogYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IGdlbmVyYXRlU1coe1xuICAgICAgICAgICAgLi4uZ2VuZXJhdGVTV0NvbmZpZyxcbiAgICAgICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBnZW5lcmF0ZVNXQ29uZmlnLnJ1bnRpbWVDYWNoaW5nLm1hcCgoZW50cnkpID0+ICh7XG4gICAgICAgICAgICAgIC4uLmVudHJ5LFxuICAgICAgICAgICAgICBoYW5kbGVyOiBlbnRyeS5oYW5kbGVyIGFzXG4gICAgICAgICAgICAgICAgfCBcIk5ldHdvcmtGaXJzdFwiXG4gICAgICAgICAgICAgICAgfCBcIkNhY2hlRmlyc3RcIlxuICAgICAgICAgICAgICAgIHwgXCJTdGFsZVdoaWxlUmV2YWxpZGF0ZVwiXG4gICAgICAgICAgICAgICAgfCBcIk5ldHdvcmtPbmx5XCIsXG4gICAgICAgICAgICB9KSksXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJTZXJ2aWNlIHdvcmtlciBnZW5lcmF0ZWQgc3VjY2Vzc2Z1bGx5IVwiKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIlNlcnZpY2Ugd29ya2VyIGdlbmVyYXRpb24gZmFpbGVkOiBcIiwgZXJyKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICBdLFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiB0cnVlLFxuICAgIHBvcnQ6IDUxNzMsXG4gICAgaGVhZGVyczoge1xuICAgICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsXG4gICAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHNcIjogXCJHRVQsIFBPU1QsIFBVVCwgREVMRVRFLCBPUFRJT05TXCIsXG4gICAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnNcIjogXCJDb250ZW50LVR5cGUsIEF1dGhvcml6YXRpb25cIixcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIHRhcmdldDogXCJlc25leHRcIixcbiAgICBtaW5pZnk6IFwidGVyc2VyXCIsXG4gICAgb3V0RGlyOiBcImRpc3RcIixcbiAgICBhc3NldHNEaXI6IFwiYXNzZXRzXCIsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgbWFpbjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJpbmRleC5odG1sXCIpLFxuICAgICAgfSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICB2dWU6IFtcInZ1ZVwiXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1widnVlXCJdLFxuICB9LFxuICBwdWJsaWNEaXI6IFwicHVibGljXCIsXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBdVMsU0FBUyxvQkFBb0I7QUFDcFUsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sVUFBVTtBQUNqQixTQUFTLGtCQUFrQjtBQUgzQixJQUFNLG1DQUFtQztBQUt6QyxJQUFNLG1CQUFtQjtBQUFBLEVBQ3ZCLFFBQVEsS0FBSyxRQUFRLGtDQUFXLHdCQUF3QjtBQUFBLEVBQ3hELGVBQWUsS0FBSyxRQUFRLGtDQUFXLE1BQU07QUFBQSxFQUM3QyxjQUFjLENBQUMsMkRBQTJEO0FBQUEsRUFDMUUsZ0JBQWdCO0FBQUEsSUFDZDtBQUFBLE1BQ0UsWUFBWTtBQUFBLE1BQ1osU0FBUztBQUFBLE1BQ1QsU0FBUztBQUFBLFFBQ1AsV0FBVztBQUFBLFFBQ1gsdUJBQXVCO0FBQUEsUUFDdkIsWUFBWTtBQUFBLFVBQ1YsWUFBWTtBQUFBLFVBQ1osZUFBZSxLQUFLLEtBQUs7QUFBQTtBQUFBLFFBQzNCO0FBQUEsUUFDQSxnQkFBZ0I7QUFBQSxVQUNkLE1BQU07QUFBQSxVQUNOLFNBQVM7QUFBQSxZQUNQLGtCQUFrQixLQUFLO0FBQUE7QUFBQSxVQUN6QjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0E7QUFBQSxNQUNFLFlBQVk7QUFBQSxNQUNaLFNBQVM7QUFBQSxNQUNULFNBQVM7QUFBQSxRQUNQLFdBQVc7QUFBQSxNQUNiO0FBQUEsSUFDRjtBQUFBLElBQ0E7QUFBQSxNQUNFLFlBQVk7QUFBQSxNQUNaLFNBQVM7QUFBQSxNQUNULFNBQVM7QUFBQSxRQUNQLFdBQVc7QUFBQSxRQUNYLFlBQVk7QUFBQSxVQUNWLFlBQVk7QUFBQSxVQUNaLGVBQWUsS0FBSyxLQUFLO0FBQUEsUUFDM0I7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0E7QUFBQSxNQUNFLFlBQVk7QUFBQSxNQUNaLFNBQVM7QUFBQSxNQUNULFNBQVM7QUFBQSxRQUNQLFdBQVc7QUFBQSxRQUNYLFlBQVk7QUFBQSxVQUNWLFlBQVk7QUFBQSxVQUNaLGVBQWUsSUFBSSxLQUFLLEtBQUs7QUFBQSxRQUMvQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQTtBQUFBLE1BQ0UsWUFBWTtBQUFBLE1BQ1osU0FBUztBQUFBLE1BQ1QsU0FBUztBQUFBLFFBQ1AsV0FBVztBQUFBLFFBQ1gsWUFBWTtBQUFBLFVBQ1YsWUFBWTtBQUFBLFVBQ1osZUFBZSxJQUFJLEtBQUssS0FBSztBQUFBLFFBQy9CO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSjtBQUFBLE1BQ0UsTUFBTTtBQUFBLE1BQ04sYUFBYSxZQUFZO0FBQ3ZCLFlBQUk7QUFDRixnQkFBTSxXQUFXO0FBQUEsWUFDZixHQUFHO0FBQUEsWUFDSCxnQkFBZ0IsaUJBQWlCLGVBQWUsSUFBSSxDQUFDLFdBQVc7QUFBQSxjQUM5RCxHQUFHO0FBQUEsY0FDSCxTQUFTLE1BQU07QUFBQSxZQUtqQixFQUFFO0FBQUEsVUFDSixDQUFDO0FBQ0Qsa0JBQVEsSUFBSSx3Q0FBd0M7QUFBQSxRQUN0RCxTQUFTLEtBQUs7QUFDWixrQkFBUSxNQUFNLHNDQUFzQyxHQUFHO0FBQUEsUUFDekQ7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQSxNQUNQLCtCQUErQjtBQUFBLE1BQy9CLGdDQUFnQztBQUFBLE1BQ2hDLGdDQUFnQztBQUFBLElBQ2xDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLFFBQ0wsTUFBTSxLQUFLLFFBQVEsa0NBQVcsWUFBWTtBQUFBLE1BQzVDO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixLQUFLLENBQUMsS0FBSztBQUFBLFFBQ2I7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxLQUFLO0FBQUEsRUFDakI7QUFBQSxFQUNBLFdBQVc7QUFDYixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
