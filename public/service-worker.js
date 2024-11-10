const CACHE_NAME = "my-app-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  // Styles and Scripts
  "/style.css",
  "/main.js",
  // Images and Icons
  "/assets/melody.gif",
  "/assets/melody2.gif",
  "/assets/melody3.gif",
  "/assets/melodykiss.png",
  "/assets/sleepingmelody.png",
  "/assets/bgsky.jpg",
  "/assets/sunsetbg.jpg",
  "/assets/moonbg.gif",
  "/chart-line-solid.svg",
  "/journal.svg",
  "/taskIcon.svg",
  "/vite.svg",
  "/img/icons/safari-pinned-tab.svg",
  // Routes
  // "/pomodoro",
  // "/tasks",
  // "/journal",
  // Firebase assets (for offline persistence)
  "/__/firebase/init.js",
  // Vue components
  // "/src/App.vue",
  // "/src/components/BottomNav.vue",
  // "/src/views/Home.vue",
  // "/src/views/Pomodoro.vue",
  // "/src/views/Tasks.vue",
  // "/src/views/Journal.vue",
  // offline page
  "/offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      // return cache.addAll(urlsToCache);
      return Promise.all(
        urlsToCache.map((url) => {
          return cache.add(url).catch((err) => {
            console.error("Error caching", ${ url }, err);
          });
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Update Service Worker
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-tasks") {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  try {
    const offlineTasks = await getOfflineTasks();
    await Promise.all(offlineTasks.map((task) => syncTask(task)));
    await clearOfflineTasks();
  } catch (error) {
    console.error("Error syncing tasks:", error);
  }
}

async function getOfflineTasks() {
  // Implement getting tasks from IndexedDB or other local storage
  return [];
}

async function syncTask(task) {
  // Implement syncing individual task with server
}

async function clearOfflineTasks() {
  // Implement clearing synced tasks from offline storage
}
