import { defineStore } from "pinia";
import { syncService } from "../services/syncService";
import { indexedDBService } from "../services/indexedDB";
import { useOffline } from "../composables/useOffline";

interface Task {
  id?: number;
  title: string;
  completed: boolean;
  folderId?: string | null;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
  timestamp: number;
}

interface JournalEntry {
  id?: number;
  title: string;
  content: string;
  date: string;
  folderId?: string | null;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
  timestamp: number;
}

interface Folder {
  id?: number;
  name: string;
  type: "task" | "journal";
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
  timestamp: number;
}

export const useNotesStore = defineStore("notes", {
  state: () => ({
    tasks: [] as Task[],
    journalEntries: [] as JournalEntry[],
    folders: [] as Folder[],
    loading: false,
    error: null as string | null,
    lastSync: null as Date | null,
  }),

  getters: {
    tasksByFolder: (state) => (folderId: string | null) => {
      return state.tasks.filter((task) => task.folderId === folderId);
    },
    entriesByFolder: (state) => (folderId: string | null) => {
      return state.journalEntries.filter((entry) => entry.folderId === folderId);
    },
    pendingChanges: (state) => {
      const pendingTasks = state.tasks.filter(t => t.syncStatus === 'pending');
      const pendingEntries = state.journalEntries.filter(e => e.syncStatus === 'pending');
      const pendingFolders = state.folders.filter(f => f.syncStatus === 'pending');
      return pendingTasks.length + pendingEntries.length + pendingFolders.length;
    }
  },

  actions: {
    async initialise() {
      try {
        this.loading = true;
        
        // Load data from IndexedDB
        const [tasks, entries, folders] = await Promise.all([
          indexedDBService.getAllItems("tasks"),
          indexedDBService.getAllItems("journal"),
          indexedDBService.getAllItems("folders")
        ]);

        this.tasks = tasks;
        this.journalEntries = entries;
        this.folders = folders;

        // If online, sync with server
        if (navigator.onLine) {
          await this.syncWithServer();
        }

        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to initialize store';
      } finally {
        this.loading = false;
      }
    },

    async syncWithServer() {
      try {
        await syncService.syncData();
        this.lastSync = new Date();
      } catch (error) {
        console.error('Sync failed:', error);
        throw error;
      }
    },

    // Task actions
    async addTask(title: string, folderId: string | null = null) {
      try {
        const task: Task = {
          title,
          completed: false,
          folderId,
          syncStatus: 'pending',
          lastModified: Date.now(),
          timestamp: Date.now()
        };

        const id = await indexedDBService.addItem("tasks", task);
        task.id = id;
        this.tasks.push(task);

        if (navigator.onLine) {
          await this.syncWithServer();
        }

        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to add task';
        throw error;
      }
    },

    async editTask(taskId: number, updates: Partial<Task>) {
      try {
        const task = this.tasks.find((t) => t.id === taskId);
        if (!task) throw new Error('Task not found');

        const updatedTask = {
          ...task,
          ...updates,
          syncStatus: 'pending',
          lastModified: Date.now()
        };

        await indexedDBService.updateItem("tasks", taskId, updatedTask);
        
        const index = this.tasks.findIndex((t) => t.id === taskId);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
        }

        if (navigator.onLine) {
          await this.syncWithServer();
        }

        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to edit task';
        throw error;
      }
    },

    async toggleTask(taskId: number) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (task) {
        await this.editTask(taskId, { completed: !task.completed });
      }
    },

    async deleteTask(taskId: number) {
      try {
        await indexedDBService.deleteItem("tasks", taskId);
        this.tasks = this.tasks.filter((t) => t.id !== taskId);

        if (navigator.onLine) {
          await this.syncWithServer();
        }

        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete task';
        throw error;
      }
    },

    // Journal actions
    async addJournalEntry(title: string, content: string, folderId: string | null = null) {
      try {
        const entry: JournalEntry = {
          title,
          content,
          date: new Date().toISOString(),
          folderId,
          syncStatus: 'pending',
          lastModified: Date.now(),
          timestamp: Date.now()
        };

        const id = await indexedDBService.addItem("journal", entry);
        entry.id = id;
        this.journalEntries.push(entry);

        if (navigator.onLine) {
          await this.syncWithServer();
        }

        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to add journal entry';
        throw error;
      }
    },

    async updateJournalEntry(entryId: number, updates: Partial<JournalEntry>) {
      try {
        const entry = this.journalEntries.find((e) => e.id === entryId);
        if (!entry) throw new Error('Journal entry not found');

        const updatedEntry = {
          ...entry,
          ...updates,
          syncStatus: 'pending',
          lastModified: Date.now()
        };

        await indexedDBService.updateItem("journal", entryId, updatedEntry);
        
        const index = this.journalEntries.findIndex((e) => e.id === entryId);
        if (index !== -1) {
          this.journalEntries[index] = updatedEntry;
        }

        if (navigator.onLine) {
          await this.syncWithServer();
        }

        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update journal entry';
        throw error;
      }
    },

    async deleteJournalEntry(entryId: number) {
      try {
        await indexedDBService.deleteItem("journal", entryId);
        this.journalEntries = this.journalEntries.filter((e) => e.id !== entryId);

        if (navigator.onLine) {
          await this.syncWithServer();
        }

        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete journal entry';
        throw error;
      }
    },

    // Folder actions
    async addFolder(name: string, type: "task" | "journal") {
      try {
        const folder: Folder = {
          name,
          type,
          syncStatus: 'pending',
          lastModified: Date.now(),
          timestamp: Date.now()
        };

        const id = await indexedDBService.addItem("folders", folder);
        folder.id = id;
        this.folders.push(folder);

        if (navigator.onLine) {
          await this.syncWithServer();
        }

        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to add folder';
        throw error;
      }
    },

    async editFolder(folderId: number, updates: Partial<Folder>) {
      try {
        const folder = this.folders.find((f) => f.id === folderId);
        if (!folder) throw new Error('Folder not found');

        const updatedFolder = {
          ...folder,
          ...updates,
          syncStatus: 'pending',
          lastModified: Date.now()
        };

        await indexedDBService.updateItem("folders", folderId, updatedFolder);
        
        const index = this.folders.findIndex((f) => f.id === folderId);
        if (index !== -1) {
          this.folders[index] = updatedFolder;
        }

        if (navigator.onLine) {
          await this.syncWithServer();
        }

        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to edit folder';
        throw error;
      }
    },

    async deleteFolder(folderId: number) {
      try {
        await indexedDBService.deleteItem("folders", folderId);
        this.folders = this.folders.filter((f) => f.id !== folderId);

        // Update related tasks and entries
        const tasksToUpdate = this.tasks.filter(t => t.folderId === folderId);
        const entriesToUpdate = this.journalEntries.filter(e => e.folderId === folderId);

        await Promise.all([
          ...tasksToUpdate.map(t => this.editTask(t.id!, { folderId: null })),
          ...entriesToUpdate.map(e => this.updateJournalEntry(e.id!, { folderId: null }))
        ]);

        if (navigator.onLine) {
          await this.syncWithServer();
        }

        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete folder';
        throw error;
      }
    },
  },
});
