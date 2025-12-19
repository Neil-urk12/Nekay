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
  padding: 0.25rem 1rem;
  background: rgba(138, 79, 255, 0.08);
  border-top: 1px solid rgba(138, 79, 255, 0.15);
  text-align: center;
}

.typing-text {
  font-size: 0.75rem;
  color: #8a4fff;
  font-style: italic;
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
