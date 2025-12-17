export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js', {
          scope: '/',
        })
        .catch((error) => {
          console.error('ServiceWorker registration failed:', error)
        })
    })
  }
}
