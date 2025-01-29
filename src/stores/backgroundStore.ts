import { defineStore } from "pinia";
import { ref } from "vue";

export type TimeOfDay = "morning" | "noon" | "afternoon" | "evening" | "night";

export const useBackgroundStore = defineStore("background", () => {
  const backgroundImage = ref("");

  const setBackground = (url: string) => (backgroundImage.value = url);
  const timeOfDay = ref<TimeOfDay>("morning");

  const determineTimeOfDay = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      timeOfDay.value = "morning";
      setBackground("url(/src/assets/bgsky.webp)");
    } else if (hour >= 12 && hour < 13) {
      timeOfDay.value = "noon";
      setBackground("url(/src/assets/noonbg.webp)");
    } else if (hour >= 13 && hour < 17) {
      timeOfDay.value = "afternoon";
      setBackground("url(/src/assets/afternoon.webp)");
    } else if (hour >= 17 && hour < 19) {
      timeOfDay.value = "evening";
      setBackground("url(/src/assets/newsunset.webp)");
    } else {
      timeOfDay.value = "night";
      setBackground("url(/src/assets/moonbg.gif)");
    }
  };

  return { backgroundImage, setBackground, determineTimeOfDay, timeOfDay };
});
