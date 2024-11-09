import { defineStore } from 'pinia'

interface Task {
  id: string
  title: string
  completed: boolean
  folderId: string | null
}

interface JournalEntry {
  id: string
  title: string
  content: string
  date: string
  folderId: string | null
}

interface Folder {
  id: string
  name: string
  type: 'task' | 'journal'
}

export const useNotesStore = defineStore('notes', {
  state: () => ({
    tasks: [] as Task[],
    journalEntries: [] as JournalEntry[],
    folders: [] as Folder[]
  }),

  actions: {
    // Task actions
    addTask(title: string, folderId: string | null = null) {
      const task: Task = {
        id: Date.now().toString(),
        title,
        completed: false,
        folderId
      }
      this.tasks.push(task)
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
    addJournalEntry(title: string, content: string, folderId: string | null = null) {
      const entry: JournalEntry = {
        id: Date.now().toString(),
        title,
        content,
        date: new Date().toISOString(),
        folderId
      }
      this.journalEntries.push(entry)
    },

    updateJournalEntry(entryId: string, updates: Partial<JournalEntry>) {
      const entry = this.journalEntries.find(e => e.id === entryId)
      if (entry) {
        Object.assign(entry, updates)
      }
    },

    deleteJournalEntry(entryId: string) {
      this.journalEntries = this.journalEntries.filter(e => e.id !== entryId)
    },

    // Folder actions
    addFolder(name: string, type: 'task' | 'journal') {
      const folder: Folder = {
        id: Date.now().toString(),
        name,
        type
      }
      this.folders.push(folder)
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
    }
  }
})