import { defineStore } from 'pinia'
import { indexedDBService, PomodoroStats, PomodoroSession } from '../services/indexedDB'

const WORK_DURATION = 25 * 60 // 25 minutes in seconds
const BREAK_DURATION = 5 * 60 // 5 minutes in seconds
const NOTIFICATION_VOLUME = 0.5 // 50% volume

const STORAGE_KEY = 'pomodoro-state'

export const usePomodoro = defineStore('pomodoro', {
  state: () => ({
    timeLeft: WORK_DURATION,
    isRunning: false,
    timer: null as ReturnType<typeof setInterval> | null,
    stats: null as PomodoroStats | null,
    currentSession: null as PomodoroSession | null,
    error: null as string | null,
    isLoading: false,
    mode: 'work' as 'work' | 'break'
  }),

  getters: {
    formattedTime: (state) => {
      const minutes = Math.floor(state.timeLeft / 60)
      const seconds = state.timeLeft % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    },
    formattedTotalTime: (state) => {
      if (!state.stats) return '0 minutes'
      return `${Math.floor(state.stats.totalFocusTime / 60)} minutes`
    },
    progress: (state) => {
      const total = state.mode === 'work' ? WORK_DURATION : BREAK_DURATION
      return ((total - state.timeLeft) / total) * 100
    }
  },

  actions: {
    async init() {
      try {
        this.isLoading = true
        this.error = null

        // Restore state from localStorage if it exists
        const savedState = localStorage.getItem(STORAGE_KEY)
        if (savedState) {
          const { timeLeft, isRunning, mode } = JSON.parse(savedState)
          this.timeLeft = timeLeft
          this.mode = mode
          if (isRunning) {
            this.start()
          }
        }

        const stats = await indexedDBService.getItem<PomodoroStats>('pomodoro', 'stats')
        if (!stats) {
          const newStats: PomodoroStats = {
            id: 'stats',
            completedSessions: 0,
            totalFocusTime: 0,
            lastModified: Date.now(),
            syncStatus: 'pending'
          }
          await indexedDBService.addItem('pomodoro', newStats)
          this.stats = newStats
        } else {
          this.stats = stats
        }

        // Request notification permission
        if ('Notification' in window) {
          await Notification.requestPermission()
        }

        // Add keyboard shortcuts
        window.addEventListener('keydown', this.handleKeyPress)
      } catch (err) {
        this.error = 'Failed to initialize Pomodoro timer'
        console.error(err)
      } finally {
        this.isLoading = false
      }
    },

    handleKeyPress(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return // Don't handle shortcuts when typing in inputs
      }

      switch(event.key.toLowerCase()) {
        case ' ':
          event.preventDefault()
          this.isRunning ? this.pause() : this.start()
          break
        case 'r':
          event.preventDefault()
          this.reset()
          break
        case 'b':
          event.preventDefault()
          this.toggleMode()
          break
      }
    },

    saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        timeLeft: this.timeLeft,
        isRunning: this.isRunning,
        mode: this.mode
      }))
    },

    toggleMode() {
      this.pause()
      this.mode = this.mode === 'work' ? 'break' : 'work'
      this.timeLeft = this.mode === 'work' ? WORK_DURATION : BREAK_DURATION
      this.saveState()
    },

    start() {
      if (this.isRunning) return
      
      this.isRunning = true
      if (this.mode === 'work') {
        this.currentSession = {
          id: crypto.randomUUID(),
          startTime: Date.now(),
          endTime: 0,
          duration: 0,
          type: 'work',
          completed: false,
          lastModified: Date.now(),
          syncStatus: 'pending'
        }
      }
      
      this.timer = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--
          this.saveState()
        } else {
          this.complete()
        }
      }, 1000)
    },

    pause() {
      if (!this.isRunning) return
      
      this.isRunning = false
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
      this.saveState()
    },

    reset() {
      this.pause()
      this.timeLeft = this.mode === 'work' ? WORK_DURATION : BREAK_DURATION
      this.currentSession = null
      this.saveState()
    },

    async complete() {
      try {
        this.pause()
        
        if (this.currentSession && this.stats && this.mode === 'work') {
          this.currentSession.endTime = Date.now()
          // Convert milliseconds to seconds for consistency
          const durationInSeconds = Math.floor((this.currentSession.endTime - this.currentSession.startTime) / 1000)
          this.currentSession.duration = durationInSeconds
          this.currentSession.completed = true
          
          await indexedDBService.addItem('pomodoro', this.currentSession)
          
          this.stats.completedSessions++
          this.stats.totalFocusTime += durationInSeconds
          this.stats.lastModified = Date.now()
          this.stats.syncStatus = 'pending'
          
          await indexedDBService.updateItem('pomodoro', 'stats', this.stats)
        }

        // Toggle to break mode after work session, or work mode after break
        this.mode = this.mode === 'work' ? 'break' : 'work'
        this.timeLeft = this.mode === 'work' ? WORK_DURATION : BREAK_DURATION
        this.saveState()

        // Play notification sound
        try {
          const audio = new Audio('/notification.mp3')
          audio.volume = NOTIFICATION_VOLUME
          await audio.play()
        } catch (err) {
          console.warn('Failed to play notification sound:', err)
        }

        // Show system notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(
            this.mode === 'work' ? 'Break Time!' : 'Back to Work!',
            {
              body: this.mode === 'work' 
                ? 'Time to focus on your next task!' 
                : 'Great job! Take a short break.',
              icon: '/favicon.ico'
            }
          )
        }
      } catch (err) {
        this.error = 'Failed to save session'
        console.error(err)
      }
    },

    dispose() {
      window.removeEventListener('keydown', this.handleKeyPress)
      this.pause()
    }
  }
})

export type { PomodoroStats }
