<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from "vue";
import { useBackgroundStore } from "./stores/backgroundStore";
const BottomNav = defineAsyncComponent(
  () => import("./components/BottomNav.vue")
);
const backgroundStore = useBackgroundStore();
const isLoading = ref(true);
const error = ref<Error | null>(null);

onMounted(async () => {
  try {
    backgroundStore.determineTimeOfDay();
    setInterval(() => backgroundStore.determineTimeOfDay, 60000);
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
      <BottomNav v-if="$route.path !== '/' && $route.path !== '/check'" />
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
