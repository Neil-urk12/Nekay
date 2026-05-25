import { createPinia } from 'pinia'
import { createApp } from 'vue'
import VueVirtualScroller from 'vue-virtual-scroller'
import { registerServiceWorker } from './utils/serviceWorker'
import App from './App.vue'
import router from './router'
import { displayCriticalError } from './utils/displayCriticalError'

async function initApp() {
  const app = createApp(App).use(router).use(createPinia()).use(VueVirtualScroller)

  try {
    registerServiceWorker()
    app.mount('#app')
  }
  catch (err) {
    console.error('App initialization failed:', err)
    console.warn('Unable to initialize app storage. Some features may be unavailable.')
    app.mount('#app')
  }
}

initApp().catch(displayCriticalError)
