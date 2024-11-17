import Dexie, { Table } from 'dexie';

interface Task {
  id?: string;
  title: string;
  completed: boolean;
  folderId?: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
  timestamp: number;
}

interface JournalEntry {
  id?: string;
  title: string;
  content: string;
  date: string;
  folderId?: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
  timestamp: number;
}

interface Folder {
  id?: string;
  name: string;
  type: 'task' | 'journal';
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
  timestamp: number;
}

interface Note {
  id?: string;
  content: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
  timestamp: number;
}

interface PomodoroSession {
  id?: string;
  duration: number;
  startTime: number;
  endTime: number;
  type: 'work' | 'break';
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
  timestamp: number;
}

interface SyncQueueItem {
  id?: number;
  action: 'create' | 'update' | 'delete';
  store: string;
  data: any;
  timestamp: number;
  attempts: number;
}

class NekayDatabase extends Dexie {
  tasks!: Table<Task>;
  journal!: Table<JournalEntry>;
  folders!: Table<Folder>;
  notes!: Table<Note>;
  pomodoro!: Table<PomodoroSession>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    // Change database name to force a fresh start
    super('NekayOfflineDB_v2');
    
    this.version(1).stores({
      tasks: 'id, syncStatus, folderId, lastModified',
      journal: 'id, syncStatus, folderId, date, lastModified',
      folders: 'id, syncStatus, type, lastModified',
      notes: 'id, syncStatus, lastModified',
      pomodoro: 'id, syncStatus, type, startTime, lastModified',
      syncQueue: '++id, action, store, timestamp'
    });

    // Add hooks to ensure IDs are strings
    this.tasks.hook('creating', (primKey, obj) => {
      obj.id = obj.id || crypto.randomUUID();
      return obj;
    });

    this.journal.hook('creating', (primKey, obj) => {
      obj.id = obj.id || crypto.randomUUID();
      return obj;
    });

    this.folders.hook('creating', (primKey, obj) => {
      obj.id = obj.id || crypto.randomUUID();
      return obj;
    });

    this.notes.hook('creating', (primKey, obj) => {
      obj.id = obj.id || crypto.randomUUID();
      return obj;
    });

    this.pomodoro.hook('creating', (primKey, obj) => {
      obj.id = obj.id || crypto.randomUUID();
      return obj;
    });
  }
}

const db = new NekayDatabase();

type StoreNames = 'tasks' | 'journal' | 'folders' | 'notes' | 'pomodoro' | 'syncQueue';

interface BaseItem {
  id?: string;
  syncStatus?: 'synced' | 'pending' | 'failed';
  lastModified?: number;
  timestamp?: number;
}

class IndexedDBService {
  private readonly validStores: StoreNames[] = ['tasks', 'journal', 'folders', 'notes', 'pomodoro', 'syncQueue'];

  private validateStore(store: string): asserts store is StoreNames {
    if (!this.validStores.includes(store as StoreNames)) {
      throw new Error(`Invalid store name: ${store}`);
    }
  }

  private addMetadata<T extends BaseItem>(item: T): T {
    const timestamp = Date.now();
    return {
      ...item,
      syncStatus: 'pending',
      lastModified: timestamp,
      timestamp
    };
  }

  async init(): Promise<void> {
    try {
      await db.open();
      console.log('Database opened successfully');
    } catch (error) {
      const err = error as Error;
      console.error('Failed to open database:', err);
      
      if (err.name === 'UpgradeError') {
        // Delete the old database and try again
        await Dexie.delete('NekayOfflineDB');
        try {
          await db.open();
          console.log('Database recreated successfully');
          return;
        } catch (retryError) {
          throw {
            code: 'INDEXEDDB_INIT_ERROR',
            message: 'Failed to initialize database after cleanup',
            details: retryError instanceof Error ? retryError.message : String(retryError)
          };
        }
      }

      if (err.name === 'BulkError') {
        throw {
          code: 'INDEXEDDB_BULK_ERROR',
          message: 'Failed to process multiple items',
          details: err.message
        };
      }

      if (err.name === 'DatabaseClosedError') {
        throw {
          code: 'INDEXEDDB_BLOCKED',
          message: 'Database is blocked. Please close other tabs or refresh the page.',
          details: err.message
        };
      }

      throw {
        code: 'INDEXEDDB_INIT_ERROR',
        message: 'Failed to initialize database',
        details: err.message
      };
    }
  }

  async addItem<T extends BaseItem>(store: StoreNames, item: T): Promise<string> {
    try {
      this.validateStore(store);
      const table = db.table(store);
      const itemWithMeta = this.addMetadata(item);
      
      const id = await db.transaction('rw', table, async () => {
        const id = await table.add(itemWithMeta);
        await db.syncQueue.add({
          action: 'create',
          store,
          data: { ...itemWithMeta, id },
          timestamp: Date.now(),
          attempts: 0
        });
        return id;
      });
      
      return id.toString();
    } catch (error) {
      const msg = `Failed to add item to ${store}`;
      console.error(msg, error);
      throw new Error(`${msg}: ${error}`);
    }
  }

