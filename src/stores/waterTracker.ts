import type { WaterEntry } from '../services/indexedDB'
import { defineStore } from 'pinia'
import { createDataAccess } from '../services/dataAccess'
import { formatError } from '../composables/useStoreError'

const dataAccess = createDataAccess()

export const useWaterStore = defineStore('waterTracker', {
  state: () => ({
    waterEntries: [] as WaterEntry[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getWaterEntries: state => state.waterEntries,
  },

  actions: {
    setError(error: unknown) {
      this.error = formatError(error)
      console.error('Water Store error:', error)
    },

    async loadWaterEntries() {
      try {
        this.loading = true
        this.waterEntries = await dataAccess.getWaterEntries()
      }
      catch (err) {
        this.setError(err)
      }
      finally {
        this.loading = false
      }
    },

    async addWaterEntry(entry: { amount: number, date: string }) {
      try {
        const newEntry = await dataAccess.createWaterEntry(entry.amount, entry.date)
        this.waterEntries = [...this.waterEntries, newEntry]
        this.error = null
      }
      catch (error) {
        this.setError(error)
      }
    },

    async deleteWaterEntry(entryId: string) {
      try {
        const entryIndex = this.waterEntries.findIndex(e => e.id === entryId)
        if (entryIndex === -1)
          throw new Error('Water entry not found')

        await dataAccess.deleteWaterEntry(entryId)
        this.waterEntries.splice(entryIndex, 1)
        this.error = null
      }
      catch (error) {
        this.setError(error)
      }
    },
  },
})
