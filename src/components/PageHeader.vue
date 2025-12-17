<script setup lang="ts">
interface Props {
  title: string
  backTo?: string
}

withDefaults(defineProps<Props>(), {
  backTo: '/folders',
})
</script>

<template>
  <header class="page-header">
    <button class="back-arrow" aria-label="Back" @click="$router.push(backTo)">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="20" height="20">
        <path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
      </svg>
    </button>
    <h1>{{ title }}</h1>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid rgba(219, 39, 119, 0.1);
  box-shadow: 0 2px 8px rgba(219, 39, 119, 0.08);
}

.back-arrow {
  background: none;
  border: none;
  cursor: pointer;
  color: rgb(219, 39, 119);
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.back-arrow:hover {
  background: rgba(219, 39, 119, 0.1);
  transform: translateX(-2px);
}

.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: rgb(219, 39, 119);
}
</style>