  async updateItem<T extends BaseItem>(store: StoreNames, id: string, updates: Partial<T>): Promise<void> {
    try {
      this.validateStore(store);
      const table = db.table(store);
      const updatesWithMeta = this.addMetadata(updates);
      
      await db.transaction('rw', table, async () => {
        await table.update(id, updatesWithMeta);
        await db.syncQueue.add({
          action: 'update',
          store,
          data: { id, ...updatesWithMeta },
          timestamp: Date.now(),
          attempts: 0
        });
      });
    } catch (error) {
      const msg = `Failed to update item in ${store}`;
      console.error(msg, error);
      throw new Error(`${msg}: ${error}`);
    }
  }

  async deleteItem(store: StoreNames, id: string): Promise<void> {
    try {
      this.validateStore(store);
      const table = db.table(store);
      
      await db.transaction('rw', [table, db.syncQueue], async () => {
        await table.delete(id);
        await db.syncQueue.add({
          action: 'delete',
          store,
          data: { id },
          timestamp: Date.now(),
          attempts: 0
        });
      });
    } catch (error) {
      const msg = `Failed to delete item from ${store}`;
      console.error(msg, error);
      throw new Error(`${msg}: ${error}`);
    }
  }

  async getAllItems<T extends BaseItem>(store: StoreNames): Promise<T[]> {
    try {
      this.validateStore(store);
      const table = db.table(store);
      return await table.toArray();
    } catch (error) {
      const msg = `Failed to get items from ${store}`;
      console.error(msg, error);
      throw new Error(`${msg}: ${error}`);
    }
  }

  async getItem<T extends BaseItem>(store: StoreNames, id: string): Promise<T | undefined> {
    try {
      this.validateStore(store);
      const table = db.table(store);
      return await table.get(id);
    } catch (error) {
      const msg = `Failed to get item from ${store}`;
      console.error(msg, error);
      throw new Error(`${msg}: ${error}`);
    }
  }

  async clearItems(store: StoreNames): Promise<void> {
    try {
      this.validateStore(store);
      const table = db.table(store);
      await table.clear();
    } catch (error) {
      const msg = `Failed to clear items from ${store}`;
      console.error(msg, error);
      throw new Error(`${msg}: ${error}`);
    }
  }

  async getPendingSyncItems<T extends BaseItem>(store: StoreNames): Promise<T[]> {
    try {
      this.validateStore(store);
      const table = db.table(store);
      return await table.where('syncStatus').equals('pending').toArray();
    } catch (error) {
      const msg = `Failed to get pending sync items from ${store}`;
      console.error(msg, error);
      throw new Error(`${msg}: ${error}`);
    }
  }

  async updateSyncStatus(store: StoreNames, id: string, status: 'pending' | 'synced' | 'failed'): Promise<void> {
    try {
      this.validateStore(store);
      const table = db.table(store);
      await table.update(id, { syncStatus: status, lastModified: Date.now() });
    } catch (error) {
      const msg = `Failed to update sync status in ${store}`;
      console.error(msg, error);
      throw new Error(`${msg}: ${error}`);
    }
  }

  async bulkAdd<T extends BaseItem>(store: StoreNames, items: T[]): Promise<string[]> {
    try {
      this.validateStore(store);
      const table = db.table(store);
      const timestamp = Date.now();
      const itemsWithMeta = items.map(item => this.addMetadata(item));
      
      const ids = await db.transaction('rw', [table, db.syncQueue], async () => {
        const ids = await table.bulkAdd(itemsWithMeta, { allKeys: true });
        await Promise.all(
          itemsWithMeta.map((item, index) =>
            db.syncQueue.add({
              action: 'create',
              store,
              data: { ...item, id: ids[index] },
              timestamp: Date.now(),
              attempts: 0
            })
          )
        );
        return ids;
      });
      
      return ids.map(id => id.toString());
    } catch (error) {
      const msg = `Failed to bulk add items to ${store}`;
      console.error(msg, error);
      throw new Error(`${msg}: ${error}`);
    }
  }

  async bulkUpdate<T extends BaseItem>(store: StoreNames, items: { id: string; changes: Partial<T> }[]): Promise<void> {
    try {
      this.validateStore(store);
      const table = db.table(store);
      
      await db.transaction('rw', [table, db.syncQueue], async () => {
        await Promise.all(
          items.map(async ({ id, changes }) => {
            const updatesWithMeta = this.addMetadata(changes);
            await table.update(id, updatesWithMeta);
            await db.syncQueue.add({
              action: 'update',
              store,
              data: { id, ...updatesWithMeta },
              timestamp: Date.now(),
              attempts: 0
            });
          })
        );
      });
    } catch (error) {
      const msg = `Failed to bulk update items in ${store}`;
      console.error(msg, error);
      throw new Error(`${msg}: ${error}`);
    }
  }

  async searchItems<T extends BaseItem>(store: StoreNames, query: string): Promise<T[]> {
    try {
      this.validateStore(store);
      const table = db.table(store);
      return await table
        .filter(item => 
          Object.values(item).some(value => 
            String(value).toLowerCase().includes(query.toLowerCase())
          )
        )
        .toArray();
    } catch (error) {
      const msg = `Failed to search items in ${store}`;
      console.error(msg, error);
      throw new Error(`${msg}: ${error}`);
    }
  }
}

export const indexedDBService = new IndexedDBService();
