import Dexie, { Table } from 'dexie';

export interface BaseItem {
  id?: string;
  syncStatus?: 'synced' | 'pending' | 'failed';
  lastModified?: number;
  timestamp?: number;
}

export interface Task extends BaseItem {
  title: string;
  completed: boolean;
  folderId?: string;
}

export interface JournalEntry extends BaseItem {
  title: string;
  content: string;
  date: string;
  folderId?: string;
}

export interface Folder extends BaseItem {
  name: string;
  type: 'task' | 'journal';
}

export interface Note extends BaseItem {
  content: string;
}

export interface PomodoroSession extends BaseItem {
  startTime: number;
  endTime: number;
  duration: number;
  type: 'work' | 'break';
  completed: boolean;
}

export interface PomodoroStats extends BaseItem {
  completedSessions: number;
  totalFocusTime: number;
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
    super('NekayOfflineDB_v2');
    
    this.version(1).stores({
      tasks: 'id, syncStatus, folderId, lastModified, [syncStatus+lastModified]',
      journal: 'id, syncStatus, folderId, date, lastModified, [syncStatus+lastModified]',
      folders: 'id, syncStatus, type, lastModified, [syncStatus+lastModified]',
      notes: 'id, syncStatus, lastModified, [syncStatus+lastModified]',
      pomodoro: 'id, syncStatus, type, startTime, lastModified, [syncStatus+lastModified]',
      syncQueue: '++id, action, store, timestamp'
    });

    this.tasks = this.table('tasks');
    this.journal = this.table('journal');
    this.folders = this.table('folders');
    this.notes = this.table('notes');
    this.pomodoro = this.table('pomodoro');
    this.syncQueue = this.table('syncQueue');
  }
}

const db = new NekayDatabase();

export type StoreNames = 'tasks' | 'journal' | 'folders' | 'notes' | 'pomodoro' | 'syncQueue';

class IndexedDBService {
  private readonly validStores: StoreNames[] = ['tasks', 'journal', 'folders', 'notes', 'pomodoro', 'syncQueue'];
  private isInitialized = false;

  private validateStore(store: string): asserts store is StoreNames {
    if (!this.validStores.includes(store as StoreNames)) {
      throw new Error(`Invalid store name: ${store}`);
    }
  }

  private addMetadata<T extends BaseItem>(item: T): T {
    const timestamp = Date.now();
    return {
      ...item,
      id: item.id || crypto.randomUUID(),
      syncStatus: item.syncStatus || 'pending',
      lastModified: timestamp,
      timestamp: timestamp
    };
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await db.open();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to open database:', error);
      throw error;
    }
  }

  // Add retry and cleanup mechanisms
  private async retryOnQuotaError<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        return await operation();
      } catch (error: any) {
        attempts++;
        if (error.name === 'QuotaExceededError') {
          console.warn('Storage quota exceeded, attempting cleanup...');
          await this.cleanup();
          if (attempts === maxRetries) throw error;
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retry attempts reached');
  }

  private async cleanup(): Promise<void> {
    console.log('Starting storage cleanup...');
    const oldestTimestamp = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    try {
      await db.transaction('rw', this.validStores, async () => {
        await Promise.all(
          this.validStores.map(store => 
            db.table(store).where('timestamp').below(oldestTimestamp).delete()
          )
        );
      });
      console.log('Cleanup completed successfully');
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  }

  async addItem<T extends BaseItem>(store: StoreNames, item: T): Promise<string> {
    if (!this.isInitialized) {
      await this.init();
    }

    this.validateStore(store);
    const itemWithMetadata = this.addMetadata(item);
    
    return await this.retryOnQuotaError(async () => {
      try {
        await db.table(store).add(itemWithMetadata);
        return itemWithMetadata.id!;
      } catch (error: any) {
        if (error.name === 'ConstraintError') {
          // Handle duplicate key by updating instead
          await db.table(store).put(itemWithMetadata);
          return itemWithMetadata.id!;
        }
        throw error;
      }
    });
  }

  async updateItem<T extends BaseItem>(store: StoreNames, id: string, updates: Partial<T>): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      this.validateStore(store);
      const table = db.table(store);
      await table.update(id, { ...updates, lastModified: Date.now() });
    } catch (error) {
      console.error(`Failed to update item in ${store}:`, error);
      throw error;
    }
  }

  async getAllItems<T extends BaseItem>(store: StoreNames): Promise<T[]> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      this.validateStore(store);
      const table = db.table(store);
      return await table.toArray() as T[];
    } catch (error) {
      console.error(`Failed to get items from ${store}:`, error);
      throw error;
    }
  }

  async getItem<T extends BaseItem>(store: StoreNames, id: string): Promise<T | undefined> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      this.validateStore(store);
      const table = db.table(store);
      return await table.get(id) as T;
    } catch (error) {
      console.error(`Failed to get item from ${store}:`, error);
      throw error;
    }
  }

  async deleteItem(store: StoreNames, id: string): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      this.validateStore(store);
      const table = db.table(store);
      await table.delete(id);
    } catch (error) {
      console.error(`Failed to delete item from ${store}:`, error);
      throw error;
    }
  }

  async clearItems(store: StoreNames): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      this.validateStore(store);
      const table = db.table(store);
      await table.clear();
    } catch (error) {
      console.error(`Failed to clear items from ${store}:`, error);
      throw error;
    }
  }

  async clearStore(store: StoreNames): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      this.validateStore(store);
      const table = db.table(store);
      await table.clear();
    } catch (error) {
      console.error(`Failed to clear store ${store}:`, error);
      throw error;
    }
  }

  async getPendingSyncItems<T extends BaseItem>(store: StoreNames, batchSize: number, offset: number): Promise<T[]> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      this.validateStore(store);
      const table = db.table(store);
      return await table
        .where('[syncStatus+lastModified]')
        .between(['pending', Dexie.minKey], ['pending', Dexie.maxKey])
        .offset(offset)
        .limit(batchSize)
        .toArray() as T[];
    } catch (error) {
      console.error(`Failed to get pending sync items from ${store}:`, error);
      throw error;
    }
  }
}

export const indexedDBService = new IndexedDBService();
