<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNotesStore } from '../stores/notes'
import { storeToRefs } from 'pinia'

const store = useNotesStore()
const { journalEntries, folders, loading } = storeToRefs(store)

const newEntryTitle = ref('')
const newEntryContent = ref('')
const newFolderName = ref('')
const selectedFolderId = ref<string | null>(null)
const showNewEntryForm = ref(false)

const addEntry = () => {
  if (newEntryTitle.value.trim() && newEntryContent.value.trim()) {
    store.addJournalEntry(
      newEntryTitle.value,
      newEntryContent.value,
      selectedFolderId.value
    )
    newEntryTitle.value = ''
    newEntryContent.value = ''
    showNewEntryForm.value = false
  }
}

const addFolder = () => {
  if (newFolderName.value.trim()) {
    store.addFolder(newFolderName.value, 'journal')
    newFolderName.value = ''
  }
}

const filteredEntries = computed(() => {
  if (!selectedFolderId.value) return journalEntries.value
  return journalEntries.value.filter(entry => entry.folderId === selectedFolderId.value)
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  store.fetchJournalEntries();
  store.fetchFolders();
})
</script>

<template>
  <div class="journal-container">
    <div class="content-card">
      <h1 class="page-title">
        <img src="/public/assets/melody2.gif" alt="My Melody" />
        My Journal
      </h1>

      <div class="folders-section">
        <h2>Categories</h2>
        <div class="folder-list">
          <button 
            class="folder-item"
            :class="{ active: !selectedFolderId }"
            @click="selectedFolderId = null"
          >
            All Entries
          </button>
          <button
            v-for="folder in folders.filter(f => f.type === 'journal')"
            :key="folder.id"
            class="folder-item"
            :class="{ active: selectedFolderId === folder.id }"
            @click="selectedFolderId = folder.id"
          >
            {{ folder.name }}
          </button>
        </div>
        <div class="add-folder">
          <input
            v-model="newFolderName"
            placeholder="New category name"
            @keyup.enter="addFolder"
          />
          <button @click="addFolder">Add Category</button>
        </div>
      </div>

      <div class="journal-section">
        <button
          class="new-entry-button"
          @click="showNewEntryForm = !showNewEntryForm"
        >
          {{ showNewEntryForm ? 'Cancel' : 'New Entry' }}
        </button>

        <div v-if="showNewEntryForm" class="new-entry-form">
          <input
            v-model="newEntryTitle"
            placeholder="Entry title"
            class="entry-title-input"
          />
          <textarea
            v-model="newEntryContent"
            placeholder="Write your thoughts..."
            class="entry-content-input"
          ></textarea>
          <button @click="addEntry" class="save-button">Save Entry</button>
        </div>

        <div class="entries-list">
          <div v-if="loading">Loading...</div>
          <div
            v-else
            v-for="entry in filteredEntries"
            :key="entry.id"
            class="entry-item"
          >
            <div class="entry-header">
              <h3>{{ entry.title }}</h3>
              <span class="entry-date">{{ formatDate(entry.date) }}</span>
            </div>
            <p class="entry-content">{{ entry.content }}</p>
            <button
              class="delete-button"
              @click="store.deleteJournalEntry(entry.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.journal-container {
  min-height: 100vh;
  background-color: #fce7f3;
  padding: 1rem;
  padding-bottom: 5rem;
}

.content-card {
  background-color: white;
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 24rem;
  margin: 0 auto;
}

.page-title {
  font-size: 1.875rem;
  color: #db2777;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.page-title img {
  width: 2rem;
  height: 2rem;
}

.folders-section {
  margin-bottom: 2rem;
}

.folders-section h2 {
  color: #db2777;
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.folder-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.folder-item {
  background-color: #fdf2f8;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  cursor: pointer;
  color: #db2777;
}

.folder-item.active {
  background-color: #db2777;
  color: white;
}

.add-folder {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

input,
textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #fbcfe8;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

textarea {
  min-height: 8rem;
  resize: vertical;
}

button {
  background-color: #f472b6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
}

.new-entry-button {
  width: 100%;
  margin-bottom: 1rem;
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.entry-item {
  background-color: #fdf2f8;
  padding: 1rem;
  border-radius: 0.5rem;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.entry-header h3 {
  color: #db2777;
  margin: 0;
}

.entry-date {
  font-size: 0.875rem;
  color: #9ca3af;
}

.entry-content {
  margin-bottom: 1rem;
  white-space: pre-wrap;
}

.delete-button {
  background-color: #fb7185;
  font-size: 0.875rem;
}

.delete-button:hover {
  background-color: #e11d48;
}
</style>
