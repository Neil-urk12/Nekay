<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from "vue";
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

onMounted(async () => {
  try {
    backgroundStore.determineTimeOfDay();
    setInterval(() => backgroundStore.determineTimeOfDay, 60000);
    notesStore.initializeStore();

    await syncService.loadFromCache();
    
    if (navigator.onLine) {
      await syncService.syncAll().catch(err => {
        console.error("Background sync failed:", err);
      });
    }
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
      <router-view></router-view>
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
