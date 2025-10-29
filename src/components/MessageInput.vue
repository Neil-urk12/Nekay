<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: string
  isLoading?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'send'): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<Emits>()

const inputValue = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  inputValue.value = newValue
})

const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement
  inputValue.value = target.value
  emit('update:modelValue', target.value)
}

const handleSend = () => {
  if (inputValue.value.trim() && !props.isLoading) {
    emit('send')
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="message-input-container">
    <input
      type="text"
      :value="inputValue"
      @input="updateValue"
      @keydown="handleKeyDown"
      :disabled="isLoading"
      placeholder="Type a message..."
      class="message-input"
    />
    <button
      @click="handleSend"
      :disabled="isLoading || !inputValue.trim()"
      class="send-button"
    >
      <span v-if="isLoading">...</span>
      <span v-else>Send</span>
    </button>
  </div>
</template>

<style scoped>
.message-input-container {
  display: flex;
  padding: 0.75rem;
  gap: 0.5rem;
  background: #fff;
  border-top: 1px solid #e0e0e0;
}

.message-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.message-input:focus {
  border-color: #8a4fff;
}

.message-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.send-button {
  padding: 0.75rem 1.5rem;
  background: #8a4fff;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.send-button:hover:not(:disabled) {
  background: #7a3eef;
  transform: translateY(-1px);
}

.send-button:active:not(:disabled) {
  transform: translateY(0);
}

.send-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
