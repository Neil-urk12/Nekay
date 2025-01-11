<script lang="ts" setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
// const hasError = ref(false)
// const errorMessage = ref('')

const currentTime = ref("");
const currentDate = ref("");
// const interval = ref(null)
let timer: NodeJS.Timeout;

interface Button {
  number: string;
  label: string;
  action?: string;
}

const updateTime = () => {
  const date = new Date();
  currentTime.value = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

onMounted(() => {
  const date = new Date();
  currentDate.value = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  // updateTime()
  timer = setInterval(updateTime, 1000);
});

onBeforeUnmount(() => {
  clearInterval(timer);
});

const inputValue = ref("");
const buttons = ref([
  { number: "1", label: "" },
  { number: "2", label: "ABC" },
  { number: "3", label: "DEF" },
  { number: "4", label: "GHI" },
  { number: "5", label: "JKL" },
  { number: "6", label: "MNO" },
  { number: "7", label: "PQRS" },
  { number: "8", label: "TUV" },
  { number: "9", label: "WXYZ" },
  { number: "", label: "" },
  { number: "0", label: "" },
  { number: "", label: "" },
]);

watch(inputValue, (inputValue) => {
  if (inputValue === import.meta.env.VITE_MOTMOT_KEY) router.push("/home");
});

const handleButtonClick = (button: Button) => {
  if (button.action === "delete")
    inputValue.value = inputValue.value.slice(0, -1);
  else if (button.action === "emergency") alert("Emergency clicked");
  else if (button.action === "cancel") alert("Cancel clicked");
  else inputValue.value += button.number;
};
</script>

<template>
  <div class="login-container">
    <!-- Status Bar -->
    <div class="status-bar">
      <div class="status-bar-left">{{ currentTime }}</div>
      <div class="status-bar-center"></div>
      <div class="status-bar-right">
        <span class="battery">🔋</span>
      </div>
    </div>

    <!-- Header -->
    <div class="header">
      <div class="datetime">{{ currentDate }}</div>
      <div class="title">Touch ID or Enter Passcode</div>
    </div>

    <!-- Display for pressed numbers -->
    <div class="input-display">
      <span v-for="n in inputValue.length" :key="n" class="dot"></span>
    </div>

    <!-- Number Buttons -->
    <div class="button-container">
      <div class="button-box" v-for="(button, index) in buttons" :key="index">
        <button
          v-if="button.number"
          class="number-button"
          @click="handleButtonClick(button)"
        >
          <div class="number">{{ button.number }}</div>
          <div class="label">{{ button.label }}</div>
        </button>
      </div>
    </div>

    <!-- Bottom Buttons -->
    <div class="bottom-buttons">
      <button
        class="text-button emergency"
        @click="
          handleButtonClick({ number: '', label: '', action: 'emergency' })
        "
      >
        Emergency
      </button>
      <button
        class="text-button cancel"
        @click="handleButtonClick({ number: '', label: '', action: 'delete' })"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  background: linear-gradient(
    0deg,
    #ffe6eb 0%,
    #ffd1dc 25%,
    #f8bbd0 50%,
    #e6c3df 75%,
    #e0b0ff 100%
  );
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow-x: hidden;
  padding-top: 44px; /* Increased padding for status bar */
}

.status-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background-color: transparent;
  font-size: 14px;
  color: #333;
}

.status-bar-left {
  font-weight: bold;
}

.status-bar-right {
  display: flex;
  gap: 5px;
}

.header {
  margin-top: 60px; /* Add space after status bar */
  margin-bottom: 40px; /* Increased space before input display */
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.input-display {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px; /* Increased space before buttons */
  padding: 10px;
  width: 80%;
  max-width: 300px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #333;
  margin: 0 5px;
  opacity: 0;
  transform: scale(0.5);
  animation: dotAppear 0.3s ease forwards;
}

@keyframes dotAppear {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.button-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px; /* Reduced gap between buttons */
  justify-content: center;
  max-width: 300px;
  margin: 20px auto; /* Added vertical margin */
}

.button-box {
  display: flex;
  justify-content: center;
  align-items: center;
}

.number-button {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: none;
  background-color: #ffd6e0;
  color: #333;
  font-size: 2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.number-button::after {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: scale(0);
  transition: transform 0.3s ease-out;
}

.number-button:active::after {
  transform: scale(1);
  transition: 0s;
}

.number-button:active {
  transform: scale(0.95);
  background-color: #ffb3c1;
}

.number-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Update emergency and delete buttons */
.number-button.emergency:active,
.number-button.delete:active {
  transform: scale(0.95);
  background-color: rgba(0, 0, 0, 0.05);
}

.number-button.delete {
  background-color: transparent;
  color: #333;
  font-size: 1rem;
}

.number-button.delete::before {
  content: none;
}

.number-button.emergency {
  background-color: transparent;
  font-weight: normal;
}

.number-button.emergency:hover {
  background-color: rgba(255, 59, 48, 0.1);
  transform: translateY(-2px);
}

.number-button.cancel {
  background-color: transparent; /* Transparent for cancel button */
  color: #333;
  font-size: 1rem;
}

.label {
  font-size: 0.8rem;
  margin-top: 5px;
  color: #666;
}

.datetime {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 15px; /* Increased space between date and title */
}

.emergency-text {
  display: none;
}

.emergency-icon {
  display: none;
}

.text-button {
  background-color: transparent !important;
  font-size: 1rem !important;
  font-weight: bolder !important;
  color: black !important;
}

.text-button:hover {
  background-color: rgba(255, 59, 48, 0.1) !important;
}

.bottom-buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 300px;
  margin-top: 20px;
  padding: 0 20px;
}

.text-button {
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: normal;
  cursor: pointer;
  padding: 10px;
  transition: all 0.2s ease;
}

.text-button.emergency {
  color: #ff3b30;
}

.text-button.cancel {
  color: #007aff;
}

.text-button:hover {
  opacity: 0.7;
}

.text-button:active {
  transform: scale(0.95);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .number-button {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }

  .title {
    font-size: 1.2rem;
  }

  .input-display {
    font-size: 1.5rem;
  }

  .label {
    font-size: 0.7rem;
  }

  .header {
    margin-top: 40px;
    margin-bottom: 30px;
  }

  .button-container {
    gap: 40px;
  }
}
</style>
