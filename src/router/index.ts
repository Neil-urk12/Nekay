import { createRouter, createWebHistory } from "vue-router";
import { auth } from "../firebase/firebase-config";
import { onAuthStateChanged } from "firebase/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "SecurityCheck",
      component: () => import("../views/SecurityCheck.vue"),
      meta: {
        hideBottomNav: true,
        requiresAuth: false,
      },
    },
    {
      path: "/",
      name: "Lockscreen",
      component: () => import("../views/Login.vue"),
      meta: {
        hideBottomNav: true,
        requiresAuth: true,
      },
    },
    {
      path: "/sync-test",
      component: () => import("../components/SyncTester.vue"),
    },
    {
      path: "/letter",
      component: () => import("../views/LetterView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/home",
      component: () => import("../views/Home.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/water_tracker",
      component: () => import("../views/WaterTrackerView.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/breathing_exercise",
      component: () => import("../views/BreathingExercisesView.vue"),
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
    {
      path: "/messaging",
      component: () => import("../views/Messaging.vue"),
      meta: { requiresAuth: true }
    },
    {
      path: "/profile/:nickname",
      name: "Profile",
      component: () => import("../views/ProfileView.vue"),
      meta: { requiresAuth: true }
    },
    {
      path: "/archive",
      component: () => import("../views/ArchivePage.vue"),
      meta: { requiresAuth: true }
    },
    // {
    //   path: "/settings",
    //   component: () => import("../views/SettingsView.vue"),
    // },
  ],
});

// Navigation guard
router.beforeEach(async (to, _from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  // console.log(requiresAuth)
  
  const isAuthenticated = localStorage.getItem("isAuthenticated");

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      
      if (!isAuthenticated) {
        localStorage.setItem("isAuthenticated", "false");
        resolve(next("/login"))
      }
      if (requiresAuth && !user) {
        resolve(next("/login"));
      } else if (to.path === "/login" && user) {
        resolve(next("/"));
      } else {
        resolve(next());
      }
    });
  });
});
// router.beforeEach((to, _from, next) => {
//   const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

//   onAuthStateChanged(auth, (user) => {
//     if (requiresAuth && !user) {
//       next("/login");
//     } else if (to.path === "/login" && user) {
//       next("/");
//     } else {
//       next();
//     }
//   });
// });

export default router;
