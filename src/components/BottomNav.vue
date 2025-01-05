<script setup lang="ts">
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <nav class="bottom-nav">
    <div class="nav-container">
      <router-link to="/" :class="['nav-link', { active: route.path === '/' }]">
        <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 .7 160.2c0 2.7-.2 5.4-.5 8.1l0 16.2c0 22.1-17.9 40-40 40l-16 0c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1L416 512l-24 0c-22.1 0-40-17.9-40-40l0-24 0-64c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32l0 64 0 24c0 22.1-17.9 40-40 40l-24 0-31.9 0c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2l-16 0c-22.1 0-40-17.9-40-40l0-112c0-.9 0-1.9 .1-2.8l0-69.7-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg></span>
        <span class="nav-text">Home</span>
      </router-link>
      <router-link to="/pomodoro" :class="['nav-link', { active: route.path === '/pomodoro' }]">
        <span class="nav-icon"><svg fill="#000000" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 7.008q0 1.856 0.992 3.52 1.184-3.328 3.712-5.824t5.824-3.712q-1.696-0.992-3.52-0.992-2.912 0-4.96 2.080t-2.048 4.928zM2.016 16q0 2.784 1.056 5.312t2.944 4.48v4.224q0 0.832 0.576 1.408t1.408 0.576 1.408-0.576 0.608-1.408v-1.408q2.912 1.408 5.984 1.408t6.016-1.408v1.408q0 0.832 0.576 1.408t1.408 0.576 1.408-0.576 0.608-1.408v-4.224q1.888-1.952 2.944-4.448t1.056-5.344-1.12-5.44-2.976-4.48-4.48-2.976-5.44-1.12-5.44 1.12-4.48 2.976-2.976 4.48-1.088 5.44zM6.016 16q0-2.048 0.768-3.872t2.144-3.2 3.2-2.144 3.872-0.8q2.72 0 5.024 1.344t3.648 3.648 1.344 5.024q0 2.016-0.8 3.872t-2.144 3.2-3.2 2.144-3.872 0.768q-2.72 0-5.024-1.312t-3.616-3.648-1.344-5.024zM14.016 16q0 0.832 0.576 1.408t1.408 0.576h4q0.832 0 1.408-0.576t0.608-1.408-0.608-1.408-1.408-0.608h-1.984v-1.984q0-0.832-0.608-1.408t-1.408-0.608-1.408 0.608-0.576 1.408v4zM21.472 0.992q3.328 1.216 5.824 3.712t3.712 5.824q0.992-1.664 0.992-3.52 0-2.88-2.048-4.928t-4.96-2.080q-1.824 0-3.52 0.992z"></path>
          </svg></span>
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