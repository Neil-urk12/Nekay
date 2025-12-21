import process from 'node:process'
import { register } from 'register-service-worker'

if (process.env.NODE_ENV === 'production') {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {
      console.warn('App is being served from cache by a service worker.')
    },
    registered(registration) {
      console.warn('Service worker has been registered.')
      // Check for updates every 60 seconds
      setInterval(() => {
        registration.update()
      }, 60 * 1000)
    },
    cached() {
      console.warn('Content has been cached for offline use.')
    },
    updatefound() {
      console.warn('New content is downloading.')
    },
    updated(registration) {
      console.warn('New content is available.')
      // Dispatch event for UI to handle gracefully
      document.dispatchEvent(
        new CustomEvent('sw-updated', { detail: registration }),
      )
    },
    offline() {
      console.warn('No internet connection found. App is running in offline mode.')
    },
    error(error) {
      console.error('Error during service worker registration:', error)
    },
  })
}
