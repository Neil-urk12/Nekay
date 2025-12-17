<script setup lang="ts">
import { AlertTriangle, HelpCircle, Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'

export type ConfirmationVariant = 'danger' | 'warning' | 'default'

export interface ConfirmationModalProps {
  show: boolean
  title?: string
  message?: string
  itemName?: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  variant?: ConfirmationVariant
}

const props = withDefaults(defineProps<ConfirmationModalProps>(), {
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  loading: false,
  variant: 'default',
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()

const displayMessage = computed(() => {
  if (props.itemName) {
    return `${props.message} "${props.itemName}"?`
  }
  return props.message
})

const variantStyles = computed(() => {
  switch (props.variant) {
    case 'danger':
      return {
        iconBg: 'var(--confirm-modal-danger-icon-bg, #fef2f2)',
        iconColor: 'var(--confirm-modal-danger-icon-color, #ef4444)',
        btnBg: 'var(--confirm-modal-danger-btn-bg, #ef4444)',
        btnHoverBg: 'var(--confirm-modal-danger-btn-hover-bg, #dc2626)',
      }
    case 'warning':
      return {
        iconBg: 'var(--confirm-modal-warning-icon-bg, #fffbeb)',
        iconColor: 'var(--confirm-modal-warning-icon-color, #f59e0b)',
        btnBg: 'var(--confirm-modal-warning-btn-bg, #f59e0b)',
        btnHoverBg: 'var(--confirm-modal-warning-btn-hover-bg, #d97706)',
      }
    default:
      return {
        iconBg: 'var(--confirm-modal-default-icon-bg, #f0fdf4)',
        iconColor: 'var(--confirm-modal-default-icon-color, #22c55e)',
        btnBg: 'var(--confirm-modal-default-btn-bg, #db2777)',
        btnHoverBg: 'var(--confirm-modal-default-btn-hover-bg, #be185d)',
      }
  }
})

function handleOverlayClick(event: MouseEvent) {
  if (event.target === event.currentTarget && !props.loading) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
        <transition name="modal-scale" appear>
          <div class="modal-content">
            <!-- Icon -->
            <div
              class="modal-icon"
              :style="{
                backgroundColor: variantStyles.iconBg,
                color: variantStyles.iconColor,
              }"
            >
              <Trash2 v-if="variant === 'danger'" :size="28" />
              <AlertTriangle v-else-if="variant === 'warning'" :size="28" />
              <HelpCircle v-else :size="28" />
            </div>

            <!-- Title -->
            <h2 class="modal-title">
              {{ title }}
            </h2>

            <!-- Message -->
            <p class="modal-message">
              {{ displayMessage }}
            </p>

            <!-- Actions -->
            <div class="modal-actions">
              <button
                class="btn btn-cancel"
                :disabled="loading"
                @click="emit('close')"
              >
                {{ cancelText }}
              </button>

              <button
                class="btn btn-confirm"
                :style="{
                  '--btn-bg': variantStyles.btnBg,
                  '--btn-hover-bg': variantStyles.btnHoverBg,
                }"
                :disabled="loading"
                @click="emit('confirm')"
              >
                <span v-if="loading" class="spinner" />
                <span v-else>{{ confirmText }}</span>
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-content {
  background: white;
  padding: 1.75rem;
  border-radius: 20px;
  width: 100%;
  max-width: 340px;
  text-align: center;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(0, 0, 0, 0.05);
}

.modal-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
}

.modal-title {
  color: #1e293b;
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
}

.modal-message {
  color: #64748b;
  margin: 0 0 1.5rem;
  font-size: 0.95rem;
  line-height: 1.6;
  word-break: break-word;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #f1f5f9;
  color: #64748b;
}

.btn-cancel:hover:not(:disabled) {
  background: #e2e8f0;
  color: #475569;
}

.btn-confirm {
  background: var(--btn-bg, #db2777);
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: var(--btn-hover-bg, #be185d);
  transform: translateY(-1px);
}

.btn-confirm:active:not(:disabled) {
  transform: translateY(0);
}

/* Spinner */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-scale-leave-active {
  transition: all 0.2s ease;
}

.modal-scale-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .modal-content {
    background: #1e293b;
  }

  .modal-title {
    color: #f1f5f9;
  }

  .modal-message {
    color: #94a3b8;
  }

  .btn-cancel {
    background: #334155;
    color: #94a3b8;
  }

  .btn-cancel:hover:not(:disabled) {
    background: #475569;
    color: #e2e8f0;
  }
}
</style>
