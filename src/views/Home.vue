<script lang="ts" setup>
import { ref, onMounted, computed, defineAsyncComponent } from "vue"
const MelodyHeader = defineAsyncComponent(() => import("../components/MelodyHeader.vue"))

type TimeOfDay = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night'
const timeOfDay = ref<TimeOfDay>('morning')

const greetingMessage = computed(() => {
  const messages: Record<TimeOfDay, string> = {
    morning: "Rise and shine! Have a wonderful morning! ",
    noon: "Hope you're having a great lunch! ",
    afternoon: "Keep going strong this afternoon! ",
    evening: "Winding down for a peaceful evening! ",
    night: "Sweet dreams ahead! "
  }
  return messages[timeOfDay.value as TimeOfDay] || "Have a great day!"
})

const backgroundImage = ref("")

const determineTimeOfDay = () => {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) {
    timeOfDay.value = "morning"
    backgroundImage.value = "url(/assets/bgsky.png)"
  } else if (hour >= 12 && hour < 13) {
    timeOfDay.value = "noon"
    backgroundImage.value = "url(/assets/noonbg.jpg)"
  } else if (hour >= 13 && hour < 15) {
    timeOfDay.value = "afternoon"
    backgroundImage.value = "url(src/assets/newsunset.jpg)"
  } else if (hour >= 16 && hour < 17) {
    timeOfDay.value = "evening"
    backgroundImage.value = "url(/assets/sunsetbg.jpg)"
  } else {
    timeOfDay.value = "night"
    backgroundImage.value = "url(/assets/moonbg.gif)"
  }
}

onMounted(() => {
  setInterval(determineTimeOfDay, 60000)
  determineTimeOfDay()
})
</script>

<template>
  <div class="home-container" :style="{ backgroundImage: backgroundImage }">
    <MelodyHeader />
    <div class="cloud-icon animate-float">
      <img src="/assets/cloud.png" alt="Cloud" class="cloud" loading="lazy" />
    </div>
    <div class="message-container animate-float">
      <div class="message-box animate-fade-in">
        <p class="greeting">Hi Kaykayy! </p>
        <p class="greetingMessage">{{ greetingMessage }}</p>
      </div>
    </div>
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
}
.message-container {
  max-width: 32rem;
  margin: 0 auto;
  z-index: 3;
}
.message-box, .greetingMessage {
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

.animate-float {animation: float 3s ease-in-out infinite}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.animate-fade-in {animation: fadeIn 0.5s ease-out}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (max-width: 640px) {
  .message-box {
    margin: 1rem;
    padding: 1rem;
  }
}
</style>
