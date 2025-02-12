<script setup>
import { ref, computed, onMounted } from "vue";

// Constants
const minGoal = 1500;
const maxGoal = 2000;
const quickAddAmounts = [100, 300, 500];

// Reactive state
const showModal = ref(false);
const currentWater = ref(0);
const waterHistory = ref([]);
const waterInput = ref("");
const errorMessage = ref("");
const seaweeds = ref([
  { style: { left: "10%", height: "60px" } },
  { style: { left: "30%", height: "80px" } },
  { style: { left: "60%", height: "70px" } },
  { style: { left: "80%", height: "65px" } },
]);

// Computed properties
const waterHeight = computed(() =>
  Math.min((currentWater.value / maxGoal) * 100, 100)
);

const sharkDisplay = computed(() =>
  waterHeight.value > 25 ? "block" : "none"
);

const sharkPosition = computed(() => waterHeight.value / 2);

const goalStatus = computed(() => {
  if (currentWater.value < minGoal) {
    return `${minGoal - currentWater.value}ml below minimum goal`;
  } else if (currentWater.value <= maxGoal) {
    return "Within recommended range! 👍";
  } else {
    return `${currentWater.value - maxGoal}ml above maximum goal`;
  }
});

const goalStatusClass = computed(() => {
  if (currentWater.value < minGoal) return "under";
  if (currentWater.value <= maxGoal) return "good";
  return "over";
});

// Methods
const addCustomWater = () => {
  const amount = parseInt(waterInput.value);
  if (isNaN(amount) || amount <= 0) {
    errorMessage.value = "Please enter a valid amount";
    return;
  }
  if (amount > 1000) {
    errorMessage.value = "Amount seems too high. Maximum is 1000ml at once.";
    return;
  }
  addWater(amount);
  waterInput.value = "";
  errorMessage.value = "";
  showModal.value = false;
};

const addWater = (amount) => {
  waterHistory.value.push(amount);
  currentWater.value += amount;
  saveToLocalStorage();
  if (currentWater.value >= minGoal && currentWater.value <= maxGoal) {
    celebrate();
  }
};

const removeLastEntry = () => {
  if (waterHistory.value.length > 0) {
    const lastAmount = waterHistory.value.pop();
    currentWater.value -= lastAmount;
    saveToLocalStorage();
  }
};

const resetWater = () => {
  currentWater.value = 0;
  waterHistory.value = [];
  errorMessage.value = "";
  saveToLocalStorage();
};

const celebrate = () => {
  // Add celebration animation logic here
};

const saveToLocalStorage = () => {
  localStorage.setItem("waterAmount", currentWater.value.toString());
  localStorage.setItem("waterHistory", JSON.stringify(waterHistory.value));
};

const loadFromLocalStorage = () => {
  const savedAmount = localStorage.getItem("waterAmount");
  const savedHistory = localStorage.getItem("waterHistory");
  if (savedAmount) {
    currentWater.value = parseInt(savedAmount);
    waterHistory.value = savedHistory ? JSON.parse(savedHistory) : [];
  }
};

// Create bubbles
const createBubble = () => {
  if (currentWater.value <= 0) return;

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const waterElement = document.querySelector(".water");

  const existingBubbles =
    waterElement?.querySelectorAll(".bubble")?.length || 0;

  if (existingBubbles >= 6) return;

  const size = Math.random() * 15 + 5;
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;
  bubble.style.left = `${Math.random() * 80 + 10}%`;
  bubble.style.bottom = "0";

  // const duration = ((waterElement?.offsetHeight || 0) / 50) * 2;
  const duration = 3 + (15 - size) / 10;
  bubble.style.animationDuration = `${duration}s`;

  waterElement?.appendChild(bubble);

  setTimeout(() => {
    if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
  }, duration * 1000);
};

onMounted(() => {
  loadFromLocalStorage();

  setInterval(() => {
    if (currentWater.value > 10 && Math.random() > 0.5) createBubble();
  }, 1000);

  // Set up daily reset check
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      resetWater();
    }
  }, 60000);
});
</script>

<template>
  <div class="water-tracker-container">
    <div class="header-controls">
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

      <div class="modal" v-if="showModal">
        <div class="modal-content">
          <h2>Add Water</h2>
          <div class="input-group">
            <input
              type="number"
              v-model="waterInput"
              placeholder="Enter ml"
              min="0"
              @keypress.enter="addCustomWater"
            />
            <div class="error-message" v-if="errorMessage">
              {{ errorMessage }}
            </div>
          </div>
          <div class="modal-buttons">
            <button @click="addCustomWater">Add</button>
            <button @click="showModal = false" class="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="showModal = true" class="add-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 5v14M5 12h14"
            />
          </svg>
          Add Water
        </button>
        <button @click="resetWater" class="reset-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="modal" v-if="showModal">
      <div class="modal-content">
        <h2>Add Water</h2>
        <div class="quick-amounts">
          <button
            v-for="amount in quickAddAmounts"
            :key="amount"
            @click="
              addWater(amount);
              showModal = false;
            "
            class="quick-amount-btn"
          >
            {{ amount }}ml
          </button>
        </div>
        <div class="input-divider">or</div>
        <div class="input-group">
          <input
            type="number"
            v-model="waterInput"
            placeholder="Enter ml"
            min="0"
            @keypress.enter="addCustomWater"
          />
          <div class="error-message" v-if="errorMessage">
            {{ errorMessage }}
          </div>
        </div>
        <div class="modal-buttons">
          <button @click="addCustomWater">Add</button>
          <button @click="showModal = false" class="cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <h1>Sharky Water Tracker</h1>

    <div class="fish-tank">
      <div class="empty-state" v-if="currentWater < 500">
        <img src="/assets/sadShark.svg" alt="Sad shark" loading="lazy" />
      </div>
      <div class="water" :style="{ height: waterHeight + '%' }">
        <div
          class="shark"
          :style="{ display: sharkDisplay, bottom: sharkPosition + '%' }"
        >
          <img src="/assets/shark.svg" alt="Shark" loading="lazy" />
        </div>
      </div>
      <div
        v-for="(seaweed, index) in seaweeds"
        :key="index"
        class="seaweed"
        :style="seaweed.style"
      ></div>
      <div class="rocks"></div>
    </div>

    <div class="stats">
      <h2>{{ currentWater }} ml</h2>
      <div class="progress-info">
        Recommended: {{ minGoal }}ml - {{ maxGoal }}ml daily
        <div :class="['goal-status', goalStatusClass]">{{ goalStatus }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.water-tracker-container {
  background: linear-gradient(45deg, #83a4d4, #b6fbff);
  margin: 0;
  box-sizing: border-box;
  padding: 1rem;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 350px;
  height: 95vh;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: rgb(37, 99, 235);
  font-weight: 500;
  margin-bottom: 1rem;
  width: fit-content;
}

.back-button:hover {
  opacity: 0.8;
}
.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 2;
}
.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 1rem 0;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.add-button,
.reset-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
}

