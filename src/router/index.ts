import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../supabase/supabase-config'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'SecurityCheck',
      component: () => import('../views/SecurityCheck.vue'),
      meta: {
        hideBottomNav: true,
        requiresAuth: false,
      },
    },
    {
      path: '/',
      name: 'Lockscreen',
      component: () => import('../views/Login.vue'),
      meta: {
        hideBottomNav: true,
        requiresAuth: true,
      },
    },
    {
      path: '/letter',
      component: () => import('../views/LetterView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/home',
      component: () => import('../views/Home.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/water_tracker',
      component: () => import('../views/WaterTrackerView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/breathing_exercise',
      component: () => import('../views/BreathingExercisesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/pomodoro',
      component: () => import('../views/Pomodoro.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/folders',
      name: 'Folders',
      component: () => import('../views/TaskFoldersView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/folders/:id',
      name: 'FolderTasks',
      component: () => import('../views/TaskView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/tasks',
      component: () => import('../views/AllTasks.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/journal',
      component: () => import('../views/JournalFoldersView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/journal/:id',
      component: () => import('../views/JournalEntryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/messaging',
      component: () => import('../views/Messaging.vue'),
      meta: { requiresAuth: true, hideBottomNav: true },
    },
    {
      path: '/messaging/:id',
      name: 'Conversation',
      component: () => import('../views/ConversationView.vue'),
      meta: { requiresAuth: true, hideBottomNav: true },
    },
    {
      path: '/messaging/:id/settings',
      name: 'ConversationSettings',
      component: () => import('../views/ConversationSettings.vue'),
      meta: { requiresAuth: true, hideBottomNav: true },
    },
    {
      path: '/messaging/settings',
      name: 'MessagingSettings',
      component: () => import('../views/MessagingSettings.vue'),
      meta: { requiresAuth: true, hideBottomNav: true },
    },
    {
      path: '/profile/:nickname',
      name: 'Profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/me',
      name: 'UserProfile',
      component: () => import('../views/UserProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/archive',
      component: () => import('../views/ArchivePage.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// Navigation guard using Supabase
router.beforeEach(async (to, _from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  try {
    const { data: { session } } = await supabase.auth.getSession()
    const isAuthenticated = !!session?.user

    if (!isAuthenticated) {
      localStorage.setItem('isAuthenticated', 'false')
    }
    else {
      localStorage.setItem('isAuthenticated', 'true')
    }

    if (requiresAuth && !isAuthenticated) {
      next('/login')
    }
    else if (to.path === '/login' && isAuthenticated) {
      next('/')
    }
    else {
      next()
    }
  }
  catch (error) {
    console.error('Auth check error:', error)
    next('/login')
  }
})

export default router
