<script setup lang="ts">
import { ref, onMounted, computed, defineAsyncComponent } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNotesStore } from "../stores/notes";
import AddJournalEntryModal from "../components/AddJournalEntryModal.vue";
import DeleteEntryModal from "../components/DeleteEntryModal.vue";
import { JournalEntry } from "../composables/interfaces";
const EditEntryModal = defineAsyncComponent(
  () => import("../components/EditEntryModal.vue")
);
const TrashIconSvg = defineAsyncComponent(
  () => import("../components/TrashIconSvg.vue")
);

const entryStore = useNotesStore();
const router = useRouter();
const route = useRoute();

const showEditModal = ref(false);
const selectedEntry = ref<{
  id: string;
  title: string;
  content: string;
} | null>(null);
const editingEntry = ref<{ id: string; title: string } | null>(null);
const showDeleteModal = ref<{ id: string; title: string } | null>(null);
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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const formattedEntries = computed(() =>
  currentFolderEntries.value.map((entry) => ({
    ...entry,
    formattedDate: formatDate(entry.date),
  }))
);
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

const editEntry = async (updatedEntry: {
  id: string;
  title: string;
  content: string;
}) => {
  try {
    await entryStore.editJournalEntry(updatedEntry.id, {
      title: updatedEntry.title,
      content: updatedEntry.content,
    });
  } catch (err) {
    console.error("Failed to edit entry: ", err);
  }
};

const openEditModal = (entry: JournalEntry) => {
  selectedEntry.value = entry;
  showEditModal.value = true;
};

const saveEdit = async () => {
  if (!editingEntry.value) return;
  try {
    await entryStore.editJournalEntry(editingEntry.value.id, {
      title: editingEntry.value.title,
    });
    editingEntry.value = null;
  } catch (err) {
    console.error("Failed to edit entry : ", err);
  }
};

const confirmDelete = async (id: string) => {
  try {
    await entryStore.deleteJournalEntry(id);
    showDeleteModal.value = null;
  } catch (err) {
    console.error("Failed to delete entry : ", err);
  }
};

const expandedEntries = ref<Set<string>>(new Set());

const toggleEntry = (entryId: string) => {
  if (expandedEntries.value.has(entryId)) {
    expandedEntries.value.delete(entryId);
  } else {
    expandedEntries.value.add(entryId);
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

    <div class="entries-list" v-if="currentFolderEntries.length">
      <div v-for="entry in formattedEntries" :key="entry.id" class="entry-item">
        <div class="entry-header">
          <div class="entry-header-left">
            <button 
              class="collapse-btn" 
              @click="toggleEntry(entry.id)"
              :class="{ 'expanded': expandedEntries.has(entry.id) }"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 320 512"
                width="0.8rem"
              >
                <path
                  fill="currentColor"
                  d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"
                />
              </svg>
            </button>
            <template v-if="editingEntry?.id === entry.id">
              <input
                v-model="editingEntry.title"
                @keyup.enter="saveEdit"
                @keyup.esc="editingEntry = null"
                class="edit-input"
                @click.stop
              />
            </template>
            <template v-else>
              <h2 class="entry-title">{{ entry.title }}</h2>
            </template>
          </div>
          
          <div class="entry-actions">
            <button class="icon-btn" @click.stop="openEditModal(entry)">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                width="1.2rem"
              >
                <path
                  fill="black"
                  d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z"
                />
              </svg>
            </button>
            <button
              class="icon-btn"
              @click.stop="showDeleteModal = { id: entry.id, title: entry.title }"
            >
              <TrashIconSvg/>
            </button>
          </div>
        </div>
        
        <div class="entry-content">
          <p class="entry-date">{{ entry.formattedDate }}</p>
          <p v-if="expandedEntries.has(entry.id)" class="entry-text">
            {{ entry.content }}
          </p>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>No entries yet. Click "Add Entry" to create your first entry!</p>
    </div>
    <DeleteEntryModal
      v-if="showDeleteModal"
      :show="!!showDeleteModal"
      :title="showDeleteModal?.title"
      :id="showDeleteModal?.id"
      @close="showDeleteModal = null"
      @delete="confirmDelete"
    />
  </div>
  <EditEntryModal
    v-if="showEditModal"
    :entry="selectedEntry"
    @close="showEditModal = false"
    @editEntry="editEntry"
  />
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
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #fbcfe8;
  margin: 0 0 0.5rem 0;
  display: flex;
  flex-direction: column;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.entry-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.entry-content {
  margin-left: 1.8rem;
}

.entry-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: rgb(219, 39, 119);
  transition: transform 0.2s ease;
}

.collapse-btn.expanded {
  transform: rotate(90deg);
}

.entry-title {
  color: #db2777;
  margin: 0;
  font-weight: 600;
  font-size: 1.25rem;
}

.entry-date {
  color: #f472b6;
  font-size: 0.9rem;
  margin: 0 0 0.5rem 0;
}

.entry-text {
  margin-top: 1rem;
  word-break: break-word;
  white-space: pre-wrap;
  color: #4b5563;
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s ease;
}

.icon-btn:hover {
  color: rgb(219, 39, 119);
}

.edit-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid rgb(219, 39, 119);
  border-radius: 5px;
  font-size: 1.25rem;
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

.modal-title {
  color: rgb(219, 39, 119);
  margin: 0 0 1rem 0;
}

.modal-actions {
  display: felx;
  justify-content: flex-end;
  gap: 1rem;
  margin: 1.5rem 0 0 0;
}

.btn-secondary {
  background: #ddd;
  color: #333;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}

.btn-danger {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}
</style>
