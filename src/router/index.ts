import { createRouter, createWebHistory } from 'vue-router' 

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: {
        hideBottomNav: true,
        requiresAuth: false
      }
    },
    { 
      path: '/',
      component: () => import('../views/Home.vue'),
      meta: { requiresAuth: true }
    },
    { 
      path: '/home', 
      redirect: '/',
      meta: { requiresAuth: true }
    },
    { 
      path: '/pomodoro', 
      component: () => import('../views/Pomodoro.vue'),
      meta: { requiresAuth: true }
    },
    { 
      path: '/tasks', 
      component: () => import('../views/Tasks.vue'),
      meta: { requiresAuth: true }
    },
    { 
      path: '/journal', 
      component: () => import('../views/Journal.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation guard
router.beforeEach((to, _from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router