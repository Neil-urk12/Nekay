<script setup lang="ts">
import { Sun, Moon } from "lucide-vue-next";

defineProps<{
  isDarkMode: boolean;
}>();

defineEmits<{
  (e: 'toggle'): void;
}>();
</script>

<template>
  <button
    class="dark-mode-toggle"
    @click="$emit('toggle')"
    :aria-label="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
  >
    <span class="button-icon" aria-hidden="true">
      <Sun v-if="isDarkMode" :size="20" />
      <Moon v-else :size="20" />
    </span>
    <span class="mode-label">
      {{ isDarkMode ? "Light Mode" : "Dark Mode" }}
    </span>
  </button>
</template>

<style scoped>
.dark-mode-toggle {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  border: 2px solid #db2777;
  background-color: rgba(255, 255, 255, 0.8);
  color: #db2777;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dark-mode-toggle:hover {
  transform: scale(1.05);
  background-color: #fce7f3;
}

.dark .dark-mode-toggle {
  background-color: #2d2d2d;
  border-color: #f472b6;
  color: #f472b6;
}

.dark .dark-mode-toggle:hover {
  background-color: #4a4a4a;
}

.button-icon {
  display: flex;
  align-items: center;
}

.mode-label {
  font-size: 0.9rem;
}
</style>