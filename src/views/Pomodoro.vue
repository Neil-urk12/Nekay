<script setup lang="ts">
import { usePomodoro } from '../stores/pomodoro'
import { storeToRefs } from 'pinia'

const store = usePomodoro()
const { timeLeft, isRunning, stats } = storeToRefs(store)
</script>

<template>
  <div class="pomodoro-container">
    <div class="timer-card">
      <h1 class="timer-title">
        <img src="/public/assets/melodykiss.png" alt="My Melody" loading="lazy" />
        Pomodoro Timer
      </h1>
      
      <div class="timer-display-container">
        <div class="timer-display">
          {{ Math.floor(timeLeft / 60) }}:{{ (timeLeft % 60).toString().padStart(2, '0') }}
        </div>
      </div>

      <div class="timer-controls">
        <button 
          @click="store.toggleTimer"
          :class="['control-button', 'primary', { running: isRunning }]"
        >
          <span class="button-icon">{{ isRunning ? '⏸️' : '▶️' }}</span>
          {{ isRunning ? 'Pause' : 'Start' }}
        </button>
        <button 
          @click="store.resetTimer"
          class="control-button secondary"
        >
          <span class="button-icon">🔄</span>
          Reset
        </button>
      </div>

      <div class="stats-container">
        <div class="stats-header">
          <img src="/public/assets/sleepingmelody.png" alt="My Melody and Friend" loading="lazy" />
          <h2>Your Progress</h2>
        </div>
        <div class="stats-content">
          <p>
            <span class="stats-icon"><svg width="20px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64L0 400c0 44.2 35.8 80 80 80l400 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L80 416c-8.8 0-16-7.2-16-16L64 64zm406.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L320 210.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L240 221.3l57.4 57.4c12.5 12.5 32.8 12.5 45.3 0l128-128z"/></svg></span>
            Completed Sessions: {{ stats.completedSessions }}
          </p>
          <p>
            <span class="stats-icon">⏱️</span>
            Total Focus Time: {{ Math.floor(stats.totalFocusTime / 60) }} minutes
          </p>
        </div>
      </div>
      <div v-if="isRunning" class="dancing-melody">
        <p>Go! Go! Go! Goo Babieee!</p>
        <img src="/public/assets/melody3.gif" alt="My Melody Dancing" loading="lazy" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.pomodoro-container {
  min-height: 100vh;
  background-color: #fce7f3;
  padding: 1rem;
}
.timer-card {
  background-color: white;
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 24rem;
  margin: 0 auto;
  border: 4px solid #fbcfe8;
}
.timer-title {
  font-size: 1.875rem;
  font-weight: bold;
  color: #db2777;
  text-align: center;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
svg{
fill: #db2777;
}
.timer-title img {
  width: 2rem;
  height: 2rem;
}
.timer-display-container {
  position: relative;
  margin-bottom: 2rem;
}
.dancing-melody {
  position: absolute;
  color: black;
  font-size: 1.15rem;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
}
.dancing-melody img {
  width: 10rem;
}
.timer-display {
  font-size: 3.75rem;
  font-weight: bold;
  text-align: center;
  color: #db2777;
  background-color: #fdf2f8;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}
.timer-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
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
.stats-header img {
  width: 2rem;
  height: 2rem;
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
</style>