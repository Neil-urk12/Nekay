<script setup lang="ts">
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
    <span class="button-icon" aria-hidden="true" :class="{ dark: isDarkMode }">
      {{ isDarkMode ? "☀️" : "🌙" }}
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
  padding: 0.5rem;
  border-radius: 50%;
  border: 1px solid plum;
  background-color: rgba(0, 0, 0, 0.1);
  cursor: pointer;
  font-size: 1.5rem;
  transition: transform 0.3s ease;
}

.dark-mode-toggle:hover {
  transform: scale(1.1);
}

.dark .dark-mode-toggle {
  color: #ffffff;
}

.mode-label {
  padding: 0 0 0 1rem;
  font-size: 1rem;
}
</style>