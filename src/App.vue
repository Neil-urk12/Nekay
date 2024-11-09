<script setup lang="ts">
import BottomNav from './components/BottomNav.vue'
</script>

<template>
  <div class="app-container">
    <router-view></router-view>
    <BottomNav />
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: 'Comic Sans MS', cursive;
}

.app-container {
  min-height: 100vh;
  background-color: #fce7f3;
}
</style>