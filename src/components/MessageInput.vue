<script setup lang="ts">
import { onUnmounted, ref } from 'vue'

defineProps<{
  modelValue: string
  isLoading: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'send': []
  'typing': []
  'stopTyping': []
}>()

// Debounce timer for typing indicator
const typingTimeoutId = ref<ReturnType<typeof setTimeout> | null>(null)
const isCurrentlyTyping = ref(false)

function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', value)

  // Emit typing event on every keystroke to keep indicator alive
  isCurrentlyTyping.value = true
  emit('typing')

  // Reset the stop-typing timer
  if (typingTimeoutId.value) {
    clearTimeout(typingTimeoutId.value)
  }

  // Set timer to stop typing after 3 seconds of inactivity
  typingTimeoutId.value = setTimeout(() => {
    isCurrentlyTyping.value = false
    emit('stopTyping')
  }, 3000)
}

function handleSend() {
  // Clear typing state immediately when sending
  if (typingTimeoutId.value) {
    clearTimeout(typingTimeoutId.value)
  }
  if (isCurrentlyTyping.value) {
    isCurrentlyTyping.value = false
    emit('stopTyping')
  }
  emit('send')
}

onUnmounted(() => {
  if (typingTimeoutId.value) {
    clearTimeout(typingTimeoutId.value)
  }
})
</script>

<template>
  <div class="message-input">
    <input
      type="text"
      :value="modelValue"
      placeholder="Type a message..."
      :disabled="isLoading"
      @input="handleInput"
      @keydown.enter="handleSend"
    >
    <button
      class="send-btn"
      :disabled="isLoading"
      @click="handleSend"
    >
      <svg class="send-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.message-input {
  display: flex;
  padding: 0.75rem 1rem;
  background: #fff;
  align-items: center;
  gap: 0.75rem;
  border-top: 1px solid #eee;
}

.message-input input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 1.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.message-input input:focus {
  outline: none;
  border-color: #8a4fff;
}

.message-input input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.send-btn {
  background: #8a4fff;
  border: none;
  color: white;
  padding: 0.75rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, transform 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #7b3aff;
  transform: scale(1.05);
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.send-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.send-icon {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
