<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNotesStore } from "../stores/notes";
import AddJournalEntryModal from "../components/AddJournalEntryModal.vue";

const entryStore = useNotesStore();
const router = useRouter();
const route = useRoute();

const entries = computed(() => entryStore.getEntries);
const folders = computed(() => entryStore.getJournalFolders);
const currentFolderId = computed(() => route.params.id as string);
const currentFolder = computed(() =>
  folders.value.find((f) => f.id === currentFolderId.value)
);
const currentFolderEntries = computed(() =>
  entries.value.filter((task) => task.folderId === currentFolderId.value)
);
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear().toString().slice(-2); // Get last 2 digits of year
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
// const formattedEntries = computed(() =>
//   currentFolderEntries.value.map((entry) => ({
//     ...entry,
//     formattedDate: formatDate(entry.date),
//   }))
// );

const showModal = ref(false);
const openModal = () => {
  showModal.value = true;
};
const closeModal = () => {
  showModal.value = false;
};

const addEntry = async (entry: { title: string; content: string }) => {
  try {
    if (!entry) return;

    await entryStore.addEntry(
      entry.title.trim(),
      entry.content.trim(),
      currentFolderId.value
    );
    closeModal();
  } catch (err) {
    console.error(err);
  }
};

onMounted(async () => {
  if (!currentFolder.value || !currentFolderId.value) router.push("/journal");
  if (folders.value.length === 0) await entryStore.loadFolders();
  await entryStore.loadEntries();
});
</script>

<template>
  <div class="folder-view">
    <div class="folder-header">
      <button class="back-button" @click="router.push('/journal')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          width="1rem"
        >
          <path
            fill="currentColor"
            d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"
          />
        </svg>
      </button>
      <h1>{{ currentFolder?.name }}</h1>
      <button class="add-entry-button" @click="openModal">Add Entry</button>
    </div>
    <AddJournalEntryModal
      v-if="showModal"
      @close="closeModal"
      @addEntry="addEntry"
    />

    <div class="entries-list" v-if="entries.length">
      <div
        v-for="entry in currentFolderEntries"
        :key="entry.id"
        class="entry-item"
      >
        <h2 class="entry-title">{{ entry.title }}</h2>
        <p class="entry-date">{{ formatDate(entry.date) }}</p>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>No entries yet. Click "Add Entry" to create your first entry!</p>
    </div>
  </div>
</template>

<style scoped>
* {
  font-family: "Concert One", "Montserrat", sans-serif;
}
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
  color: rgb(219, 39, 119);
}

.back-button:hover {
  color: rgb(219, 39, 119);
}

h1 {
  color: rgb(219, 39, 119);
  margin: 0;
  flex-grow: 1;
}

.add-entry-button {
  background: rgb(219, 39, 119);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}

.add-entry-button:hover {
  background: white;
  color: rgb(219, 39, 119);
  border: 1px solid rgb(219, 39, 119);
}

.empty-state {
  text-align: center;
  color: #666;
  margin-top: 2rem;
}

.entry-item {
  background-color: #fdf2f8;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #fbcfe8;
  margin: 0 0 0.5rem 0;
}

.entry-title {
  color: #db2777;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  font-size: 1.25rem;
}

.entry-date {
  color: #f472b6;
  font-size: 0.9rem;
  margin: 0 0 0.5rem 0;
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
