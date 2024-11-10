import { ref, onMounted, onUnmounted } from "vue";

export function useOffline() {
  const isOffline = ref(false);

  const updateOnlineStatus = () => {
    isOffline.value = !navigator.onLine;
  };

  onMounted(() => {
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();
  });

  onUnmounted(() => {
    window.removeEventListener("online", updateOnlineStatus);
    window.removeEventListener("offline", updateOnlineStatus);
  });

  return {
    isOffline,
  };
}
