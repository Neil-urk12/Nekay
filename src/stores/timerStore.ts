import { defineStore } from 'pinia'
import { supabase } from '../supabase/supabase-config'
import { useAuthStore } from './authStore'

interface Stats {
  completedSessions: number
}

export const useTimerStore = defineStore('timer', {
  state: () => ({
    isRunning: false,
    mode: 'work' as 'work' | 'shortBreak' | 'longBreak',
    progress: 0,
    stats: { completedSessions: 0 } as Stats,
    formattedTime: '25:00',
    formattedTotalTime: '00:00',
    workDuration: 1500, // 25 minutes in seconds
    shortBreakDuration: 300, // 5 minutes in seconds,
    longBreakDuration: 900, // 15 minutes in seconds,
    totalTime: 0,
    timeRemaining: 1500, // Initial time for work duration which is 25 minutes
    intervalId: null as number | null | NodeJS.Timeout,
    sessionCount: 0,
    longBreakInterval: 4, // You need 4 work sessions before a long break
  }),
  getters: {
    currentDuration(): number {
      switch (this.mode) {
        case 'work':
          return this.workDuration
        case 'shortBreak':
          return this.shortBreakDuration
        case 'longBreak':
          return this.longBreakDuration
        default:
          return this.workDuration
      }
    },
  },
  actions: {

    startTimer() {
      if (this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = null
      }
      if (!this.isRunning) {
        this.playStartSound()
        this.isRunning = true
        this.intervalId = setInterval(() => {
          this.timeRemaining--
          this.progress
            = (1 - this.timeRemaining / this.currentDuration) * 100

          if (this.timeRemaining <= 0) {
            clearInterval(this.intervalId!)
            this.totalTime += this.currentDuration
            if (this.mode === 'work') {
              this.stats.completedSessions++
              this.sessionCount++
              this.saveSession()
              if (this.sessionCount % this.longBreakInterval === 0) {
                this.mode = 'longBreak'
              }
              else {
                this.mode = 'shortBreak'
              }
            }
            this.playNotificationSound()
            this.startTimer()
          }

          const minutes = Math.floor(this.timeRemaining / 60)
          const seconds = this.timeRemaining % 60
          this.formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`
          this.formattedTotalTime = this.formatTime(this.totalTime)
        }, 1000)
      }
    },
    pauseTimer() {
      if (this.isRunning && this.intervalId !== null) {
        clearInterval(this.intervalId)
        this.intervalId = null
        this.isRunning = false
      }
    },
    resetTimer() {
      if (this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = null
        this.isRunning = false
      }
      this.mode = 'work'
      this.progress = 0
      this.timeRemaining = this.workDuration
      this.formattedTime = '25:00'
    },
    toggleMode() {
      if (this.mode === 'work') {
        this.mode = 'shortBreak'
        this.timeRemaining = this.shortBreakDuration
      }
      else if (this.mode === 'shortBreak') {
        this.mode = 'work'
        this.timeRemaining = this.workDuration
      }
      else if (this.mode === 'longBreak') {
        this.mode = 'work'
        this.timeRemaining = this.workDuration
      }
      this.progress = 0
      const minutes = Math.floor(this.timeRemaining / 60)
      const seconds = this.timeRemaining % 60
      this.formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`
    },
    formatTime(totalSeconds: number): string {
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      return `${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`
    },
    async playNotificationSound() {
      try {
        const audio = new Audio('/notification.mp3')
        audio.volume = 0.5
        await audio.play()
      }
      catch (error) {
        // Audio playback can fail on mobile browsers without user gesture
        // or if the audio file is not found. Fail silently with a warning.
        console.warn('Failed to play notification sound:', error)
      }
    },
    async playStartSound() {
      try {
        const audio = new Audio('/pomostart.wav')
        audio.volume = 0.5
        await audio.play()
      }
      catch (error) {
        // Audio playback can fail on mobile browsers without user gesture
        // or if the audio file is not found. Fail silently with a warning.
        console.warn('Failed to play start sound:', error)
      }
    },

    // Save individual session to Supabase (Option A approach)
    async saveSession() {
      try {
        const authStore = useAuthStore()
        const userId = authStore.uid
        if (!navigator.onLine || !userId)
          return

        const { error } = await supabase.from('pomodoro_sessions').insert({
          user_id: userId,
          duration_minutes: Math.floor(this.workDuration / 60),
          task_id: null, // Can be linked to a task later
        })

        if (error) {
          console.error('Failed to save pomodoro session:', error)
        }
      }
      catch (error) {
        console.error('Failed to save pomodoro session:', error)
      }
    },

    // Load stats by computing from individual sessions
    async loadStats() {
      try {
        const authStore = useAuthStore()
        const userId = authStore.uid
        if (!navigator.onLine || !userId)
          return

        const { data, error } = await supabase
          .from('pomodoro_sessions')
          .select('duration_minutes, completed_at')
          .eq('user_id', userId)

        if (error) {
          console.error('Failed to load pomodoro stats:', error)
          return
        }

        if (data && data.length > 0) {
          // Compute stats from individual sessions
          this.stats.completedSessions = data.length
          this.totalTime = data.reduce((acc, session) => acc + (session.duration_minutes * 60), 0)
          this.sessionCount = data.length
          this.formattedTotalTime = this.formatTime(this.totalTime)
        }
      }
      catch (error) {
        console.error('Failed to load pomodoro stats:', error)
      }
    },
  },
})
