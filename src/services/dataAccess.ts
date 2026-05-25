import type { Task, JournalEntry, Folder } from '../composables/interfaces'
import type { WaterEntry } from './indexedDB'
import { db } from './indexedDB'
import { supabase, onAuthStateChange } from '../supabase/supabase-config'
import { generateUUID } from '../utils/functions'

export interface DataAccess {
  getTasks(): Promise<Task[]>
  createTask(content: string, folderId?: string): Promise<Task>
  updateTask(id: string, changes: Partial<Task>): Promise<void>
  deleteTask(id: string): Promise<void>

  getEntries(): Promise<JournalEntry[]>
  createEntry(title: string, content: string, folderId?: string): Promise<JournalEntry>
  updateEntry(id: string, changes: Partial<JournalEntry>): Promise<void>
  deleteEntry(id: string): Promise<void>

  getFolders(): Promise<Folder[]>
  createFolder(name: string, type: 'task' | 'journal' | 'allTasks'): Promise<Folder>
  updateFolder(id: string, changes: Partial<Folder>): Promise<void>
  deleteFolder(id: string): Promise<void>

  getWaterEntries(): Promise<WaterEntry[]>
  createWaterEntry(amount: number, date: string): Promise<WaterEntry>
  deleteWaterEntry(id: string): Promise<void>

  syncAll(): Promise<void>
}

