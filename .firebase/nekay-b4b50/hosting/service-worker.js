importScripts('https://cdn.jsdelivr.net/npm/dexie@latest/dist/dexie.min.js');

// Cache Strategies
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-cache-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-cache-${CACHE_VERSION}`;
const API_CACHE = `api-cache-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/notification.mp3',
  '/notification2.wav',
  '/vite.svg',
  '/chart-line-solid.svg',
  '/journal.svg',
  '/taskIcon.svg',
  '/assets/',
  '/src/',
  '/node_modules/',
  '/@vite/client',
  '/assets/moonbg.gif',
  '/assets/melodysticker.gif',
  '/assets/melodysticker.png',
  '/assets/melody3.gif',
  '/assets/bgsky.jpg',
  '/assets/sunsetbg.jpg',
  '/assets/melodystar.png',
  '/assets/melodygoodstickr.jpg',
  '/assets/background.jpg',
  '/assets/bgsky.png',
  '/assets/melodyno.gif',
  '/assets/melody.gif',
  '/assets/cloud.png',
  '/assets/melody2.gif',
  '/assets/melodykiss.png',
  '/assets/sleepingmelody.png',
  '/img/icons/apple-touch-icon.png',
  '/img/icons/safari-pinned-tab.svg',
  '/img/icons/android-chrome-192x192.png',
  '/img/icons/android-chrome-512x512.png',
  '/img/icons/android-chrome-maskable-192x192.png',
  '/img/icons/android-chrome-maskable-512x512.png',
  OFFLINE_PAGE
];

// Cache size limits
const DYNAMIC_CACHE_LIMIT = 50;
const API_CACHE_LIMIT = 100;

// Initialize Dexie
class NekayDatabase extends Dexie {
  constructor() {
    super('NekayOfflineDB_v2');
    this.version(1).stores({
      tasks: 'id, syncStatus, folderId, lastModified',
      journal: 'id, syncStatus, folderId, date, lastModified',
      folders: 'id, syncStatus, type, lastModified',
      notes: 'id, syncStatus, lastModified',
      pomodoro: 'id, syncStatus, type, startTime, lastModified',
      syncQueue: '++id, action, store, timestamp'
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
      caches.open(API_CACHE),
      db.open().catch(err => console.error('Failed to open database:', err))
    ])
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      cleanupCaches(),
      // Claim clients
      self.clients.claim(),
      // Open database
      db.open().catch(err => console.error('Failed to open database:', err))
    ])
  );
});

// Cleanup old caches and enforce size limits
async function cleanupCaches() {
  const lockKey = 'cache-cleanup-lock';
  
  // Try to acquire lock
  if (await caches.match(lockKey)) {
    console.log('Cache cleanup already in progress');
    return;
  }
  
  try {
    // Set lock
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(lockKey, new Response('locked'));
    
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
      name.startsWith('static-cache-') && name !== STATIC_CACHE ||
      name.startsWith('dynamic-cache-') && name !== DYNAMIC_CACHE ||
      name.startsWith('api-cache-') && name !== API_CACHE
    );

    await Promise.all([
      ...oldCaches.map(cache => caches.delete(cache)),
      trimCache(DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT),
      trimCache(API_CACHE, API_CACHE_LIMIT)
    ]);
  } finally {
    // Release lock
    const cache = await caches.open(STATIC_CACHE);
    await cache.delete(lockKey);
  }
}

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    console.log(`Trimming cache ${cacheName}, current size: ${keys.length}`);
    for (let i = 0; i < keys.length - maxItems; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests and browser-sync
  if (event.request.method !== 'GET' || url.pathname.includes('browser-sync')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event));
    return;
  }

  // Handle static assets
  if (STATIC_ASSETS.some(asset => url.pathname.includes(asset))) {
    event.respondWith(handleStaticAsset(event));
    return;
  }

  // Handle other requests
  event.respondWith(handleDynamicRequest(event));
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function handleApiRequest(event) {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      const response = await fetch(event.request);
      
      // Validate cache headers
      const cacheControl = response.headers.get('Cache-Control');
      const shouldCache = !cacheControl || !cacheControl.includes('no-store');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Cache the response if allowed
      if (shouldCache && response.ok) {
        const cache = await caches.open(API_CACHE);
        try {
          await cache.put(event.request, response.clone());
        } catch (cacheError) {
          console.error('Failed to cache API response:', cacheError);
        }
      }
      
      return response;
    } catch (error) {
      retries++;
      console.error(`API request failed (attempt ${retries}/${MAX_RETRIES}):`, error);
      
      if (retries === MAX_RETRIES) {
        // Queue failed request if it's a mutation
        if (event.request.method !== 'GET') {
          const request = event.request.clone();
          await queueFailedRequest(request);
        }
        
        // Try to return cached data for GET requests
        if (event.request.method === 'GET') {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
        }
        
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

function handleStaticAsset(event) {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
}

async function handleDynamicRequest(event) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const response = await fetch(event.request);
    if (response.ok) {
      await cache.put(event.request, response.clone());
      return response;
    }
  } catch (error) {
    const cached = await cache.match(event.request);
    if (cached) {
      return cached;
    }
  }

  // Return offline page as last resort
  return cache.match(OFFLINE_PAGE);
}

