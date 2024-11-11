import { defineStore } from 'pinia'

export const usePomodoro = defineStore('pomodoro', {
  state: () => ({
    timeLeft: 25 * 60,
    isRunning: false,
    timer: null as NodeJS.Timeout | null,
    stats: {
      completedSessions: 0,
      totalFocusTime: 0
    },
    error: null as string | null
  }),
  
  actions: {
    toggleTimer() {
      if (this.isRunning) {
        this.pauseTimer()
      } else {
        this.startTimer()
      }
    },
    saveStats() {
      localStorage.setItem('pomodoroStats', JSON.stringify(this.stats))
    },
    loadStats() {
      const saved = localStorage.getItem('pomodoroStats')
      if (saved) {
        this.stats = JSON.parse(saved)
      }
    },

    validateStats() {
      if (this.stats.completedSessions < 0) {
        throw new Error('Completed sessions cannot be negative')
      }
      if (this.stats.totalFocusTime < 0) {
        throw new Error('Total focus time cannot be negative')
      }
    },

    startTimer() {
      try {
        if (!this.isRunning) {
          this.isRunning = true
          this.timer = setInterval(() => {
            if (this.timeLeft > 0) {
              this.timeLeft--
            } else {
              this.completeSession()
            }
          }, 1000)
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to start timer'
        this.pauseTimer()
      }
    },

    pauseTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
      this.isRunning = false
    },

    resetTimer() {
      this.pauseTimer()
      this.timeLeft = 25 * 60
    },

    completeSession() {
      try {
        this.pauseTimer()
        this.stats.completedSessions++
        this.stats.totalFocusTime += 25 * 60
        this.validateStats()
        this.resetTimer()
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to complete session'
        this.resetTimer()
      }
    }
  }
})