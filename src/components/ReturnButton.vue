<template>
  <button class="back-btn" @click="router.push('/folders')">
    ← Back to Folders
  </button>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<style scoped>
.back-btn {
  border: none;
  cursor: pointer;
  background: none;
  font-size: 1rem;
  position: absolute;
  left: 0;
  transition: color 0.2s ease;
}

.back-btn:hover {
  color: #63e6be;
}
</style>