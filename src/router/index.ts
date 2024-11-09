import { createRouter, createWebHistory } from 'vue-router' 

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',component: () => import('../views/Home.vue') },
    { path: '/pomodoro', component: () => import('../views/Pomodoro.vue') },
    { path: '/tasks', component: () => import('../views/Tasks.vue') },
    { path: '/journal', component: () => import('../views/Journal.vue') }
  ]
})

export default router