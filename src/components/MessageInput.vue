<template>
  <div class="message-input">
    <input
      ref="inputRef"
      type="text"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keydown.enter="$emit('send')"
      placeholder="Type a message..."
      :disabled="isLoading"
    />
    <button 
      class="send-btn" 
      @click="$emit('send')"
      :disabled="isLoading"
    >
      <svg class="send-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  isLoading: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: string];
  'send': [];
}>();
</script>

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
