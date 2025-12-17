<script setup lang="ts">
import type { FolderItemData } from '../components/FolderItem.vue'
import type { Folder } from '../composables/interfaces'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import FolderItem from '../components/FolderItem.vue'
import { useNotesStore } from '../stores/notes'

const EditFolderModal = defineAsyncComponent(
  () => import('../components/EditFolderModal.vue'),
)
const DeleteConfirmModal = defineAsyncComponent(
  () => import('../components/DeleteConfirmModal.vue'),
)
const FloatingActionButton = defineAsyncComponent(
  () => import('../components/FloatingActionButton.vue'),
)
const SlideUpSheet = defineAsyncComponent(
  () => import('../components/SlideUpSheet.vue'),
)

const router = useRouter()
const journalStore = useNotesStore()

const showAddSheet = ref(false)
const showEditFolderModal = ref(false)
const showDeleteModal = ref(false)
const selectedFolder = ref<Folder | null>(null)
const folderToDelete = ref<Folder | null>(null)
const newFolderName = ref('')

const folders = computed(() => journalStore.getJournalFolders)

async function addFolder() {
  if (!newFolderName.value.trim())
    return

  try {
    await journalStore.addFolder(newFolderName.value, 'journal')
    newFolderName.value = ''
    showAddSheet.value = false
  }
  catch (err) {
    console.error(err)
  }
}

async function editFolder(updatedFolder: Partial<Folder>) {
  try {
    if (!updatedFolder || !updatedFolder.id)
      return

    await journalStore.editFolder(updatedFolder.id, {
      name: updatedFolder.name,
    })
  }
  catch (err) {
    console.error('Error editing folder', err)
  }
}

function openDeleteModal(folder: FolderItemData) {
  folderToDelete.value = folder as Folder
  showDeleteModal.value = true
}

async function deleteFolder() {
  try {
    if (!folderToDelete.value || !folderToDelete.value.id)
      return

    await journalStore.deleteFolder(folderToDelete.value.id)

    showDeleteModal.value = false
    folderToDelete.value = null
  }
  catch (err) {
    console.error('Error deleting folder:', err)
  }
}

function openEditModal(folder: FolderItemData) {
  selectedFolder.value = folder as Folder
  showEditFolderModal.value = true
}

function navigateToFolder(folder: FolderItemData) {
  return router.push(`/journal/${folder.id}`)
}

onMounted(() => {
  if (folders.value.length === 0)
    journalStore.loadFolders()
})
</script>

<template>
  <div class="journal-container">
    <div class="journal-header">
      <h1>My Journal</h1>
    </div>

    <div class="journal-folder-list">
      <div v-if="folders.length === 0" class="empty-state">
        <p>No folders yet. Create your first journal folder!</p>
      </div>

      <FolderItem
        v-for="folder in folders"
        v-else
        :key="folder.id"
        :folder="folder"
        item-label="entries"
        @click="navigateToFolder"
        @edit="openEditModal"
        @delete="openDeleteModal"
      />
    </div>

    <FloatingActionButton aria-label="Add new folder" @click="showAddSheet = true" />

    <!-- Add Folder Sheet -->
    <SlideUpSheet :show="showAddSheet" title="New Journal Folder" @close="showAddSheet = false">
      <div class="sheet-form">
        <input
          v-model="newFolderName"
          placeholder="Folder name"
          class="sheet-input"
          autofocus
          @keyup.enter="addFolder"
        >
        <button class="btn-primary sheet-btn" @click="addFolder">
          Create Folder
        </button>
      </div>
    </SlideUpSheet>

    <EditFolderModal
      v-if="showEditFolderModal"
      :folder="selectedFolder"
      @close="showEditFolderModal = false"
      @edit-folder="editFolder"
    />

    <DeleteConfirmModal
      v-if="showDeleteModal"
      :folder-name="folderToDelete?.name"
      @close="showDeleteModal = false"
      @confirm="deleteFolder"
    />
  </div>
</template>

<style scoped>
.journal-container {
  background: rgb(255, 255, 255);
  min-height: 95vh;
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.journal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

h1 {
  color: rgb(219, 39, 119);
}

.journal-folder-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 5rem;
}

.empty-state {
  text-align: center;
  background: pink;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

/* Sheet Form Styles */
.sheet-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sheet-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  background: #f9fafb;
}

.sheet-input:focus {
  outline: none;
  border-color: #db2777;
  background: white;
}

.sheet-btn {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #db2777, #ec4899);
  color: white;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.sheet-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(219, 39, 119, 0.4);
}

.sheet-btn:active {
  transform: translateY(0);
}

.btn-primary {
  color: white;
  font-weight: bold;
}
</style>