.reset-button {
  padding: 0.5rem;
  background: #95a5a6;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-button {
  background: #95a5a6;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.fish-tank {
  width: 300px;
  height: 400px;
  background: rgba(255, 255, 255, 0.1);
  border: 8px solid #34495e;
  border-radius: 15px;
  position: relative;
  margin: 0 auto;
  overflow: visible;
  background: linear-gradient(180deg, #c2e9fb, #a1c4fd);
}

.water {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 0%;
  background: linear-gradient(
    180deg,
    rgba(33, 147, 176, 0.8),
    rgba(109, 213, 237, 0.575)
  );
  transition: height 0.3s ease;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
  z-index: 1;
}

.bubble {
  position: absolute;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: floatInWater linear forwards;
  pointer-events: none;
  box-shadow: 0 0 2px rgba(255, 255, 255, 0.5);
  bottom: 0;
  z-index: 2;
}

.quick-amounts {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.quick-amount-btn {
  padding: 0.5rem 1rem;
}

.input-divider {
  text-align: center;
  margin: 1rem 0;
  color: #95a5a6;
  position: relative;
}

.input-divider::before,
.input-divider::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background: #ddd;
}
.input-divider::before {
  left: 0;
}
.input-divider::after {
  right: 0;
}
.shark {
  position: absolute;
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 0;
  animation: swim 8s linear infinite;
  transform-origin: center;
  display: none;
  z-index: 2;
}
.shark img {
  width: 100%;
  height: 100%;
  transform: scaleX(1);
}
.seaweed {
  position: absolute;
  bottom: 0;
  width: 20px;
  background: #27ae60;
  border-radius: 20px 20px 0 0;
  animation: sway 3s ease-in-out infinite;
}
.rocks {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 30px;
  background: linear-gradient(to right, #95a5a6 0%, #7f8c8d 50%, #95a5a6 100%);
  border-radius: 5px;
}
.input-group {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}
input[type="number"] {
  padding: 8px;
  border: 2px solid #3498db;
  border-radius: 5px;
  width: 100px;
  text-align: center;
}
button {
  padding: 10px 20px;
  margin: 5px;
  border: none;
  border-radius: 5px;
  background: #3498db;
  color: white;
  cursor: pointer;
  transition: transform 0.2s;
}
button:hover {
  transform: scale(1.05);
}
.quick-add {
  margin: 1rem 0;
}
.quick-add button {
  background: #2ecc71;
}
.error-message {
  color: #e74c3c;
  font-size: 0.9em;
  margin-top: 5px;
  min-height: 20px;
}
.stats {
  margin-top: 1rem;
  color: #2c3e50;
}
.progress-info {
  font-size: 0.9em;
  color: #7f8c8d;
}

.goal-status {
  margin-top: 5px;
  font-weight: bold;
}

.goal-status.under {
  color: #e67e22;
}
.goal-status.good {
  color: #27ae60;
}
.goal-status.over {
  color: #e74c3c;
}

.dropdown {
  position: relative;
  display: inline-block;
}

.dropbtn {
  background-color: #2ecc71;
  color: white;
  padding: 10px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
}

.dropdown-content {
  display: none;
  position: absolute;
  background-color: #f9f9f9;
  min-width: 100px;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.dropdown-content button {
  display: block;
  padding: 10px;
  text-align: left;
  background: #2ecc71;
  color: white;
  border: none;
  cursor: pointer;
}

.dropdown:hover .dropdown-content {
  display: block;
}

.dropdown-content button:hover {
  background: #239654;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
  margin-bottom: 4rem;
}

.undo-button {
  background: #e74c3c;
}

@keyframes swim {
  0% {
    left: -60px;
    transform: scaleX(1);
  }
  49% {
    transform: scaleX(1);
  }
  50% {
    left: 100%;
    transform: scaleX(-1);
  }
  99% {
    transform: scaleX(-1);
  }
  100% {
    left: -60px;
    transform: scaleX(1);
  }
}

@keyframes floatInWater {
  0% {
    transform: translateY(0) translateX(10px);
    opacity: 0.3;
  }
  20% {
    opacity: 1;
  }
  90% {
    opacity: 1;
    transform: translateY(-98vh);
  }
  100% {
    transform: translateY(-100%) translateX(10px);
    opacity: 0;
  }
}

@keyframes sway {
  0%,
  100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}
</style>
