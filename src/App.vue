<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from "vue";
import { TimeOfDay } from "./views/Home.vue";
const BottomNav = defineAsyncComponent(
  () => import("./components/BottomNav.vue")
);
const isLoading = ref(true);
const error = ref<Error | null>(null);

const backgroundImage = ref("");

const timeOfDay = ref<TimeOfDay>("morning");

const determineTimeOfDay = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    timeOfDay.value = "morning";
    backgroundImage.value = "url(/assets/bgsky.png)";
  } else if (hour >= 12 && hour < 13) {
    timeOfDay.value = "noon";
    backgroundImage.value = "url(src/assets/noonbg.jpg)";
  } else if (hour >= 13 && hour < 18) {
    timeOfDay.value = "afternoon";
    backgroundImage.value = "url(src/assets/newsunset.jpg)";
  } else if (hour >= 18 && hour < 20) {
    timeOfDay.value = "evening";
    backgroundImage.value = "url(/assets/sunsetbg.jpg)";
  } else {
    timeOfDay.value = "night";
    backgroundImage.value = "url(/assets/moonbg.gif)";
  }
};

onMounted(() => {
  setInterval(determineTimeOfDay, 60000);
  determineTimeOfDay();
});

onMounted(async () => {
  try {
    // if (!initialized.value)
    //   await notesStore.initialise()
    // await notesStore.fetchFromFirebase()
  } catch (err) {
    console.error("Failed to initialize app:", err);
    error.value = err as Error;
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="app-container" :style="{ backgroundImage }">
    <div v-if="error" class="error-message">
      {{ error.message }}
    </div>
    <div v-else-if="isLoading" class="loading">Loading...</div>
    <template v-else>
      <router-view></router-view>
      <BottomNav v-if="$route.path !== '/login'" />
    </template>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: "Comic Sans MS", cursive;
}
.app-container {
  min-height: 100vh;
  background-size: cover;
  background-repeat: no-repeat;
}
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
}
.error-message {
  padding: 1rem;
  margin: 1rem;
  background-color: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 0.5rem;
  color: #dc2626;
}
</style>
