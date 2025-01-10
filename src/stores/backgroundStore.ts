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
      setBackground("url(https://s6.imgcdn.dev/pSKhw.png)");
    } else if (hour >= 12 && hour < 13) {
      timeOfDay.value = "noon";
      setBackground("url(https://s6.imgcdn.dev/pSsaL.jpg)");
    } else if (hour >= 13 && hour < 18) {
      timeOfDay.value = "afternoon";
      setBackground("url(https://s6.imgcdn.dev/pSimB.png)");
    } else if (hour >= 18 && hour < 20) {
      timeOfDay.value = "evening";
      setBackground("url(https://s6.imgcdn.dev/pSyWa.jpg)");
    } else {
      timeOfDay.value = "night";
      setBackground("url(https://s6.imgcdn.dev/pSnuu.gif)");
    }
  };

  return { backgroundImage, setBackground, determineTimeOfDay, timeOfDay };
});
