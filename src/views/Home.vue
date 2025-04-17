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
defineProps<{ dailyAffirmation: string }>();
</script>

<template>
  <div
    class="home-container"
    :style="{ backgroundImage: backgroundStore.backgroundImage }"
  >
    <MelodyHeader />
    <div class="cloud-icon animate-float">
      <img src="/assets/cloud.webp" alt="Cloud" class="cloud" loading="lazy" />
    </div>
    <div class="message-container animate-float">
      <div class="message-box animate-fade-in">
        <p class="greeting">Hi Babiee!</p>
        <p class="greetingMessage">{{ greetingMessage }}</p>
      </div>
    </div>

    <div class="affirmation-container">
      <p class="affirmation">{{ dailyAffirmation }}</p>
    </div>

    <div class="app-icons-container">
      <router-link to="/water_tracker">
        <div class="app-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 384 512"
            width="1.5rem"
          >
            <path
              fill="#74C0FC"
              d="M192 512C86 512 0 426 0 320C0 228.8 130.2 57.7 166.6 11.7C172.6 4.2 181.5 0 191.1 0l1.8 0c9.6 0 18.5 4.2 24.5 11.7C253.8 57.7 384 228.8 384 320c0 106-86 192-192 192zM96 336c0-8.8-7.2-16-16-16s-16 7.2-16 16c0 61.9 50.1 112 112 112c8.8 0 16-7.2 16-16s-7.2-16-16-16c-44.2 0-80-35.8-80-80z"
            />
          </svg>
          <span class="app-name">Water Tracker</span>
        </div>
      </router-link>

      <router-link to="/breathing_exercise">
        <div class="app-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 384 512"
            width="1.5rem"
          >
            <path
              fill="#63E6BE"
              d="M384 312.7c-55.1 136.7-187.1 54-187.1 54-40.5 81.8-107.4 134.4-184.6 134.7-16.1 0-16.6-24.4 0-24.4 64.4-.3 120.5-42.7 157.2-110.1-41.1 15.9-118.6 27.9-161.6-82.2 109-44.9 159.1 11.2 178.3 45.5 9.9-24.4 17-50.9 21.6-79.7 0 0-139.7 21.9-149.5-98.1 119.1-47.9 152.6 76.7 152.6 76.7 1.6-16.7 3.3-52.6 3.3-53.4 0 0-106.3-73.7-38.1-165.2 124.6 43 61.4 162.4 61.4 162.4 .5 1.6 .5 23.8 0 33.4 0 0 45.2-89 136.4-57.5-4.2 134-141.9 106.4-141.9 106.4-4.4 27.4-11.2 53.4-20 77.5 0 0 83-91.8 172-20z"
            />
          </svg>
          <span class="app-name">Breathing Exercise</span>
        </div> </router-link
      ><br />
      <router-link to="/archive">
        <div class="app-icon">
          <svg width="4rem" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M11.5 21H12.5C16.2712 21 18.1569 21 19.3284 19.8284C20.5 18.6569 20.5 16.7713 20.5 13V6.99805C20.3548 7.00008 20.1509 7.00005 20 7.00002H4C3.84905 7.00005 3.6452 7.00008 3.5 6.99805V13C3.5 16.7713 3.5 18.6569 4.67157 19.8284C5.84315 21 7.72876 21 11.5 21ZM9.07612 11.1173C9 11.3011 9 11.5341 9 12C9 12.4659 9 12.6989 9.07612 12.8827C9.17761 13.1277 9.37229 13.3224 9.61732 13.4239C9.80109 13.5 10.0341 13.5 10.5 13.5H13.5C13.9659 13.5 14.1989 13.5 14.3827 13.4239C14.6277 13.3224 14.8224 13.1277 14.9239 12.8827C15 12.6989 15 12.4659 15 12C15 11.5341 15 11.3011 14.9239 11.1173C14.8224 10.8723 14.6277 10.6776 14.3827 10.5761C14.1989 10.5 13.9659 10.5 13.5 10.5H10.5C10.0341 10.5 9.80109 10.5 9.61732 10.5761C9.37229 10.6776 9.17761 10.8723 9.07612 11.1173Z" fill="#1C274C"/>
              <g opacity="0.5">
            <path d="M2 5C2 4.05719 2 3.58579 2.29289 3.29289C2.58579 3 3.05719 3 4 3H20C20.9428 3 21.4142 3 21.7071 3.29289C22 3.58579 22 4.05719 22 5C22 5.94281 22 6.41421 21.7071 6.70711C21.4142 7 20.9428 7 20 7H4C3.05719 7 2.58579 7 2.29289 6.70711C2 6.41421 2 5.94281 2 5Z" fill="#1C274C"/>
              </g>
          </svg>
          <span class="app-name">Heartfelt Memories</span>
        </div>
      </router-link>
      <router-link to="/messaging">
        <div class="app-icon">
          <svg
            width="3.5rem"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0" />

            <g
              id="SVGRepo_tracerCarrier"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <g id="SVGRepo_iconCarrier">
              <path
                d="M21 8H3M16 2V5M8 2V5M7.8 22H16.2C17.8802 22 18.7202 22 19.362 21.673C19.9265 21.3854 20.3854 20.9265 20.673 20.362C21 19.7202 21 18.8802 21 17.2V8.8C21 7.11984 21 6.27976 20.673 5.63803C20.3854 5.07354 19.9265 4.6146 19.362 4.32698C18.7202 4 17.8802 4 16.2 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V17.2C3 18.8802 3 19.7202 3.32698 20.362C3.6146 20.9265 4.07354 21.3854 4.63803 21.673C5.27976 22 6.11984 22 7.8 22ZM11.9973 12.3306C11.1975 11.4216 9.8639 11.1771 8.86188 12.0094C7.85986 12.8418 7.71879 14.2335 8.50568 15.2179C9.077 15.9327 10.6593 17.3397 11.4833 18.0569C11.662 18.2124 11.7513 18.2902 11.856 18.321C11.9466 18.3477 12.0479 18.3477 12.1386 18.321C12.2432 18.2902 12.3325 18.2124 12.5112 18.0569C13.3353 17.3397 14.9175 15.9327 15.4888 15.2179C16.2757 14.2335 16.1519 12.8331 15.1326 12.0094C14.1134 11.1858 12.797 11.4216 11.9973 12.3306Z"
                stroke="#ed333b"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </g>
          </svg>
          <span class="app-name">Cutiegram</span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
a {
  text-decoration: none;
}
.home-container {
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 0rem;
  transition: background-image 1s ease-in-outi;
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
.app-icon {
  background: white;
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  gap: 0.5rem;
  width: 100px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.app-icon:hover {
  transform: scale(1.05);
}

.app-name {
  font-size: 0.8rem;
  color: #4b5563;
  font-weight: 500;
  text-align: center;
}
/* Add this to create a container for the app icons */
.app-icons-container {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin: 2rem 0 2rem 2rem;
  text-decoration: none;
  flex-wrap: wrap;
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

.affirmation-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  margin: 4rem 0 2rem 0;
}

.affirmation {
  color: #4b5563;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
  text-align: center;
  max-width: 80%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-family: "Courier New", Courier, monospace;
}
</style>
