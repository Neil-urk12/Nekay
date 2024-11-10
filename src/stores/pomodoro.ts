import { defineStore } from 'pinia'

export const usePomodoro = defineStore('pomodoro', {
  state: () => ({
    timeLeft: 25 * 60, // 25 minutes in seconds
    isRunning: false,
    timer: null as NodeJS.Timeout | null,
    stats: {
      completedSessions: 0,
      totalFocusTime: 0
    }
  }),
  
  actions: {
    toggleTimer() {
      if (this.isRunning) {
        this.pauseTimer()
      } else {
        this.startTimer()
      }
    },

    startTimer() {
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
      this.pauseTimer()
      this.stats.completedSessions++
      this.stats.totalFocusTime += 25 * 60
      this.resetTimer()
      // Could add notification here
    }
  }
})
