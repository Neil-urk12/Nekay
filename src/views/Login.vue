<script lang="ts" setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const currentTime = ref("");
const currentDate = ref("");
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
  else if (button.action === "emergency") {
  } else inputValue.value += button.number;
};
</script>

<template>
  <div class="login-container">
    <!-- Status Bar -->
    <div class="status-bar">
      <div class="status-bar-left">{{ currentTime }}</div>
      <div class="status-bar-center"></div>
      <div class="status-bar-right">
        <span class="wifi">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="1.2rem"
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M11.7 13.9998C12.777 13.9998 13.65 14.8952 13.65 15.9998C13.65 17.1043 12.777 17.9998 11.7 17.9998C10.623 17.9998 9.75 17.1043 9.75 15.9998C9.75 14.8952 10.623 13.9998 11.7 13.9998Z"
                stroke="#000000"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="M6.53734 11.4153C6.21454 11.6749 6.16328 12.147 6.42284 12.4698C6.68241 12.7926 7.15451 12.8438 7.47731 12.5843L6.53734 11.4153ZM15.9217 12.5843C16.2445 12.8438 16.7166 12.7926 16.9762 12.4698C17.2357 12.147 17.1845 11.6749 16.8617 11.4153L15.9217 12.5843ZM4.40719 8.91358C4.08343 9.17195 4.03042 9.64385 4.28878 9.96761C4.54714 10.2914 5.01905 10.3444 5.34281 10.086L4.40719 8.91358ZM18.0785 10.1024C18.4113 10.349 18.881 10.2791 19.1276 9.9463C19.3742 9.61349 19.3043 9.14379 18.9715 8.89719L18.0785 10.1024ZM7.47731 12.5843C9.95807 10.5895 13.441 10.5895 15.9217 12.5843L16.8617 11.4153C13.832 8.97915 9.56702 8.97915 6.53734 11.4153L7.47731 12.5843ZM5.34281 10.086C8.03641 7.9365 10.6227 7.52956 12.8154 7.84408C15.0378 8.16284 16.9034 9.23173 18.0785 10.1024L18.9715 8.89719C17.6808 7.94087 15.5835 6.72576 13.0284 6.35927C10.4437 5.98854 7.43782 6.4951 4.40719 8.91358L5.34281 10.086Z"
                fill="#000000"
              ></path>
            </g>
          </svg>
        </span>
        <span class="data-signal">
          <svg
            fill="#000000"
            viewBox="-7.5 0 32 32"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            width="1.2rem"
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <title>signal</title>
              <path
                d="M15.96 24.52c-0.48 0-0.84-0.36-0.84-0.84v-15.36c0-0.48 0.36-0.84 0.84-0.84s0.84 0.36 0.84 0.84v15.4c0.040 0.44-0.36 0.8-0.84 0.8zM10.92 24.52c-0.48 0-0.84-0.36-0.84-0.84v-12.2c0-0.48 0.36-0.84 0.84-0.84s0.84 0.36 0.84 0.84v12.2c0.040 0.48-0.36 0.84-0.84 0.84zM5.88 24.52c-0.48 0-0.84-0.36-0.84-0.84v-8c0-0.48 0.36-0.84 0.84-0.84s0.84 0.36 0.84 0.84v8c0 0.48-0.4 0.84-0.84 0.84zM0.84 24.52c-0.48 0-0.84-0.36-0.84-0.84v-5.28c0-0.48 0.36-0.84 0.84-0.84s0.84 0.36 0.84 0.84v5.28c0 0.48-0.4 0.84-0.84 0.84z"
              ></path>
            </g>
          </svg>
        </span>
        <span class="battery">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="1.2rem"
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
              <path
                d="M21 11V13"
                stroke="#323232"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="M12 8L11.8852 8.15313L9.12188 11.8375L9.07313 11.9025C9.043 11.9427 9.07166 12 9.12188 12V12H12.8107V12C12.8887 12 12.9332 12.0891 12.8864 12.1515L12.8107 12.2525L10.157 15.7907L10 16"
                stroke="#323232"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="M14 16H16V16C17.1046 16 18 15.1046 18 14V10C18 8.89543 17.1046 8 16 8V8H15"
                stroke="#323232"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="M7 16H5V16C3.89543 16 3 15.1046 3 14V10C3 8.89543 3.89543 8 5 8V8H8"
                stroke="#323232"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </g>
          </svg>
        </span>
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
* {
  font-family: "Concert One", "Montserrat", sans-serif;
}
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
  padding-top: 44px;
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
  margin-top: 60px;
  margin-bottom: 40px;
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
  margin-bottom: 20px;
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
