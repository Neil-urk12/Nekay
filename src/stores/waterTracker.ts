import type { WaterEntry } from '../services/indexedDB'
import { defineStore } from 'pinia'
import { db } from '../services/indexedDB'
import { supabase } from '../supabase/supabase-config'
import { generateUUID } from '../utils/functions'

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
      this.error = error instanceof Error ? error.message : String(error)
      console.error('Water Store error:', error)
    },

    async getUserId(): Promise<string | null> {
      const { data: { session } } = await supabase.auth.getSession()
      return session?.user?.id || null
    },

    async loadWaterEntries() {
      try {
        this.loading = true
        const userId = await this.getUserId()

        if (navigator.onLine && userId) {
          const { data, error } = await supabase
            .from('water_logs')
            .select('*')
            .eq('user_id', userId)
            .order('logged_at', { ascending: false })

          if (error)
            throw error

          // Map Supabase fields to app fields
          this.waterEntries = (data || []).map(entry => ({
            id: entry.id,
            amount: entry.amount_ml,
            date: entry.logged_at,
            timestamp: new Date(entry.logged_at).getTime(),
            syncStatus: 'synced' as const,
            lastModified: new Date(entry.logged_at).getTime(),
          }))
        }
        else {
          this.waterEntries = await db.getWaterEntries()
        }
      }
      catch (err) {
        this.setError(err)
        // Fallback to local
        this.waterEntries = await db.getWaterEntries()
      }
      finally {
        this.loading = false
      }
    },

    async addWaterEntry(entry: { amount: number, date: string }) {
      try {
        const timestamp = Date.now()
        const userId = await this.getUserId()
        const entryId = generateUUID()

        const newEntry: WaterEntry = {
          id: entryId,
          amount: entry.amount,
          date: entry.date,
          timestamp,
          syncStatus: 'pending',
          lastModified: timestamp,
        }

        if (navigator.onLine && userId) {
          const { error } = await supabase.from('water_logs').insert({
            id: entryId,
            user_id: userId,
            amount_ml: entry.amount,
            logged_at: entry.date,
          })

          if (error)
            throw error

          newEntry.syncStatus = 'synced'
          await db.createWaterEntry(newEntry)
        }
        else {
          await db.createWaterEntry(newEntry)
        }

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

        if (navigator.onLine) {
          const { error } = await supabase
            .from('water_logs')
            .delete()
            .eq('id', entryId)

          if (error)
            throw error

          await db.deleteWaterEntry(entryId)
        }
        else {
          await db.deleteWaterEntry(entryId)
        }

        this.waterEntries.splice(entryIndex, 1)
        this.error = null
      }
      catch (error) {
        this.setError(error)
      }
    },
  },
})
