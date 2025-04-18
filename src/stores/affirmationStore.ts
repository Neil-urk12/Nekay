import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAffirmationStore = defineStore('affirmation', () => {
  const dailyAffirmation = ref<string>('');

  async function fetchAffirmation() {
    try {
      console.log('Fetching affirmation...');
      const response = await fetch('https://affi-rm.vercel.app/daily-affirmation');
      console.log('Response status: ', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch affirmation');
      }
      if (response.status === 204) {
        dailyAffirmation.value = 'You are doing great! Keep up the good work!';
        return;
      }
      const data = await response.json();
      dailyAffirmation.value = data.message;
    } catch (err) {
      console.error('Error fetching affirmation: ', err);
      dailyAffirmation.value = 'You are doing great! Keep up the good work!';
    }
  }

  return { dailyAffirmation, fetchAffirmation };
});
