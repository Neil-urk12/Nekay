<script setup lang="ts">
import { ref } from 'vue'
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
        <span class="nav-icon">📝</span>
        <span class="nav-text">Tasks</span>
      </router-link>
      <router-link to="/journal" :class="['nav-link', { active: route.path === '/journal' }]">
        <span class="nav-icon">📔</span>
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
</style>