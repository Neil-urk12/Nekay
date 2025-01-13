import { defineStore } from "pinia";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface Stats {
  completedSessions: number;
}

export const useTimerStore = defineStore("timer", {
  state: () => ({
    isRunning: false,
    mode: "work" as "work" | "shortBreak" | "longBreak",
    progress: 0,
    stats: { completedSessions: 0 } as Stats,
    formattedTime: "25:00",
    formattedTotalTime: "00:00",
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
        case "work":
          return this.workDuration;
        case "shortBreak":
          return this.shortBreakDuration;
        case "longBreak":
          return this.longBreakDuration;
        default:
          return this.workDuration
      }
    },
  },
  actions: {
    startTimer() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      if (!this.isRunning) {
        this.playStartSound()
        this.isRunning = true;
        this.intervalId = setInterval(() => {
          this.timeRemaining--;
          this.progress =
            (1 - this.timeRemaining / this.currentDuration) * 100;

          if (this.timeRemaining <= 0) {
            clearInterval(this.intervalId!);
            this.totalTime += this.currentDuration;
            if (this.mode === "work") {
              this.stats.completedSessions++;
              this.sessionCount++;
              this.syncStats();
              if (this.sessionCount % this.longBreakInterval === 0) {
                this.mode = "longBreak";
              } else {
                this.mode = "shortBreak";
              }
            }
            this.playNotificationSound();
            this.startTimer()
          }

          const minutes = Math.floor(this.timeRemaining / 60);
          const seconds = this.timeRemaining % 60;
          this.formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;
          this.formattedTotalTime = this.formatTime(this.totalTime);
        }, 1000);
      }
    },
    pauseTimer() {
      if (this.isRunning && this.intervalId !== null) {
        clearInterval(this.intervalId);
        this.intervalId = null;
        this.isRunning = false;
      }
    },
    resetTimer() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
        this.isRunning = false;
      }
      this.mode = "work";
      this.progress = 0;
      this.timeRemaining = this.workDuration;
      this.formattedTime = "25:00";
    },
    toggleMode() {
      if (this.mode === "work") {
        this.mode = "shortBreak";
        this.timeRemaining = this.shortBreakDuration;
      } else if (this.mode === "shortBreak") {
        this.mode = "work"
        this.timeRemaining = this.workDuration;
      } else if (this.mode === "longBreak") {
        this.mode = "work"
        this.timeRemaining = this.workDuration;
      }
      this.progress = 0;
      const minutes = Math.floor(this.timeRemaining / 60);
      const seconds = this.timeRemaining % 60;
      this.formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    },
    formatTime(totalSeconds: number): string {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    },
    playNotificationSound() {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.5;
      audio.play();
    },
    playStartSound() {
      const audio = new Audio('/pomostart.wav')
      audio.volume = 0.5
      audio.play()
    },
    async syncStats() {
      try {
        if (navigator.onLine) {
          const { db } = await import("../firebase/firebase-config");
          const statsRef = doc(db, "pomodoroStats", "userStats");
          await setDoc(statsRef, {
            completedSessions: this.stats.completedSessions,
            totalTime: this.totalTime,
            sessionCount: this.sessionCount,
            formattedTotalTime: this.formattedTotalTime
          });
        }
        
      } catch (error) {
        console.error("Failed to sync pomodoro stats:", error);
      }
    },
    async loadStats() {
      try {
        if (navigator.onLine) {
          const { db } = await import("../firebase/firebase-config");
          const statsRef = doc(db, "pomodoroStats", "userStats");
          const docSnap = await getDoc(statsRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            this.stats.completedSessions = data.completedSessions;
            this.totalTime = data.totalTime;
            this.sessionCount = data.sessionCount;
            this.formattedTotalTime = data.formattedTotalTime
          }
        }
      } catch (error) {
        console.error("Failed to load pomodoro stats:", error);
      }
    }
  },
});
