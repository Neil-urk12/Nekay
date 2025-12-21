<script setup lang="ts">
defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  refresh: []
  dismiss: []
}>()
</script>

<template>
  <Transition name="slide-down">
    <div v-if="visible" class="update-banner">
      <span class="update-text">
        ✨ A new version is available
      </span>
      <div class="update-actions">
        <button class="update-btn refresh" @click="emit('refresh')">
          Refresh
        </button>
        <button class="update-btn dismiss" @click="emit('dismiss')">
          Later
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.update-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  color: #f1f5f9;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.update-text {
  font-size: 0.9rem;
  font-weight: 500;
}

.update-actions {
  display: flex;
  gap: 0.5rem;
}

.update-btn {
  padding: 0.4rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.update-btn:active {
  transform: scale(0.96);
}

.update-btn.refresh {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.update-btn.dismiss {
  background: transparent;
  color: #94a3b8;
  border: 1px solid #475569;
}

.update-btn.dismiss:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* Transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
