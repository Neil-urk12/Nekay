<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref, watch } from "vue";
import { useBackgroundStore } from "./stores/backgroundStore";
import { useNotesStore } from "./stores/notes";
const BottomNav = defineAsyncComponent(
  () => import("./components/BottomNav.vue")
);
import { syncService } from "./services/syncService";
const backgroundStore = useBackgroundStore();
const notesStore = useNotesStore()
const isLoading = ref(true);
const error = ref<Error | null>(null);
const dailyAffirmation = ref("")

watch(dailyAffirmation, (newVal) => {
  console.log("Affirmation updated:", newVal);
});

async function fetchAffirmation() {
  try {
    console.log("Fetching affirmation...")
    const response = await fetch("https://affi-rm.vercel.app/daily-affirmation")
    console.log("Response status: ", response.status)
    if (!response.ok) {
      throw new Error('Failed to fetch affirmation');
    }

    if (response.status === 204) {
      dailyAffirmation.value = "You are doing great! Keep up the good work!"
      return;
    }

    if (!response) {  
      throw new Error('Failed to fetch affirmation');
    }

    const data = await response.json()
    dailyAffirmation.value = data.message
  } catch (err) {
    console.error('Error fetching affirmation: ', err);
    dailyAffirmation.value = "You are doing great! Keep up the good work!"
  }
}

const initializeApp = async () => {
  try {
    await Promise.all([
      syncService.loadFromCache(),
      fetchAffirmation(),
    ])
    if (navigator.onLine) {
      await syncService.syncAll().catch((err) => {
        console.error("Background sync failed:", err);
      });
    }
  } catch (err) {
    console.error("Failed to initialize app:", err);
    error.value = err as Error;
  }
};

onMounted(async () => {
  try {
    await initializeApp();
    backgroundStore.determineTimeOfDay();
    setInterval(() => backgroundStore.determineTimeOfDay, 60000);
    await notesStore.initializeStore();
  } catch (err) {
    console.error("Failed to initialize app:", err);
    error.value = err as Error;
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div
    class="app-container"
    :style="{ backgroundImage: backgroundStore.backgroundImage }"
  >
    <div v-if="error" class="error-message">
      {{ error.message }}
    </div>
    <div v-else-if="isLoading" class="loading">Loading...</div>
    <template v-else>
      <router-view :dailyAffirmation="dailyAffirmation"></router-view>
      <BottomNav v-if="$route.path !== '/' && $route.path !== '/login'" />
    </template>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  font-family: "Concert One", "Montserrat", sans-serif;
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
input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #fbcfe8;
  border-radius: 0.5rem;
  max-width: calc(100% - 1rem);
  outline: none;
  text-align: center;
  box-sizing: border-box;
  width: 100%;
}
button {
  background-color: #f472b6;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
}
</style>
