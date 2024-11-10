import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import "./style.css";
// import App from "./App.vue";
import App from "/src/App.vue";
import { indexedDBService } from "./services/indexedDB";
import { registerServiceWorker } from "./utils/serviceWorker";

const initApp = async () => {
  try {
    await indexedDBService.init();
  } catch (err) {
    console.log("Failed to initialize IndexedDB: ", err);
  }
  const app = createApp(App);
  app.use(createPinia());
  app.use(router);
  app.mount("#app");
};
initApp();
registerServiceWorker();
// const app = createApp(App);
// app.use(createPinia());
// app.use(router);
// app.mount("#app");
