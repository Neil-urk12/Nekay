import { defineStore } from 'pinia'
import { storeTask, storeJournalEntry, storeFolder, getTasks, getJournalEntries, getFolders, deleteDoc, doc } from '../firebase/firestore-service';
import { db, app } from '../firebase/firebase-config';

export interface Task {
  id: string
  title: string
  completed: boolean
  folderId: string | null
}

export interface JournalEntry {
  id: string
  title: string
  content: string
  date: string
  folderId: string | null
}

export interface Folder {
  id: string
  name: string
  type: 'task' | 'journal'
}

export const useNotesStore = defineStore('notes', {
  state: () => ({
    tasks: [] as Task[],
    journalEntries: [] as JournalEntry[],
    folders: [] as Folder[],
    loading: false
  }),

  actions: {
    // Task actions
    async fetchTasks() {
      this.loading = true;
      const tasks = await getTasks();
      this.tasks = tasks;
      this.loading = false;
    },
    addTask(title: string, folderId: string | null = null) {
      const task: Task = {
        id: Date.now().toString(),
        title,
        completed: false,
        folderId
      }
      this.tasks.push(task)
      storeTask(task);
    },

    toggleTask(taskId: string) {
      const task = this.tasks.find(t => t.id === taskId)
      if (task) {
        task.completed = !task.completed
      }
    },

    deleteTask(taskId: string) {
      this.tasks = this.tasks.filter(t => t.id !== taskId)
    },

    // Journal actions
    async fetchJournalEntries() {
      this.loading = true;
      const journalEntries = await getJournalEntries();
      this.journalEntries = journalEntries;
      this.loading = false;
    },
    addJournalEntry(title: string, content: string, folderId: string | null = null) {
      const entry: JournalEntry = {
        id: Date.now().toString(),
        title,
        content,
        date: new Date().toISOString(),
        folderId
      }
      this.journalEntries.push(entry)
      storeJournalEntry(entry);
    },

    updateJournalEntry(entryId: string, updates: Partial<JournalEntry>) {
      const entry = this.journalEntries.find(e => e.id === entryId)
      if (entry) {
        Object.assign(entry, updates)
      }
    },

    async deleteJournalEntry(entryId: string) {
      await deleteDoc(doc(db, 'journalEntries', entryId));
      this.journalEntries = this.journalEntries.filter(e => e.id !== entryId)
    },

    // Folder actions
    async fetchFolders() {
      this.loading = true;
      const folders = await getFolders();
      this.folders = folders;
      this.loading = false;
    },
    addFolder(name: string, type: 'task' | 'journal') {
      const folder: Folder = {
        id: Date.now().toString(),
        name,
        type
      }
      this.folders.push(folder)
      storeFolder(folder);
    },

    deleteFolder(folderId: string) {
      this.folders = this.folders.filter(f => f.id !== folderId)
      // Remove folder reference from tasks and entries
      this.tasks = this.tasks.map(t => 
        t.folderId === folderId ? { ...t, folderId: null } : t
      )
      this.journalEntries = this.journalEntries.map(e =>
        e.folderId === folderId ? { ...e, folderId: null } : e
      )
    },

    editTask(taskId: string, newTitle: string) {
      const taskIndex = this.tasks.findIndex(t => t.id === taskId);
      if (taskIndex !== -1) {
        this.tasks[taskIndex].title = newTitle;
      }
    },

    editFolder(folderId: string, newTitle: string) {
      const folderIndex = this.folders.findIndex(f => f.id === folderId);
      if (folderIndex !== -1) {
        this.folders[folderIndex].name = newTitle;
      }
    }
  }
})
