import { defineStore } from "pinia";
import { ref } from "vue";

export type TimeOfDay = "morning" | "noon" | "afternoon" | "evening" | "night";

export const useBackgroundStore = defineStore("background", () => {
  const backgroundImage = ref("");

  const setBackground = (url: string) => (backgroundImage.value = url);
  const timeOfDay = ref<TimeOfDay>("morning");

  const getRandomNumber = () => Math.floor(Math.random() * 2) + 1;

  const determineTimeOfDay = () => {
    const hour = new Date().getHours();
    const randomNumber = getRandomNumber();

    if (hour >= 5 && hour < 12) {
      timeOfDay.value = "morning";
      setBackground("url(/assets/bgsky.webp)");
    } else if (hour >= 12 && hour < 13) {
      timeOfDay.value = "noon";
      setBackground("url(/assets/noonbg.webp)");
    } else if (hour >= 13 && hour < 17) {
      timeOfDay.value = "afternoon";
      setBackground("url(/assets/afternoon.webp)");
    } else if (hour >= 17 && hour < 19) {
      timeOfDay.value = "evening";
      setBackground("url(/assets/newsunset.webp)");
    } else {
      timeOfDay.value = "night";
      if (randomNumber === 1) {
        setBackground("url(/assets/galaxy.webp)");

      } else {
        setBackground("url(/assets/moonbg.gif)");
      }
    }
  };

  return { backgroundImage, setBackground, determineTimeOfDay, timeOfDay };
});
