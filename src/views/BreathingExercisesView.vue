<script setup>
import { ref, onUnmounted } from "vue";
import DarkModeToggle from '../components/DarkModeToggle.vue';

const inhaleInput = ref(4);
const holdInput = ref(4);
const exhaleInput = ref(6);
const isRunning = ref(false);
const circleText = ref("Ready");
const message = ref("");
const circleClass = ref("circle");
const isDarkMode = ref(false);
let intervalId;

function startBreathing() {
  if (isRunning.value) return;
  isRunning.value = true;
  breatheCycle();
}

function stopBreathing() {
  isRunning.value = false;
  clearTimeout(intervalId);
  circleText.value = "Ready";
  circleClass.value = "circle";
  message.value = "";
}

function breatheCycle() {
  const inhaleTime = inhaleInput.value * 1000;
  const holdTime = holdInput.value * 1000;
  const exhaleTime = exhaleInput.value * 1000;

  circleText.value = "Inhale";
  circleClass.value = "circle inhale";
  message.value = "Inhale slowly...";

  intervalId = setTimeout(() => {
    circleText.value = "Hold";
    circleClass.value = "circle hold";
    message.value = "Hold your breath...";

    intervalId = setTimeout(() => {
      circleText.value = "Exhale";
      circleClass.value = "circle exhale";
      message.value = "Exhale slowly...";

      intervalId = setTimeout(() => {
        if (isRunning.value) {
          breatheCycle();
        } else {
          stopBreathing();
        }
      }, exhaleTime);
    }, holdTime);
  }, inhaleTime);
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
}

onUnmounted(() => {
  clearTimeout(intervalId);
});
</script>

<template>
  <div class="exercise-container" :class="{ dark: isDarkMode }">
    <DarkModeToggle :isDarkMode="isDarkMode" @toggle="toggleDarkMode" />
    <router-link to="/home" class="back-button">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 448 512"
        width="1rem"
      >
        <path
          fill="currentColor"
          d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"
        />
      </svg>
      Back
    </router-link>
    <h1>Breathing Exercise</h1>
    <div class="controls">
      <div class="control-group">
        <label for="inhale">Inhale (s)</label>
        <input
          type="number"
          id="inhale"
          v-model="inhaleInput"
          min="1"
          :disabled="isRunning"
          inputmode="numeric"
          pattern="[0-9]*"
        />
      </div>
      <div class="control-group">
        <label for="hold">Hold (s)</label>
        <input
          type="number"
          id="hold"
          v-model="holdInput"
          min="0"
          :disabled="isRunning"
        />
      </div>
      <div class="control-group">
        <label for="exhale">Exhale (s)</label>
        <input
          type="number"
          id="exhale"
          v-model="exhaleInput"
          min="1"
          :disabled="isRunning"
        />
      </div>
    </div>
    <button @click="isRunning ? stopBreathing() : startBreathing()">
      {{ isRunning ? "Stop" : "Start" }}
    </button>
    <div class="circle-container">
      <div :class="circleClass">{{ circleText }}</div>
    </div>
    <div id="message">{{ message }}</div>
  </div>
</template>

<style scoped>
* {
  font-family: "Concert One", "Montserrat", sans-serif;
}
.exercise-container {
  background-color: #ffe0e6;
  padding: 1rem;
  border-radius: 12px;
  height: 90vh;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
  position: relative;
}

.exercise-container.dark {
  background-color: #2d1f2f;
}

.back-button {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #ff69b4;
  font-weight: 500;
}

.dark .back-button {
  color: #69b3ff;
}

.back-button:hover {
  opacity: 0.8;
}

h1 {
  color: #ff69b4;
  margin: 0.5rem 0;
  font-size: clamp(1.5rem, 4vw, 2.5rem);
}

.dark h1 {
  color: #ff99cc;
}

.controls {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 0.5rem auto;
  max-width: 100%;
  padding: 0 1rem;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

label {
  color: #ff69b4;
  font-size: clamp(0.875rem, 2vw, 1rem);
  white-space: nowrap;
}

.dark label {
  color: #ff99cc;
}

input[type="number"] {
  padding: 0.5rem 0.75rem;
  border: 2px solid #ffb6c1;
  border-radius: 8px;
  width: clamp(60px, 15vw, 80px);
  text-align: center;
  font-size: 1rem;
  -moz-appearance: textfield;
}

.dark input[type="number"] {
  background-color: #1f1f1f;
  border-color: #ff99cc;
  color: #ffffff;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

button {
  padding: 0.75rem 1.5rem;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  transition: background-color 0.3s ease;
  width: clamp(120px, 50%, 200px);
  margin: 0 auto;
}

.dark button {
  background-color: #ff99cc;
}

button:hover {
  background-color: #f0499a;
}

.dark button:hover {
  background-color: #ff80bf;
}

button:active {
  transform: scale(0.98);
}

.circle-container {
  position: relative;
  width: clamp(200px, 50vw, 300px);
  height: clamp(200px, 50vw, 300px);
  margin: 1rem auto;
}

.circle {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: clamp(3px, 1vw, 5px) solid #ffb6c1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: clamp(1.25rem, 4vw, 2rem);
  color: #ff69b4;
  font-weight: bold;
  transition: all 0.5s ease;
}

.dark .circle {
  border-color: #ff99cc;
  color: #ff99cc;
}

.inhale {
  transform: scale(1.2);
  border-color: #ff69b4;
}

.dark .inhale {
  border-color: #ff99cc;
}

.exhale {
  transform: scale(0.8);
  border-color: #ffe0e6;
  color: #fff;
  background-color: #ff69b4;
}

.dark .exhale {
  border-color: #2d1f2f;
  background-color: #ff99cc;
}

.hold {
  border-color: #ffb6c1;
}

.dark .hold {
  border-color: #ff99cc;
}

#message {
  margin-top: 1rem;
  font-size: clamp(1rem, 3vw, 1.5rem);
  color: #ff69b4;
  font-weight: bold;
  padding: 0 1rem;
}

.dark #message {
  color: #ff99cc;
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;
    gap: 2rem;
  }

  .back-button {
    top: 2rem;
    left: 2rem;
  }

  .controls {
    gap: 2rem;
    padding: 0 2rem;
  }

  .circle-container {
    margin: 2rem auto;
  }
}

@media (max-width: 480px) {
  .controls {
    gap: 0.5rem;
  }
  
  .control-group {
    flex-direction: column;
  }
}

@media (max-height: 600px) {
  .container {
    padding: 1rem;
    gap: 0.5rem;
  }

  .circle-container {
    width: clamp(150px, 30vw, 200px);
    height: clamp(150px, 30vw, 200px);
    margin: 0.5rem auto;
  }
}
</style>
