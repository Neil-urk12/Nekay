import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";
import { registerServiceWorker } from "../src/utils/serviceWorker";
import VueVirtualScroller from "vue-virtual-scroller";

const initApp = async () => {
  const app = createApp(App).use(router).use(createPinia()).use(VueVirtualScroller);

  try {
    registerServiceWorker();
    app.mount("#app");
  } catch (err) {
    console.error('App initialization failed:', err);
    alert("Unable to initialize app storage. Some features may be unavailable.");
    app.mount("#app");
  }
};

initApp().catch(error => {
  console.error('Critical initialization error:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1>Unable to Start App</h1>
      <p>Please try refreshing the page. If the problem persists, clear your browser data.</p>
      <pre style="color: red;">${error.message}</pre>
    </div>
  `;
});
