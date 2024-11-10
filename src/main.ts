import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import App from './App.vue'
import { useNotesStore } from './stores/notes'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

app.mount('#app')

pinia.use(({ store }) => {
  if (store.$id === 'notes') {
    store.fetchTasks();
    store.fetchJournalEntries();
    store.fetchFolders();
  }
})
