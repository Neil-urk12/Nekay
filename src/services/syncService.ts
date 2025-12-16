import type { RealtimeChannel } from '@supabase/supabase-js'
import debounce from 'lodash/debounce'
import { supabase } from '../supabase/supabase-config'
import { db } from './indexedDB'

type SyncableCollection = 'tasks' | 'folders' | 'journal' | 'pomodoro' | 'water_logs'
type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error'

interface SyncState {
  status: SyncStatus
  lastSync: Date | null
  error: Error | null
  progress: number
}

// Map local collection names to Supabase table names
const tableNameMap: Record<SyncableCollection, string> = {
  tasks: 'tasks',
  folders: 'folders',
  journal: 'journal_entries',
  pomodoro: 'pomodoro_sessions',
  water_logs: 'water_logs',
}

export class SyncService {
  private static instance: SyncService
  private channels: Map<string, RealtimeChannel> = new Map()
  private syncState: Map<SyncableCollection, SyncState> = new Map()
  private readonly BATCH_SIZE = 500
  private isOnline: boolean = navigator.onLine
  private userId: string | null = null

  private constructor() {
    this.setupNetworkListeners()
    this.initializeSyncStates()
    this.initializeUserId()
  }

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }

  private async initializeUserId() {
    const { data: { session } } = await supabase.auth.getSession()
    this.userId = session?.user?.id || null

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      this.userId = session?.user?.id || null
    })
  }

  private initializeSyncStates() {
    const collections: SyncableCollection[] = [
      'tasks',
      'folders',
      'journal',
      'pomodoro',
      'water_logs',
    ]
    collections.forEach((collection) => {
      this.syncState.set(collection, {
        status: 'synced',
        lastSync: null,
        error: null,
        progress: 0,
      })
    })
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncAll()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.removeAllChannels()
    })
  }

  private async setupRealtimeListener(collectionName: SyncableCollection) {
    const tableName = tableNameMap[collectionName]

    const channel = supabase
      .channel(`${tableName}_changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
          filter: this.userId ? `user_id=eq.${this.userId}` : undefined,
        },
        debounce(async (payload) => {
          if (!this.isOnline)
            return

          try {
            switch (payload.eventType) {
              case 'INSERT':
              case 'UPDATE':
                await this.handleIncomingChange(collectionName, payload.new)
                break
              case 'DELETE':
                await this.handleRemoteDelete(collectionName, payload.old.id)
                break
            }
          }
          catch (error) {
            this.updateSyncState(collectionName, 'error', error as Error)
          }
        }, 1500),
      )
      .subscribe()

    this.channels.set(collectionName, channel)
  }

  private async handleIncomingChange(
    collection: SyncableCollection,
    data: any,
  ) {
    const localData = await this.getLocalItem(collection, data.id)
    const mappedData = this.mapFromSupabase(collection, data)

    if (!localData) {
      await this.updateLocalItem(collection, data.id, mappedData)
      return
    }

    const localModified = localData.lastModified
    const remoteModified = new Date(data.created_at || data.completed_at || data.logged_at).getTime()

    if (localModified < remoteModified) {
      await this.updateLocalItem(collection, data.id, mappedData)
    }
  }

  private mapFromSupabase(collection: SyncableCollection, data: any): any {
    switch (collection) {
      case 'tasks':
        return {
          id: data.id,
          taskContent: data.title,
          completed: data.completed,
          folderId: data.folder_id,
          syncStatus: 'synced',
          lastModified: new Date(data.created_at).getTime(),
          timestamp: new Date(data.created_at).getTime(),
        }
      case 'folders':
        return {
          id: data.id,
          name: data.name,
          type: data.type,
          syncStatus: 'synced',
          numOfItems: 0,
          lastModified: new Date(data.created_at).getTime(),
          timestamp: new Date(data.created_at).getTime(),
        }
      case 'journal':
        return {
          id: data.id,
          title: data.title || '',
          content: data.content,
          status: data.status || 'active',
          date: data.created_at,
          folderId: data.folder_id,
          syncStatus: 'synced',
          lastModified: new Date(data.created_at).getTime(),
          timestamp: new Date(data.created_at).getTime(),
        }
      default:
        return { ...data, syncStatus: 'synced' }
    }
  }

  private mapToSupabase(collection: SyncableCollection, item: any): any {
    switch (collection) {
      case 'tasks':
        return {
          id: item.id,
          user_id: this.userId,
          title: item.taskContent,
          completed: item.completed,
          folder_id: item.folderId || null,
        }
      case 'folders':
        return {
          id: item.id,
          user_id: this.userId,
          name: item.name,
          type: item.type,
        }
      case 'journal':
        return {
          id: item.id,
          user_id: this.userId,
          title: item.title,
          content: item.content,
          folder_id: item.folderId || null,
          status: item.status,
        }
      default:
        return item
    }
  }

  private async handleRemoteDelete(collection: SyncableCollection, id: string) {
    try {
      switch (collection) {
        case 'tasks':
          await db.deleteTask(id)
          break
        case 'folders':
          await db.deleteFolder(id)
          break
        case 'journal':
          await db.deleteEntry(id)
          break
      }
    }
    catch (error) {
      console.error('Error handling remote delete:', error)
      throw error
    }
  }

  private async getLocalItem(collection: SyncableCollection, id: string) {
    switch (collection) {
      case 'tasks':
        return await db.tasks.where('id').equals(id).first()
      case 'folders':
        return await db.folders.where('id').equals(id).first()
      case 'journal':
        return await db.journal.where('id').equals(id).first()
      default:
        return null
    }
  }

  private async syncFromSupabase(collectionToSync: SyncableCollection) {
    if (!this.userId)
      return

    try {
      const tableName = tableNameMap[collectionToSync]
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', this.userId)

      if (error)
        throw error

      for (const item of data || []) {
        const mappedData = this.mapFromSupabase(collectionToSync, item)
        await this.updateLocalItem(collectionToSync, item.id, mappedData)
      }
    }
    catch (error) {
      console.error('Error syncing from Supabase:', error)
      throw error
    }
  }

  private async updateLocalItem(
    collection: SyncableCollection,
    id: string,
    data: any,
  ) {
    try {
      const existingItem = await this.getLocalItem(collection, id)

      switch (collection) {
        case 'tasks':
          if (existingItem) {
            await db.updateTask(id, data)
          }
          else {
            await db.createTask(data)
          }
          break
        case 'folders':
          if (existingItem) {
            await db.updateFolder(id, data)
          }
          else {
            await db.createFolder(data)
          }
          break
        case 'journal':
          if (existingItem) {
            await db.updateEntry(id, data)
          }
          else {
            await db.createEntry(data)
          }
          break
      }
    }
    catch (error) {
      console.error('Error updating local item:', error)
      throw error
    }
  }

  private async getPendingItems(collection: SyncableCollection) {
    try {
      switch (collection) {
        case 'tasks':
          return await db.tasks
            .where('syncStatus')
            .equals('pending')
            .toArray()
        case 'folders':
          return await db.folders
            .where('syncStatus')
            .equals('pending')
            .toArray()
        case 'journal':
          return await db.journal
            .where('syncStatus')
            .equals('pending')
            .toArray()
        default:
          return []
      }
    }
    catch (error) {
      console.error('Error getting pending items:', error)
      throw error
    }
  }

  private async getDeletedItems(collection: SyncableCollection) {
    try {
      switch (collection) {
        case 'tasks':
          return await db.tasks
            .where('syncStatus')
            .equals('deleted')
            .toArray()
        case 'folders':
          return await db.folders
            .where('syncStatus')
            .equals('deleted')
            .toArray()
        case 'journal':
          return await db.journal
            .where('syncStatus')
            .equals('deleted')
            .toArray()
        default:
          return []
      }
    }
    catch (error) {
      console.error('Error getting deleted items:', error)
      throw error
    }
  }

  private updateSyncState(
    collection: SyncableCollection,
    status: SyncStatus,
    error: Error | null = null,
  ) {
    const state = this.syncState.get(collection)!
    this.syncState.set(collection, {
      ...state,
      status,
      error,
      lastSync: status === 'synced' ? new Date() : state.lastSync,
    })
  }

  async syncAll() {
    if (!this.isOnline || !this.userId)
      return

    const collections: SyncableCollection[] = [
      'tasks',
      'folders',
      'journal',
    ]

    for (const collection of collections) {
      try {
        this.updateSyncState(collection, 'syncing')
        await this.syncCollection(collection)
        this.setupRealtimeListener(collection)
        this.updateSyncState(collection, 'synced')
      }
      catch (error) {
        this.updateSyncState(collection, 'error', error as Error)
      }
    }
  }

  private async syncCollection(collection: SyncableCollection) {
    if (!this.userId)
      return

    try {
      const pendingItems = await this.getPendingItems(collection)
      const deletedItems = await this.getDeletedItems(collection)
      const tableName = tableNameMap[collection]

      // Handle deletions
      for (const item of deletedItems) {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', item.id)

        if (!error) {
          await this.deleteLocalItem(collection, item.id)
        }
      }

      // Handle pending items
      if (pendingItems.length === 0) {
        await this.syncFromSupabase(collection)
        return
      }

      // Batch upsert pending items
      for (let i = 0; i < pendingItems.length; i += this.BATCH_SIZE) {
        const chunk = pendingItems.slice(i, i + this.BATCH_SIZE)
        const mappedChunk = chunk.map(item => this.mapToSupabase(collection, item))

        const { error } = await supabase
          .from(tableName)
          .upsert(mappedChunk, { onConflict: 'id' })

        if (error) {
          console.error(`Error upserting ${collection}:`, error)
          continue
        }

        // Update local items as synced
        for (const item of chunk) {
          await this.updateLocalItem(collection, item.id, {
            ...item,
            syncStatus: 'synced',
            lastModified: Date.now(),
          })
        }

        this.updateSyncProgress(
          collection,
          ((i + chunk.length) / pendingItems.length) * 100,
        )
      }
    }
    catch (error) {
      console.error('Error syncing collection:', error)
      this.updateSyncState(collection, 'error', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  private async deleteLocalItem(collection: SyncableCollection, id: string) {
    switch (collection) {
      case 'tasks':
        await db.deleteTask(id)
        break
      case 'folders':
        await db.deleteFolder(id)
        break
      case 'journal':
        await db.deleteEntry(id)
        break
    }
  }

  private updateSyncProgress(collection: SyncableCollection, progress: number) {
    const state = this.syncState.get(collection)!
    this.syncState.set(collection, {
      ...state,
      progress,
    })
  }

  async loadFromCache() {
    const collections: SyncableCollection[] = [
      'tasks',
      'folders',
      'journal',
    ]

    for (const collection of collections) {
      try {
        const localData = await this.getLocalItems(collection)
        if (!localData || localData.length === 0) {
          await this.syncFromSupabase(collection)
          await this.getLocalItems(collection)
        }
      }
      catch (error) {
        console.error('Error loading from cache:', error)
        throw error
      }
    }
  }

  private async getLocalItems(collection: SyncableCollection) {
    switch (collection) {
      case 'tasks':
        return await db.tasks.toArray()
      case 'folders':
        return await db.folders.toArray()
      case 'journal':
        return await db.journal.toArray()
      default:
        return []
    }
  }

  removeAllChannels() {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel)
    })
    this.channels.clear()
  }

  getSyncState(collection: SyncableCollection): SyncState {
    return this.syncState.get(collection)!
  }
}

export const syncService = SyncService.getInstance()
