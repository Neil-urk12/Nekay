import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Dexie before importing
vi.mock('dexie', () => {
  const mockTable = {
    add: vi.fn().mockResolvedValue(1),
    update: vi.fn().mockResolvedValue(1),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    toArray: vi.fn().mockResolvedValue([]),
    where: vi.fn().mockReturnValue({
      equals: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    }),
  }

  return {
    default: class MockDexie {
      constructor(_name?: string) {}
      version(_v: number) {
        return { stores: () => {} }
      }
      table(_name: string) {
        return mockTable
      }
    },
  }
})

import { db } from '../indexedDB'

describe('NekayDatabase validation guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('updateFolder', () => {
    it('throws when both folderId and changes are missing', async () => {
      await expect((db as any).updateFolder(undefined, undefined)).rejects.toThrow()
    })

    it('throws when folderId is missing but changes provided', async () => {
      await expect((db as any).updateFolder(undefined, { name: 'test' })).rejects.toThrow()
    })

    it('throws when changes missing but folderId provided', async () => {
      await expect((db as any).updateFolder('folder-1', undefined)).rejects.toThrow()
    })
  })

  describe('updateTask', () => {
    it('throws when both taskId and changes are missing', async () => {
      await expect((db as any).updateTask(undefined, undefined)).rejects.toThrow()
    })

    it('throws when taskId is missing but changes provided', async () => {
      await expect((db as any).updateTask(undefined, { title: 'test' })).rejects.toThrow()
    })

    it('throws when changes missing but taskId provided', async () => {
      await expect((db as any).updateTask('task-1', undefined)).rejects.toThrow()
    })
  })

  describe('updateEntry', () => {
    it('throws when both entryId and changes are missing', async () => {
      await expect((db as any).updateEntry(undefined, undefined)).rejects.toThrow()
    })

    it('throws when entryId is missing but changes provided', async () => {
      await expect((db as any).updateEntry(undefined, { content: 'test' })).rejects.toThrow()
    })

    it('throws when changes missing but entryId provided', async () => {
      await expect((db as any).updateEntry('entry-1', undefined)).rejects.toThrow()
    })
  })
})
