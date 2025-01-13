<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import { useTimerStore } from "../stores/timerStore";
const DarkModeToggle = defineAsyncComponent(
  () => import("../components/DarkModeToggle.vue")
);

const store = useTimerStore();

const startTimer = () => store.startTimer();
const pauseTimer = () => store.pauseTimer();
const resetTimer = () => store.resetTimer();
const toggleMode = () => store.toggleMode();
const error = ref<string | null>(null);
const isLoading = ref(true);
const isDarkMode = ref(false);
const isRunning = computed(() => store.isRunning);

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem("nekayDarkMode", isDarkMode.value.toString());
};

onMounted(async () => {
  try {
    const savedDarkMode = localStorage.getItem("nekayDarkMode");
    if (savedDarkMode) isDarkMode.value = savedDarkMode === "true";
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (store.intervalId !== null) {
    clearInterval(store.intervalId);
  }
});
</script>

<template>
  <div class="pomodoro-container" :class="{ dark: isDarkMode }">
    <DarkModeToggle :isDarkMode="isDarkMode" @toggle="toggleDarkMode" />
    <div v-if="error" class="error-message" role="alert">
      {{ error }}
    </div>

    <div v-if="isLoading" class="loading-spinner" role="status">
      <span class="sr-only">Loading...</span>
      Loading...
    </div>

    <div v-else class="timer-card" :class="{ dark: isDarkMode }">
      <div class="mode-indicator" :class="store.mode">
        {{
          store.mode === "work"
            ? "Work Time"
            : store.mode === "shortBreak"
            ? "Short Break Time"
            : "Long Break Time"
        }}
      </div>

      <div
        class="timer-display"
        role="timer"
        :aria-label="`${store.mode === 'work' ? 'Work' : 'Break'} timer: ${
          store.formattedTime
        } remaining`"
      >
        {{ store.formattedTime }}
        <div
          class="progress-bar"
          :style="{ width: `${store.progress}%` }"
          :class="store.mode"
        ></div>
      </div>

      <div class="timer-controls" role="group" aria-label="Timer controls">
        <button
          v-if="!isRunning"
          class="control-button primary"
          @click="startTimer"
          aria-label="Start timer"
        >
          <span class="button-icon" aria-hidden="true">▶</span>
          Start
        </button>
        <button
          v-else
          class="control-button secondary"
          @click="pauseTimer"
          aria-label="Pause timer"
        >
          <span class="button-icon" aria-hidden="true">⏸</span>
          Pause
        </button>
        <button
          class="control-button secondary"
          @click="resetTimer"
          aria-label="Reset timer"
        >
          <span class="button-icon" aria-hidden="true">↺</span>
          Reset
        </button>
        <button
          class="control-button secondary"
          @click="toggleMode"
          :aria-label="
            store.mode === 'work'
              ? 'Switch to short break timer'
              : store.mode === 'shortBreak'
              ? 'Return to work timer'
              : 'Return to work timer'
          "
        >
          <span class="button-icon" aria-hidden="true">⇄</span>
          {{
            store.mode === "work"
              ? "Take Short Break"
              : store.mode === "shortBreak"
              ? "Return to Work"
              : "Return to Work"
          }}
        </button>
      </div>

      <div
        v-if="store.stats"
        class="stats-container"
        role="region"
        aria-label="Progress statistics"
      >
        <div class="stats-header">
          <span class="stats-icon" aria-hidden="true">📊</span>
          <h2>Your Progress</h2>
        </div>
        <div class="stats-content">
          <p>
            <span class="stats-icon" aria-hidden="true">🎯</span>
            Completed Sessions: {{ store.stats.completedSessions }}
          </p>
          <p>
            <span class="stats-icon" aria-hidden="true">⏱</span>
            Total Focus Time: {{ store.formattedTotalTime }}
          </p>
        </div>
      </div>
      <div
        v-if="isRunning"
        class="dancing-melody"
        role="status"
        aria-label="Timer is running"
      >
        <img src="/assets/melody3.gif" alt="My Melody Dancing" loading="lazy" />
        <h3 class="focus-time" :class="{ dark: isDarkMode }">
          {{ store.mode === "work" ? "Focus Time!" : "Take a Break!" }}
        </h3>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  font-family: "Concert One", "Montserrat", sans-serif;
}
.pomodoro-container {
  min-height: 100vh;
  background-color: #fce7f3;
  padding: 1rem 1rem 0rem 1rem;
  max-width: 600px;
}
.pomodoro-container.dark {
  background-color: #1a1a1a;
  color: #ffffff;
}
.mode-indicator {
  text-align: center;
  font-size: 1.25rem;
  font-weight: bold;
  padding: 0.5rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}
.mode-indicator.work {
  background-color: #f472b6;
  color: white;
}
.mode-indicator.break {
  background-color: #60a5fa;
  color: white;
}
.timer-display {
  position: relative;
  font-size: 3.75rem;
  font-weight: bold;
  text-align: center;
  color: #db2777;
  background-color: #fdf2f8;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}
.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  background-color: #f472b6;
  transition: width 1s linear;
}
.progress-bar.break {
  background-color: #60a5fa;
}
.keyboard-shortcuts {
  background-color: #fdf2f8;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
  font-size: 0.875rem;
}
.keyboard-shortcuts p {
  font-weight: bold;
  margin-bottom: 0.5rem;
}
.keyboard-shortcuts ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}
.keyboard-shortcuts li {
  margin: 0.25rem 0;
}
.timer-card {
  background-color: white;
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 24rem;
  margin: 0 auto;
  border: 4px solid #fbcfe8;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.timer-card.dark {
  background-color: #2d2d2d;
  border-color: #4a4a4a;
}
.timer-controls {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.control-button {
  padding: 0.75rem 2rem;
  border-radius: 9999px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s;
}
.control-button.primary {
  background-color: #f472b6;
  color: white;
}
.control-button.primary:hover {
  background-color: #db2777;
}
.control-button.secondary {
  background-color: #fbcfe8;
  color: #db2777;
}
.control-button.secondary:hover {
  background-color: #f9a8d4;
}
.button-icon {
  font-size: 1.25rem;
}
.stats-container {
  background-color: #fdf2f8;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 2px solid #fbcfe8;
}
.stats-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.stats-header h2 {
  font-size: 1.25rem;
  font-weight: bold;
  color: #db2777;
  margin: 0;
}
.stats-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: #be185d;
}
.stats-content p {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}
.stats-icon {
  font-size: 1.25rem;
}
.dancing-melody {
  position: absolute;
  color: black;
  font-size: 1.15rem;
  text-align: center;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
}
.dancing-melody img {
  width: 10rem;
}
.dancing-melody h3 {
  border: #d46e98 1px dashed;
  padding: 0.5rem;
  border-radius: 0.5rem;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.dark .mode-indicator.work {
  background-color: #d946ef;
}
.dark .mode-indicator.break {
  background-color: #3b82f6;
}
.dark .timer-display {
  background-color: #3d3d3d;
  color: #f472b6;
}
.dark .stats-container {
  background-color: #3d3d3d;
  border-color: #4a4a4a;
}
.dark .stats-header h2 {
  color: #f472b6;
}
.dark .stats-content {
  color: #f9a8d4;
}
.dark .control-button.primary {
  background-color: #d946ef;
}
.dark .control-button.primary:hover {
  background-color: #c026d3;
}
.dark .control-button.secondary {
  background-color: #4a4a4a;
  color: #f472b6;
}
.dark .control-button.secondary:hover {
  background-color: #606060;
}
.focus-time.dark {
  color: #f472b6;
}
</style>
