import { defineStore } from "pinia";
import { Task, JournalEntry, Folder } from "../composables/interfaces";
import { generateUUID } from "../utils/functions";
import { collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from "firebase/firestore";
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
    getEntries: (state) => state.journalEntries,
    getJournalFolders: (state) => {
      return state.folders.filter((f) => f.type === "journal");
    },
    getTaskFolders: (state) => {
      return state.folders.filter((f) => f.type === "task");
    },
    getFolders: (state) => state.folders,
    getTasks: (state) => state.tasks,
  },

  actions: {
    setError(error: unknown) {
      this.error = error instanceof Error ? error.message : String(error);
      console.error("Store error:", error);
    },

    async loadTasks() {
      try {
        this.tasksLoading = true;
        if (navigator.onLine) {
          const querySnapshot = await getDocs(collection(fireDb, "tasks"));
          this.tasks = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Task[];
          this.tasksLoading = false;
        } else {
          this.tasks = await db.getTasks();
          this.tasksLoading = false;
        }
      } catch (err) {
        console.error('Failed to load tasks', err);
      }
    },

    async loadEntries() {
      try {
        this.loading = true;
        if (navigator.onLine) {
          const querySnapshot = await getDocs(collection(fireDb, "entries"));
          this.journalEntries = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as JournalEntry[];
          this.loading = false;
        } else {
          this.journalEntries = await db.getEntries();
          this.loading = false;
        }
      } catch (err) {
        console.error('Failed to load entries', err);
      }
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
          newTask.syncStatus = "synced";
          const docRef = doc(fireDb, "tasks", newTask.id)
          await setDoc(docRef, newTask)
          await db.createTask(newTask);
          this.tasks = [...this.tasks, newTask];
          this.error = null;
          return;
        } else {
          await db.createTask(newTask);
          this.tasks = [...this.tasks, newTask];
          this.error = null;
        }
      } catch (error) {
        this.setError(error);
        console.error("Failed to add task:", error);
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

        if (navigator.onLine) {
          const docRef = doc(fireDb, "tasks", id)
          await updateDoc(docRef, updatedTask)
          await db.updateTask(id, updatedTask);
          this.tasks[taskIndex] = updatedTask;   
          this.error = null;
          return;
        } 
        await db.updateTask(id, updatedTask);
        this.tasks[taskIndex] = updatedTask;
        this.error = null;
      } catch (error) {
        this.setError(error);
      }
    },

    async deleteTask(taskId: string) {
      try {
        const taskIndex = this.tasks.findIndex((t) => t.id === taskId);

        if (taskIndex === -1) throw new Error("Task not found");

        if (navigator.onLine) {
          await deleteDoc(doc(fireDb, "tasks", taskId));
          await db.deleteTask(taskId);
          this.tasks.splice(taskIndex, 1);
          this.error = null;
          return;
        }

        await db.deleteTask(taskId);
        this.tasks.splice(taskIndex, 1);
        this.error = null;
      } catch (error) {
        this.setError(error);
        console.error("Failed to delete task:", error);
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
          const docRef = doc(fireDb, "folders", newFolder.id)
          await setDoc(docRef, newFolder)
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

        if (navigator.onLine) {
          const docRef = doc(fireDb, "folders", folderId)
          await updateDoc(docRef, updatedFolder)
        }

        await db.updateFolder(folderId, updatedFolder);
        this.folders[folderIndex] = updatedFolder;

        this.error = null;
      } catch (error) {
        this.setError(error);
      }
    },

    async deleteFolder(folderId: string) {
      try {
        const folderIndex = this.folders.findIndex((f) => f.id === folderId);

        if (folderIndex === -1) throw new Error("Folder not found");

        if (navigator.onLine) {
          await deleteDoc(doc(fireDb, "folders", folderId));
        }

        await db.deleteFolder(folderId);
        this.folders.splice(folderIndex, 1);


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
    async addEntry(entryTitle: string, entryContent: string, folderId: string) {
      try {
        if (!entryTitle) return;
        if (!entryContent) return;
        if (!folderId) return;

        const timestamp = Date.now();
        const date = new Date().toISOString();

        const newEntry: JournalEntry = {
          id: generateUUID(),
          title: entryTitle,
          content: entryContent,
          status: "active",
          date: date,
          folderId: folderId,
          syncStatus: "pending",
          lastModified: timestamp,
          timestamp: timestamp,
        };

        if (navigator.onLine) {
          newEntry.syncStatus = "synced";
          const docRef = doc(fireDb, "entries", newEntry.id)
          await setDoc(docRef, newEntry)
          await db.createEntry(newEntry);
          this.journalEntries = [...this.journalEntries, newEntry];
          this.error = null;
          return;
        } else {
          await db.createEntry(newEntry);
          this.journalEntries = [...this.journalEntries, newEntry];
          this.error = null;
        }
      } catch (err) {
        this.setError(err);
        console.error("Failed to add entry:", err);
      }
    },
    async editJournalEntry(entryId: string, updates: Partial<JournalEntry>) {
      try {
        if (!entryId) throw new Error("Missing entry id");
        if (!updates) throw new Error("Missing entry changes");

        const entryIndex = this.journalEntries.findIndex(
          (entry) => entry.id === entryId
        );

        if (entryIndex === -1) throw new Error("Journal entry not found");

        const timestamp = Date.now();
        const updatedEntry = {
          ...this.journalEntries[entryIndex],
          ...updates,
          syncStatus: "pending" as const,
          lastModified: timestamp,
        };

        if (navigator.onLine) {
          const docRef = doc(fireDb, "entries", entryId)
          await updateDoc(docRef, updatedEntry)
          await db.updateEntry(entryId, updatedEntry);
          this.journalEntries[entryIndex] = updatedEntry;
          this.error = null;
          return;
        }
        await db.updateEntry(entryId, updatedEntry);
        this.journalEntries[entryIndex] = updatedEntry;
        this.error = null;
      } catch (err) {
        this.setError(err);
        console.error("Failed to update journal entry:", err);
      }
    },

    async deleteJournalEntry(entryId: string) {
      try {
        if (!entryId) return;

        const entryIndex = this.journalEntries.findIndex(
          (entry) => entry.id === entryId
        );

        if (entryIndex === -1) throw new Error("Journal entry not found!");

        if (navigator.onLine) {
          await deleteDoc(doc(fireDb, "entries", entryId));
          await db.deleteEntry(entryId);
          this.journalEntries.splice(entryIndex, 1);
          this.error = null;
          return;
        }

        await db.deleteEntry(entryId);
        this.journalEntries.splice(entryIndex, 1);
        this.error = null;
      } catch (err) {
        this.setError(err);
        console.error("Failed to delete entry:", err);
      }
    },
  },
});
