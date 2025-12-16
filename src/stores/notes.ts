import type { Folder, JournalEntry, Task } from '../composables/interfaces'
import { defineStore } from 'pinia'
import { db } from '../services/indexedDB'
import { supabase } from '../supabase/supabase-config'
import { generateUUID } from '../utils/functions'

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
      this.error = error instanceof Error ? error.message : String(error)
      console.error('Store error:', error)
    },

    async getUserId(): Promise<string | null> {
      const { data: { session } } = await supabase.auth.getSession()
      return session?.user?.id || null
    },

    async initializeStore() {
      try {
        await this.loadTasks()
        await this.loadEntries()
        await this.loadFolders()
        this.initialized = true
        console.log('Store initialized')
      }
      catch (error) {
        console.error('Error initializing store:', error)
      }
    },

    async loadTasks() {
      try {
        this.tasksLoading = true
        const userId = await this.getUserId()

        if (navigator.onLine && userId) {
          const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)

          if (error)
            throw error

          // Map Supabase fields to app fields
          this.tasks = (data || []).map(task => ({
            id: task.id,
            taskContent: task.title,
            completed: task.completed,
            folderId: task.folder_id || undefined,
            syncStatus: 'synced' as const,
            lastModified: new Date(task.created_at).getTime(),
            timestamp: new Date(task.created_at).getTime(),
          }))
          this.tasksLoading = false
        }
        else {
          this.tasks = await db.getTasks()
          this.tasksLoading = false
        }
      }
      catch (err) {
        console.error('Failed to load tasks', err)
        // Fallback to local
        this.tasks = await db.getTasks()
        this.tasksLoading = false
      }
    },

    async loadEntries() {
      try {
        this.loading = true
        const userId = await this.getUserId()

        if (navigator.onLine && userId) {
          const { data, error } = await supabase
            .from('journal_entries')
            .select('*')
            .eq('user_id', userId)

          if (error)
            throw error

          // Map Supabase fields to app fields
          this.journalEntries = (data || []).map(entry => ({
            id: entry.id,
            title: entry.title || '',
            content: entry.content,
            status: (entry.status as 'active' | 'archived' | 'deleted') || 'active',
            date: entry.created_at,
            folderId: entry.folder_id || undefined,
            syncStatus: 'synced' as const,
            lastModified: new Date(entry.created_at).getTime(),
            timestamp: new Date(entry.created_at).getTime(),
          }))
          this.loading = false
        }
        else {
          this.journalEntries = await db.getEntries()
          this.loading = false
        }
      }
      catch (err) {
        console.error('Failed to load entries', err)
        this.journalEntries = await db.getEntries()
        this.loading = false
      }
    },

    async addTask(taskContent: string, folderId: string | undefined) {
      try {
        const timestamp = Date.now()
        const userId = await this.getUserId()
        const taskId = generateUUID()

        const newTask: Task = {
          id: taskId,
          taskContent: taskContent.trim(),
          completed: false,
          folderId,
          syncStatus: 'pending',
          lastModified: timestamp,
          timestamp,
        }

        if (navigator.onLine && userId) {
          const { error } = await supabase.from('tasks').insert({
            id: taskId,
            user_id: userId,
            title: taskContent.trim(),
            completed: false,
            folder_id: folderId || null,
          })

          if (error)
            throw error

          newTask.syncStatus = 'synced'
          await db.createTask(newTask)
          this.tasks = [...this.tasks, newTask]
          this.error = null
        }
        else {
          await db.createTask(newTask)
          this.tasks = [...this.tasks, newTask]
          this.error = null
        }
      }
      catch (error) {
        this.setError(error)
        console.error('Failed to add task:', error)
      }
    },

    async editTask(id: string, updates: Partial<Task>) {
      try {
        const timestamp = Date.now()
        const taskIndex = this.tasks.findIndex(t => t.id === id)

        if (taskIndex === -1)
          throw new Error('Task not found')

        const updatedTask = {
          ...this.tasks[taskIndex],
          ...updates,
          syncStatus: 'pending' as const,
          lastModified: timestamp,
        }

        if (navigator.onLine) {
          const { error } = await supabase
            .from('tasks')
            .update({
              title: updatedTask.taskContent,
              completed: updatedTask.completed,
              folder_id: updatedTask.folderId || null,
            })
            .eq('id', id)

          if (error)
            throw error;

          (updatedTask as { syncStatus: string }).syncStatus = 'synced'
          await db.updateTask(id, updatedTask)
          this.tasks[taskIndex] = updatedTask
          this.error = null
          return
        }
        await db.updateTask(id, updatedTask)
        this.tasks[taskIndex] = updatedTask
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

        if (navigator.onLine) {
          const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId)

          if (error)
            throw error

          await db.deleteTask(taskId)
        }
        else {
          await db.markForDeletion('tasks', taskId)
        }
        this.tasks.splice(taskIndex, 1)
        this.error = null
      }
      catch (error) {
        this.setError(error)
        console.error('Failed to delete task:', error)
      }
    },

    async addFolder(name: string, type: 'task' | 'journal') {
      try {
        const timestamp = Date.now()
        const userId = await this.getUserId()
        const folderId = generateUUID()

        const newFolder: Folder = {
          id: folderId,
          name,
          type,
          syncStatus: 'pending',
          numOfItems: 0,
          lastModified: timestamp,
          timestamp,
        }

        if (navigator.onLine && userId) {
          const { error } = await supabase.from('folders').insert({
            id: folderId,
            user_id: userId,
            name,
            type,
          })

          if (error)
            throw error

          newFolder.syncStatus = 'synced'
        }

        await db.createFolder(newFolder)
        this.folders = [...this.folders, newFolder]
        this.error = null
      }
      catch (error) {
        this.setError(error)
      }
    },

    async loadFolders() {
      try {
        this.loading = true
        const userId = await this.getUserId()

        if (navigator.onLine && userId) {
          const { data, error } = await supabase
            .from('folders')
            .select('*')
            .eq('user_id', userId)

          if (error)
            throw error

          this.folders = (data || []).map(folder => ({
            id: folder.id,
            name: folder.name,
            type: folder.type as 'task' | 'journal',
            syncStatus: 'synced' as const,
            numOfItems: 0,
            lastModified: new Date(folder.created_at).getTime(),
            timestamp: new Date(folder.created_at).getTime(),
          }))
        }
        else {
          const localFolders = (await db.getFolders()) || []
          this.folders = localFolders
        }
        this.loading = false
      }
      catch (err) {
        console.error('Failed to load folders', err)
        const localFolders = (await db.getFolders()) || []
        this.folders = localFolders
        this.loading = false
      }
    },

    async editFolder(folderId: string, updates: Partial<Folder>) {
      try {
        if (!folderId && !updates)
          throw new Error('Folder ID and updates are required')

        const folderIndex = this.folders.findIndex(f => f.id === folderId)

        if (folderIndex === -1)
          throw new Error('Folder not found')

        const timestamp = Date.now()
        const updatedFolder = {
          ...this.folders[folderIndex],
          ...updates,
          syncStatus: 'pending' as const,
          lastModified: timestamp,
        }

        if (navigator.onLine) {
          const { error } = await supabase
            .from('folders')
            .update({
              name: updatedFolder.name,
            })
            .eq('id', folderId)

          if (error)
            throw error;

          (updatedFolder as { syncStatus: string }).syncStatus = 'synced'
        }

        await db.updateFolder(folderId, updatedFolder)
        this.folders[folderIndex] = updatedFolder

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

        if (navigator.onLine) {
          const { error } = await supabase
            .from('folders')
            .delete()
            .eq('id', folderId)

          if (error)
            throw error

          await db.deleteFolder(folderId)
        }
        else {
          await db.markForDeletion('folders', folderId)
        }
        this.folders.splice(folderIndex, 1)
        this.error = null
      }
      catch (error) {
        this.setError(error)
        const deletedFolder = this.folders.find(f => f.id === folderId)
        if (deletedFolder) {
          this.folders.push(deletedFolder)
        }
        throw error
      }
    },

    async addEntry(entryTitle: string, entryContent: string, folderId: string) {
      try {
        if (!entryTitle)
          return
        if (!entryContent)
          return
        if (!folderId)
          return

        const timestamp = Date.now()
        const date = new Date().toISOString()
        const userId = await this.getUserId()
        const entryId = generateUUID()

        const newEntry: JournalEntry = {
          id: entryId,
          title: entryTitle,
          content: entryContent,
          status: 'active',
          date,
          folderId,
          syncStatus: 'pending',
          lastModified: timestamp,
          timestamp,
        }

        if (navigator.onLine && userId) {
          const { error } = await supabase.from('journal_entries').insert({
            id: entryId,
            user_id: userId,
            title: entryTitle,
            content: entryContent,
            folder_id: folderId,
            status: 'active',
          })

          if (error)
            throw error

          newEntry.syncStatus = 'synced'
          await db.createEntry(newEntry)
          this.journalEntries = [...this.journalEntries, newEntry]
          this.error = null
        }
        else {
          await db.createEntry(newEntry)
          this.journalEntries = [...this.journalEntries, newEntry]
          this.error = null
        }
      }
      catch (err) {
        this.setError(err)
        console.error('Failed to add entry:', err)
      }
    },

    async editJournalEntry(entryId: string, updates: Partial<JournalEntry>) {
      try {
        if (!entryId)
          throw new Error('Missing entry id')
        if (!updates)
          throw new Error('Missing entry changes')

        const entryIndex = this.journalEntries.findIndex(
          entry => entry.id === entryId,
        )

        if (entryIndex === -1)
          throw new Error('Journal entry not found')

        const timestamp = Date.now()
        const updatedEntry = {
          ...this.journalEntries[entryIndex],
          ...updates,
          syncStatus: 'pending' as const,
          lastModified: timestamp,
        }

        if (navigator.onLine) {
          const { error } = await supabase
            .from('journal_entries')
            .update({
              title: updatedEntry.title,
              content: updatedEntry.content,
              status: updatedEntry.status,
              folder_id: updatedEntry.folderId || null,
            })
            .eq('id', entryId)

          if (error)
            throw error;

          (updatedEntry as { syncStatus: string }).syncStatus = 'synced'
          await db.updateEntry(entryId, updatedEntry)
          this.journalEntries[entryIndex] = updatedEntry
          this.error = null
          return
        }

        await db.updateEntry(entryId, updatedEntry)
        this.journalEntries[entryIndex] = updatedEntry
        this.error = null
      }
      catch (err) {
        this.setError(err)
        console.error('Failed to update journal entry:', err)
      }
    },

    async deleteJournalEntry(entryId: string) {
      try {
        if (!entryId)
          return

        const entryIndex = this.journalEntries.findIndex(
          entry => entry.id === entryId,
        )

        if (entryIndex === -1)
          throw new Error('Journal entry not found!')

        if (navigator.onLine) {
          const { error } = await supabase
            .from('journal_entries')
            .delete()
            .eq('id', entryId)

          if (error)
            throw error

          await db.deleteEntry(entryId)
        }
        else {
          await db.markForDeletion('journal', entryId)
        }

        this.journalEntries.splice(entryIndex, 1)
        this.error = null
      }
      catch (err) {
        this.setError(err)
        console.error('Failed to delete entry:', err)
      }
    },
  },
})