async function queueFailedRequest(request) {
  try {
    // Clone the request before reading it
    const requestClone = request.clone();
    
    let body;
    try {
      body = await requestClone.text();
    } catch (e) {
      body = null;
    }

    const serializedRequest = {
      url: request.url,
      method: request.method,
      headers: Array.from(request.headers.entries()),
      body,
      mode: request.mode,
      credentials: request.credentials,
      cache: request.cache,
      timestamp: Date.now()
    };

    await db.syncQueue.add({
      action: 'api',
      store: 'requests',
      data: serializedRequest,
      timestamp: Date.now(),
      attempts: 0
    });

    // Notify clients about the queued request
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_QUEUED',
        payload: {
          url: request.url,
          method: request.method,
          timestamp: Date.now()
        }
      });
    });
  } catch (error) {
    console.error('Failed to queue request:', error);
    throw error;
  }
}

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  const MAX_RETRY_ATTEMPTS = 5;
  const clients = await self.clients.matchAll();
  
  try {
    const pendingItems = await db.syncQueue.toArray();
    console.log(`Processing ${pendingItems.length} pending items`);
    
    for (const item of pendingItems) {
      try {
        if (item.action === 'api' && item.attempts < MAX_RETRY_ATTEMPTS) {
          await processSyncRequest(item.data);
          await db.syncQueue.delete(item.id);
          
          // Notify clients about successful sync
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_COMPLETED',
              payload: {
                id: item.id,
                timestamp: Date.now()
              }
            });
          });
        } else if (item.attempts >= MAX_RETRY_ATTEMPTS) {
          console.log(`Item ${item.id} exceeded max retry attempts, marking as failed`);
          await db.syncQueue.delete(item.id);
          
          // Notify clients about sync failure
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_FAILED',
              payload: {
                id: item.id,
                error: 'Exceeded maximum retry attempts'
              }
            });
          });
        }
      } catch (error) {
        console.error(`Failed to process sync item ${item.id}:`, error);
        
        // Update retry attempts
        await db.syncQueue.update(item.id, {
          attempts: (item.attempts || 0) + 1
        });
        
        // Notify clients about sync error
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_ERROR',
            payload: {
              id: item.id,
              error: error.message
            }
          });
        });
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
    
    // Notify clients about sync failure
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_FAILED',
        payload: {
          error: error.message
        }
      });
    });
    
    throw error;
  }
}

async function processSyncRequest(requestData) {
  try {
    const { url, method, headers, body, mode, credentials, cache } = requestData;
    
    const request = new Request(url, {
      method,
      headers: new Headers(headers),
      body: body || null,
      mode,
      credentials,
      cache
    });
    
    const response = await fetch(request);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('Failed to process sync request:', error);
    throw error;
  }
}
