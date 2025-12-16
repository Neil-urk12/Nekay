<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <button class="back-btn" @click="router.push('/folders')">
    ← Back to Folders
  </button>
</template>

<style scoped>
.back-btn {
  border: none;
  cursor: pointer;
  background: none;
  font-size: 0.95rem;
  font-weight: 500;
  color: rgb(219, 39, 119);
  padding: 0.5rem 0;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.back-btn:hover {
  color: #ec4899;
  transform: translateX(-3px);
}
</style>
