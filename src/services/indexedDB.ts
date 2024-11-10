export interface IndexedDBTask {
  id: string;
  title: string;
  completed: boolean;
  folderId: string | null;
  syncStatus: "synced" | "pending" | "failed";
  lastModified: number;
}

export interface IndexedDBJournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  folderId: string | null;
  syncStatus: "synced" | "pending" | "failed";
  lastModified: number;
}

export interface IndexedDBFolder {
  id: string;
  name: string;
  type: "task" | "journal";
  syncStatus: "synced" | "pending" | "failed";
  lastModified: number;
}

// Database configuration
const DB_NAME = "NekayOfflineDB";
const DB_VERSION = 1;
const STORES = {
  tasks: "tasks",
  journal: "journal",
  folders: "folders",
  syncQueue: "syncQueue",
};

// IndexedDB wrapper class
export class IndexedDBService {
  private db: IDBDatabase | null = null;

  // Initialize the database
  public async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Error opening IndexedDB");
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("IndexedDB initialized successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores with indexes
        if (!db.objectStoreNames.contains(STORES.tasks)) {
          const taskStore = db.createObjectStore(STORES.tasks, {
            keyPath: "id",
          });
          taskStore.createIndex("syncStatus", "syncStatus", { unique: false });
          taskStore.createIndex("folderId", "folderId", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.journal)) {
          const journalStore = db.createObjectStore(STORES.journal, {
            keyPath: "id",
          });
          journalStore.createIndex("syncStatus", "syncStatus", {
            unique: false,
          });
          journalStore.createIndex("folderId", "folderId", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.folders)) {
          const folderStore = db.createObjectStore(STORES.folders, {
            keyPath: "id",
          });
          folderStore.createIndex("syncStatus", "syncStatus", {
            unique: false,
          });
          folderStore.createIndex("type", "type", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.syncQueue)) {
          const syncQueueStore = db.createObjectStore(STORES.syncQueue, {
            keyPath: "id",
            autoIncrement: true,
          });
          syncQueueStore.createIndex("timestamp", "timestamp", {
            unique: false,
          });
        }
      };
    });
  }

  // Generic method to add items to any store
  async addItem<T>(storeName: string, item: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add({
        ...item,
        syncStatus: "pending",
        lastModified: Date.now(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Generic method to get all items from a store
  async getAllItems<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get pending sync items
  async getPendingSyncItems(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const index = store.index("syncStatus");
      const request = index.getAll("pending");

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Update sync status
  async updateSyncStatus(
    storeName: string,
    id: string,
    status: "synced" | "failed"
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const item = request.result;
        if (item) {
          item.syncStatus = status;
          item.lastModified = Date.now();
          store.put(item);
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Delete item
  async deleteItem(storeName: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Update item
  async updateItem<T>(storeName: string, item: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put({
        ...item,
        syncStatus: "pending",
        lastModified: Date.now(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Create and export a singleton instance
export const indexedDBService = new IndexedDBService();
