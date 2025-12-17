<script setup lang="ts">
import type { FolderItemData } from '../components/FolderItem.vue'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmationModal from '../components/ConfirmationModal.vue'
import FolderItem from '../components/FolderItem.vue'
import { useNotesStore } from '../stores/notes'

const SlideUpSheet = defineAsyncComponent(() => import('../components/SlideUpSheet.vue'))
const FloatingActionButton = defineAsyncComponent(() => import('../components/FloatingActionButton.vue'))

const router = useRouter()
const noteStore = useNotesStore()

const newFolderName = ref('')
const showAddSheet = ref(false)
const deleteConfirm = ref<{ id: string, name: string } | null>(null)
const isDeleting = ref(false)

const folders = computed(() => noteStore.getTaskFolders)

const navigateToFolder = (folderId: string) => router.push(`/folders/${folderId}`)

async function addFolder() {
  if (!newFolderName.value.trim())
    return
  try {
    await noteStore.addFolder(newFolderName.value, 'task')
    newFolderName.value = ''
    showAddSheet.value = false
  }
  catch (error) {
    console.error('Failed to add folder:', error)
  }
}

async function handleSave(folder: FolderItemData) {
  try {
    await noteStore.editFolder(folder.id, {
      name: folder.name,
    })
  }
  catch (err) {
    console.error('Failed to edit folder: ', err)
  }
}

function handleDelete(folder: FolderItemData) {
  deleteConfirm.value = { id: folder.id, name: folder.name }
}

async function confirmDelete() {
  if (!deleteConfirm.value)
    return

  isDeleting.value = true
  try {
    await noteStore.deleteFolder(deleteConfirm.value.id)
    deleteConfirm.value = null
  }
  catch (err) {
    console.error('Failed to delete folder: ', err)
  }
  finally {
    isDeleting.value = false
  }
}

const cancelDelete = () => deleteConfirm.value = null

onMounted(async () => {
  await noteStore.ensureInitialized()
})
</script>

<template>
  <div class="folders-view">
    <header class="page-header">
      <h1>My Folders</h1>
    </header>

    <div class="folders-list">
      <!-- All Tasks Folder -->
      <div class="folder-card all-tasks" @click="router.push('/tasks')">
        <div class="folder-info">
          <h2>All Tasks</h2>
          <p>View all your tasks</p>
        </div>
      </div>

      <!-- User Created Folders -->
      <FolderItem
        v-for="folder in folders"
        :key="folder.id"
        :folder="folder"
        item-label="tasks"
        inline-edit
        @click="navigateToFolder(folder.id)"
        @save="handleSave"
        @delete="handleDelete"
      />
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      :show="!!deleteConfirm"
      title="Delete Folder"
      message="Are you sure you want to delete"
      :item-name="deleteConfirm?.name"
      confirm-text="Delete"
      variant="danger"
      :loading="isDeleting"
      @close="cancelDelete"
      @confirm="confirmDelete"
    />

    <!-- FAB Button -->
    <FloatingActionButton aria-label="Add new folder" @click="showAddSheet = true" />

    <!-- Slide Up Sheet for Adding Folder -->
    <SlideUpSheet :show="showAddSheet" title="New Folder" @close="showAddSheet = false">
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
  </div>
</template>

<style scoped>
h1 {
  color: rgb(219, 39, 119);
}

.folders-view {
  max-width: 800px;
  margin: 0 auto;
  background-color: #fce7f3;
  min-height: 100vh;
}

.page-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 0.75rem;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid rgba(219, 39, 119, 0.1);
  box-shadow: 0 2px 8px rgba(219, 39, 119, 0.08);
}

.folders-list {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.folder-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.folder-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.folder-card.all-tasks {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(252, 231, 243, 0.9));
  border: 1px solid rgba(219, 39, 119, 0.2);
  margin: 0 auto 0.5rem auto;
  width: 85%;
}

.folder-info h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.folder-info p {
  margin: 0.25rem 0 0;
  color: #64748b;
  font-size: 0.875rem;
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
