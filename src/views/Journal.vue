<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNotesStore } from '../stores/notes'
import { storeToRefs } from 'pinia'
import type { Folder } from '../stores/notes'

const store = useNotesStore()
const { journalEntries, folders, loading, error } = storeToRefs(store)

const newEntryTitle = ref('')
const newEntryContent = ref('')
const newFolderName = ref('')
const selectedFolderId = ref<string | null>(null)
const showNewEntryForm = ref(false)
const displayHiddenLetter = ref(false)

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
  return journalEntries.value.filter((entry) => entry.folderId === selectedFolderId.value);
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(async () => {
  try {
    await store.fetchJournalEntries()
    await store.fetchFolders()
  } catch (e) {
    console.error("Error fetching data:", e);
  }
})
</script>

<template>
  <div class="journal-container">
    <div class="popup" v-if="displayHiddenLetter">
      <div class="modal-content">
        <span @click="displayHiddenLetter = !displayHiddenLetter" class="close">&times;</span>
        <p>ksjdfkjsdfjsdlfjsdkl</p>
      </div>
    </div>
    <div class="content-card">
      <h1 class="page-title" @click="displayHiddenLetter = !displayHiddenLetter">
        <button class="displayLetter" @click="displayHiddenLetter = !displayHiddenLetter" style="width: 5px; height: 5px;">K</button>
        <img src="/public/assets/melody2.gif" alt="My Melody" loading="lazy" />
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
            v-for="folder in folders.filter((f): f is Folder => f.type === 'journal')"
            :key="folder.id ?? ''"
            class="folder-item"
            :class="{ active: selectedFolderId === folder.id }"
            @click="selectedFolderId = folder.id ?? null"
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
          <div v-else-if="error">Error loading entries.</div>
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
              @click="entry.id && store.deleteJournalEntry(entry.id)"
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  background-color: #fef6f6;
  box-sizing: border-box;
  overflow-x: hidden;
}
.content-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  width: 100%;
}
.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 2rem;
  color: #ff69b4;
  margin-bottom: 24px;
  position: relative;
}
.page-title img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}
.displayLetter {
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: transparent;
  cursor: pointer;
}
.popup {
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
  padding: 24px;
  border-radius: 12px;
  position: relative;
  max-width: 90%;
  width: 400px;
}
.close {
  position: absolute;
  right: 16px;
  top: 16px;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}
.folders-section {margin-bottom: 32px}
.folders-section h2 {
  color: #333;
  margin-bottom: 16px;
  font-size: 1.5rem;
}
.folder-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.folder-item {
  padding: 8px 16px;
  border: none;
  background: #f0f0f0;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
}
.folder-item:hover {background: #e0e0e0}
.folder-item.active {
  background: #ff69b4;
  color: white;
}
.add-folder {
  display: flex;
  gap: 12px;
}
.add-folder input {
  flex: 1;
  padding: 8px 16px;
  border: 2px solid #eee;
  border-radius: 8px;
  font-size: 1rem;
}
.add-folder button {
  padding: 8px 16px;
  background: #ff69b4;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.add-folder button:hover {background: #ff4da6}
.journal-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
}
.new-entry-button {
  width: 100%;
  padding: 12px;
  background: #ff69b4;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
  margin-bottom: 20px;
}
.new-entry-button:hover {background: #ff4da6}
.new-entry-form {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
}
.entry-title-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #eee;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 1rem;
}
.entry-content-input {
  min-height: 120px;
  padding: 12px;
  border: 2px solid #eee;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 1rem;
  resize: vertical;
}
.save-button {
  padding: 12px 24px;
  background: #ff69b4;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.save-button:hover {background: #ff4da6}
.entries-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - 200px);
  overflow-y: auto;
}
.entry-item {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 16px;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.entry-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.entry-header h3 {
  color: #333;
  margin: 0;
  font-size: 1.2rem;
}
.entry-date {
  color: #666;
  font-size: 0.9rem;
}
.entry-content {
  color: #444;
  line-height: 1.6;
  margin-bottom: 16px;
}
.delete-button {
  padding: 6px 12px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
  font-size: 0.9rem;
}
.delete-button:hover {background: #ff2020}
@media (max-width: 768px) {
  .journal-container {padding: 12px}
  .content-card {
    padding: 16px;
    border-radius: 12px;
  }
  .page-title {
    font-size: 1.5rem;
    margin-bottom: 16px;
  }
  .page-title img {
    width: 30px;
    height: 30px;
  }
  .folder-list {gap: 8px}
  .folder-item {
    padding: 6px 12px;
    font-size: 0.9rem;
  }
  .add-folder {flex-direction: column}
  .add-folder input,
  .add-folder button {width: 100%}
  .new-entry-form {padding: 16px}
  .entry-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .entry-date {font-size: 0.8rem}
}
@media (max-width: 480px) {
  .journal-container {padding: 8px}
  .content-card {padding: 12px}
  .page-title {font-size: 1.2rem}
  .folder-item {
    font-size: 0.8rem;
    padding: 4px 10px;
  }
  .entry-header h3 {font-size: 1rem}
  .entry-content {font-size: 0.9rem}
  .delete-button {
    padding: 4px 10px;
    font-size: 0.8rem;
  }
}
</style>