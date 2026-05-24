import type { Folder, JournalEntry, Task } from '../composables/interfaces'
import { createDataAccess, type DataAccess } from '../services/dataAccess'
import { formatError } from '../composables/useStoreError'
import { defineStore } from 'pinia'

const dataAccess: DataAccess = createDataAccess()

export const useNotesStore = defineStore('notes', {
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
    getEntries: (state) => {
      return state.journalEntries.filter(entry => entry.syncStatus !== 'deleted')
    },
    getJournalFolders: (state) => {
      return state.folders.filter(f => ((f.type === 'journal' && f.syncStatus !== 'deleted')))
    },
    getTaskFolders: (state) => {
      return state.folders.filter(f => f.type === 'task' && f.syncStatus !== 'deleted')
    },
    getFolders: state => state.folders,
    getTasks: state => state.tasks,
  },

  actions: {
    setError(error: unknown) {
      this.error = formatError(error)
      console.error('Store error:', error)
    },

    async ensureInitialized() {
      if (this.initialized)
        return
      await this.initializeStore()
    },

    async initializeStore() {
      try {
        await this.loadTasks()
        await this.loadEntries()
        await this.loadFolders()
        this.initialized = true
      }
      catch (error) {
        console.error('Error initializing store:', error)
      }
    },

    async loadTasks() {
      try {
        this.tasksLoading = true
        this.tasks = await dataAccess.getTasks()
      }
      catch (err) {
        console.error('Failed to load tasks', err)
        this.setError(err)
      }
      finally {
        this.tasksLoading = false
      }
    },

    async loadEntries() {
      try {
        this.loading = true
        this.journalEntries = await dataAccess.getEntries()
      }
      catch (err) {
        console.error('Failed to load entries', err)
        this.setError(err)
      }
      finally {
        this.loading = false
      }
    },

    async loadFolders() {
      try {
        this.loading = true
        this.folders = await dataAccess.getFolders()
      }
      catch (err) {
        console.error('Failed to load folders', err)
        this.setError(err)
      }
      finally {
        this.loading = false
      }
    },

    async addTask(taskContent: string, folderId: string | undefined) {
      try {
        const task = await dataAccess.createTask(taskContent.trim(), folderId)
        this.tasks = [...this.tasks, task]
        this.error = null
      }
      catch (error) {
        this.setError(error)
      }
    },

    async editTask(id: string, updates: Partial<Task>) {
      try {
        const taskIndex = this.tasks.findIndex(t => t.id === id)
        if (taskIndex === -1)
          throw new Error('Task not found')

        await dataAccess.updateTask(id, updates)

        this.tasks[taskIndex] = {
          ...this.tasks[taskIndex],
          ...updates,
        }
        this.error = null
      }
      catch (error) {
        this.setError(error)
      }
    },

    async deleteTask(taskId: string) {
      try {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId)
        if (taskIndex === -1)
          throw new Error('Task not found')

        await dataAccess.deleteTask(taskId)
        this.tasks.splice(taskIndex, 1)
        this.error = null
      }
      catch (error) {
        this.setError(error)
      }
    },

    async addFolder(name: string, type: 'task' | 'journal') {
      try {
        const folder = await dataAccess.createFolder(name, type)
        this.folders = [...this.folders, folder]
        this.error = null
      }
      catch (error) {
        this.setError(error)
      }
    },

    async editFolder(folderId: string, updates: Partial<Folder>) {
      try {
        if (!folderId || !updates)
          throw new Error('Folder ID and updates are required')

        const folderIndex = this.folders.findIndex(f => f.id === folderId)
        if (folderIndex === -1)
          throw new Error('Folder not found')

        await dataAccess.updateFolder(folderId, updates)

        this.folders[folderIndex] = {
          ...this.folders[folderIndex],
          ...updates,
        }
        this.error = null
      }
      catch (error) {
        this.setError(error)
      }
    },

    async deleteFolder(folderId: string) {
      try {
        const folderIndex = this.folders.findIndex(f => f.id === folderId)
        if (folderIndex === -1)
          throw new Error('Folder not found')

        await dataAccess.deleteFolder(folderId)
        this.folders.splice(folderIndex, 1)
        this.error = null
      }
      catch (error) {
        const deletedFolder = this.folders.find(f => f.id === folderId)
        if (deletedFolder) {
          this.folders.push(deletedFolder)
        }
        this.setError(error)
        throw error
      }
    },

    async addEntry(entryTitle: string, entryContent: string, folderId: string) {
      try {
        if (!entryTitle || !entryContent || !folderId)
          return

        const entry = await dataAccess.createEntry(entryTitle, entryContent, folderId)
        this.journalEntries = [...this.journalEntries, entry]
        this.error = null
      }
      catch (err) {
        this.setError(err)
      }
    },

    async editJournalEntry(entryId: string, updates: Partial<JournalEntry>) {
      try {
        if (!entryId)
          throw new Error('Missing entry id')
        if (!updates)
          throw new Error('Missing entry changes')

        const entryIndex = this.journalEntries.findIndex(entry => entry.id === entryId)
        if (entryIndex === -1)
          throw new Error('Journal entry not found')

        await dataAccess.updateEntry(entryId, updates)

        this.journalEntries[entryIndex] = {
          ...this.journalEntries[entryIndex],
          ...updates,
        }
        this.error = null
      }
      catch (err) {
        this.setError(err)
      }
    },

    async deleteJournalEntry(entryId: string) {
      try {
        if (!entryId)
          return

        const entryIndex = this.journalEntries.findIndex(entry => entry.id === entryId)
        if (entryIndex === -1)
          throw new Error('Journal entry not found!')

        await dataAccess.deleteEntry(entryId)
        this.journalEntries.splice(entryIndex, 1)
        this.error = null
      }
      catch (err) {
        this.setError(err)
      }
    },
  },
})
