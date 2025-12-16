<script setup lang="ts">
defineProps<{
  show: boolean
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()

const handleOverlayClick = () => {
  emit('close')
}
</script>

<template>
  <transition name="slide-up">
    <div v-if="show" class="sheet-overlay" @click.self="handleOverlayClick">
      <div class="sheet-content">
        <div class="sheet-header">
          <h3>{{ title }}</h3>
          <button class="close-btn" @click="emit('close')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="sheet-body">
          <slot></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: flex-end;
}

.sheet-content {
  width: 100%;
  background: white;
  border-top-left-radius: 2rem;
  border-top-right-radius: 2rem;
  padding: 2rem;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.sheet-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #1f2937;
  font-weight: 700;
}

.close-btn {
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.close-btn svg {
  width: 24px;
  height: 24px;
}

.sheet-body {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Slide-up Transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
}

.slide-up-enter-active .sheet-content,
.slide-up-leave-active .sheet-content {
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.slide-up-enter-from .sheet-content,
.slide-up-leave-to .sheet-content {
  transform: translateY(100%);
}
</style>
