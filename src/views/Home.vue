<script setup lang="ts">
import { ref, onMounted, watchEffect } from "vue";
import { useNotesStore } from "../stores/notes";

const timeOfDay = ref("");
const backgroundImage = ref("");

const determineTimeOfDay = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    timeOfDay.value = "morning";
    backgroundImage.value = "url(/public/assets/bgsky.jpg)";
  } else if (hour >= 12 && hour < 13) {
    timeOfDay.value = "noon";
    backgroundImage.value = "url(/public/assets/bgsky.jpg)";
  } else if (hour >= 13 && hour < 17) {
    timeOfDay.value = "afternoon";
    backgroundImage.value = "url(/public/assets/background.jpg)";
  } else if (hour >= 17 && hour < 21) {
    timeOfDay.value = "evening";
    backgroundImage.value = "url(/public/assets/sunsetbg.jpg)";
  } else {
    timeOfDay.value = "night";
    backgroundImage.value = "url(/public/assets/moonbg.gif)";
  }
};
// Add interfaces for weather data
interface WeatherData {
  temp_c: number;
  condition: {
    text: string;
    icon: string;
  };
}

const currentWeather = ref<WeatherData>({
  temp_c: 0,
  condition: { text: "", icon: "" }
});
const forecast = ref({
  maxtemp_c: 0,
  mintemp_c: 0,
});
const airQuality = ref({
  pm2_5: 0,
  pm10: 0,
});
const API_KEY = import.meta.env.VITE_API_KEY;
const weatherError = ref<string>("");

const fetchWeather = async () => {
  try {
    const response = await fetch(
      `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=Liloan,Cebu&days=1&aqi=yes&alerts=yes`
    );
    const data = await response.json();

    currentWeather.value = data.current;
    forecast.value = data.forecast.forecastday[0].day;
    airQuality.value = data.current.air_quality;
  } catch (error) {
    weatherError.value = "Unable to fetch weather data";
    console.error("Error fetching weather:", error);
  } finally {
    isLoading.value = false;
  }
}

const isLoading = ref(true);
const imageLoadError = ref(false);

const handleImageError = (event: Event) => {
  imageLoadError.value = true;
  const imgElement = event.target as HTMLImageElement
  imgElement.src = '/public/assets/melodysticker.gif'
};

watchEffect(() => {
  const weatherInterval = setInterval(() => {
    fetchWeather();
  }, 1800000); 
  return () => clearInterval(weatherInterval);
});

onMounted(() => {
  useNotesStore().initialise();
  setInterval(determineTimeOfDay, 60000);
  determineTimeOfDay();
  fetchWeather();
});
</script>

<template>
  <div class="home-container" :style="{ backgroundImage: backgroundImage }">
    <div class="melody-header">
      <img
        class="homeMelody"
        src="/public/assets/melodysticker.gif"
        alt="My Melody"
        loading="lazy"
         @error="handleImageError"
      />
    </div>
    <div class="message-container">
      <div class="message-box">
        <div class="cloud-icon">
          <img src="/assets/cloud.png" alt="Cloud" loading="lazy" />
        </div>
        <p class="greeting">Hi Kaykayy! 💖</p>
        <p>Good {{ timeOfDay }}!</p>
        <p>I hope you're having a great {{ timeOfDay }}! <3</p>
      </div>
      <div class="cloud-icon">
        <img src="/assets/cloud.png" alt="Cloud" loading="lazy" />
      </div>
      <div class="weather">
        <h3>
          The weather in Liloan, Cebu is {{ currentWeather.condition.text }} and
          {{ currentWeather.temp_c }}°C.
        </h3>
        <div class="otherWeather">
          <div class="forecast">
            <p>Today's Forecast:</p>
            <p>High: {{ forecast.maxtemp_c }}°C</p>
            <p>Low: {{ forecast.mintemp_c }}°C</p>
          </div>
          <div class="air-quality">
            <p>Air Quality Index:</p>
            <p>PM2.5: {{ airQuality.pm2_5 }}</p>
            <p>PM10: {{ airQuality.pm10 }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  background-size: cover;
  padding: 1rem;
}
.melody-header {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}
.melody-header img {
  width: 8rem;
  height: 8rem;
}
.message-container {
  position: relative;
}
.message-box {
  background-color: white;
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  color: blueviolet;
  text-align: center;
  margin: 0 auto;
  max-width: 24rem;
  position: relative;
}
.cloud-icon {
  position: absolute;
  top: -1rem;
  left: -1rem;
  width: 4rem;
  height: 4rem;
}
.cloud-icon img {
  width: 100%;
  height: 100%;
}
.greeting {
  font-size: 1.5rem;
  color: #db2777;
  font-weight: bold;
  text-align: center;
  margin: 0;
}
.homeMelody {
  width: 100%;
  height: 100%;
}
button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #db2777;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}
.weather {
  background-color: rgba(255, 255, 255, 0.36);
  border-radius: 1.5rem;
  padding: 1rem;
  margin: 1rem auto;
  max-width: 17rem;
  text-align: center;
}
.otherWeather {
  display: flex;
  flex-direction: row;
  gap: 1rem;
}
.current-temp {
  font-size: 2rem;
  font-weight: bold;
  color: #db2777;
  margin: 0;
}
.forecast,
.air-quality {
  margin: 0.25rem 0;
  padding: 0.5rem;
  background-color: rgba(255, 74, 156, 0.1);
  border-radius: 1rem;
}

.temp p {
  margin: 0.5rem 0;
}
</style>
