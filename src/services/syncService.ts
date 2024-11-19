import { indexedDBService } from "./indexedDB";
import type { BatchUpdateOperations } from "../firebase/firestore-service";
import { 
  getChangedItems,
  batchUpdate,
  WithMetadata,
  Task, Folder, JournalEntry 
} from "../firebase/firestore-service";
import { useOffline } from "../composables/useOffline";
import { watch } from 'vue';

const SYNC_INTERVAL = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

async function retry<T>(func: () => Promise<T>, retries: number = MAX_RETRIES): Promise<T> {
  try {
    return await func();
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying after error: ${error}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retry(func, retries - 1);
    } else {
      console.error(`Failed after multiple retries: ${error}`);
      throw error;
    }
  }
}

export class SyncService {
  private isSyncing = false;
  private lastSyncTime = 0;
  private syncInterval: NodeJS.Timeout | null = null;
  private offlineState = useOffline();
  private syncDebounceTimeout: NodeJS.Timeout | null = null;
  private syncQueue: Map<string, Promise<void>> = new Map();

  private get isOnline() {
    return !this.offlineState.isOffline.value;
  }

  constructor() {
    this.setupAutoSync();
    this.setupOnlineListener();
  }

  private clearTimeouts() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.syncDebounceTimeout) {
      clearTimeout(this.syncDebounceTimeout);
      this.syncDebounceTimeout = null;
    }
  }

  private setupAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncData();
      }
    }, SYNC_INTERVAL);
  }

  private setupOnlineListener() {
    watch(this.offlineState.isOffline, (isOffline) => {
      if (!isOffline) {
        this.debouncedSync();
      }
    });

    window.addEventListener('app-online', () => {
      this.debouncedSync();
    });
  }

  private debouncedSync(): void {
    if (this.syncDebounceTimeout) {
      clearTimeout(this.syncDebounceTimeout);
    }
    
    try {
      this.syncDebounceTimeout = setTimeout(() => {
        this.syncData().catch(error => {
          console.error('Debounced sync failed:', error);
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to schedule debounced sync:', error);
    }
  }

  private async queueSync(key: string, operation: () => Promise<void>): Promise<void> {
    const existing = this.syncQueue.get(key);
    if (existing) {
      return existing;
    }

    const promise = operation().finally(() => {
      this.syncQueue.delete(key);
    });

    this.syncQueue.set(key, promise);
    return promise;
  }

  // Main sync process
  async syncData(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress, queuing...');
      return this.queueSync('main', () => this._syncData());
    }
    return this._syncData();
  }

  private async _syncData(): Promise<void> {
    try {
      this.isSyncing = true;
      console.log('Starting sync process...');

      const syncStart = Date.now();
      
      // Get all pending changes from IndexedDB in batches
      const batchSize = 50;
      let processed = 0;
      
      while (true) {
        const [pendingTasks, pendingEntries, pendingFolders] = await retry<[Task[], JournalEntry[], Folder[]]>(() => Promise.all([
          indexedDBService.getPendingSyncItems<Task>('tasks', batchSize, processed),
          indexedDBService.getPendingSyncItems<JournalEntry>('journal', batchSize, processed),
          indexedDBService.getPendingSyncItems<Folder>('folders', batchSize, processed)
        ]));

        if (!pendingTasks.length && !pendingEntries.length && !pendingFolders.length) {
          break;
        }

        // Process batch
        await this.processBatch({
          tasks: pendingTasks,
          journalEntries: pendingEntries,
          folders: pendingFolders
        });

        processed += batchSize;
      }

      // Get remote changes since last sync
      const [remoteTasks, remoteEntries, remoteFolders] = await retry<[WithMetadata<Task>[], WithMetadata<JournalEntry>[], WithMetadata<Folder>[]]>(() => Promise.all([
        getChangedItems<Task>('tasks', this.lastSyncTime),
        getChangedItems<JournalEntry>('journalEntries', this.lastSyncTime),
        getChangedItems<Folder>('folders', this.lastSyncTime)
      ]));

      // Process remote changes first
      console.log('Processing remote changes...');
      await retry(() => this.processRemoteChanges(remoteTasks, remoteEntries, remoteFolders));

      this.lastSyncTime = syncStart;
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  private async processBatch(
    batch: {
      tasks: WithMetadata<Task>[],
      journalEntries: WithMetadata<JournalEntry>[],
      folders: WithMetadata<Folder>[]
    }
  ): Promise<void> {
    const { tasks, journalEntries, folders } = batch;
    
    // Process in smaller chunks to avoid overwhelming IndexedDB
    const chunkSize = 10;
    const chunks = [];
    
    for (let i = 0; i < Math.max(tasks.length, journalEntries.length, folders.length); i += chunkSize) {
      chunks.push({
        tasks: tasks.slice(i, i + chunkSize),
        journalEntries: journalEntries.slice(i, i + chunkSize),
        folders: folders.slice(i, i + chunkSize)
      });
    }
    
    for (const chunk of chunks) {
      await retry(() => this.processChunk(chunk));
    }
  }

  private async processChunk(
    chunk: {
      tasks: WithMetadata<Task>[],
      journalEntries: WithMetadata<JournalEntry>[],
      folders: WithMetadata<Folder>[]
    }
  ): Promise<void> {
    // Separate deleted and updated items
    const deletedTasks = chunk.tasks.filter(t => t.deleted).map(t => t.id!);
    const deletedEntries = chunk.journalEntries.filter(e => e.deleted).map(e => e.id!);
    const deletedFolders = chunk.folders.filter(f => f.deleted).map(f => f.id!);

    const updatedTasks = chunk.tasks.filter(t => !t.deleted);
    const updatedEntries = chunk.journalEntries.filter(e => !e.deleted);
    const updatedFolders = chunk.folders.filter(f => !f.deleted);

    // Process in batches
    await retry(() => batchUpdate({
      tasks: updatedTasks,
      journalEntries: updatedEntries,
      folders: updatedFolders,
      deletedTaskIds: deletedTasks,
      deletedJournalEntryIds: deletedEntries,
      deletedFolderIds: deletedFolders
    } as BatchUpdateOperations));

    // Update sync status in IndexedDB for both updated and deleted items
    await retry(() => Promise.all([
      ...updatedTasks.map(task => 
        indexedDBService.updateItem('tasks', task.id!, { ...task, syncStatus: 'synced' as const })
      ),
      ...updatedEntries.map(entry => 
        indexedDBService.updateItem('journal', entry.id!, { ...entry, syncStatus: 'synced' as const })
      ),
      ...updatedFolders.map(folder => 
        indexedDBService.updateItem('folders', folder.id!, { ...folder, syncStatus: 'synced' as const })
      ),
      ...deletedTasks.map(id => 
        indexedDBService.deleteItem('tasks', id)
      ),
      ...deletedEntries.map(id => 
        indexedDBService.deleteItem('journal', id)
      ),
      ...deletedFolders.map(id => 
        indexedDBService.deleteItem('folders', id)
      )
    ]));
  }

  private async processRemoteChanges(
    tasks: WithMetadata<Task>[],
    entries: WithMetadata<JournalEntry>[],
    folders: WithMetadata<Folder>[]
  ) {
    console.log('Processing remote changes...');

    // Process tasks
    for (const task of tasks) {
      if (!task.id) {
        console.warn('Skipping task without id:', task);
        continue;
      }

      if (task.deleted) {
        await retry(() => indexedDBService.deleteItem('tasks', task.id!));
      } else {
        const localTask = await retry(() => indexedDBService.getItem<Task>('tasks', task.id!));
        if (!localTask || localTask.lastModified < task.lastModified) {
          await retry(() => indexedDBService.updateItem('tasks', task.id!, task));
        }
      }
    }

    // Process journal entries
    for (const entry of entries) {
      if (!entry.id) {
        console.warn('Skipping journal entry without id:', entry);
        continue;
      }

      if (entry.deleted) {
        await retry(() => indexedDBService.deleteItem('journal', entry.id!));
      } else {
        const localEntry = await retry(() => indexedDBService.getItem<JournalEntry>('journal', entry.id!));
        if (!localEntry || localEntry.lastModified < entry.lastModified) {
          await retry(() => indexedDBService.updateItem('journal', entry.id!, entry));
        }
      }
    }

    // Process folders
    for (const folder of folders) {
      if (!folder.id) {
        console.warn('Skipping folder without id:', folder);
        continue;
      }

      if (folder.deleted) {
        await retry(() => indexedDBService.deleteItem('folders', folder.id!));
      } else {
        const localFolder = await retry(() => indexedDBService.getItem<Folder>('folders', folder.id!));
        if (!localFolder || localFolder.lastModified < folder.lastModified) {
          await retry(() => indexedDBService.updateItem('folders', folder.id!, folder));
        }
      }
    }
  }

  // Cleanup method
  destroy() {
    this.clearTimeouts();
    this.syncQueue.clear();
  }
}

export const syncService = new SyncService();
