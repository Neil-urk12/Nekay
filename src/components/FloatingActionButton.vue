<script setup lang="ts">
defineProps<{
  ariaLabel?: string
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button class="fab" @click="emit('click')" :aria-label="ariaLabel || 'Action button'">
    <slot>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="24" height="24">
        <path fill="white" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z"/>
      </svg>
    </slot>
  </button>
</template>

<style scoped>
.fab {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #db2777, #ec4899);
  border: none;
  box-shadow: 0 4px 12px rgba(219, 39, 119, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 100;
}

.fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(219, 39, 119, 0.5);
}

.fab:active {
  transform: scale(0.95);
}
</style>
