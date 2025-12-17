<script setup lang="ts">
import type { FolderItemData } from '../components/FolderItem.vue'
import type { Folder } from '../composables/interfaces'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmationModal from '../components/ConfirmationModal.vue'
import EmptyState from '../components/EmptyState.vue'
import FolderItem from '../components/FolderItem.vue'
import { useNotesStore } from '../stores/notes'

const FloatingActionButton = defineAsyncComponent(
  () => import('../components/FloatingActionButton.vue'),
)
const SlideUpSheet = defineAsyncComponent(
  () => import('../components/SlideUpSheet.vue'),
)

const router = useRouter()
const journalStore = useNotesStore()

// Add Folder Sheet State
const showAddSheet = ref(false)
const newFolderName = ref('')

// Edit Folder Sheet State
const showEditSheet = ref(false)
const editFolderName = ref('')
const editingFolderId = ref<string | null>(null)

// Delete State
const showDeleteModal = ref(false)
const folderToDelete = ref<Folder | null>(null)
const isDeleting = ref(false)

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

function openEditSheet(folder: FolderItemData) {
  editingFolderId.value = folder.id
  editFolderName.value = folder.name
  showEditSheet.value = true
}

function closeEditSheet() {
  showEditSheet.value = false
  editingFolderId.value = null
  editFolderName.value = ''
}

async function saveEditFolder() {
  if (!editingFolderId.value || !editFolderName.value.trim())
    return

  try {
    await journalStore.editFolder(editingFolderId.value, {
      name: editFolderName.value.trim(),
    })
    closeEditSheet()
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
  if (!folderToDelete.value || !folderToDelete.value.id)
    return

  isDeleting.value = true
  try {
    await journalStore.deleteFolder(folderToDelete.value.id)
    showDeleteModal.value = false
    folderToDelete.value = null
  }
  catch (err) {
    console.error('Error deleting folder:', err)
  }
  finally {
    isDeleting.value = false
  }
}

function navigateToFolder(folder: FolderItemData) {
  return router.push(`/journal/${folder.id}`)
}

onMounted(async () => {
  await journalStore.ensureInitialized()
})
</script>

<template>
  <div class="journal-container">
    <div class="journal-header">
      <h1>My Journal</h1>
    </div>

    <div class="journal-folder-list">
      <EmptyState
        v-if="folders.length === 0"
        message="No folders yet. Create your first journal folder!"
        icon="📖"
      />

      <FolderItem
        v-for="folder in folders"
        v-else
        :key="folder.id"
        :folder="folder"
        item-label="entries"
        @click="navigateToFolder"
        @edit="openEditSheet"
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

    <!-- Edit Folder Sheet -->
    <SlideUpSheet :show="showEditSheet" title="Edit Folder" @close="closeEditSheet">
      <div class="sheet-form">
        <input
          v-model="editFolderName"
          placeholder="Folder name"
          class="sheet-input"
          autofocus
          @keyup.enter="saveEditFolder"
        >
        <button class="btn-primary sheet-btn" @click="saveEditFolder">
          Save Changes
        </button>
      </div>
    </SlideUpSheet>

    <ConfirmationModal
      :show="showDeleteModal"
      title="Delete Folder"
      message="Are you sure you want to delete"
      :item-name="folderToDelete?.name"
      confirm-text="Delete"
      variant="danger"
      :loading="isDeleting"
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

.btn-primary {
  color: white;
  font-weight: bold;
}
</style>
