import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotesStore } from './notes'
import { indexedDBService } from '../services/indexedDB'
import { syncService } from '../services/syncService'

// Mock the services
vi.mock('../services/indexedDB')
vi.mock('../services/syncService')
vi.mock('../firebase/firestore-service')

describe('Notes Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initialise', () => {
    it('should load data from IndexedDB and sync if online', async () => {
      const store = useNotesStore()
      const mockTasks = [{ id: '1', title: 'Test Task', completed: false, folderId: null }]
      const mockEntries = [{ id: '1', title: 'Test Entry', content: 'Content', date: '2023-01-01', folderId: null }]
      const mockFolders = [{ id: '1', name: 'Test Folder', type: 'task' }]

      vi.spyOn(indexedDBService, 'getAllItems').mockImplementation((store) => {
        switch(store) {
          case 'tasks': return Promise.resolve(mockTasks)
          case 'journal': return Promise.resolve(mockEntries)
          case 'folders': return Promise.resolve(mockFolders)
          default: return Promise.resolve([])
        }
      })

      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
      vi.spyOn(syncService, 'syncData').mockResolvedValue()

      await store.initialise()

      expect(store.tasks).toEqual(mockTasks)
      expect(store.journalEntries).toEqual(mockEntries)
      expect(store.folders).toEqual(mockFolders)
      expect(syncService.syncData).toHaveBeenCalled()
    })
  })

  describe('Task Operations', () => {
    it('should add a new task', async () => {
      const store = useNotesStore()
      const taskTitle = 'New Task'
      
      vi.spyOn(Date, 'now').mockReturnValue(123456789)
      vi.spyOn(indexedDBService, 'addItem').mockResolvedValue()

      await store.addTask(taskTitle)

      expect(store.tasks).toHaveLength(1)
      expect(store.tasks[0]).toEqual({
        id: '123456789',
        title: taskTitle,
        completed: false,
        folderId: null
      })
    })

    it('should toggle task completion', () => {
      const store = useNotesStore()
      const task = { id: '1', title: 'Test Task', completed: false, folderId: null }
      store.tasks = [task]

      store.toggleTask('1')
      expect(store.tasks[0].completed).toBe(true)

      store.toggleTask('1')
      expect(store.tasks[0].completed).toBe(false)
    })

    it('should delete a task', () => {
      const store = useNotesStore()
      store.tasks = [
        { id: '1', title: 'Task 1', completed: false, folderId: null },
        { id: '2', title: 'Task 2', completed: false, folderId: null }
      ]

      store.deleteTask('1')
      expect(store.tasks).toHaveLength(1)
      expect(store.tasks[0].id).toBe('2')
    })
  })

  describe('Journal Operations', () => {
    it('should add a journal entry', () => {
      const store = useNotesStore()
      const title = 'Test Entry'
      const content = 'Test Content'
      
      vi.spyOn(Date, 'now').mockReturnValue(123456789)

      store.addJournalEntry(title, content)

      expect(store.journalEntries).toHaveLength(1)
      expect(store.journalEntries[0]).toMatchObject({
        id: '123456789',
        title,
        content,
        folderId: null
      })
    })

    it('should update a journal entry', () => {
      const store = useNotesStore()
      const entry = {
        id: '1',
        title: 'Original Title',
        content: 'Original Content',
        date: '2023-01-01',
        folderId: null
      }
      store.journalEntries = [entry]

      store.updateJournalEntry('1', { title: 'Updated Title' })
      expect(store.journalEntries[0].title).toBe('Updated Title')
    })
  })

  describe('Folder Operations', () => {
    it('should add a folder', () => {
      const store = useNotesStore()
      const folderName = 'Test Folder'
      
      vi.spyOn(Date, 'now').mockReturnValue(123456789)

      store.addFolder(folderName, 'task')

      expect(store.folders).toHaveLength(1)
      expect(store.folders[0]).toEqual({
        id: '123456789',
        name: folderName,
        type: 'task'
      })
    })

    it('should delete a folder and update references', () => {
      const store = useNotesStore()
      store.folders = [{ id: '1', name: 'Test Folder', type: 'task' }]
      store.tasks = [{ id: '1', title: 'Task 1', completed: false, folderId: '1' }]
      store.journalEntries = [{ id: '1', title: 'Entry 1', content: 'Content', date: '2023-01-01', folderId: '1' }]

      store.deleteFolder('1')

      expect(store.folders).toHaveLength(0)
      expect(store.tasks[0].folderId).toBeNull()
      expect(store.journalEntries[0].folderId).toBeNull()
    })
  })
})
