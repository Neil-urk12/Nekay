import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { IndexedDBService, type IndexedDBTask } from '../indexedDB'

// Mock IndexedDB
const indexedDBMock = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
}

const mockDB = {
  createObjectStore: vi.fn(),
  objectStoreNames: {
    contains: vi.fn(),
  },
  transaction: vi.fn(),
}

describe('IndexedDBService', () => {
  let service: IndexedDBService

  beforeEach(() => {
    vi.stubGlobal('indexedDB', indexedDBMock)
    service = new IndexedDBService()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  describe('init', () => {
    it('should initialize the database successfully', async () => {
      const openRequest = {
        result: mockDB,
        onerror: null,
        onsuccess: null,
        onupgradeneeded: null,
      }

      indexedDBMock.open.mockImplementation(() => {
        setTimeout(() => {
          openRequest.onsuccess && openRequest.onsuccess(new Event('success'))
        }, 0)
        return openRequest
      })

      await service.init()
      expect(indexedDBMock.open).toHaveBeenCalledWith('NekayOfflineDB', 1)
    })

    it('should handle initialization error', async () => {
      const openRequest = {
        error: new Error('Init failed'),
        onerror: null,
        onsuccess: null,
      }

      indexedDBMock.open.mockImplementation(() => {
        setTimeout(() => {
          openRequest.onerror && openRequest.onerror(new Event('error'))
        }, 0)
        return openRequest
      })

      await expect(service.init()).rejects.toEqual({
        message: 'Failed to initialize offline storage',
        details: 'Init failed',
        code: 'INDEXEDDB_INIT_ERROR'
      })
    })
  })

  describe('CRUD operations', () => {
    it('should add item successfully', async () => {
      const mockStore = {
        add: vi.fn().mockImplementation(() => ({
          onsuccess: null,
          onerror: null
        }))
      }

      const mockTransaction = {
        objectStore: vi.fn().mockReturnValue(mockStore)
      }

      mockDB.transaction = vi.fn().mockReturnValue(mockTransaction)
      service['db'] = mockDB as any

      const task: IndexedDBTask = {
        id: '1',
        title: 'Test Task',
        completed: false,
        folderId: null,
        syncStatus: 'pending',
        lastModified: Date.now()
      }

      await service.addItem('tasks', task)
      expect(mockDB.transaction).toHaveBeenCalledWith('tasks', 'readwrite')
      expect(mockStore.add).toHaveBeenCalled()
    })

    it('should get all items successfully', async () => {
      const mockItems = [{ id: '1', title: 'Test' }]
      const mockStore = {
        getAll: vi.fn().mockImplementation(() => ({
          onsuccess: null,
          result: mockItems
        }))
      }

      const mockTransaction = {
        objectStore: vi.fn().mockReturnValue(mockStore)
      }

      mockDB.transaction = vi.fn().mockReturnValue(mockTransaction)
      service['db'] = mockDB as any

      const result = await service.getAllItems('tasks')
      expect(result).toEqual(mockItems)
    })

    it('should update sync status successfully', async () => {
      const mockStore = {
        get: vi.fn().mockImplementation(() => ({
          onsuccess: null,
          result: { id: '1', title: 'Test' }
        })),
        put: vi.fn()
      }

      const mockTransaction = {
        objectStore: vi.fn().mockReturnValue(mockStore)
      }

      mockDB.transaction = vi.fn().mockReturnValue(mockTransaction)
      service['db'] = mockDB as any

      await service.updateSyncStatus('tasks', '1', 'synced')
      expect(mockStore.put).toHaveBeenCalled()
    })
  })
})
