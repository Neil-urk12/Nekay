<script setup lang="ts">
import { defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import UpdateBanner from './components/UpdateBanner.vue'
import { notificationService } from './services/notificationService'
import { syncService } from './services/syncService'
import { useAffirmationStore } from './stores/affirmationStore'
import { useAuthStore } from './stores/authStore'

import { useBackgroundStore } from './stores/backgroundStore'

const BottomNav = defineAsyncComponent(
  () => import('./components/BottomNav.vue'),
)
const backgroundStore = useBackgroundStore()
const affirmationStore = useAffirmationStore()
const isLoading = ref(true)
const error = ref<Error | null>(null)

const authStore = useAuthStore()

// Service worker update state
const showUpdateBanner = ref(false)
let swRegistration: ServiceWorkerRegistration | null = null

function handleSwUpdated(event: Event) {
  const customEvent = event as CustomEvent<ServiceWorkerRegistration>
  swRegistration = customEvent.detail
  showUpdateBanner.value = true
}

function applyUpdate() {
  if (swRegistration?.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }
  window.location.reload()
}

function dismissUpdate() {
  showUpdateBanner.value = false
}

async function initializeApp() {
  try {
    await affirmationStore.fetchAffirmation()
    if (navigator.onLine) {
      await syncService.syncAll().catch((err) => {
        console.error('Background sync failed:', err)
      })
    }
    notificationService.scheduleReminders()
  }
  catch (err) {
    console.error('Failed to initialize app:', err)
    error.value = err as Error
  }
};

onMounted(async () => {
  document.addEventListener('sw-updated', handleSwUpdated)
  try {
    await initializeApp()
    backgroundStore.determineTimeOfDay()
    setInterval(() => backgroundStore.determineTimeOfDay(), 60000)
    await authStore.setUser()
  }
  catch (err) {
    console.error('Failed to initialize app:', err)
    error.value = err as Error
  }
  finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  document.removeEventListener('sw-updated', handleSwUpdated)
})
</script>

<template>
  <UpdateBanner
    :visible="showUpdateBanner"
    @refresh="applyUpdate"
    @dismiss="dismissUpdate"
  />
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
      <div class="spinner" />
      Please wait...
    </div>
    <div v-else class="app-content">
      <router-view :daily-affirmation="affirmationStore.dailyAffirmation" />
      <BottomNav v-if="!$route.meta.hideBottomNav" />
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

/* Sheet Form Styles */
.sheet-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sheet-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  background: #f9fafb;
}

.sheet-input:focus {
  outline: none;
  border-color: #db2777;
  background: white;
}

.sheet-btn {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #db2777, #ec4899);
  color: white;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.sheet-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(219, 39, 119, 0.4);
}

.sheet-btn:active {
  transform: translateY(0);
}

/* Global Button Classes */
.btn-primary {
  color: white;
  font-weight: bold;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-danger {
  background: #ef4444;
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.35);
}

.cancel-button {
  background: #95a5a6;
}

.btn-primary:hover,
.btn-secondary:hover,
.cancel-button:hover {
  transform: translateY(-2px);
  transition: all 0.2s ease;
}
</style>
