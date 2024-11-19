import { defineStore } from "pinia";
import { syncService } from "../services/syncService";
import { indexedDBService, type StoreNames } from "../services/indexedDB";
import { getChangedItems } from '../firebase/firestore-service';

// Helper function to generate UUID using Web Crypto API
function generateUUID(): string {
  return crypto.randomUUID();
}

export interface Task {
  id?: string;
  title: string;
  completed: boolean;
  folderId?: string | null;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
  timestamp: number;
  deleted?: boolean;
}

export interface JournalEntry {
  id?: string;
  title: string;
  content: string;
  date: string;
  folderId?: string | null;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
  timestamp: number;
  deleted?: boolean;
}

export interface Folder {
  id?: string;
  name: string;
  type: "task" | "journal";
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
  timestamp: number;
  deleted?: boolean;
}

export const useNotesStore = defineStore("notes", {
  state: () => ({
    tasks: [] as Task[],
    journalEntries: [] as JournalEntry[],
    folders: [] as Folder[],
    loading: false,
    error: null as string | null,
    lastSync: null as Date | null,
    initialized: false,
    tasksLoading: false,
  }),

  getters: {
    tasksByFolder: (state) => (folderId: string | null) => {
      return state.tasks.filter((task) => task.folderId === folderId);
    },
    entriesByFolder: (state) => (folderId: string | null) => {
      return state.journalEntries.filter((entry) => entry.folderId === folderId && !entry.deleted);
    },
    pendingChanges: (state) => {
      const pendingTasks = state.tasks.filter(t => t.syncStatus === 'pending');
      const pendingEntries = state.journalEntries.filter(e => e.syncStatus === 'pending');
      const pendingFolders = state.folders.filter(f => f.syncStatus === 'pending');
      return pendingTasks.length + pendingEntries.length + pendingFolders.length;
    }
  },

  actions: {
    setError(error: unknown) {
      this.error = error instanceof Error ? error.message : String(error);
      console.error('Store error:', error);
    },

    async fetchTasks() {
      try {
        this.loading = true;
        const tasks = await indexedDBService.getAllItems<Task>('tasks');
        // Sort by lastModified to show newest first and filter out duplicates by id
        this.tasks = tasks
          .sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0))
          .filter((task, index, self) => 
            index === self.findIndex(t => t.id === task.id)
          );
        this.error = null;
      } catch (error) {
        console.error('Error fetching tasks:', error);
        this.setError(error);
      } finally {
        this.loading = false;
      }
    },

    async fetchJournalEntries(): Promise<void> {
      try {
        this.loading = true;
        const entries = await indexedDBService.getAllItems<JournalEntry>('journal');
        // Filter out deleted entries
        this.journalEntries = entries.filter(entry => !entry.deleted);
        this.error = null;
      } catch (error) {
        console.error('Error fetching journal entries:', error);
        this.setError(error);
      } finally {
        this.loading = false;
      }
    },

    async fetchFolders() {
      try {
        this.loading = true;
        const folders = await indexedDBService.getAllItems<Folder>('folders');
        // Sort by lastModified to show newest first and filter out duplicates by id
        this.folders = folders
          .sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0))
          .filter((folder, index, self) => 
            index === self.findIndex(f => f.id === folder.id)
          );
        this.error = null;
      } catch (error) {
        console.error('Error fetching folders:', error);
        this.setError(error);
      } finally {
        this.loading = false;
      }
    },

    async initialise() {
      if (this.initialized) return;

      try {
        console.log('Initializing store...');
        await indexedDBService.init();
        
        // Fetch all data in parallel
        await Promise.all([
          this.fetchTasks(),
          this.fetchJournalEntries(),
          this.fetchFolders()
        ]);
        
        this.initialized = true;
      } catch (error) {
        console.error('Failed to initialize store:', error);
        this.setError(error);
        throw error;
      }
    },

    async fetchFromFirebase() {
      try {
        console.log('Fetching data from Firebase...');
        const [remoteTasks, remoteEntries, remoteFolders] = await Promise.all([
          getChangedItems<Task>('tasks', 0), 
          getChangedItems<JournalEntry>('journalEntries', 0),
          getChangedItems<Folder>('folders', 0)
        ]);

        // Process items one store at a time to avoid transaction conflicts
        const processItems = async <T extends { id?: string; deleted?: boolean }>(
          items: T[],
          storeName: StoreNames,
          stateArray: T[]
        ) => {
          
          // Clear existing items from IndexedDB first
          await indexedDBService.clearStore(storeName);
          
          // Clear state array
          stateArray.length = 0;
          
          // Process non-deleted items
          for (const item of items) {
            if (!item.deleted && item.id) {
              try {
                // Add to IndexedDB
                await indexedDBService.addItem(storeName, {
                  ...item,
                  syncStatus: 'synced'
                });
                
                // Add to state
                stateArray.push({ ...item, syncStatus: 'synced' });
              } catch (error) {
                console.error(`Failed to process item ${item.id}:`, error);
                // Continue with next item instead of failing completely
              }
            }
          }
        };

        // Process each store sequentially to avoid conflicts
        await processItems(remoteTasks, 'tasks', this.tasks);
        await processItems(remoteEntries, 'journal', this.journalEntries);
        await processItems(remoteFolders, 'folders', this.folders);

        console.log('Firebase data fetched and stored:', {
          tasks: this.tasks.length,
          entries: this.journalEntries.length,
          folders: this.folders.length
        });
      } catch (error) {
        console.error('Error fetching from Firebase:', error);
        this.setError(error);
        throw error;
      }
    },

    async syncWithServer() {
      if (!navigator.onLine) {
        console.log('Offline, skipping sync');
        return;
      }
      await syncService.syncData();
    },

    async addTask(title: string, folderId: string | null = null) {
      try {
        const timestamp = Date.now();
        const newTask: Task = {
          id: generateUUID(),
          title,
          completed: false,
          folderId,
          syncStatus: 'pending',
          lastModified: timestamp,
          timestamp
        };

        // Store in IndexedDB first
        await indexedDBService.addItem<Task>("tasks", newTask);
        
        // Update local state
        this.tasks.push(newTask);
        
        // Trigger sync
        await syncService.syncData();
        
        this.error = null;
      } catch (error) {
        this.setError(error);
      }
    },

    async editTask(taskId: string, updates: Partial<Task>) {
      try {
        const timestamp = Date.now();
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
          throw new Error('Task not found');
        }

        const updatedTask = {
          ...this.tasks[taskIndex],
          ...updates,
          syncStatus: 'pending' as const,
          lastModified: timestamp
        };

        // Update in IndexedDB
        await indexedDBService.updateItem<Task>("tasks", taskId, updatedTask);
        
        // Update local state
        this.tasks[taskIndex] = updatedTask;
        
        // Trigger sync
        await syncService.syncData();
        
        this.error = null;
      } catch (error) {
        this.setError(error);
      }
    },

    async deleteTask(taskId: string) {
      try {
        const timestamp = Date.now();
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
          throw new Error('Task not found');
        }

        // Remove from local state first
        const deletedTask = {
          ...this.tasks[taskIndex],
          deleted: true,
          syncStatus: 'pending' as const,
          lastModified: timestamp
        };
        
        // Update in IndexedDB
        await indexedDBService.updateItem<Task>("tasks", taskId, deletedTask);
        
        // Update local state
        this.tasks.splice(taskIndex, 1);
        
        // Trigger sync
        await syncService.syncData();
        
        this.error = null;
      } catch (error) {
        this.setError(error);
        // Rollback local state if error
        const deletedTask = this.tasks.find(t => t.id === taskId);
        if (deletedTask) {
          this.tasks.push(deletedTask);
        }
        throw error;
      }
    },

    async addFolder(name: string, type: "task" | "journal") {
      try {
        const timestamp = Date.now();
        const newFolder: Folder = {
          id: generateUUID(),
          name,
          type,
          syncStatus: 'pending',
          lastModified: timestamp,
          timestamp
        };

        // Store in IndexedDB first
        await indexedDBService.addItem<Folder>("folders", newFolder);
        
        // Update local state
        this.folders.push(newFolder);
        
        // Trigger sync
        await syncService.syncData();
        
        this.error = null;
      } catch (error) {
        this.setError(error);
      }
    },

    async editFolder(folderId: string, updates: Partial<Folder>) {
      try {
        const folderIndex = this.folders.findIndex(f => f.id === folderId);
        
        if (folderIndex === -1) {
          throw new Error('Folder not found');
        }

        const timestamp = Date.now();
        const updatedFolder = {
          ...this.folders[folderIndex],
          ...updates,
          syncStatus: 'pending' as const,
          lastModified: timestamp
        };

        // Update in IndexedDB
        await indexedDBService.updateItem<Folder>("folders", folderId, updatedFolder);
        
        // Update local state
        this.folders[folderIndex] = updatedFolder;
        
        // Trigger sync
        await syncService.syncData();
        
        this.error = null;
      } catch (error) {
        this.setError(error);
      }
    },

    async deleteFolder(folderId: string) {
      try {
        const folderIndex = this.folders.findIndex(f => f.id === folderId);
        
        if (folderIndex === -1) {
          throw new Error('Folder not found');
        }

        const deletedFolder = {
          ...this.folders[folderIndex],
          deleted: true,
          syncStatus: 'pending' as const,
          lastModified: Date.now()
        };
        
        // Update in IndexedDB
        await indexedDBService.updateItem<Folder>("folders", folderId, deletedFolder);
        
        // Update local state
        this.folders.splice(folderIndex, 1);
        
        // Trigger sync
        await syncService.syncData();
        
        this.error = null;
      } catch (error) {
        this.setError(error);
        // Rollback local state if error
        const deletedFolder = this.folders.find(f => f.id === folderId);
        if (deletedFolder) {
          this.folders.push(deletedFolder);
        }
        throw error;
      }
    },

    async addJournalEntry(title: string, content: string, folderId: string | null = null): Promise<void> {
        const timestamp = Date.now();
        const newEntry: JournalEntry = {
          id: generateUUID(),
          title,
          content,
          date: new Date().toISOString(),
          folderId,
          syncStatus: 'pending',
          lastModified: timestamp,
          timestamp
        };

        this.journalEntries.push(newEntry);
        try {
          await indexedDBService.addItem<JournalEntry>('journal', newEntry);
          await syncService.syncData();
        } catch (error) {
          this.setError(error);
        }
    },

    async editJournalEntry(entryId: string, updates: Partial<JournalEntry>): Promise<void> {
      try {
        const entryIndex = this.journalEntries.findIndex(entry => entry.id === entryId);
        if (entryIndex === -1) {
          throw new Error('Journal entry not found');
        }

        const timestamp = Date.now();
        const updatedEntry = {
          ...this.journalEntries[entryIndex],
          ...updates,
          syncStatus: 'pending' as const,
          lastModified: timestamp
        };

        // Update in IndexedDB
        await indexedDBService.updateItem<JournalEntry>('journal', entryId, updatedEntry);
        
        // Update local state
        this.journalEntries[entryIndex] = updatedEntry;
        
        // Trigger sync
        await syncService.syncData();
        
        this.error = null;
      } catch (error) {
        this.setError(error);
      }
    },

    async deleteJournalEntry(entryId: string): Promise<void> {
      try {
        const entryIndex = this.journalEntries.findIndex(entry => entry.id === entryId);
        if (entryIndex === -1) {
          throw new Error('Journal entry not found');
        }

        const deletedEntry = {
          ...this.journalEntries[entryIndex],
          deleted: true,
          syncStatus: 'pending' as const,
          lastModified: Date.now()
        };

        // Update in IndexedDB
        await indexedDBService.updateItem<JournalEntry>('journal', entryId, deletedEntry);
        
        // Update local state - remove from array
        this.journalEntries.splice(entryIndex, 1);
        
        // Trigger sync immediately
        await syncService.syncData();
        
        this.error = null;
      } catch (error) {
        this.setError(error);
      }
    }
  }
});
