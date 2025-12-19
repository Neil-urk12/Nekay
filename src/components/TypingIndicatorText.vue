<script setup lang="ts">
/**
 * Text-based typing indicator
 * Displays "[Name] is typing..." above the message input
 */
defineProps<{
  name: string
}>()
</script>

<template>
  <div class="typing-indicator-text">
    <span class="typing-text">{{ name }} is typing...</span>
  </div>
</template>

<style scoped>
.typing-indicator-text {
  padding: 0.375rem 1rem;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  text-align: center;
}

.typing-text {
  font-size: 0.75rem;
  color: #374151;
  font-weight: 500;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}
</style>
