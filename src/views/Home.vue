<script setup lang="ts">
import { ref, onMounted, watchEffect, computed } from "vue";
import { useNotesStore } from "../stores/notes";

// Types
interface WeatherData {
  temp_c: number;
  condition: {
    text: string;
    icon: string;
  };
}

interface Forecast {
  maxtemp_c: number;
  mintemp_c: number;
}

interface AirQuality {
  pm2_5: number;
  pm10: number;
}

type TimeOfDay = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

// Constants
const WEATHER_REFRESH_INTERVAL = 1800000; // 30 minutes
const TIME_REFRESH_INTERVAL = 60000; // 1 minute
const API_KEY = import.meta.env.VITE_API_KEY;
const WEATHER_API_URL = `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=Liloan,Cebu&days=1&aqi=yes&alerts=yes`;

// State
const timeOfDay = ref<TimeOfDay>('morning'); // Initialize with a default value
const backgroundImage = ref("");
const currentWeather = ref<WeatherData>({
  temp_c: 0,
  condition: { text: "", icon: "" }
});
const forecast = ref<Forecast>({
  maxtemp_c: 0,
  mintemp_c: 0,
});
const airQuality = ref<AirQuality>({
  pm2_5: 0,
  pm10: 0,
});
const isLoading = ref(true);
const imageLoadError = ref(false);
const weatherError = ref<string>("");

// Computed
const greetingMessage = computed(() => {
  const messages: Record<TimeOfDay, string> = {
    morning: "Rise and shine! Have a wonderful morning! ",
    noon: "Hope you're having a great lunch! ",
    afternoon: "Keep going strong this afternoon! ",
    evening: "Winding down for a peaceful evening! ",
    night: "Sweet dreams ahead! "
  };
  return messages[timeOfDay.value as TimeOfDay] || "Have a great day!";
});

const airQualityStatus = computed(() => {
  const pm25 = airQuality.value.pm2_5;
  if (pm25 <= 12) return { text: "Good", color: "text-green-500" };
  if (pm25 <= 35.4) return { text: "Moderate", color: "text-yellow-500" };
  if (pm25 <= 55.4) return { text: "Unhealthy for Sensitive Groups", color: "text-orange-500" };
  return { text: "Unhealthy", color: "text-red-500" };
});

// Methods
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

const fetchWeather = async () => {
  try {
    const response = await fetch(WEATHER_API_URL);
    if (!response.ok) throw new Error('Weather API request failed');
    
    const data = await response.json();
    currentWeather.value = data.current;
    forecast.value = data.forecast.forecastday[0].day;
    airQuality.value = data.current.air_quality;
    weatherError.value = "";
  } catch (error) {
    weatherError.value = "Unable to fetch weather data";
    console.error("Error fetching weather:", error);
  } finally {
    isLoading.value = false;
  }
};

const handleImageError = (event: Event) => {
  imageLoadError.value = true;
  const imgElement = event.target as HTMLImageElement;
  imgElement.src = '/public/assets/melodysticker.gif';
};

// Lifecycle
watchEffect(() => {
  const weatherInterval = setInterval(fetchWeather, WEATHER_REFRESH_INTERVAL);
  return () => clearInterval(weatherInterval);
});

onMounted(() => {
  useNotesStore().initialise();
  setInterval(determineTimeOfDay, TIME_REFRESH_INTERVAL);
  determineTimeOfDay();
  fetchWeather();
});
</script>

<template>
  <div class="home-container" :style="{ backgroundImage: backgroundImage }">
    <div class="melody-header">
      <img
        class="homeMelody animate-bounce"
        src="/public/assets/melodysticker.gif"
        alt="My Melody"
        loading="lazy"
        @error="handleImageError"
      />
    </div>

    <div class="message-container">
      <div class="message-box animate-fade-in">
        <div class="cloud-icon animate-float">
          <img src="/assets/cloud.png" alt="Cloud" loading="lazy" />
        </div>
        <p class="greeting">Hi Kaykayy! </p>
        <p>{{ greetingMessage }}</p>
      </div>

      <transition name="fade">
        <div v-if="!isLoading" class="weather animate-fade-in">
          <template v-if="!weatherError">
            <h3 class="current-weather">
              <img 
                :src="currentWeather.condition.icon" 
                :alt="currentWeather.condition.text"
                class="inline-block w-8 h-8 mr-2"
              />
              {{ currentWeather.condition.text }} • {{ currentWeather.temp_c }}°C
            </h3>

            <div class="weather-details">
              <div class="forecast">
                <p class="text-lg font-semibold">Today's Forecast</p>
                <div class="flex justify-between">
                  <p>High: <span class="text-red-500">{{ forecast.maxtemp_c }}°C</span></p>
                  <p>Low: <span class="text-blue-500">{{ forecast.mintemp_c }}°C</span></p>
                </div>
              </div>

              <div class="air-quality">
                <p class="text-lg font-semibold">Air Quality</p>
                <p :class="airQualityStatus.color">{{ airQualityStatus.text }}</p>
                <div class="text-sm">
                  <p>PM2.5: {{ airQuality.pm2_5.toFixed(1) }}</p>
                  <p>PM10: {{ airQuality.pm10.toFixed(1) }}</p>
                </div>
              </div>
            </div>
          </template>
          <p v-else class="text-red-500">{{ weatherError }}</p>
        </div>
        <div v-else class="weather-loading">
          <div class="loading-spinner"></div>
          <p>Loading weather data...</p>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 1rem;
  transition: background-image 1s ease-in-out;
}

.melody-header {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.homeMelody {
  width: 8rem;
  height: 8rem;
  transition: transform 0.3s ease;
}

.homeMelody:hover {
  transform: scale(1.1);
}

.message-container {
  max-width: 32rem;
  margin: 0 auto;
  z-index: 3;
}

.message-box {
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  font-weight: 800;
  color: blueviolet;
  text-align: center;
  position: relative;
  margin-bottom: 2rem;
  transition: transform 0.3s ease;
}

.message-box:hover {
  transform: translateY(-5px);
}

.cloud-icon {
  position: absolute;
  top: -1rem;
  left: -1rem;
  width: 4rem;
  height: 4rem;
  z-index: -1;
}

.greeting {
  font-size: 1.5rem;
  color: #db2777;
  font-weight: bold;
  margin-bottom: 1rem;
}

.weather {
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.current-weather {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.weather-details {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  font-size: 0.9rem;
}

.forecast, .air-quality {
  flex: 1;
}

.forecast p, .air-quality p {
  margin: 0.25rem 0;
}

.forecast, .air-quality {
  background-color: rgba(255, 255, 255, 0.5);
  padding: 1rem;
  border-radius: 1rem;
  transition: background-color 0.3s ease;
}

.forecast:hover, .air-quality:hover {
  background-color: rgba(255, 255, 255, 0.8);
}

.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #db2777;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-bounce {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsive Design */
@media (max-width: 640px) {
  .message-box, .weather {
    margin: 1rem;
    padding: 1rem;
  }

  .weather-details {
    flex-direction: column;
  }

  .homeMelody {
    width: 6rem;
    height: 6rem;
  }
}
</style>
