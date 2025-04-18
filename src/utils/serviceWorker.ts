export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js", {
          scope: "/",
        })
        .then((registration) => {
          console.log(
            "ServiceWorker registration successful:",
            registration.scope
          );
        })
        .catch((error) => {
          console.error("ServiceWorker registration failed:", error);
        });
    });
  }
}
