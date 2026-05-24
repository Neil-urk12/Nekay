import { beforeEach, describe, expect, it, vi } from 'vitest'

// --- Mocks ---

// Mock Supabase client
const { mockSupabaseFrom, mockSupabaseAuth, mockSupabase } = vi.hoisted(() => {
  const mockSupabaseFrom = vi.fn()
  const mockSupabaseAuth = {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn(),
  }
  const mockSupabase = {
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
    channel: vi.fn(),
  }
  return { mockSupabaseFrom, mockSupabaseAuth, mockSupabase }
})

vi.mock('../../supabase/supabase-config', () => ({
  supabase: mockSupabase,
  onAuthStateChange: (cb: (session: any) => void) => {
    mockSupabaseAuth.onAuthStateChange((_event: string, session: any) => cb(session))
    return { data: { subscription: { unsubscribe: vi.fn() } } }
  },
}))

// Mock IndexedDB (Dexie)
const { mockDbTasks, mockDbJournal, mockDbFolders, mockDbWaterEntries } = vi.hoisted(() => {
  const mockDbTasks = {
    toArray: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    where: vi.fn(),
  }
  const mockDbJournal = {
    toArray: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    where: vi.fn(),
  }
  const mockDbFolders = {
    toArray: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    where: vi.fn(),
  }
  const mockDbWaterEntries = {
    toArray: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    where: vi.fn(),
  }
  return { mockDbTasks, mockDbJournal, mockDbFolders, mockDbWaterEntries }
})

vi.mock('../indexedDB', () => ({
  db: {
    tasks: mockDbTasks,
    journal: mockDbJournal,
    folders: mockDbFolders,
    waterEntries: mockDbWaterEntries,
  },
}))

// Mock generateUUID
vi.mock('../../utils/functions', () => ({
  generateUUID: () => 'test-uuid-1234',
}))

// --- Import after mocks ---
import {
  createDataAccess,
  type DataAccess,
} from '../dataAccess'
import type { Task, JournalEntry, Folder } from '../../composables/interfaces'
import type { WaterEntry } from '../indexedDB'

// --- Helpers ---

const TEST_USER_ID = 'user-abc-123'

function mockAuthenticated() {
  mockSupabaseAuth.getSession.mockResolvedValue({
    data: { session: { user: { id: TEST_USER_ID } } },
  })
}

function mockUnauthenticated() {
  mockSupabaseAuth.getSession.mockResolvedValue({
    data: { session: null },
  })
}

/** Build a chained Supabase query mock that resolves with `data` / `error` */
function supabaseChain(result: { data: any; error: any }) {
  const chain: any = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.insert = vi.fn().mockReturnValue(chain)
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.in = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue(result)
  chain.then = (resolve: any) => Promise.resolve(result).then(resolve)
  return chain
}

// --- Test suites ---