export function createDataAccess(): DataAccess {
  let currentUserId: string | null = null
  let sessionResolved = false

  // Get initial session — store promise so early callers can await it
  const sessionPromise = supabase.auth.getSession().then(({ data }: any) => {
    currentUserId = data?.session?.user?.id ?? null
    sessionResolved = true
  })

  // Subscribe to auth state changes
  onAuthStateChange((session: any) => {
    currentUserId = session?.user?.id ?? null
  })

  // --- Helpers ---

  function isOnline(): boolean {
    return navigator.onLine
  }

  async function ensureAuth(): Promise<string> {
    if (!sessionResolved) await sessionPromise
    if (!currentUserId) throw new Error('No authenticated user')
    return currentUserId
  }

  // --- Field mapping: local → Supabase ---

  function toSupabaseTask(task: Task): Record<string, any> {
    return {
      id: task.id,
      title: task.taskContent,
      completed: task.completed,
      folder_id: task.folderId ?? null,
      user_id: currentUserId,
    }
  }

  function toSupabaseEntry(entry: JournalEntry): Record<string, any> {
    return {
      id: entry.id,
      title: entry.title,
      content: entry.content,
      folder_id: entry.folderId ?? null,
      status: entry.status,
      user_id: currentUserId,
    }
  }

  function toSupabaseFolder(folder: Folder): Record<string, any> {
    return {
      id: folder.id,
      name: folder.name,
      type: folder.type,
      user_id: currentUserId,
    }
  }

  function toSupabaseWater(entry: WaterEntry): Record<string, any> {
    return {
      id: entry.id,
      amount_ml: entry.amount,
      logged_at: entry.date,
      user_id: currentUserId,
    }
  }

  // --- Field mapping: Supabase → local ---

  function mapSupabaseTask(row: any): Task {
    return {
      id: row.id,
      taskContent: row.title,
      completed: row.completed,
      folderId: row.folder_id ?? undefined,
      syncStatus: 'synced',
      lastModified: row.created_at ? new Date(row.created_at).getTime() : 0,
      timestamp: row.created_at ? new Date(row.created_at).getTime() : 0,
    }
  }

  function mapSupabaseEntry(row: any): JournalEntry {
    return {
      id: row.id,
      title: row.title ?? '',
      content: row.content,
      folderId: row.folder_id ?? undefined,
      status: row.status ?? 'active',
      date: row.created_at ?? '',
      syncStatus: 'synced',
      lastModified: row.created_at ? new Date(row.created_at).getTime() : 0,
      timestamp: row.created_at ? new Date(row.created_at).getTime() : 0,
    }
  }

  function mapSupabaseFolder(row: any): Folder {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      syncStatus: 'synced',
      numOfItems: 0,
      lastModified: row.created_at ? new Date(row.created_at).getTime() : 0,
      timestamp: row.created_at ? new Date(row.created_at).getTime() : 0,
    }
  }

  function mapSupabaseWater(row: any): WaterEntry {
    return {
      id: row.id,
      amount: row.amount_ml,
      date: row.logged_at,
      syncStatus: 'synced',
      lastModified: row.logged_at ? new Date(row.logged_at).getTime() : 0,
      timestamp: row.logged_at ? new Date(row.logged_at).getTime() : 0,
    }
  }

  // --- Supabase helpers ---

  async function supabaseFetch(table: string): Promise<any[]> {
    const userId = await ensureAuth()
    const chain: any = supabase.from(table).select().eq('user_id', userId)
    const { data, error } = await chain
    if (error) throw new Error(error.message)
    return Array.isArray(data) ? data : []
  }

  // --- Fetch helpers ---

  async function fetchTasks(): Promise<Task[]> {
    const rows = await supabaseFetch('tasks')
    return rows.map(mapSupabaseTask)
  }

  async function fetchEntries(): Promise<JournalEntry[]> {
    const rows = await supabaseFetch('journal_entries')
    return rows.map(mapSupabaseEntry)
  }

  async function fetchFolders(): Promise<Folder[]> {
    const rows = await supabaseFetch('folders')
    return rows.map(mapSupabaseFolder)
  }

  async function fetchWaterEntries(): Promise<WaterEntry[]> {
    const rows = await supabaseFetch('water_logs')
    return rows.map(mapSupabaseWater)
  }

  // --- Sync helpers ---

  async function syncToSupabase<T extends { id: string; syncStatus: string }>(
    table: string,
    localItems: T[],
    mapper: (item: T) => Record<string, any>,
    dbTable: any,
  ): Promise<void> {
    const pending = localItems.filter(i => i.syncStatus === 'pending')
    if (pending.length === 0) return

    const rows = pending.map(mapper)
    const { error } = await supabase.from(table).insert(rows)
    if (error) {
      for (const item of pending) {
        await dbTable.update(item.id, { syncStatus: 'failed' })
      }
    } else {
      for (const item of pending) {
        await dbTable.update(item.id, { syncStatus: 'synced' })
      }
    }
  }

  async function resolveConflicts<T extends { id: string; lastModified: number }>(
    localItems: T[],
    remoteItems: T[],
    updateLocal: (id: string, data: T) => Promise<void>,
    addLocal: (data: T) => Promise<void>,
  ): Promise<void> {
    const localMap = new Map(localItems.map(i => [i.id, i]))

    for (const remote of remoteItems) {
      const local = localMap.get(remote.id)
      if (!local) {
        // Remote-only → add locally
        await addLocal(remote)
      } else if (remote.lastModified > local.lastModified) {
        // Remote newer → overwrite local
        await updateLocal(remote.id, remote)
      }
      // else local newer → keep local (will be pushed on next sync)
    }
  }

  async function syncDeletedItems<T extends { id: string }>(
    table: string,
    items: T[],
    dbTable: any,
  ): Promise<void> {
    for (const item of items) {
      try {
        const { error } = await supabase.from(table).delete().eq('id', item.id)
        if (!error) await dbTable.delete(item.id)
      } catch (err) { console.error('[dataAccess] delete sync failed:', err) }
    }
  }

  // --- CRUD: Tasks ---

  async function getTasks(): Promise<Task[]> {
    const local = (await db.tasks.toArray()).filter(t => t.syncStatus !== 'deleted')
    if (!isOnline() || local.length > 0) return local

    // Only fetch from Supabase when no local data
    const remote = await fetchTasks()
    return remote
  }

  async function createTask(content: string, folderId?: string): Promise<Task> {
    if (isOnline()) await ensureAuth()

    const now = Date.now()
    const task: Task = {
      id: generateUUID(),
      taskContent: content,
      completed: false,
      folderId: folderId ?? undefined,
      syncStatus: 'pending',
      lastModified: now,
      timestamp: now,
    }

    await db.tasks.add(task)

    if (isOnline()) {
      const supabaseData = toSupabaseTask(task)
      const { data, error } = await supabase.from('tasks').insert(supabaseData)
      if (error) throw new Error(error.message)
      if (data) {
        const row: any = Array.isArray(data) ? data[0] : data
        if (row) {
          const remoteTs = row.created_at ? new Date(row.created_at).getTime() : task.lastModified
          await db.tasks.update(task.id, { lastModified: remoteTs, syncStatus: 'synced' })
          task.lastModified = remoteTs
          task.syncStatus = 'synced'
        }
      }
    }

    return task
  }

  async function updateTask(id: string, changes: Partial<Task>): Promise<void> {
    if (isOnline()) await ensureAuth()

    const now = Date.now()
    const updates: Partial<Task> = {
      ...changes,
      lastModified: now,
      syncStatus: isOnline() ? 'synced' : 'pending',
    }

    await db.tasks.update(id, updates)

    if (isOnline()) {
      const supabaseUpdates: Record<string, any> = {}
      if (changes.taskContent !== undefined) supabaseUpdates.title = changes.taskContent
      if (changes.completed !== undefined) supabaseUpdates.completed = changes.completed
      if (changes.folderId !== undefined) supabaseUpdates.folder_id = changes.folderId ?? null
      if (Object.keys(supabaseUpdates).length > 0) {
        const { error } = await supabase.from('tasks').update(supabaseUpdates).eq('id', id)
        if (error) throw new Error(error.message)
      }
    }
  }

  async function deleteTask(id: string): Promise<void> {
    if (isOnline()) await ensureAuth()

    const now = Date.now()
    await db.tasks.update(id, { syncStatus: 'deleted', lastModified: now })

    if (isOnline()) {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw new Error(error.message)
    }
  }

  // --- CRUD: Journal Entries ---

  async function getEntries(): Promise<JournalEntry[]> {
    const local = (await db.journal.toArray()).filter(e => e.syncStatus !== 'deleted')
    if (!isOnline() || local.length > 0) return local

    const remote = await fetchEntries()
    return remote
  }

  async function createEntry(title: string, content: string, folderId?: string): Promise<JournalEntry> {
    if (isOnline()) await ensureAuth()

    const now = Date.now()
    const entry: JournalEntry = {
      id: generateUUID(),
      title,
      content,
      folderId: folderId ?? undefined,
      status: 'active',
      date: new Date().toISOString().split('T')[0],
      syncStatus: 'pending',
      lastModified: now,
      timestamp: now,
    }

    await db.journal.add(entry)

    if (isOnline()) {
      const supabaseData = toSupabaseEntry(entry)
      const { data, error } = await supabase.from('journal_entries').insert(supabaseData)
      if (error) throw new Error(error.message)
      if (data) {
        const row: any = Array.isArray(data) ? data[0] : data
        if (row) {
          const remoteTs = row.created_at ? new Date(row.created_at).getTime() : entry.lastModified
          await db.journal.update(entry.id, { lastModified: remoteTs, syncStatus: 'synced' })
          entry.lastModified = remoteTs
          entry.syncStatus = 'synced'
        }
      }
    }

    return entry
  }

  async function updateEntry(id: string, changes: Partial<JournalEntry>): Promise<void> {
    if (isOnline()) await ensureAuth()

    const now = Date.now()
    const updates: Partial<JournalEntry> = {
      ...changes,
      lastModified: now,
      syncStatus: isOnline() ? 'synced' : 'pending',
    }

    await db.journal.update(id, updates)

    if (isOnline()) {
      const supabaseUpdates: Record<string, any> = {}
      if (changes.title !== undefined) supabaseUpdates.title = changes.title
      if (changes.content !== undefined) supabaseUpdates.content = changes.content
      if (changes.folderId !== undefined) supabaseUpdates.folder_id = changes.folderId ?? null
      if (changes.status !== undefined) supabaseUpdates.status = changes.status
      if (Object.keys(supabaseUpdates).length > 0) {
        const { error } = await supabase.from('journal_entries').update(supabaseUpdates).eq('id', id)
        if (error) throw new Error(error.message)
      }
    }
  }

  async function deleteEntry(id: string): Promise<void> {
    if (isOnline()) await ensureAuth()

    const now = Date.now()
    await db.journal.update(id, { syncStatus: 'deleted', lastModified: now })

    if (isOnline()) {
      const { error } = await supabase.from('journal_entries').delete().eq('id', id)
      if (error) throw new Error(error.message)
    }
  }

  // --- CRUD: Folders ---

  async function getFolders(): Promise<Folder[]> {
    const local = (await db.folders.toArray()).filter(f => f.syncStatus !== 'deleted')
    if (!isOnline() || local.length > 0) return local

    const remote = await fetchFolders()
    return remote
  }

  async function createFolder(name: string, type: 'task' | 'journal' | 'allTasks'): Promise<Folder> {
    if (isOnline()) await ensureAuth()

    const now = Date.now()
    const folder: Folder = {
      id: generateUUID(),
      name,
      type,
      syncStatus: 'pending',
      numOfItems: 0,
      lastModified: now,
      timestamp: now,
    }

    await db.folders.add(folder)

    if (isOnline()) {
      const supabaseData = toSupabaseFolder(folder)
      const { data, error } = await supabase.from('folders').insert(supabaseData)
      if (error) throw new Error(error.message)
      if (data) {
        const row: any = Array.isArray(data) ? data[0] : data
        if (row) {
          const remoteTs = row.created_at ? new Date(row.created_at).getTime() : folder.lastModified
          await db.folders.update(folder.id, { lastModified: remoteTs, syncStatus: 'synced' })
          folder.lastModified = remoteTs
          folder.syncStatus = 'synced'
        }
      }
    }

    return folder
  }

  async function updateFolder(id: string, changes: Partial<Folder>): Promise<void> {
    if (isOnline()) await ensureAuth()

    const now = Date.now()
    const updates: Partial<Folder> = {
      ...changes,
      lastModified: now,
      syncStatus: isOnline() ? 'synced' : 'pending',
    }

    await db.folders.update(id, updates)

    if (isOnline()) {
      const supabaseUpdates: Record<string, any> = {}
      if (changes.name !== undefined) supabaseUpdates.name = changes.name
      if (changes.type !== undefined) supabaseUpdates.type = changes.type
      if (Object.keys(supabaseUpdates).length > 0) {
        const { error } = await supabase.from('folders').update(supabaseUpdates).eq('id', id)
        if (error) throw new Error(error.message)
      }
    }
  }

  async function deleteFolder(id: string): Promise<void> {
    if (isOnline()) await ensureAuth()

    const now = Date.now()
    await db.folders.update(id, { syncStatus: 'deleted', lastModified: now })

    if (isOnline()) {
      const { error } = await supabase.from('folders').delete().eq('id', id)
      if (error) throw new Error(error.message)
    }
  }

  // --- CRUD: Water Entries ---

  async function getWaterEntries(): Promise<WaterEntry[]> {
    const local = (await db.waterEntries.toArray()).filter(w => w.syncStatus !== 'deleted')
    if (!isOnline() || local.length > 0) return local

    const remote = await fetchWaterEntries()
    return remote
  }

  async function createWaterEntry(amount: number, date: string): Promise<WaterEntry> {
    if (isOnline()) await ensureAuth()

    const now = Date.now()
    const entry: WaterEntry = {
      id: generateUUID(),
      amount,
      date,
      syncStatus: 'pending',
      lastModified: now,
      timestamp: now,
    }

    await db.waterEntries.add(entry)

    if (isOnline()) {
      const supabaseData = toSupabaseWater(entry)
      const { data, error } = await supabase.from('water_logs').insert(supabaseData)
      if (error) throw new Error(error.message)
      if (data) {
        const row: any = Array.isArray(data) ? data[0] : data
        if (row) {
          const remoteTs = row.logged_at ? new Date(row.logged_at).getTime() : entry.lastModified
          await db.waterEntries.update(entry.id, { lastModified: remoteTs, syncStatus: 'synced' })
          entry.lastModified = remoteTs
          entry.syncStatus = 'synced'
        }
      }
    }

    return entry
  }

  async function deleteWaterEntry(id: string): Promise<void> {
    const now = Date.now()
    await db.waterEntries.update(id, { syncStatus: 'deleted', lastModified: now })

    if (isOnline()) {
      const { error } = await supabase.from('water_logs').delete().eq('id', id)
      if (error) throw new Error(error.message)
    }
  }

  // --- Sync ---

  async function syncAll(): Promise<void> {
    if (!isOnline()) return

    // Push soft-deleted items
    const deletedTasks = (await db.tasks.toArray()).filter(t => t.syncStatus === 'deleted')
    await syncDeletedItems('tasks', deletedTasks, db.tasks)

    const deletedEntries = (await db.journal.toArray()).filter(e => e.syncStatus === 'deleted')
    await syncDeletedItems('journal_entries', deletedEntries, db.journal)

    const deletedFolders = (await db.folders.toArray()).filter(f => f.syncStatus === 'deleted')
    await syncDeletedItems('folders', deletedFolders, db.folders)

    const deletedWater = (await db.waterEntries.toArray()).filter(w => w.syncStatus === 'deleted')
    await syncDeletedItems('water_logs', deletedWater, db.waterEntries)

    // Push pending
    const pendingTasks = (await db.tasks.toArray()).filter(t => t.syncStatus === 'pending')
    await syncToSupabase('tasks', pendingTasks, toSupabaseTask, db.tasks)

    const pendingEntries = (await db.journal.toArray()).filter(e => e.syncStatus === 'pending')
    await syncToSupabase('journal_entries', pendingEntries, toSupabaseEntry, db.journal)

    const pendingFolders = (await db.folders.toArray()).filter(f => f.syncStatus === 'pending')
    await syncToSupabase('folders', pendingFolders, toSupabaseFolder, db.folders)

    const pendingWater = (await db.waterEntries.toArray()).filter(w => w.syncStatus === 'pending')
    await syncToSupabase('water_logs', pendingWater, toSupabaseWater, db.waterEntries)

    // Pull remote (silently skip tables that fail — will retry on next sync)
    try {
      const remoteTasks = await fetchTasks()
      const localTasks = (await db.tasks.toArray()).filter(t => t.syncStatus === 'synced')
      await resolveConflicts(localTasks, remoteTasks,
        async (id, data) => { await db.tasks.update(id, { ...data, syncStatus: 'synced' }) },
        async (data) => { await db.tasks.add({ ...data, syncStatus: 'synced' }) },
      )
    } catch (err) { console.error('[dataAccess] task conflict resolution failed:', err) }

    try {
      const remoteEntries = await fetchEntries()
      const localEntries = (await db.journal.toArray()).filter(e => e.syncStatus === 'synced')
      await resolveConflicts(localEntries, remoteEntries,
        async (id, data) => { await db.journal.update(id, { ...data, syncStatus: 'synced' }) },
        async (data) => { await db.journal.add({ ...data, syncStatus: 'synced' }) },
      )
    } catch (err) { console.error('[dataAccess] entry conflict resolution failed:', err) }

    try {
      const remoteFolders = await fetchFolders()
      const localFolders = (await db.folders.toArray()).filter(f => f.syncStatus === 'synced')
      await resolveConflicts(localFolders, remoteFolders,
        async (id, data) => { await db.folders.update(id, { ...data, syncStatus: 'synced' }) },
        async (data) => { await db.folders.add({ ...data, syncStatus: 'synced' }) },
      )
    } catch (err) { console.error('[dataAccess] folder conflict resolution failed:', err) }

    try {
      const remoteWater = await fetchWaterEntries()
      const localWater = (await db.waterEntries.toArray()).filter(w => w.syncStatus === 'synced')
      await resolveConflicts(localWater, remoteWater,
        async (id, data) => { await db.waterEntries.update(id, { ...data, syncStatus: 'synced' }) },
        async (data) => { await db.waterEntries.add({ ...data, syncStatus: 'synced' }) },
      )
    } catch (err) { console.error('[dataAccess] water conflict resolution failed:', err) }
  }

  return {
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    getEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    getFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    getWaterEntries,
    createWaterEntry,
    deleteWaterEntry,
    syncAll,
  }
}
