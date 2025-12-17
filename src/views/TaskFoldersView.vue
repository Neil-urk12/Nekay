<script setup lang="ts">
import type { FolderItemData } from '../components/FolderItem.vue'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import FolderItem from '../components/FolderItem.vue'
import { useNotesStore } from '../stores/notes'

const SlideUpSheet = defineAsyncComponent(() => import('../components/SlideUpSheet.vue'))
const FloatingActionButton = defineAsyncComponent(() => import('../components/FloatingActionButton.vue'))

const router = useRouter()
const noteStore = useNotesStore()

const newFolderName = ref('')
const showAddSheet = ref(false)
const deleteConfirm = ref<{ id: string, name: string } | null>(null)

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

  try {
    await noteStore.deleteFolder(deleteConfirm.value.id)
    deleteConfirm.value = null
  }
  catch (err) {
    console.error('Failed to delete folder: ', err)
  }
}

const cancelDelete = () => deleteConfirm.value = null

onMounted(() => {
  if (folders.value.length === 0)
    noteStore.loadFolders()
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
    <div v-if="deleteConfirm" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Delete Folder</h3>
          <button class="close-btn" @click="cancelDelete">
            ×
          </button>
        </div>
        <div class="modal-body">
          <p>
            Are you sure you want to delete "<span class="folder-highlight">{{
              deleteConfirm.name
            }}</span>"?
          </p>
          <p class="warning-text">
            This action cannot be undone.
          </p>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="cancelDelete">
            Cancel
          </button>
          <button class="btn-danger" @click="confirmDelete">
            Delete
          </button>
        </div>
      </div>
    </div>

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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: rgba(255, 245, 246, 0.95);
  padding: 0;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: modal-in 0.3s ease-out;
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1a1c1e;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin: 0;
  font-size: 1.125rem;
  line-height: 1.5;
}

.warning-text {
  margin-top: 0.75rem !important;
  color: #dc3545;
  font-size: 1rem !important;
  font-weight: 600;
}

.folder-highlight {
  font-weight: 600;
  color: #1a1c1e;
}

.modal-actions {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  cursor: pointer;
}

.btn-secondary {
  background: #f8f9fa;
  color: #1a1c1e;
  border: 1px solid #dee2e6;
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  cursor: pointer;
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