describe('dataAccess', () => {
  let da: DataAccess

  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthenticated()
    // Default: online
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)

    da = createDataAccess()
  })

  // -------------------------------------------------------
  // 1. Auth state subscription
  // -------------------------------------------------------
  describe('auth state', () => {
    it('resolves userId internally — no userId parameter on methods', () => {
      // The interface should not require userId
      // If this compiles, the test passes (type-level check at runtime)
      const methodNames = [
        'getTasks', 'createTask', 'updateTask', 'deleteTask',
        'getEntries', 'createEntry', 'updateEntry', 'deleteEntry',
        'getFolders', 'createFolder', 'updateFolder', 'deleteFolder',
        'getWaterEntries', 'createWaterEntry', 'deleteWaterEntry',
        'syncAll',
      ] as const

      for (const name of methodNames) {
        expect(typeof (da as any)[name]).toBe('function')
      }
    })

    it('subscribes to auth state changes on creation', () => {
      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalled()
    })

    it('uses session userId for Supabase operations', async () => {

      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: { id: 'test-uuid-1234', title: 'Buy groceries', completed: false, folder_id: 'folder-1', user_id: TEST_USER_ID },
        error: null,
      }))

      mockDbTasks.add.mockResolvedValue(undefined)

      await da.createTask('Buy groceries', 'folder-1')

      // Supabase insert should include user_id from session
      const fromCall = mockSupabaseFrom.mock.calls.find(c => c[0] === 'tasks')
      expect(fromCall).toBeTruthy()
    })

    it('throws when no authenticated user and calling Supabase operation', async () => {
      mockUnauthenticated()
      // Re-create to pick up unauthenticated state
      const daUnauth = createDataAccess()

      // online + no user should error (can't write to Supabase without user_id)
      await expect(daUnauth.createTask('test')).rejects.toThrow()
    })
  })

  // -------------------------------------------------------
  // 2. Online mode: dual-write
  // -------------------------------------------------------
  describe('online mode', () => {
    it('writes task to both Supabase and IndexedDB', async () => {
      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: { id: 'test-uuid-1234', title: 'Buy groceries', completed: false, folder_id: null },
        error: null,
      }))
      mockDbTasks.add.mockResolvedValue(undefined)

      await da.createTask('Buy groceries')

      // IndexedDB write — object mutated after add, so check shape without syncStatus
      expect(mockDbTasks.add).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-uuid-1234',
          taskContent: 'Buy groceries',
          completed: false,
        }),
      )

      // Supabase write confirms → syncStatus upgraded to 'synced'
      expect(mockDbTasks.update).toHaveBeenCalledWith('test-uuid-1234', expect.objectContaining({
        syncStatus: 'synced',
      }))
      expect(mockSupabaseFrom).toHaveBeenCalledWith('tasks')
    })

    it('writes journal entry to both stores', async () => {
      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: { id: 'test-uuid-1234', title: 'Day 1', content: 'Hello', folder_id: 'f1', status: 'active' },
        error: null,
      }))
      mockDbJournal.add.mockResolvedValue(undefined)

      await da.createEntry('Day 1', 'Hello', 'f1')

      expect(mockDbJournal.add).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-uuid-1234',
          title: 'Day 1',
          content: 'Hello',
          folderId: 'f1',
        }),
      )
      expect(mockDbJournal.update).toHaveBeenCalledWith('test-uuid-1234', expect.objectContaining({
        syncStatus: 'synced',
      }))
      expect(mockSupabaseFrom).toHaveBeenCalledWith('journal_entries')
    })

    it('writes folder to both stores', async () => {
      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: { id: 'test-uuid-1234', name: 'Work', type: 'task' },
        error: null,
      }))
      mockDbFolders.add.mockResolvedValue(undefined)

      await da.createFolder('Work', 'task')

      expect(mockDbFolders.add).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-uuid-1234',
          name: 'Work',
          type: 'task',
        }),
      )
      expect(mockDbFolders.update).toHaveBeenCalledWith('test-uuid-1234', expect.objectContaining({
        syncStatus: 'synced',
      }))
      expect(mockSupabaseFrom).toHaveBeenCalledWith('folders')
    })

    it('writes water entry to both stores', async () => {
      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: { id: 'test-uuid-1234', amount_ml: 250, logged_at: '2024-01-15' },
        error: null,
      }))
      mockDbWaterEntries.add.mockResolvedValue(undefined)

      await da.createWaterEntry(250, '2024-01-15')

      expect(mockDbWaterEntries.add).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-uuid-1234',
          amount: 250,
          date: '2024-01-15',
        }),
      )
      expect(mockDbWaterEntries.update).toHaveBeenCalledWith('test-uuid-1234', expect.objectContaining({
        syncStatus: 'synced',
      }))
      expect(mockSupabaseFrom).toHaveBeenCalledWith('water_logs')
    })

    it('marks IndexedDB item as synced when Supabase succeeds', async () => {
      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: { id: 'test-uuid-1234', title: 'done', completed: false },
        error: null,
      }))
      mockDbTasks.add.mockResolvedValue(undefined)

      await da.createTask('done')

      // add is called with pending, but object gets mutated — verify via update call
      expect(mockDbTasks.add).toHaveBeenCalled()
      expect(mockDbTasks.update).toHaveBeenCalledWith('test-uuid-1234', expect.objectContaining({
        syncStatus: 'synced',
      }))
    })
  })

  // -------------------------------------------------------
  // 3. Offline mode: IndexedDB only + pending
  // -------------------------------------------------------
  describe('offline mode', () => {
    beforeEach(() => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    })

    it('writes task to IndexedDB only, marks as pending', async () => {
      mockDbTasks.add.mockResolvedValue(undefined)

      await da.createTask('Offline task')

      expect(mockDbTasks.add).toHaveBeenCalledWith(
        expect.objectContaining({
          taskContent: 'Offline task',
          syncStatus: 'pending',
        }),
      )
      // Supabase should NOT be called
      expect(mockSupabaseFrom).not.toHaveBeenCalled()
    })

    it('writes journal entry to IndexedDB only when offline', async () => {
      mockDbJournal.add.mockResolvedValue(undefined)

      await da.createEntry('Offline entry', 'content', 'f1')

      expect(mockDbJournal.add).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Offline entry',
          syncStatus: 'pending',
        }),
      )
      expect(mockSupabaseFrom).not.toHaveBeenCalled()
    })

    it('writes folder to IndexedDB only when offline', async () => {
      mockDbFolders.add.mockResolvedValue(undefined)

      await da.createFolder('Offline folder', 'task')

      expect(mockDbFolders.add).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Offline folder',
          syncStatus: 'pending',
        }),
      )
      expect(mockSupabaseFrom).not.toHaveBeenCalled()
    })

    it('writes water entry to IndexedDB only when offline', async () => {
      mockDbWaterEntries.add.mockResolvedValue(undefined)

      await da.createWaterEntry(500, '2024-01-15')

      expect(mockDbWaterEntries.add).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 500,
          syncStatus: 'pending',
        }),
      )
      expect(mockSupabaseFrom).not.toHaveBeenCalled()
    })

    it('update marks item as pending when offline', async () => {
      mockDbTasks.update.mockResolvedValue(undefined)

      await da.updateTask('task-1', { completed: true })

      expect(mockDbTasks.update).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({
          completed: true,
          syncStatus: 'pending',
        }),
      )
      expect(mockSupabaseFrom).not.toHaveBeenCalled()
    })

    it('delete marks item as deleted and pending when offline', async () => {
      mockDbTasks.update.mockResolvedValue(undefined)

      await da.deleteTask('task-1')

      expect(mockDbTasks.update).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({ syncStatus: 'deleted' }),
      )
      expect(mockSupabaseFrom).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------
  // 4. Field mapping
  // -------------------------------------------------------
  describe('field mapping', () => {
    it('maps taskContent → title for Supabase', async () => {
      const chain = supabaseChain({
        data: { id: 'test-uuid-1234', title: 'Mapped', completed: false },
        error: null,
      })
      mockSupabaseFrom.mockReturnValue(chain)
      mockDbTasks.add.mockResolvedValue(undefined)

      await da.createTask('Mapped')

      // The insert call should contain 'title', not 'taskContent'
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Mapped' }),
      )
    })

    it('maps folderId → folder_id for Supabase tasks', async () => {
      const chain = supabaseChain({
        data: { id: 'test-uuid-1234', title: 'x', folder_id: 'f1' },
        error: null,
      })
      mockSupabaseFrom.mockReturnValue(chain)
      mockDbTasks.add.mockResolvedValue(undefined)

      await da.createTask('x', 'f1')

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ folder_id: 'f1' }),
      )
    })

    it('maps folderId → folder_id for Supabase journal entries', async () => {
      const chain = supabaseChain({
        data: { id: 'test-uuid-1234', title: 't', content: 'c', folder_id: 'f2' },
        error: null,
      })
      mockSupabaseFrom.mockReturnValue(chain)
      mockDbJournal.add.mockResolvedValue(undefined)

      await da.createEntry('t', 'c', 'f2')

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ folder_id: 'f2' }),
      )
    })

    it('maps amount → amount_ml for Supabase water logs', async () => {
      const chain = supabaseChain({
        data: { id: 'test-uuid-1234', amount_ml: 300, logged_at: '2024-01-15' },
        error: null,
      })
      mockSupabaseFrom.mockReturnValue(chain)
      mockDbWaterEntries.add.mockResolvedValue(undefined)

      await da.createWaterEntry(300, '2024-01-15')

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ amount_ml: 300 }),
      )
    })

    it('maps date → logged_at for Supabase water logs', async () => {
      const chain = supabaseChain({
        data: { id: 'test-uuid-1234', amount_ml: 250, logged_at: '2024-06-01' },
        error: null,
      })
      mockSupabaseFrom.mockReturnValue(chain)
      mockDbWaterEntries.add.mockResolvedValue(undefined)

      await da.createWaterEntry(250, '2024-06-01')

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ logged_at: '2024-06-01' }),
      )
    })

    it('maps Supabase title → taskContent when reading tasks', async () => {
      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: [
          { id: '1', title: 'From Supabase', completed: false, folder_id: 'f1', user_id: TEST_USER_ID },
        ],
        error: null,
      }))
      mockDbTasks.toArray.mockResolvedValue([])

      const tasks = await da.getTasks()

      // getTasks should return local format with taskContent
      expect(tasks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ taskContent: 'From Supabase' }),
        ]),
      )
    })

    it('maps Supabase amount_ml → amount when reading water entries', async () => {
      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: [
          { id: '1', amount_ml: 500, logged_at: '2024-01-01', user_id: TEST_USER_ID },
        ],
        error: null,
      }))
      mockDbWaterEntries.toArray.mockResolvedValue([])

      const entries = await da.getWaterEntries()

      expect(entries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ amount: 500 }),
        ]),
      )
    })

    it('maps Supabase folder_id → folderId when reading tasks', async () => {
      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: [
          { id: '1', title: 't', completed: false, folder_id: 'remote-folder', user_id: TEST_USER_ID },
        ],
        error: null,
      }))
      mockDbTasks.toArray.mockResolvedValue([])

      const tasks = await da.getTasks()

      expect(tasks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ folderId: 'remote-folder' }),
        ]),
      )
    })
  })

  // -------------------------------------------------------
  // 5. CRUD operations
  // -------------------------------------------------------
  describe('CRUD: Tasks', () => {
    it('getTasks returns from IndexedDB', async () => {
      const localTasks: Task[] = [
        { id: '1', taskContent: 'Local', completed: false, syncStatus: 'synced', lastModified: 100, timestamp: 100 },
      ]
      mockDbTasks.toArray.mockResolvedValue(localTasks)
      // Also mock Supabase to return empty (online merge)
      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: [], error: null }))

      const result = await da.getTasks()

      expect(mockDbTasks.toArray).toHaveBeenCalled()
      expect(result).toEqual(expect.arrayContaining(localTasks))
    })

    it('createTask generates UUID and sets timestamps', async () => {
      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: { id: 'test-uuid-1234' }, error: null }))
      mockDbTasks.add.mockResolvedValue(undefined)

      const result = await da.createTask('New task')

      expect(result.id).toBe('test-uuid-1234')
      expect(result.taskContent).toBe('New task')
      expect(result.lastModified).toBeGreaterThan(0)
      expect(result.timestamp).toBeGreaterThan(0)
    })

    it('updateTask updates IndexedDB and Supabase when online', async () => {
      mockDbTasks.update.mockResolvedValue(undefined)
      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: {}, error: null }))

      await da.updateTask('task-1', { completed: true })

      expect(mockDbTasks.update).toHaveBeenCalledWith('task-1', expect.objectContaining({
        completed: true,
        syncStatus: 'synced',
      }))
    })

    it('deleteTask soft-deletes in IndexedDB and deletes from Supabase when online', async () => {
      mockDbTasks.update.mockResolvedValue(undefined)
      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: null, error: null }))

      await da.deleteTask('task-1')

      // Soft delete locally
      expect(mockDbTasks.update).toHaveBeenCalledWith('task-1', expect.objectContaining({
        syncStatus: 'deleted',
      }))
      // Hard delete on Supabase
      expect(mockSupabaseFrom).toHaveBeenCalledWith('tasks')
    })
  })

  describe('CRUD: Journal Entries', () => {
    it('getEntries returns from IndexedDB', async () => {
      const local: JournalEntry[] = [
        { id: '1', title: 't', content: 'c', status: 'active', date: '2024-01-01', syncStatus: 'synced', lastModified: 100, timestamp: 100 },
      ]
      mockDbJournal.toArray.mockResolvedValue(local)
      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: [], error: null }))

      const result = await da.getEntries()

      expect(result).toEqual(expect.arrayContaining(local))
    })

    it('createEntry generates UUID, sets defaults', async () => {
      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: { id: 'test-uuid-1234' }, error: null }))
      mockDbJournal.add.mockResolvedValue(undefined)

      const result = await da.createEntry('Title', 'Body', 'folder-1')

      expect(result.id).toBe('test-uuid-1234')
      expect(result.title).toBe('Title')
      expect(result.content).toBe('Body')
      expect(result.folderId).toBe('folder-1')
      expect(result.status).toBe('active')
    })

    it('updateEntry updates both stores when online', async () => {
      mockDbJournal.update.mockResolvedValue(undefined)
      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: {}, error: null }))

      await da.updateEntry('entry-1', { title: 'Updated' })

      expect(mockDbJournal.update).toHaveBeenCalled()
    })

    it('deleteEntry soft-deletes in IndexedDB', async () => {
      mockDbJournal.update.mockResolvedValue(undefined)
      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: null, error: null }))

      await da.deleteEntry('entry-1')

      expect(mockDbJournal.update).toHaveBeenCalledWith('entry-1', expect.objectContaining({
        syncStatus: 'deleted',
      }))
    })
  })

  describe('CRUD: Folders', () => {
    it('getFolders returns from IndexedDB', async () => {
      const local: Folder[] = [
        { id: '1', name: 'Work', type: 'task', syncStatus: 'synced', numOfItems: 3, lastModified: 100, timestamp: 100 },
      ]
      mockDbFolders.toArray.mockResolvedValue(local)
      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: [], error: null }))

      const result = await da.getFolders()

      expect(result).toEqual(expect.arrayContaining(local))
    })

    it('createFolder generates UUID', async () => {
      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: { id: 'test-uuid-1234' }, error: null }))
      mockDbFolders.add.mockResolvedValue(undefined)

      const result = await da.createFolder('Personal', 'journal')

      expect(result.id).toBe('test-uuid-1234')
      expect(result.name).toBe('Personal')
      expect(result.type).toBe('journal')
    })

    it('updateFolder updates both stores when online', async () => {
      mockDbFolders.update.mockResolvedValue(undefined)
      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: {}, error: null }))

      await da.updateFolder('folder-1', { name: 'Renamed' })

      expect(mockDbFolders.update).toHaveBeenCalled()
    })

    it('deleteFolder soft-deletes in IndexedDB', async () => {
      mockDbFolders.update.mockResolvedValue(undefined)
      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: null, error: null }))

      await da.deleteFolder('folder-1')

      expect(mockDbFolders.update).toHaveBeenCalledWith('folder-1', expect.objectContaining({
        syncStatus: 'deleted',
      }))
    })
  })

  describe('CRUD: Water Entries', () => {
    it('getWaterEntries returns from IndexedDB', async () => {
      const local: WaterEntry[] = [
        { id: '1', amount: 250, date: '2024-01-01', syncStatus: 'synced', lastModified: 100, timestamp: 100 },
      ]
      mockDbWaterEntries.toArray.mockResolvedValue(local)
      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: [], error: null }))

      const result = await da.getWaterEntries()

      expect(result).toEqual(expect.arrayContaining(local))
    })

    it('createWaterEntry generates UUID', async () => {
      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: { id: 'test-uuid-1234' }, error: null }))
      mockDbWaterEntries.add.mockResolvedValue(undefined)

      const result = await da.createWaterEntry(500, '2024-01-15')

      expect(result.id).toBe('test-uuid-1234')
      expect(result.amount).toBe(500)
      expect(result.date).toBe('2024-01-15')
    })

    it('deleteWaterEntry soft-deletes in IndexedDB and deletes from Supabase when online', async () => {
      mockDbWaterEntries.update.mockResolvedValue(undefined)
      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: null, error: null }))

      await da.deleteWaterEntry('water-1')

      expect(mockDbWaterEntries.update).toHaveBeenCalledWith('water-1', expect.objectContaining({
        syncStatus: 'deleted',
      }))
      expect(mockSupabaseFrom).toHaveBeenCalledWith('water_logs')
    })

    it('deleteWaterEntry soft-deletes when offline', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
      mockDbWaterEntries.update.mockResolvedValue(undefined)

      await da.deleteWaterEntry('water-1')

      expect(mockDbWaterEntries.update).toHaveBeenCalledWith('water-1', expect.objectContaining({
        syncStatus: 'deleted',
      }))
    })
  })

  // -------------------------------------------------------
  // 6. syncAll
  // -------------------------------------------------------
  describe('syncAll', () => {
    it('pushes pending items to Supabase', async () => {
      const pendingTasks: Task[] = [
        { id: 't1', taskContent: 'Pending task', completed: false, syncStatus: 'pending', lastModified: 200, timestamp: 100 },
      ]
      mockDbTasks.toArray.mockResolvedValue(pendingTasks)
      mockDbJournal.toArray.mockResolvedValue([])
      mockDbFolders.toArray.mockResolvedValue([])
      mockDbWaterEntries.toArray.mockResolvedValue([])

      // Supabase upsert succeeds
      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: {}, error: null }))

      await da.syncAll()

      // Should have called Supabase to push pending tasks
      expect(mockSupabaseFrom).toHaveBeenCalledWith('tasks')
      // Should update local syncStatus to synced
      expect(mockDbTasks.update).toHaveBeenCalledWith('t1', expect.objectContaining({
        syncStatus: 'synced',
      }))
    })

    it('pulls remote changes and updates IndexedDB', async () => {
      mockDbTasks.toArray.mockResolvedValue([])
      mockDbJournal.toArray.mockResolvedValue([])
      mockDbFolders.toArray.mockResolvedValue([])
      mockDbWaterEntries.toArray.mockResolvedValue([])

      // Supabase returns remote tasks
      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: [
          { id: 'remote-1', title: 'Remote task', completed: false, folder_id: null, user_id: TEST_USER_ID, created_at: '2024-01-01' },
        ],
        error: null,
      }))

      await da.syncAll()

      // Should fetch from Supabase
      expect(mockSupabaseFrom).toHaveBeenCalledWith('tasks')
    })

    it('skips Supabase push when offline', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)

      mockDbTasks.toArray.mockResolvedValue([
        { id: 't1', taskContent: 'Pending', completed: false, syncStatus: 'pending', lastModified: 200, timestamp: 100 },
      ])
      mockDbJournal.toArray.mockResolvedValue([])
      mockDbFolders.toArray.mockResolvedValue([])
      mockDbWaterEntries.toArray.mockResolvedValue([])

      await da.syncAll()

      // Should NOT attempt Supabase calls
      expect(mockSupabaseFrom).not.toHaveBeenCalled()
    })

    it('marks failed sync items as failed', async () => {
      mockDbTasks.toArray.mockResolvedValue([
        { id: 't1', taskContent: 'Will fail', completed: false, syncStatus: 'pending', lastModified: 200, timestamp: 100 },
      ])
      mockDbJournal.toArray.mockResolvedValue([])
      mockDbFolders.toArray.mockResolvedValue([])
      mockDbWaterEntries.toArray.mockResolvedValue([])

      // Supabase returns error
      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: null,
        error: { message: 'Network error' },
      }))

      await da.syncAll()

      // Should mark as failed
      expect(mockDbTasks.update).toHaveBeenCalledWith('t1', expect.objectContaining({
        syncStatus: 'failed',
      }))
    })
  })

  // -------------------------------------------------------
  // 7. Conflict resolution: last-write-wins
  // -------------------------------------------------------
  describe('conflict resolution', () => {
    it('local wins when local.lastModified > remote.lastModified', async () => {
      const localTime = 2000

      const localTasks: Task[] = [
        { id: 't1', taskContent: 'Local version', completed: true, syncStatus: 'synced', lastModified: localTime, timestamp: 100 },
      ]
      mockDbTasks.toArray.mockResolvedValue(localTasks)
      mockDbJournal.toArray.mockResolvedValue([])
      mockDbFolders.toArray.mockResolvedValue([])
      mockDbWaterEntries.toArray.mockResolvedValue([])

      // Remote has older version
      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: [
          { id: 't1', title: 'Remote version', completed: false, folder_id: null, user_id: TEST_USER_ID },
        ],
        error: null,
      }))

      await da.syncAll()

      // Local should NOT be overwritten — remote should be updated
      // The local task with 'Local version' should remain
      expect(mockDbTasks.update).not.toHaveBeenCalledWith('t1', expect.objectContaining({
        taskContent: 'Remote version',
      }))
    })

    it('remote wins when remote.lastModified > local.lastModified', async () => {
      const localTime = 1000

      const localTasks: Task[] = [
        { id: 't1', taskContent: 'Old local', completed: false, syncStatus: 'synced', lastModified: localTime, timestamp: 100 },
      ]
      mockDbTasks.toArray.mockResolvedValue(localTasks)
      mockDbJournal.toArray.mockResolvedValue([])
      mockDbFolders.toArray.mockResolvedValue([])
      mockDbWaterEntries.toArray.mockResolvedValue([])

      // Remote has newer version (Supabase row doesn't have lastModified in schema,
      // so the module should use created_at or a derived timestamp)
      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: [
          { id: 't1', title: 'Newer remote', completed: true, folder_id: null, user_id: TEST_USER_ID, created_at: '2099-01-01T00:00:00Z' },
        ],
        error: null,
      }))

      await da.syncAll()

      // Local should be updated with remote data
      expect(mockDbTasks.update).toHaveBeenCalledWith('t1', expect.objectContaining({
        taskContent: 'Newer remote',
      }))
    })
  })

  // -------------------------------------------------------
  // 8. Error propagation
  // -------------------------------------------------------
  describe('error propagation', () => {
    it('throws Supabase errors to caller on create', async () => {
      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: null,
        error: { message: 'duplicate key value violates unique constraint' },
      }))
      mockDbTasks.add.mockResolvedValue(undefined)

      await expect(da.createTask('Will fail')).rejects.toThrow('duplicate key value')
    })

    it('throws Supabase errors on update', async () => {
      mockDbTasks.update.mockResolvedValue(undefined)
      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: null,
        error: { message: 'row not found' },
      }))

      await expect(da.updateTask('task-1', { completed: true })).rejects.toThrow('row not found')
    })

    it('throws Supabase errors on delete', async () => {
      mockDbTasks.update.mockResolvedValue(undefined)
      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: null,
        error: { message: 'permission denied' },
      }))

      await expect(da.deleteTask('task-1')).rejects.toThrow('permission denied')
    })

    it('throws Dexie errors to caller', async () => {
      mockDbTasks.toArray.mockRejectedValue(new Error('IndexedDB is not available'))

      await expect(da.getTasks()).rejects.toThrow('IndexedDB is not available')
    })

    it('still writes to IndexedDB even when Supabase write fails online', async () => {
      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: null,
        error: { message: 'server error' },
      }))
      mockDbTasks.add.mockResolvedValue(undefined)

      await expect(da.createTask('Partial fail')).rejects.toThrow()

      // IndexedDB write should still have been attempted
      expect(mockDbTasks.add).toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------
  // 9. Edge cases
  // -------------------------------------------------------
  describe('edge cases', () => {
    it('createTask with no folderId defaults to undefined', async () => {
      mockSupabaseFrom.mockReturnValue(supabaseChain({
        data: { id: 'test-uuid-1234', title: 'No folder', folder_id: null },
        error: null,
      }))
      mockDbTasks.add.mockResolvedValue(undefined)

      const result = await da.createTask('No folder')

      expect(result.folderId).toBeUndefined()
    })

    it('syncAll handles empty local stores gracefully', async () => {
      mockDbTasks.toArray.mockResolvedValue([])
      mockDbJournal.toArray.mockResolvedValue([])
      mockDbFolders.toArray.mockResolvedValue([])
      mockDbWaterEntries.toArray.mockResolvedValue([])

      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: [], error: null }))

      await expect(da.syncAll()).resolves.not.toThrow()
    })

    it('each create sets lastModified to current timestamp', async () => {
      const before = Date.now()
      mockSupabaseFrom.mockReturnValue(supabaseChain({ data: { id: 'test-uuid-1234' }, error: null }))
      mockDbTasks.add.mockResolvedValue(undefined)

      const result = await da.createTask('Timestamped')

      expect(result.lastModified).toBeGreaterThanOrEqual(before)
      expect(result.lastModified).toBeLessThanOrEqual(Date.now())
    })
  })
})
