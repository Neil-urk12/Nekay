import { defineStore } from "pinia";

interface Stats {
  completedSessions: number;
}

export const useTimerStore = defineStore("timer", {
  state: () => ({
    isRunning: false,
    mode: "work" as "work" | "break",
    progress: 0,
    stats: { completedSessions: 0 } as Stats,
    formattedTime: "25:00",
    formattedTotalTime: "00:00",
    workDuration: 1500, // 25 minutes in seconds
    breakDuration: 300, // 5 minutes in seconds,
    totalTime: 0,
    timeRemaining: 1500, // Initial time for work duration which is 25 minutes
    intervalId: null as number | null | NodeJS.Timeout,
  }),
  actions: {
    startTimer() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }

      if (!this.isRunning) {
        this.isRunning = true;
        this.intervalId = setInterval(() => {
          this.timeRemaining--;
          this.progress =
            (1 -
              this.timeRemaining /
                (this.mode === "work"
                  ? this.workDuration
                  : this.breakDuration)) *
            100;

          if (this.timeRemaining <= 0) {
            clearInterval(this.intervalId!);
            this.totalTime +=
              this.mode === "work" ? this.workDuration : this.breakDuration;
            if (this.mode === "work") {
              this.stats.completedSessions++;
            }
            this.toggleMode();
            this.startTimer(); // Automatically start the next session
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
      this.intervalId = null;
      this.mode = "work";
      this.progress = 0;
      this.timeRemaining = this.workDuration;
      this.formattedTime = "25:00";
      this.totalTime = 0;
      this.formattedTotalTime = "00:00";
    },
    toggleMode() {
      if (this.mode === "work") {
        this.mode = "break";
        this.timeRemaining = this.breakDuration;
      } else {
        this.mode = "work";
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
  },
});
