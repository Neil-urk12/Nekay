importScripts('/dexie.min.js');

// Cache Strategies
const STATIC_CACHE = 'static-cache-v1';
const DYNAMIC_CACHE = 'dynamic-cache-v1';
const OFFLINE_PAGE = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/style.css',
  '/main.js',
  '/dexie.min.js',
  '/assets/melody.gif',
  '/assets/melody2.gif',
  '/assets/melody3.gif',
  '/assets/melodykiss.png',
  '/assets/sleepingmelody.png',
  '/assets/bgsky.jpg',
  '/assets/sunsetbg.jpg',
  '/assets/moonbg.gif',
  '/chart-line-solid.svg',
  '/journal.svg',
  '/taskIcon.svg',
  '/vite.svg',
  '/img/icons/safari-pinned-tab.svg',
  OFFLINE_PAGE
];

// Initialize Dexie
class NekayDatabase extends Dexie {
  constructor() {
    super('NekayOfflineDB');
    this.version(1).stores({
      syncQueue: '++id, action, store, timestamp',
      tasks: '++id, syncStatus, folderId, lastModified',
      journal: '++id, syncStatus, folderId, date, lastModified',
      folders: '++id, syncStatus, type, lastModified',
      notes: '++id, syncStatus, lastModified',
      pomodoro: '++id, syncStatus, type, startTime, lastModified'
    });
  }
}

const db = new NekayDatabase();

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(DYNAMIC_CACHE),
      db.open()
    ])
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
            .map((key) => caches.delete(key))
        );
      }),
      // Claim clients
      self.clients.claim()
    ])
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Handle API requests
  if (event.request.url.includes('/api/')) {
    return handleApiRequest(event);
  }

  // Handle static assets
  if (STATIC_ASSETS.some(asset => event.request.url.includes(asset))) {
    return handleStaticAsset(event);
  }

  // Handle dynamic assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((fetchResponse) => {
            if (!fetchResponse || fetchResponse.status !== 200) {
              return fetchResponse;
            }
            return caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(event.request.url, fetchResponse.clone());
                return fetchResponse;
              });
          })
          .catch(() => {
            // If the fetch fails, return the offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_PAGE);
            }
            return null;
          });
      })
  );
});

async function handleApiRequest(event) {
  try {
    const response = await fetch(event.request);
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    
    // Queue failed request
    const request = event.request.clone();
    await queueFailedRequest(request);
    
    // Try to return cached data
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

function handleStaticAsset(event) {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
}

async function queueFailedRequest(request) {
  try {
    const serializedRequest = {
      url: request.url,
      method: request.method,
      headers: Array.from(request.headers.entries()),
      body: await request.clone().text(),
      mode: request.mode,
      credentials: request.credentials,
      cache: request.cache
    };

    await db.syncQueue.add({
      action: 'api',
      store: 'requests',
      data: serializedRequest,
      timestamp: Date.now(),
      attempts: 0
    });
  } catch (error) {
    console.error('Failed to queue request:', error);
  }
}

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    const pendingItems = await db.syncQueue.toArray();
    
    for (const item of pendingItems) {
      try {
        if (item.action === 'api') {
          await processSyncRequest(item.data);
        } else {
          await processSyncItem(item);
        }
        await db.syncQueue.delete(item.id);
      } catch (error) {
        console.error('Error processing sync item:', error);
        await db.syncQueue.update(item.id, {
          attempts: (item.attempts || 0) + 1
        });
      }
    }
  } catch (error) {
    console.error('Error during sync:', error);
  }
}

async function processSyncRequest(requestData) {
  const request = new Request(requestData.url, {
    method: requestData.method,
    headers: new Headers(requestData.headers),
    body: requestData.body,
    mode: requestData.mode,
    credentials: requestData.credentials,
    cache: requestData.cache
  });

  const response = await fetch(request);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response;
}

async function processSyncItem(item) {
  const { store, data, action } = item;
  const table = db.table(store);
  
  switch (action) {
    case 'create':
      await table.add(data);
      break;
    case 'update':
      await table.update(data.id, data);
      break;
    case 'delete':
      await table.delete(data.id);
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
