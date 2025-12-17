<script setup lang="ts">
defineProps<{
  message: string
  icon?: string
}>()
</script>

<template>
  <div class="empty-state">
    <span v-if="icon" class="empty-icon">{{ icon }}</span>
    <p class="empty-message">{{ message }}</p>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(252, 231, 243, 0.8));
  padding: 2rem 1.5rem;
  border-radius: 16px;
  margin: 1rem;
  box-shadow: 0 4px 12px rgba(219, 39, 119, 0.1);
  border: 1px solid rgba(219, 39, 119, 0.15);
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  opacity: 0.8;
}

.empty-message {
  margin: 0;
  color: #64748b;
  font-size: 1rem;
  line-height: 1.5;
}
</style>
