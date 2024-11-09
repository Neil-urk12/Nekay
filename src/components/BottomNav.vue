<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <nav class="bottom-nav">
    <div class="nav-container">
      <router-link to="/" :class="['nav-link', { active: route.path === '/' }]">
        <span class="nav-icon">🏠</span>
        <span class="nav-text">Home</span>
      </router-link>
      <router-link to="/pomodoro" :class="['nav-link', { active: route.path === '/pomodoro' }]">
        <span class="nav-icon">⏰</span>
        <span class="nav-text">Pomodoro</span>
      </router-link>
      <router-link to="/tasks" :class="['nav-link', { active: route.path === '/tasks' }]">
         <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M152.1 38.2c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 113C-2.3 103.6-2.3 88.4 7 79s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zm0 160c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 273c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zM224 96c0-17.7 14.3-32 32-32l224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-224 0c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32l224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-224 0c-17.7 0-32-14.3-32-32zM160 416c0-17.7 14.3-32 32-32l288 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-288 0c-17.7 0-32-14.3-32-32zM48 368a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/></svg></span>
        <span class="nav-text">Tasks</span>
      </router-link>
      <router-link to="/journal" :class="['nav-link', { active: route.path === '/journal' }]">
        <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M96 0C43 0 0 43 0 96L0 416c0 53 43 96 96 96l288 0 32 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l0-64c17.7 0 32-14.3 32-32l0-320c0-17.7-14.3-32-32-32L384 0 96 0zm0 384l256 0 0 64L96 448c-17.7 0-32-14.3-32-32s14.3-32 32-32zm32-240c0-8.8 7.2-16 16-16l192 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-192 0c-8.8 0-16-7.2-16-16zm16 48l192 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-192 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/></svg></span>
        <span class="nav-text">Journal</span>
      </router-link>
    </div>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: white;
  border-top: 1px solid #fbcfe8;
  padding: 0.5rem 1rem;
}
.nav-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
}
.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #64748b;
}
.nav-link.active {
  color: #db2777;
}
.nav-icon {
  font-size: 1.5rem;
}
.nav-text {
  font-size: 0.75rem;
}
svg{
  width: 20px;
  fill: #64748b;
}
.nav-link.active svg{
  fill: #db2777;
}
</style>