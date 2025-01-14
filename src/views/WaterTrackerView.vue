<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useNotesStore } from "../stores/notes";

const waterStore = useNotesStore();
const showAddModal = ref(false);
const currentDate = ref(new Date().toISOString().split('T')[0]);

const waterEntries = computed(() => {
  return waterStore.getWaterEntries || [];
});

const addWaterEntry = async (amount: number) => {
  try {
    await waterStore.addWaterEntry({
      amount,
      date: currentDate.value,
      timestamp: new Date().toISOString()
    });
    showAddModal.value = false;
  } catch (err) {
    console.error("Error adding water entry:", err);
  }
};

const deleteEntry = async (entryId: string) => {
  try {
    await waterStore.deleteWaterEntry(entryId);
  } catch (err) {
    console.error("Error deleting water entry:", err);
  }
};

onMounted(async () => {
  await waterStore.loadWaterEntries();
});
</script>

<template>
  <div class="water-tracker-container">
    <router-link to="/home" class="back-button">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="1rem">
        <path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/>
      </svg>
      Back
    </router-link>
    <div class="water-header">
      <h1>Water Tracker</h1>
      <button class="add-water-button" @click="showAddModal = true">
        Add Water
      </button>
    </div>

    <div class="water-entries-list">
      <div v-if="waterEntries.length === 0" class="empty-state">
        <p>No water entries yet. Start tracking your water intake!</p>
      </div>

      <div v-else class="water-entries">
        <div
          v-for="entry in waterEntries"
          :key="entry.id"
          class="water-entry-item"
        >
          <div class="entry-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 384 512"
              width="1rem"
            >
              <path
                fill="#60a5fa"
                d="M32 0C23.1 0 14.6 3.7 8.6 10.2S-.6 25.4 .1 34.3L28.9 437.7c3 41.9 37.8 74.3 79.8 74.3H275.3c42 0 76.8-32.4 79.8-74.3L383.9 34.3c.6-8.9-2.4-17.6-8.5-24.1S360.9 0 352 0H32zM73 156.5L66.4 64H317.6L311 156.5l-24.2 12.1c-19.4 9.7-42.2 9.7-61.6 0c-20.9-10.4-45.5-10.4-66.4 0c-19.4 9.7-42.2 9.7-61.6 0L73 156.5z"
              />
            </svg>
            <div class="entry-details">
              <h3>{{ entry.amount }}ml</h3>
              <p>{{ new Date(entry.timestamp).toLocaleTimeString() }}</p>
            </div>
          </div>
          <button class="delete-btn" @click="deleteEntry(entry.id)">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              width="1rem"
            >
              <path
                fill="#a51d2d"
                d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Add Water Modal -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Add Water Entry</h2>
        <input
          type="number"
          v-model="amount"
          placeholder="Amount in ml"
          class="water-input"
        />
        <div class="modal-actions">
          <button class="btn-secondary" @click="showAddModal = false">
            Cancel
          </button>
          <button
            class="btn-primary"
            @click="addWaterEntry(parseInt(amount))"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.water-tracker-container {
  background: rgb(255, 255, 255);
  min-height: 90vh;
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: rgb(37, 99, 235);
  font-weight: 500;
  margin-bottom: 1rem;
  width: fit-content;
}

.back-button:hover {
  opacity: 0.8;
}

.water-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h1 {
  color: rgb(37, 99, 235);
}

.add-water-button {
  background: rgb(37, 99, 235);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  border-radius: 5px;
  cursor: pointer;
}

.add-water-button:hover {
  background: white;
  color: rgb(37, 99, 235);
  border: 1px solid rgb(37, 99, 235);
}

.empty-state {
  text-align: center;
  background: rgb(219, 234, 254);
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.water-entry-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: rgb(239, 246, 255);
  border: 1px solid rgb(191, 219, 254);
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.entry-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.entry-details h3 {
  margin: 0;
  color: rgb(37, 99, 235);
}

.entry-details p {
  margin: 0;
  font-size: 0.8rem;
  color: rgb(107, 114, 128);
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.delete-btn:hover {
  opacity: 0.8;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
}

.water-input {
  width: 100%;
  padding: 0.5rem;
  margin: 1rem 0;
  border: 1px solid rgb(37, 99, 235);
  border-radius: 5px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-secondary {
  background: #ddd;
  color: #333;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}

.btn-primary {
  background: rgb(37, 99, 235);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}
</style>
