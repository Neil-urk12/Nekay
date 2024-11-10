import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import "./style.css";
import App from "./App.vue";
import { indexedDBService } from "./services/indexedDB";
import { registerServiceWorker } from "./utils/serviceWorker";
import { useNotesStore } from "./stores/notes";

const initApp = async () => {
  try {
    await indexedDBService.init(); // Initialize IndexedDB only once
  } catch (err) {
    console.log("Failed to initialize IndexedDB: ", err);
  }
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.use(router);
  
  // Initialize the notes store
  const notesStore = useNotesStore(pinia);
  notesStore.initialise(); // Remove the call to indexedDBService.init() here

  app.mount("#app");
};
initApp();
registerServiceWorker();
// const app = createApp(App);
// app.use(createPinia());
// app.use(router);
// app.mount("#app");
