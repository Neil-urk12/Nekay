import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import "./style.css";
import App from "./App.vue";
import { indexedDBService } from "./services/indexedDB";
import { registerServiceWorker } from "./utils/serviceWorker";
import { useNotesStore } from "./stores/notes";

interface IndexedDBError {
  code: string;
  message: string;
  details?: string;
}

const initApp = async () => {
  try {
    await indexedDBService.init(); 
  } catch (err) {
    const error = err as IndexedDBError;
    if (error.code === "INDEXEDDB_INIT_ERROR") {
      // Show user-friendly notification or UI message
      alert(`Unable to start offline storage: ${error.message}`);
    } else if (error.code === "INDEXEDDB_BLOCKED") {
      alert(error.message);
    } else {
      alert("Unable to initialize app storage. Some features may be unavailable.");
    }
  }
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.use(router);
  
  const notesStore = useNotesStore(pinia);
  notesStore.initialise(); 

  app.mount("#app");
};
initApp();
registerServiceWorker();
