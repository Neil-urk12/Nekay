<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const folder = ref(null);
const entries = ref([]);

onMounted(() => {
  // This is where you would typically fetch the folder and its entries
  // For now, we'll use mock data
  folder.value = {
    id: parseInt(route.params.id),
    name: 'Loading...' // This would be updated with actual folder data
  };
  
  entries.value = []; // This would be populated with actual entries
});

const goBack = () => {
  router.push('/');
};
</script>

<template>
  <div class="folder-view">
    <div class="folder-header">
      <button class="back-button" @click="goBack">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="1rem">
          <path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/>
        </svg>
      </button>
      <h1>{{ folder?.name }}</h1>
      <button class="add-entry-button">Add Entry</button>
    </div>

    <div class="entries-list" v-if="entries.length">
      <div v-for="entry in entries" :key="entry.id" class="entry-item">
        {{ entry.title }}
      </div>
    </div>
    
    <div v-else class="empty-state">
      <p>No entries yet. Click "Add Entry" to create your first entry!</p>
    </div>
  </div>
</template>

<style scoped>
.folder-view {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
  background: rgb(255, 255, 255);
  min-height: 90vh;
  display: flex;
  flex-direction: column;
}

.folder-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: rgb(219,39,119);
}

.back-button:hover {
  color: rgb(219,39,119);
}

h1 {
  color: rgb(219,39,119);
  margin: 0;
  flex-grow: 1;
}

.add-entry-button {
  background: rgb(219,39,119);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}

.add-entry-button:hover {
  background: white;
  color: rgb(219,39,119);
  border: 1px solid rgb(219,39,119);
}

.empty-state {
  text-align: center;
  color: #666;
  margin-top: 2rem;
}
</style>
