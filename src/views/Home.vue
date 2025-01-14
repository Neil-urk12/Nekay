<script lang="ts" setup>
import { computed, defineAsyncComponent } from "vue";
import { TimeOfDay, useBackgroundStore } from "../stores/backgroundStore";
const MelodyHeader = defineAsyncComponent(
  () => import("../components/MelodyHeader.vue")
);

const backgroundStore = useBackgroundStore();

const greetingMessage = computed(() => {
  const messages: Record<TimeOfDay, string> = {
    morning: "Rise and shine! Have a wonderful morning! ",
    noon: "Hope you're having a great lunch! ",
    afternoon: "Keep going strong this afternoon! ",
    evening: "Winding down for a peaceful evening! ",
    night: "Sweet dreams ahead! ",
  };
  return (
    messages[backgroundStore.timeOfDay as TimeOfDay] || "Have a great day!"
  );
});
</script>

<template>
  <div
    class="home-container"
    :style="{ backgroundImage: backgroundStore.backgroundImage }"
  >
    <MelodyHeader />
    <div class="cloud-icon animate-float">
      <img src="/assets/cloud.png" alt="Cloud" class="cloud" loading="lazy" />
    </div>
    <div class="message-container animate-float">
      <div class="message-box animate-fade-in">
        <p class="greeting">Hi Kaykayy!</p>
        <p class="greetingMessage">{{ greetingMessage }}</p>
      </div>
    </div>

    <router-link to="/water_tracker">
      <div class="app-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="1.5rem"><path fill="#74C0FC" d="M192 512C86 512 0 426 0 320C0 228.8 130.2 57.7 166.6 11.7C172.6 4.2 181.5 0 191.1 0l1.8 0c9.6 0 18.5 4.2 24.5 11.7C253.8 57.7 384 228.8 384 320c0 106-86 192-192 192zM96 336c0-8.8-7.2-16-16-16s-16 7.2-16 16c0 61.9 50.1 112 112 112c8.8 0 16-7.2 16-16s-7.2-16-16-16c-44.2 0-80-35.8-80-80z"/></svg>
        <span class="app-name">Water Tracker</span>
      </div>
    </router-link>

    <router-link to="/breathing_exercise">
      <div class="app-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="1.5rem"><path fill="#63E6BE" d="M384 312.7c-55.1 136.7-187.1 54-187.1 54-40.5 81.8-107.4 134.4-184.6 134.7-16.1 0-16.6-24.4 0-24.4 64.4-.3 120.5-42.7 157.2-110.1-41.1 15.9-118.6 27.9-161.6-82.2 109-44.9 159.1 11.2 178.3 45.5 9.9-24.4 17-50.9 21.6-79.7 0 0-139.7 21.9-149.5-98.1 119.1-47.9 152.6 76.7 152.6 76.7 1.6-16.7 3.3-52.6 3.3-53.4 0 0-106.3-73.7-38.1-165.2 124.6 43 61.4 162.4 61.4 162.4 .5 1.6 .5 23.8 0 33.4 0 0 45.2-89 136.4-57.5-4.2 134-141.9 106.4-141.9 106.4-4.4 27.4-11.2 53.4-20 77.5 0 0 83-91.8 172-20z"/></svg>
        <span class="app-name">Breathing Exercise</span>
      </div>
    </router-link>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 0rem;
  transition: background-image 1s ease-in-out;
  display: flex;
  flex-direction: column;
}
.message-container {
  max-width: 32rem;
  margin: 0 auto;
  z-index: 3;
}
.message-box,
.greetingMessage {
  z-index: 2;
  margin: 0px;
  font-weight: 800;
  color: blueviolet;
  text-align: center;
  position: relative;
}
.cloud {
  z-index: -1;
  position: absolute;
  top: -80px;
}
.greeting {
  margin: 2rem 0 0 0;
  font-size: 2rem;
  color: #db2777;
  font-weight: bold;
}
.animate-float {
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (max-width: 640px) {
  .message-box {
    margin: 1rem;
    padding: 1rem;
  }
}
</style>
