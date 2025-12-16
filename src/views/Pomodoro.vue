<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import { useTimerStore } from "../stores/timerStore";
import { Target, Play, Pause, RotateCcw, ArrowLeftRight, Timer } from "lucide-vue-next";
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
    store.loadStats();
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
    <img class="peekingMelody" src="/assets/peekingmelody.webp" alt="YDIqCq.png" border="0" loading="lazy">
    <div v-if="error" class="error-message" role="alert">
      {{ error }}
    </div>

    <div v-if="isLoading" class="loading-spinner" role="status">
      <span class="sr-only">Loading...</span>
      Loading...
    </div>

    <div v-else class="timer-card" :class="{ dark: isDarkMode }">

      <div class="mode-indicator-wrapper">
        <div class="mode-indicator" :class="store.mode">
          {{
            store.mode === "work"
              ? "Work Time"
              : store.mode === "shortBreak"
              ? "Short Break Time"
              : "Long Break Time"
          }}
        </div>
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
        <div class="primary-controls">
           <button
            v-if="!isRunning"
            class="control-button primary icon-only-large"
            @click="startTimer"
            aria-label="Start timer"
          >
            <span class="button-icon" aria-hidden="true"><Play :size="32" /></span>
          </button>
          <button
            v-else
            class="control-button secondary icon-only-large"
            @click="pauseTimer"
            aria-label="Pause timer"
          >
            <span class="button-icon" aria-hidden="true"><Pause :size="32" /></span>
          </button>
        </div>

        <div class="secondary-controls">
           <button
            class="control-button secondary icon-only"
            @click="resetTimer"
            aria-label="Reset timer"
            title="Reset"
          >
            <span class="button-icon" aria-hidden="true"><RotateCcw :size="20" /></span>
          </button>
          <button
            class="control-button secondary icon-only"
            @click="toggleMode"
            :aria-label="
              store.mode === 'work'
                ? 'Switch to short break timer'
                : store.mode === 'shortBreak'
                ? 'Return to work timer'
                : 'Return to work timer'
            "
             :title="
              store.mode === 'work'
                ? 'Take Short Break'
                : 'Return to Work'
            "
          >
             <span class="button-icon" aria-hidden="true"><ArrowLeftRight :size="20" /></span>
          </button>
        </div>
      </div>

      <div
        v-if="store.stats"
        class="stats-container minimal"
        role="region"
        aria-label="Progress statistics"
      >
         <div class="stats-item">
            <span class="stats-icon" aria-hidden="true"><Target :size="18" /></span>
            <span>{{ store.stats.completedSessions }}</span>
         </div>
          <div class="stats-divider">|</div>
         <div class="stats-item">
            <span class="stats-icon" aria-hidden="true"><Timer :size="18" /></span>
            <span>{{ store.formattedTotalTime }}</span>
         </div>
      </div>

      <div
        v-if="isRunning"
        class="dancing-melody"
        role="status"
        aria-label="Timer is running"
      >
        <img src="/assets/melody3.gif" alt="YDIF7B.gif" border="0" loading="lazy">
        <h3 class="focus-time" :class="{ dark: isDarkMode }">
          {{ store.mode === "work" ? "Focus Time!" : "Take a Break!" }}
        </h3>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
.peekingMelody {
  position: absolute;
  top: -2.8rem;
  width: 12rem;
}
.mode-indicator-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
}
.mode-indicator {
  display: inline-block;
  text-align: center;
  font-size: 1rem;
  font-weight: bold;
  padding: 0.4rem 1.5rem;
  border-radius: 9999px; /* Pill shape */
  margin: 0 auto 0.5rem auto; /* Center horizontally */
}
.mode-indicator.work {
  background-color: #f472b6;
  color: white;
}
.mode-indicator.shortBreak {
  background-color: #60a5fa;
  color: white;
}
.mode-indicator.longBreak {
  background-color: #f9a8d4;
  color: white;
}
.mode-indicator.break {
  background-color: #60a5fa;
  color: white;
}
.timer-display {
  position: relative;
  font-size: 4rem; /* Slightly larger */
  font-weight: 800; /* Bolder */
  text-align: center;
  color: #db2777;
  background-color: #fdf2f8;
  border-radius: 1rem;
  padding: 2rem 1.5rem; /* More padding */
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin-bottom: 1rem;
}
.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 6px; /* Slightly thicker */
  background-color: #f472b6;
  transition: width 1s linear;
}
.progress-bar.break {
  background-color: #60a5fa;
}
.timer-card {
  background-color: white;
  border-radius: 1.5rem;
  padding: 2rem 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 24rem;
  margin: 4.5rem 0 0 0;
  border: 4px solid #fbcfe8;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.timer-card.dark {
  background-color: #2d2d2d;
  border-color: #4a4a4a;
}
.timer-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
}
.primary-controls {
    width: 100%;
    display: flex;
    justify-content: center;
}
.secondary-controls {
    display: flex;
    justify-content: center;
    gap: 1rem;
}

.control-button {
  border-radius: 9999px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.control-button.icon-only-large {
    padding: 1rem;
    border-radius: 50%; /* Circle button */
    width: 4.5rem;
    height: 4.5rem;
}

.control-button.icon-only {
    padding: 0.75rem;
    border-radius: 50%; /* Circle buttons */
    width: 3rem;
    height: 3rem;
}

.control-button.primary {
  background-color: #da5add; /* More vibrant purple/pink match */
  color: white;
}
.control-button.primary:hover {
  background-color: #c026d3;
  transform: translateY(-2px);
}
.control-button.secondary {
  background-color: #fbcfe8;
  color: #db2777;
}
.control-button.secondary:hover {
  background-color: #f9a8d4;
  transform: scale(1.05);
}
.button-icon {
  display: flex;
  align-items: center;
}

.stats-container.minimal {
  background-color: transparent; /* Remove container bg */
  border: none;
  padding: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  color: #db2777;
  font-weight: 500;
  margin-top: 0.5rem;
}

.stats-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.stats-divider {
    opacity: 0.5;
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
  background: white; /* readability */
}

/* Dark mode overrides */
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
.dark .stats-container.minimal {
  color: #f9a8d4;
}
.dark .control-button.primary {
  background-color: #d946ef;
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
  background: #2d2d2d;
  border-color: #f472b6;
}
</style>
