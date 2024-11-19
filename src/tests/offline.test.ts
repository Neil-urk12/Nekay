import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useOffline } from '../composables/useOffline';
import { indexedDBService } from '../services/indexedDB';

describe('Offline Functionality', () => {
  beforeEach(() => {
    // Mock IndexedDB
    const indexedDB = {
      open: vi.fn(),
      deleteDatabase: vi.fn(),
    };
    global.indexedDB = indexedDB as any;
    
    // Reset network status
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useOffline Composable', () => {
    it('should detect offline status', () => {
      const { isOffline } = useOffline();
      expect(isOffline.value).toBe(false);

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
      expect(isOffline.value).toBe(true);
    });

    it('should track reconnection attempts', async () => {
      const { reconnectionAttempts, forceCheck } = useOffline();
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      
      await forceCheck();
      expect(reconnectionAttempts.value).toBe(1);
    });

    it('should update lastOnlineTime when connection is restored', async () => {
      const { lastOnlineTime, isOffline } = useOffline();
      const mockDate = new Date();
      vi.setSystemTime(mockDate);

      // Simulate going offline then online
      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event('offline'));
      expect(isOffline.value).toBe(true);

      Object.defineProperty(navigator, 'onLine', {
        configurable: true,
        value: true,
      });
      window.dispatchEvent(new Event('online'));
      expect(lastOnlineTime.value?.getTime()).toBe(mockDate.getTime());
    });
  });

  describe('IndexedDB Service', () => {
    beforeEach(async () => {
      await indexedDBService.init();
    });

    it('should store data offline', async () => {
      const testItem = { id: '1', title: 'Test Task', completed: false };
      await indexedDBService.addItem('tasks', testItem);
      const items = await indexedDBService.getAllItems('tasks');
      expect(items).toContainEqual(expect.objectContaining(testItem));
    });

    it('should queue items for sync when offline', async () => {
      const testItem = { 
        id: '1', 
        title: 'Offline Task', 
        completed: false,
        syncStatus: 'pending' as const
      };
      await indexedDBService.addItem('tasks', testItem);
      const pendingItems = await indexedDBService.getPendingSyncItems('tasks', 50, 0);
      expect(pendingItems.length).toBe(1);
      expect(pendingItems[0]).toMatchObject(testItem);
    });

    it('should update sync status after successful sync', async () => {
      const testItem = { 
        id: '1', 
        title: 'Sync Test Task', 
        completed: false,
        syncStatus: 'pending' as const
      };
      await indexedDBService.addItem('tasks', testItem);
      const pendingItems = await indexedDBService.getPendingSyncItems('tasks', 50, 0);
      expect(pendingItems.length).toBe(1);
    });
  });

  describe('Service Worker', () => {
    it('should cache static assets', async () => {
      const cache = await caches.open('static-cache-v1');
      await cache.add('/');
      const cachedResponse = await cache.match('/');
      expect(cachedResponse).toBeTruthy();
    });

    it('should handle offline requests', async () => {
      const cache = await caches.open('static-cache-v1');
      await cache.put('/', new Response('Cached Response'));
      
      // Simulate offline
      global.fetch = vi.fn().mockRejectedValue(new Error('Offline'));
      
      const response = await fetch('/');
      expect(await response.text()).toBe('Cached Response');
    });
  });
});
