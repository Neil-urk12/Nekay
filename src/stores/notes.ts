import { defineStore } from "pinia";
import { Task, JournalEntry, Folder } from "../composables/interfaces";
import { generateUUID } from "../utils/functions";
// import { addDoc, collection } from "firebase/firestore";
// import { db as fireDb } from "../firebase/firebase-config";
import { db } from "../services/indexedDB";

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
    getFolders: (state) => state.folders,
    getTasks: (state) => state.tasks,
    tasksByFolder: (state) => (folderId: string | null) => {
      return state.tasks.filter((task) => task.folderId === folderId);
    },
    entriesByFolder: (state) => (folderId: string | null) => {
      return state.journalEntries.filter(
        (entry) => entry.folderId === folderId
      );
    },
    pendingChanges: (state) => {
      const pendingTasks = state.tasks.filter(
        (t) => t.syncStatus === "pending"
      );
      const pendingEntries = state.journalEntries.filter(
        (e) => e.syncStatus === "pending"
      );
      const pendingFolders = state.folders.filter(
        (f) => f.syncStatus === "pending"
      );
      return (
        pendingTasks.length + pendingEntries.length + pendingFolders.length
      );
    },
  },

  actions: {
    setError(error: unknown) {
      this.error = error instanceof Error ? error.message : String(error);
      console.error("Store error:", error);
    },

    async loadTasks() {
      try {
        this.tasks = await db.getTasks();
      } catch (err) {
        console.error(err);
      }
    },

    async syncWithServer() {
      if (!navigator.onLine) {
        console.log("Offline, skipping sync");
        return;
      }
      // await syncService.syncData();
    },

    async addTask(taskContent: string, folderId: string | undefined) {
      try {
        const timestamp = Date.now();
        const newTask: Task = {
          id: generateUUID(),
          taskContent: taskContent.trim(),
          completed: false,
          folderId: folderId,
          syncStatus: "pending",
          lastModified: timestamp,
          timestamp: timestamp,
        };

        if (navigator.onLine) {
          // Create in Firestore first
          newTask.syncStatus = "synced";
          // await addDoc(collection(fireDb, "tasks"), newTask);
        }
        await db.createTask(newTask);
        this.tasks = [...this.tasks, newTask];
        this.error = null;
      } catch (error) {
        this.setError(error);
      }
    },

    async editTask(id: string, updates: Partial<Task>) {
      try {
        const timestamp = Date.now();
        const taskIndex = this.tasks.findIndex((t) => t.id === id);

        if (taskIndex === -1) {
          throw new Error("Task not found");
        }

        const updatedTask = {
          ...this.tasks[taskIndex],
          ...updates,
          syncStatus: "pending" as const,
          lastModified: timestamp,
        };

        // Update in IndexedDB
        // await indexedDBService.updateItem<Task>("tasks", id, updatedTask);

        // Update local state
        this.tasks[taskIndex] = updatedTask;

        // Trigger sync
        // await syncService.syncData();

        this.error = null;
      } catch (error) {
        this.setError(error);
      }
    },

    async deleteTask(taskId: string) {
      try {
        const taskIndex = this.tasks.findIndex((t) => t.id === taskId);

        if (taskIndex === -1) throw new Error("Task not found");

        await db.deleteTask(taskId);
        this.loadTasks();
        // Trigger sync
        // await syncService.syncData();

        this.error = null;
      } catch (error) {
        this.setError(error);
        // Rollback local state if error
        const deletedTask = this.tasks.find((t) => t.id === taskId);
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
          name: name,
          type: type,
          syncStatus: "pending",
          numOfItems: 0,
          lastModified: timestamp,
          timestamp: timestamp,
        };

        if (navigator.onLine) {
          newFolder.syncStatus = "synced";
          // await addDoc(collection(fireDb, "folders"), newFolder);
        }

        await db.createFolder(newFolder);
        this.folders = [...this.folders, newFolder];
        this.error = null;
      } catch (error) {
        this.setError(error);
      }
    },

    async loadFolders() {
      try {
        this.loading = true;

        const localFolders = (await db.getFolders()) || [];
        this.folders = localFolders;
      } catch (err) {}
    },

    async editFolder(folderId: string, updates: Partial<Folder>) {
      try {
        if (!folderId && !updates) 
          throw new Error("Folder ID and updates are required");

        const folderIndex = this.folders.findIndex((f) => f.id === folderId);

        if (folderIndex === -1) throw new Error("Folder not found");

        const timestamp = Date.now();
        const updatedFolder = {
          ...this.folders[folderIndex],
          ...updates,
          syncStatus: "pending" as const,
          lastModified: timestamp,
        };

        await db.updateFolder(folderId, updatedFolder);
        this.folders[folderIndex] = updatedFolder;

        if (navigator.onLine) {
          //update in firestore later but it should be first
          // await updateDoc(doc(fireDb, "folders", folderId), updatedFolder)
        }

        // Trigger sync
        // await syncService.syncData();

        this.error = null;
      } catch (error) {
        this.setError(error);
      }
    },

    async deleteFolder(folderId: string) {
      try {
        const folderIndex = this.folders.findIndex((f) => f.id === folderId);

        if (folderIndex === -1) throw new Error("Folder not found");

        await db.deleteFolder(folderId);

        this.folders.splice(folderIndex, 1);

        if (navigator.onLine) {
          // something like await deleteDoc(doc(fireDb, "folders", folderId))
        }

        // Update in IndexedDB
        // await indexedDBService.updateItem<Folder>("folders", folderId, deletedFolder);

        // Update local state
        // this.folders.splice(folderIndex, 1);

        // Trigger sync
        // await syncService.syncData();

        this.error = null;
      } catch (error) {
        this.setError(error);
        // Rollback local state if error
        const deletedFolder = this.folders.find((f) => f.id === folderId);
        if (deletedFolder) {
          this.folders.push(deletedFolder);
        }
        throw error;
      }
    },

    async addJournalEntry(
      title: string,
      content: string,
      folderId: string | undefined
    ): Promise<void> {
      const timestamp = Date.now();
      const newEntry: JournalEntry = {
        id: generateUUID(),
        title,
        content,
        status: "active",
        date: new Date().toISOString(),
        folderId,
        syncStatus: "pending",
        lastModified: timestamp,
        timestamp,
      };

      this.journalEntries.push(newEntry);
      try {
        // await indexedDBService.addItem<JournalEntry>('journal', newEntry);
        // await syncService.syncData();
      } catch (error) {
        this.setError(error);
      }
    },

    async editJournalEntry(
      entryId: string,
      updates: Partial<JournalEntry>
    ): Promise<void> {
      try {
        const entryIndex = this.journalEntries.findIndex(
          (entry) => entry.id === entryId
        );
        if (entryIndex === -1) {
          throw new Error("Journal entry not found");
        }

        const timestamp = Date.now();
        const updatedEntry = {
          ...this.journalEntries[entryIndex],
          ...updates,
          syncStatus: "pending" as const,
          lastModified: timestamp,
        };

        // Update in IndexedDB
        // await indexedDBService.updateItem<JournalEntry>('journal', entryId, updatedEntry);

        // Update local state
        this.journalEntries[entryIndex] = updatedEntry;

        // Trigger sync
        // await syncService.syncData();

        this.error = null;
      } catch (error) {
        this.setError(error);
      }
    },

    async deleteJournalEntry(entryId: string): Promise<void> {
      try {
        const entryIndex = this.journalEntries.findIndex(
          (entry) => entry.id === entryId
        );
        if (entryIndex === -1) {
          throw new Error("Journal entry not found");
        }

        // const deletedEntry = {
        //   ...this.journalEntries[entryIndex],
        //   deleted: true,
        //   syncStatus: 'pending' as const,
        //   lastModified: Date.now()
        // };

        // Update in IndexedDB
        // await indexedDBService.updateItem<JournalEntry>('journal', entryId, deletedEntry);

        // Update local state - remove from array
        this.journalEntries.splice(entryIndex, 1);

        // Trigger sync immediately
        // await syncService.syncData();

        this.error = null;
      } catch (error) {
        this.setError(error);
      }
    },
  },
});
