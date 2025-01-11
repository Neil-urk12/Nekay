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
      meta: { requiresAuth: false },
    },
    {
      path: "/home",
      redirect: "/",
      meta: { requiresAuth: false },
    },
    {
      path: "/pomodoro",
      component: () => import("../views/Pomodoro.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/folders",
      name: "Folders",
      component: () => import("../views/TaskFoldersView.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/folders/:id",
      name: "FolderTasks",
      component: () => import("../views/TaskView.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/tasks",
      component: () => import("../views/AllTasks.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/journal",
      component: () => import("../views/JournalFolders.vue"),
      meta: { requiresAuth: false },
    },
    {
      path: "/journal/:id",
      component: () => import("../views/JournalEntryView.vue"),
      meta: { requiresAuth: false },
    },
  ],
});

// Navigation guard
router.beforeEach((to, _from, next) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const requiresAuth = to.meta.requiresAuth;

  if (requiresAuth && !isAuthenticated) {
    next("/login");
  } else if (to.path === "/login" && isAuthenticated) {
    next("/");
  } else {
    next();
  }
});

export default router;
