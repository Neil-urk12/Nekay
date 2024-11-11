import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { SyncService } from '../syncService'
import { IndexedDBService } from '../indexedDB'

describe('SyncService', () => {
  let syncService: SyncService
  let indexedDBService: IndexedDBService

  beforeEach(() => {
    indexedDBService = new IndexedDBService()
    syncService = new SyncService(indexedDBService)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('should start sync process when online', async () => {
    const mockOnline = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const syncSpy = vi.spyOn(syncService, 'sync').mockResolvedValue()
    
    await syncService.startSync()
    
    expect(syncSpy).toHaveBeenCalled()
    mockOnline.mockRestore()
  })

  it('should not start sync process when offline', async () => {
    const mockOffline = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const syncSpy = vi.spyOn(syncService, 'sync').mockResolvedValue()
    
    await syncService.startSync()
    
    expect(syncSpy).not.toHaveBeenCalled()
    mockOffline.mockRestore()
  })

  it('should handle sync errors gracefully', async () => {
    const mockOnline = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const syncSpy = vi.spyOn(syncService, 'sync').mockRejectedValue(new Error('Sync failed'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    await syncService.startSync()
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))
    mockOnline.mockRestore()
    consoleSpy.mockRestore()
  })

  it('should retry sync after failure with exponential backoff', async () => {
    const mockOnline = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const syncSpy = vi.spyOn(syncService, 'sync').mockRejectedValue(new Error('Sync failed'))
    
    await syncService.startSync()
    vi.advanceTimersByTime(1000)
    
    expect(syncSpy).toHaveBeenCalledTimes(2)
    mockOnline.mockRestore()
  })
})
