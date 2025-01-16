<script setup>
import { ref, onUnmounted } from "vue";

const inhaleInput = ref(4);
const holdInput = ref(4);
const exhaleInput = ref(6);
const isRunning = ref(false);
const circleText = ref("Ready");
const message = ref("");
const circleClass = ref("circle");
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

onUnmounted(() => {
  clearTimeout(intervalId);
});
</script>

<template>
  <div class="container">
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
.container {
  background-color: #ffe0e6;
  padding: 30px;
  border-radius: 15px;
  height: 90vh;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

h1 {
  color: #ff69b4;
  margin-bottom: 20px;
}

.controls {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  justify-content: center;
}

.control-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

label {
  margin-bottom: 5px;
  color: #ff69b4;
}

input[type="number"] {
  padding: 10px;
  border: 1px solid #ffb6c1;
  border-radius: 5px;
  width: 60px;
  text-align: center;
}

button {
  padding: 12px 25px;
  background-color: #ff69b4;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #f0499a;
}

.circle-container {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 30px auto 0;
}

.circle {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 5px solid #ffb6c1;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  color: #ff69b4;
  font-weight: bold;
  transition: transform 0.5s ease;
}

.inhale {
  transform: scale(1.2);
  border-color: #ff69b4;
}

.exhale {
  transform: scale(0.8);
  border-color: #ffe0e6;
  color: #fff;
  background-color: #ff69b4;
}

.hold {
  border-color: #ffb6c1;
}

#message {
  margin-top: 20px;
  font-size: 18px;
  color: #ff69b4;
  font-weight: bold;
}
</style>
