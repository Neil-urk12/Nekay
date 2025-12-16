<script setup lang="ts">
import { defineEmits, defineProps } from 'vue'

defineProps<{
  show: boolean
  loading: boolean
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()
</script>

<template>
  <transition name="fade">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">
        <h2>Delete Task</h2>
        <p>Are you sure you want to delete this task? This action cannot be undone.</p>

        <div class="actions">
          <button
            class="btn-cancel"
            :disabled="loading"
            @click="$emit('close')"
          >
            Cancel
          </button>

          <button
            class="btn-delete"
            :disabled="loading"
            @click="$emit('confirm')"
          >
            <span v-if="loading" class="spinner" />
            <span v-else>Delete</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  width: 90%;
  max-width: 320px;
  text-align: center;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

h2 {
  color: #1e293b;
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
}

p {
  color: #64748b;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

button {
  padding: 0.625rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  flex: 1;
}

.btn-cancel {
  background: #f1f5f9;
  color: #64748b;
}

.btn-cancel:hover:not(:disabled) {
  background: #e2e8f0;
  color: #475569;
}

.btn-delete {
  background: #ef4444;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 40px;
}

.btn-delete:hover:not(:disabled) {
  background: #dc2626;
}

.btn-delete:disabled,
.btn-cancel:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
