import { createRouter, createWebHistory } from 'vue-router' 

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('../views/Login.vue') },
    { path: '/',component: () => import('../views/Home.vue') },
    { path: '/home', redirect: '/' },
    { path: '/pomodoro', component: () => import('../views/Pomodoro.vue') },
    { path: '/tasks', component: () => import('../views/Tasks.vue') },
    { path: '/journal', component: () => import('../views/Journal.vue') }
  ]
})

export default router