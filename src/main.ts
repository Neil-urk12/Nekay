import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import "./style.css";
import App from "./App.vue";
import { indexedDBService } from "./services/indexedDB";
import { registerServiceWorker } from "./utils/serviceWorker";

interface IndexedDBError {
  code: string;
  message: string;
  details?: string;
}

const initApp = async () => {
  // Create app instance and plugins first
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);
  app.use(router);

  try {
    // Initialize IndexedDB first
    await indexedDBService.init();
    
    // Register service worker after IndexedDB is ready
    await registerServiceWorker();
    
    // Mount the app
    app.mount("#app");
  } catch (err) {
    const error = err as IndexedDBError;
    console.error('App initialization failed:', error);
    
    if (error.code === "INDEXEDDB_INIT_ERROR") {
      alert(`Unable to start offline storage: ${error.message}`);
    } else if (error.code === "INDEXEDDB_BLOCKED") {
      alert(error.message);
    } else {
      alert("Unable to initialize app storage. Some features may be unavailable.");
    }
    
    // Mount the app anyway so users can at least see error messages
    app.mount("#app");
  }
};

// Start initialization
initApp().catch(error => {
  console.error('Critical initialization error:', error);
  // Show a user-friendly error page or message
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1>Unable to Start App</h1>
      <p>Please try refreshing the page. If the problem persists, clear your browser data.</p>
      <pre style="color: red;">${error.message}</pre>
    </div>
  `;
});
