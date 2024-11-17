import { defineStore } from 'pinia';
import { indexedDBService } from '../services/indexedDB';

interface PomodoroStats {
  completedSessions: number;
  totalFocusTime: number;
  lastModified: number;
}

interface PomodoroSession {
  id?: number;
  startTime: number;
  endTime: number;
  duration: number;
  type: 'work' | 'break';
  completed: boolean;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastModified: number;
  timestamp: number;
}

export const usePomodoro = defineStore('pomodoro', {
  state: () => ({
    timeLeft: 25 * 60,
    isRunning: false,
    timer: null as NodeJS.Timeout | null,
    stats: {
      completedSessions: 0,
      totalFocusTime: 0,
      lastModified: Date.now()
    } as PomodoroStats,
    currentSession: null as PomodoroSession | null,
    error: null as string | null
  }),

  getters: {
    formattedTime: (state) => {
      const minutes = Math.floor(state.timeLeft / 60);
      const seconds = state.timeLeft % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },
    progress: (state) => {
      return ((25 * 60 - state.timeLeft) / (25 * 60)) * 100;
    }
  },

  actions: {
    async init() {
      try {
        // Load stats from IndexedDB
        const stats = await indexedDBService.getAllItems('pomodoro');
        if (stats.length > 0) {
          this.stats = stats[0];
        }
        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to initialize pomodoro';
      }
    },

    async startTimer() {
      try {
        if (!this.isRunning) {
          this.isRunning = true;
          
          // Create new session
          const session: PomodoroSession = {
            startTime: Date.now(),
            endTime: 0,
            duration: 25 * 60,
            type: 'work',
            completed: false,
            syncStatus: 'pending',
            lastModified: Date.now(),
            timestamp: Date.now()
          };

          const id = await indexedDBService.addItem('pomodoro', session);
          session.id = id;
          this.currentSession = session;

          this.timer = setInterval(() => {
            if (this.timeLeft > 0) {
              this.timeLeft--;
            } else {
              this.completeSession();
            }
          }, 1000);
        }
        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to start timer';
        this.pauseTimer();
      }
    },

    pauseTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      this.isRunning = false;
    },

    resetTimer() {
      this.pauseTimer();
      this.timeLeft = 25 * 60;
      if (this.currentSession) {
        this.updateSession({
          ...this.currentSession,
          completed: false,
          endTime: Date.now()
        });
      }
    },

    async completeSession() {
      try {
        this.pauseTimer();
        
        if (this.currentSession) {
          await this.updateSession({
            ...this.currentSession,
            completed: true,
            endTime: Date.now()
          });
        }

        // Update stats
        const updatedStats = {
          ...this.stats,
          completedSessions: this.stats.completedSessions + 1,
          totalFocusTime: this.stats.totalFocusTime + 25 * 60,
          lastModified: Date.now()
        };

        await this.updateStats(updatedStats);
        this.validateStats();
        this.resetTimer();
        
        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to complete session';
        this.resetTimer();
      }
    },

    async updateSession(session: PomodoroSession) {
      try {
        if (!session.id) return;
        
        const updatedSession = {
          ...session,
          syncStatus: 'pending',
          lastModified: Date.now()
        };

        await indexedDBService.updateItem('pomodoro', session.id, updatedSession);
        this.currentSession = updatedSession;
        
        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update session';
      }
    },

    async updateStats(stats: PomodoroStats) {
      try {
        // Get the first stats record or create new one
        const existingStats = await indexedDBService.getAllItems('pomodoro');
        const id = existingStats.length > 0 ? existingStats[0].id : undefined;

        if (id) {
          await indexedDBService.updateItem('pomodoro', id, stats);
        } else {
          const newId = await indexedDBService.addItem('pomodoro', stats);
          stats.id = newId;
        }

        this.stats = stats;
        this.error = null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update stats';
      }
    },

    validateStats() {
      if (this.stats.completedSessions < 0) {
        throw new Error('Completed sessions cannot be negative');
      }
      if (this.stats.totalFocusTime < 0) {
        throw new Error('Total focus time cannot be negative');
      }
    },

    toggleTimer() {
      if (this.isRunning) {
        this.pauseTimer();
      } else {
        this.startTimer();
      }
    }
  }
});