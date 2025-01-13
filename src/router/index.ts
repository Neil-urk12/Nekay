import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: () => import("../views/Login.vue"),
      meta: {
        hideBottomNav: true,
        requiresAuth: false,
      },
    },
    {
      path: "/",
      component: () => import("../views/Home.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/home",
      redirect: "/",
      meta: { requiresAuth: true },
    },
    {
      path: "/pomodoro",
      component: () => import("../views/Pomodoro.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/folders",
      name: "Folders",
      component: () => import("../views/TaskFoldersView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/folders/:id",
      name: "FolderTasks",
      component: () => import("../views/TaskView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/tasks",
      component: () => import("../views/AllTasks.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/journal",
      component: () => import("../views/JournalFoldersView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/journal/:id",
      component: () => import("../views/JournalEntryView.vue"),
      meta: { requiresAuth: true },
    },
    // {
    //   path: "/settings",
    //   component: () => import("../views/SettingsView.vue"),
    // },
  ],
});

// Navigation guard
router.beforeEach((to, _from, next) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const requiresAuth = to.meta.requiresAuth;

  if (requiresAuth && !isAuthenticated) 
    next("/login");
  else if (to.path === "/login" && isAuthenticated) 
    next("/");
  else 
    next();
});

export default router;
