import { defineStore } from 'pinia'
import { PomodoroStats, PomodoroSession } from '../services/indexedDB'

const WORK_DURATION = 25 * 60 // 25 minutes in seconds
const BREAK_DURATION = 5 * 60 // 5 minutes in seconds
const NOTIFICATION_VOLUME = 0.5 // 50% volume
const SYNC_INTERVAL = 30000 // 30 seconds

const STORAGE_KEY = 'pomodoro-state'

export const usePomodoro = defineStore('pomodoro', {
  state: () => ({
    timeLeft: WORK_DURATION,
    isRunning: false,
    worker: null as Worker | null,
    stats: null as PomodoroStats | null,
    currentSession: null as PomodoroSession | null,
    error: null as string | null,
    isLoading: false,
    mode: 'work' as 'work' | 'break',
    lastSyncTime: Date.now()
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

        // Initialize Web Worker
        this.worker = new Worker('/pomodoro-worker.js')
        this.setupWorkerListeners()

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

        // Setup visibility change handler
        document.addEventListener('visibilitychange', this.handleVisibilityChange)

        // Setup periodic sync
        setInterval(this.syncTime, SYNC_INTERVAL)

        // const stats = await indexedDBService.getItem<PomodoroStats>('pomodoro', 'stats')
        // if (!stats) {
        //   const newStats: PomodoroStats = {
        //     id: 'stats',
        //     completedSessions: 0,
        //     totalFocusTime: 0,
        //     lastModified: Date.now(),
        //     syncStatus: 'pending'
        //   }
        //   await indexedDBService.addItem('pomodoro', newStats)
        //   this.stats = newStats
        // } else {
        //   this.stats = stats
        // }

        // Request notification permission
        if ('Notification' in window) {
          await Notification.requestPermission()
        }

        // Add keyboard shortcuts
        window.addEventListener('keydown', this.handleKeyPress)
      } catch (err) {
        this.error = 'Failed to initialize Pomodoro timer'
      } finally {
        this.isLoading = false
      }
    },

    setupWorkerListeners() {
      if (!this.worker) return

      this.worker.onmessage = (e) => {
        const { type, timeLeft } = e.data
        
        switch (type) {
          case 'TICK':
            this.timeLeft = timeLeft
            this.saveState()
            break
          case 'COMPLETE':
            this.complete()
            break
        }
      }
    },

    handleVisibilityChange() {
      if (document.hidden) {
        // App going to background, update last sync time
        this.lastSyncTime = Date.now()
      } else {
        // App coming to foreground, sync the timer
        this.syncTime()
      }
    },

    syncTime() {
      if (!this.worker || !this.isRunning) return
      
      this.worker.postMessage({
        type: 'SYNC',
        payload: { serverTime: this.lastSyncTime }
      })
      
      this.lastSyncTime = Date.now()
    },

    start() {
      if (this.isRunning || !this.worker) return
      
      this.isRunning = true
      if (this.mode === 'work') {
        // this.currentSession = {
        //   id: crypto.randomUUID(),
        //   startTime: Date.now(),
        //   endTime: 0,
        //   duration: 0,
        //   type: 'work',
        //   completed: false,
        //   lastModified: Date.now(),
        //   syncStatus: 'pending'
        // }
      }
      
      this.worker.postMessage({
        type: 'START',
        payload: { timeLeft: this.timeLeft }
      })
      
      this.saveState()
    },

    pause() {
      if (!this.isRunning || !this.worker) return
      
      this.isRunning = false
      this.worker.postMessage({ type: 'PAUSE' })
      this.saveState()
    },

    reset() {
      if (!this.worker) return
      
      this.pause()
      const duration = this.mode === 'work' ? WORK_DURATION : BREAK_DURATION
      this.worker.postMessage({
        type: 'RESET',
        payload: { duration }
      })
      
      this.currentSession = null
      this.saveState()
    },

    toggleMode() {
      this.pause()
      this.mode = this.mode === 'work' ? 'break' : 'work'
      this.timeLeft = this.mode === 'work' ? WORK_DURATION : BREAK_DURATION
      this.saveState()
    },

    saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        timeLeft: this.timeLeft,
        isRunning: this.isRunning,
        mode: this.mode
      }))
    },

    async complete() {
      try {
        this.pause()
        
        if (this.currentSession && this.stats && this.mode === 'work') {
          this.currentSession.endTime = Date.now()
          const durationInSeconds = Math.floor((this.currentSession.endTime - this.currentSession.startTime) / 1000)
          this.currentSession.duration = durationInSeconds
          this.currentSession.completed = true
          
          // await indexedDBService.addItem('pomodoro', this.currentSession)
          
          this.stats.completedSessions++
          this.stats.totalFocusTime += durationInSeconds
          this.stats.lastModified = Date.now()
          this.stats.syncStatus = 'pending'
          
          // await indexedDBService.updateItem('pomodoro', 'stats', this.stats)
        }

        this.mode = this.mode === 'work' ? 'break' : 'work'
        this.timeLeft = this.mode === 'work' ? WORK_DURATION : BREAK_DURATION
        this.saveState()

        try {
          const audio = new Audio('/notification.mp3')
          audio.volume = NOTIFICATION_VOLUME
          await audio.play()
        } catch (err) {
          // Ignore audio play errors
        }

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
      }
    },

    handleKeyPress(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
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

    dispose() {
      window.removeEventListener('keydown', this.handleKeyPress)
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
      if (this.worker) {
        this.worker.terminate()
        this.worker = null
      }
      this.pause()
    }
  }
})

export type { PomodoroStats }
