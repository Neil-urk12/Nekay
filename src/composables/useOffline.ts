import { ref, onMounted, onUnmounted } from "vue";

export function useOffline() {
  const isOffline = ref(false);
  const lastOnlineTime = ref<Date | null>(null);
  const reconnectionAttempts = ref(0);
  const maxReconnectionAttempts = 5;
  const reconnectionDelay = 5000; // 5 seconds

  const updateOnlineStatus = () => {
    const wasOffline = isOffline.value;
    isOffline.value = !navigator.onLine;
    
    if (!isOffline.value && wasOffline) {
      // We're back online
      lastOnlineTime.value = new Date();
      reconnectionAttempts.value = 0;
      window.dispatchEvent(new CustomEvent('app-online'));
    } else if (isOffline.value && !wasOffline) {
      // We've gone offline
      window.dispatchEvent(new CustomEvent('app-offline'));
    }
  };

  const checkConnection = async () => {
    try {
      const response = await fetch('/manifest.json', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      if (response.ok) {
        isOffline.value = false;
        lastOnlineTime.value = new Date();
        reconnectionAttempts.value = 0;
        window.dispatchEvent(new CustomEvent('app-online'));
      }
    } catch (error) {
      isOffline.value = true;
      reconnectionAttempts.value++;
      
      if (reconnectionAttempts.value < maxReconnectionAttempts) {
        setTimeout(checkConnection, reconnectionDelay);
      }
      window.dispatchEvent(new CustomEvent('app-offline'));
    }
  };

  const forceCheck = () => {
    reconnectionAttempts.value = 0;
    checkConnection();
  };

  onMounted(() => {
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    
    // Initial check
    updateOnlineStatus();
    checkConnection();

    // Set up periodic connection checks when offline
    const intervalId = setInterval(() => {
      if (isOffline.value) {
        checkConnection();
      }
    }, reconnectionDelay);

    onUnmounted(() => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      clearInterval(intervalId);
    });
  });

  return {
    isOffline,
    lastOnlineTime,
    reconnectionAttempts,
    forceCheck
  };
}
