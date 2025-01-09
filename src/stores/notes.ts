import { defineStore } from "pinia";
// import { syncService } from "../services/syncService"
// import { type StoreNames } from "../services/indexedDB"
// import { getChangedItems } from '../firebase/firestore-service'
import { Task, JournalEntry, Folder } from "../composables/interfaces";
import { generateUUID } from "../utils/functions";
import { addDoc, collection } from "firebase/firestore";
import { db as fireDb } from "../firebase/firebase-config";
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
    getFolders(state) {
      return state.folders;
    },
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

    async fetchFolderTasks(folderId: string) {
      this.loading = true;
      try {
        // const tasks = await getTasks(folderId)
        // this.tasks = tasks
      } catch (error) {
        this.error = "Failed to fetch tasks";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // async fetchTasks() {
    //   try {
    //     this.loading = true
    //     // const tasks = await indexedDBService.getAllItems<Task>('tasks')
    //     // Sort by lastModified to show newest first and filter out duplicates by id
    //     this.tasks = tasks
    //       .sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0))
    //       .filter((task, index, self) =>
    //         index === self.findIndex(t => t.taskId === task.taskId)
    //       )
    //     this.error = null
    //   } catch (error) {
    //     console.error('Error fetching tasks:', error)
    //     this.setError(error)
    //   } finally {
    //     this.loading = false
    //   }
    // },

    // async fetchJournalEntries(): Promise<void> {
    //   try {
    //     this.loading = true
    //     const entries = await indexedDBService.getAllItems<JournalEntry>('journal')
    //     // Filter out deleted entries
    //     this.journalEntries = entries.filter(entry => !entry.status.includes('deleted'))
    //     this.error = null
    //   } catch (error) {
    //     console.error('Error fetching journal entries:', error)
    //     this.setError(error)
    //   } finally {
    //     this.loading = false
    //   }
    // },

    // async fetchFolders() {
    //   try {
    //     this.loading = true;
    //     const folders = await indexedDBService.getAllItems<Folder>('folders');
    //     // Sort by lastModified to show newest first and filter out duplicates by id
    //     this.folders = folders
    //       .sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0))
    //       .filter((folder, index, self) =>
    //         index === self.findIndex(f => f.id === folder.id)
    //       )
    //     this.error = null
    //   } catch (error) {
    //     console.error('Error fetching folders:', error)
    //     this.setError(error)
    //   } finally {
    //     this.loading = false
    //   }
    // },

    // async initialise() {
    //   if (this.initialized) return

    //   try {
    //     console.log('Initializing store...')
    //     await indexedDBService.init()

    //     // Fetch all data in parallel
    //     await Promise.all([
    //       this.fetchTasks(),
    //       this.fetchJournalEntries(),
    //       this.fetchFolders()
    //     ])

    //     this.initialized = true
    //   } catch (error) {
    //     console.error('Failed to initialize store:', error)
    //     this.setError(error)
    //     throw error
    //   }
    // },

    // async fetchFromFirebase() {
    //   try {
    //     console.log('Fetching data from Firebase...');
    //     const [remoteTasks, remoteEntries, remoteFolders] = await Promise.all([
    //       getChangedItems<Task>('tasks', 0),
    //       getChangedItems<JournalEntry>('journalEntries', 0),
    //       getChangedItems<Folder>('folders', 0)
    //     ]);

    //     // Process items one store at a time to avoid transaction conflicts
    //     const processItems = async <T extends { id?: string; deleted?: boolean }>(
    //       items: T[],
    //       storeName: StoreNames,
    //       stateArray: T[]
    //     ) => {

    //       // Clear existing items from IndexedDB first
    //       // await indexedDBService.clearStore(storeName);

    //       // Clear state array
    //       stateArray.length = 0;

    //       // Process non-deleted items
    //       for (const item of items) {
    //         if (!item.deleted && item.id) {
    //           try {
    //             // Add to IndexedDB
    //             // await indexedDBService.addItem(storeName, {
    //             //   ...item,
    //             //   syncStatus: 'synced'
    //             // });

    //             // Add to state
    //             stateArray.push({ ...item, syncStatus: 'synced' });
    //           } catch (error) {
    //             console.error(`Failed to process item ${item.id}:`, error);
    //             // Continue with next item instead of failing completely
    //           }
    //         }
    //       }
    //     };

    //     // Process each store sequentially to avoid conflicts
    //     await processItems(remoteTasks, 'tasks', this.tasks);
    //     await processItems(remoteEntries, 'journal', this.journalEntries);
    //     await processItems(remoteFolders, 'folders', this.folders);

    //     console.log('Firebase data fetched and stored:', {
    //       tasks: this.tasks.length,
    //       entries: this.journalEntries.length,
    //       folders: this.folders.length
    //     });
    //   } catch (error) {
    //     console.error('Error fetching from Firebase:', error);
    //     this.setError(error);
    //     throw error;
    //   }
    // },

    async syncWithServer() {
      if (!navigator.onLine) {
        console.log("Offline, skipping sync");
        return;
      }
      // await syncService.syncData();
    },

    async addTask(title: string, folderId: string | undefined) {
      try {
        const timestamp = Date.now();
        const newTask: Task = {
          id: generateUUID(),
          taskContent: title,
          status: "pending",
          folderId,
          syncStatus: "pending",
          lastModified: timestamp,
          timestamp,
        };

        if (navigator.onLine) {
          // Create in Firestore first
          newTask.syncStatus = "synced";
          await addDoc(collection(fireDb, "tasks"), newTask);
        }

        // Store in IndexedDB
        // await indexedDBService.addItem<Task>("tasks", newTask);

        // Update local state
        this.tasks.push(newTask);

        // If offline, sync when back online
        if (!navigator.onLine) {
          // await syncService.syncData();
        }

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
        // const timestamp = Date.now();
        const taskIndex = this.tasks.findIndex((t) => t.id === taskId);

        if (taskIndex === -1) {
          throw new Error("Task not found");
        }

        // Remove from local state first
        // const deletedTask = {
        //   ...this.tasks[taskIndex],
        //   deleted: true,
        //   syncStatus: 'pending' as const,
        //   lastModified: timestamp
        // };

        // Update in IndexedDB
        // await indexedDBService.updateItem<Task>("tasks", taskId, deletedTask);

        // Update local state
        this.tasks.splice(taskIndex, 1);

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
        const folderIndex = this.folders.findIndex((f) => f.id === folderId);

        if (folderIndex === -1) {
          throw new Error("Folder not found");
        }

        const timestamp = Date.now();
        const updatedFolder = {
          ...this.folders[folderIndex],
          ...updates,
          syncStatus: "pending" as const,
          lastModified: timestamp,
        };

        // Update in IndexedDB
        // await indexedDBService.updateItem<Folder>("folders", folderId, updatedFolder);

        // Update local state
        await db.updateFolder(updatedFolder);
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

        if (folderIndex === -1) {
          throw new Error("Folder not found");
        }

        await db.deleteFolder(folderId);

        this.folders.splice(folderIndex, 1);

        if (navigator.onLine) {
          // something like await deleteDoc(doc(fireDb, "folders", folderId))
        }

        // const deletedFolder = {
        //   ...this.folders[folderIndex],
        //   deleted: true,
        //   syncStatus: 'pending' as const,
        //   lastModified: Date.now()
        // };

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
