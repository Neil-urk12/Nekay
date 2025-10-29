import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAffirmationStore = defineStore('affirmation', () => {
  const dailyAffirmation = ref<string>('');
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const DEFAULT_AFFIRMATION = 'You are doing great! Keep up the good work!';
  const FETCH_TIMEOUT = 10000; // 10 seconds

  async function fetchAffirmation() {
    try {
      console.log('Fetching affirmation...');
      isLoading.value = true;
      error.value = null;

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const response = await fetch('https://affi-rm.vercel.app/daily-affirmation', {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      console.log('Response status: ', response.status);
      
      if (response.status === 204) {
        dailyAffirmation.value = DEFAULT_AFFIRMATION;
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch affirmation: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate response data
      if (data && typeof data.message === 'string') {
        dailyAffirmation.value = data.message;
      } else {
        console.warn('Invalid affirmation data format:', data);
        dailyAffirmation.value = DEFAULT_AFFIRMATION;
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.error('Affirmation fetch timeout');
          error.value = 'Request timeout';
        } else {
          console.error('Error fetching affirmation: ', err.message);
          error.value = err.message;
        }
      } else {
        console.error('Unknown error fetching affirmation: ', err);
        error.value = 'Unknown error';
      }
      dailyAffirmation.value = DEFAULT_AFFIRMATION;
    } finally {
      isLoading.value = false;
    }
  }

  return { dailyAffirmation, isLoading, error, fetchAffirmation };
});
