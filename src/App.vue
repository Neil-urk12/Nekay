<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from "vue";
import { useBackgroundStore } from "./stores/backgroundStore";
import { useNotesStore } from "./stores/notes";
import { useAffirmationStore } from "./stores/affirmationStore";
const BottomNav = defineAsyncComponent(
  () => import("./components/BottomNav.vue")
);
import { syncService } from "./services/syncService";
import { notificationService } from "./services/notificationService";
const backgroundStore = useBackgroundStore();
const notesStore = useNotesStore()
const affirmationStore = useAffirmationStore();
const isLoading = ref(true);
const error = ref<Error | null>(null);
import { useAuthStore } from "./stores/authStore";

const authStore = useAuthStore();

async function initializeApp() {
  try {
    await Promise.all([
      syncService.loadFromCache(),
      affirmationStore.fetchAffirmation(),
    ])
    if (navigator.onLine) {
      await syncService.syncAll().catch((err) => {
        console.error("Background sync failed:", err);
      });
    }
    notificationService.scheduleReminders();
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
    await Promise.allSettled([
      notesStore.initializeStore(),
      authStore.setUser(),
    ])
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
    <div
      v-if="isLoading"
      class="loading-overlay"
    >
      <div class="spinner"></div>
      Please wait...
    </div>
    <div v-else class="app-content">
      <router-view :dailyAffirmation="affirmationStore.dailyAffirmation"></router-view>
      <BottomNav v-if="$route.path !== '/' && $route.path !== '/login' && $route.path !== '/messaging'" />
    </div>
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

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.5);
  z-index: 10;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
}

.spinner {
  border: 5px solid #f3f3f3; /* Light grey */
  border-top: 5px solid #3498db; /* Blue */
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 2s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
