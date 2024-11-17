import Dexie, { Table } from 'dexie';

interface Task {
  id?: number;
  title: string;
  completed: boolean;
  folderId?: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
  timestamp: number;
}

interface JournalEntry {
  id?: number;
  title: string;
  content: string;
  date: string;
  folderId?: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
  timestamp: number;
}

interface Folder {
  id?: number;
  name: string;
  type: 'task' | 'journal';
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
  timestamp: number;
}

interface Note {
  id?: number;
  content: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
  timestamp: number;
}

interface PomodoroSession {
  id?: number;
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
    super('NekayOfflineDB');
    this.version(1).stores({
      tasks: '++id, syncStatus, folderId, lastModified',
      journal: '++id, syncStatus, folderId, date, lastModified',
      folders: '++id, syncStatus, type, lastModified',
      notes: '++id, syncStatus, lastModified',
      pomodoro: '++id, syncStatus, type, startTime, lastModified',
      syncQueue: '++id, action, store, timestamp'
    });
  }
}

const db = new NekayDatabase();

class IndexedDBService {
  async init(): Promise<void> {
    try {
      await db.open();
      console.log('Database opened successfully');
    } catch (error) {
      console.error('Failed to open database:', error);
      throw error;
    }
  }

  async addItem(store: string, item: any): Promise<number> {
    try {
      const table = db.table(store);
      const id = await table.add({
        ...item,
        syncStatus: 'pending',
        lastModified: Date.now(),
        timestamp: Date.now()
      });
      return id as number;
    } catch (error) {
      console.error(`Failed to add item to ${store}:`, error);
      throw error;
    }
  }

  async updateItem(store: string, id: number, updates: any): Promise<void> {
    try {
      const table = db.table(store);
      await table.update(id, {
        ...updates,
        syncStatus: 'pending',
        lastModified: Date.now()
      });
    } catch (error) {
      console.error(`Failed to update item in ${store}:`, error);
      throw error;
    }
  }

  async deleteItem(store: string, id: number): Promise<void> {
    try {
      const table = db.table(store);
      await table.delete(id);
      
      // Add delete operation to sync queue
      await db.syncQueue.add({
        action: 'delete',
        store,
        data: { id },
        timestamp: Date.now(),
        attempts: 0
      });
    } catch (error) {
      console.error(`Failed to delete item from ${store}:`, error);
      throw error;
    }
  }

  async getAllItems(store: string): Promise<any[]> {
    try {
      const table = db.table(store);
      return await table.toArray();
    } catch (error) {
      console.error(`Failed to get items from ${store}:`, error);
      throw error;
    }
  }

  async getItem(store: string, id: number): Promise<any> {
    try {
      const table = db.table(store);
      return await table.get(id);
    } catch (error) {
      console.error(`Failed to get item from ${store}:`, error);
      throw error;
    }
  }

  async clearItems(store: string): Promise<void> {
    try {
      const table = db.table(store);
      await table.clear();
    } catch (error) {
      console.error(`Failed to clear items from ${store}:`, error);
      throw error;
    }
  }

  async getPendingSyncItems(store: string): Promise<any[]> {
    try {
      const table = db.table(store);
      return await table.where('syncStatus').equals('pending').toArray();
    } catch (error) {
      console.error(`Failed to get pending sync items from ${store}:`, error);
      throw error;
    }
  }

  async updateSyncStatus(store: string, id: number, status: 'pending' | 'synced' | 'failed'): Promise<void> {
    try {
      const table = db.table(store);
      await table.update(id, { syncStatus: status, lastModified: Date.now() });
    } catch (error) {
      console.error(`Failed to update sync status in ${store}:`, error);
      throw error;
    }
  }

  // New methods specific to Dexie functionality
  async bulkAdd(store: string, items: any[]): Promise<number[]> {
    try {
      const table = db.table(store);
      const timestamp = Date.now();
      const itemsWithMeta = items.map(item => ({
        ...item,
        syncStatus: 'pending',
        lastModified: timestamp,
        timestamp
      }));
      return await table.bulkAdd(itemsWithMeta, { allKeys: true });
    } catch (error) {
      console.error(`Failed to bulk add items to ${store}:`, error);
      throw error;
    }
  }

  async bulkUpdate(store: string, items: { id: number; changes: any }[]): Promise<void> {
    try {
      const table = db.table(store);
      await db.transaction('rw', table, async () => {
        await Promise.all(
          items.map(({ id, changes }) =>
            table.update(id, {
              ...changes,
              syncStatus: 'pending',
              lastModified: Date.now()
            })
          )
        );
      });
    } catch (error) {
      console.error(`Failed to bulk update items in ${store}:`, error);
      throw error;
    }
  }

  async searchItems(store: string, query: string): Promise<any[]> {
    try {
      const table = db.table(store);
      return await table
        .filter(item => 
          Object.values(item).some(value => 
            String(value).toLowerCase().includes(query.toLowerCase())
          )
        )
        .toArray();
    } catch (error) {
      console.error(`Failed to search items in ${store}:`, error);
      throw error;
    }
  }
}

export const indexedDBService = new IndexedDBService();
