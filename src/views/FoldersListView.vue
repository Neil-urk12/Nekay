<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useNotesStore } from '../stores/notes'

const router = useRouter()
const store = useNotesStore()
const { folders, loading } = storeToRefs(store)

const newFolderName = ref('')
const editingFolder = ref<{ id: string; name: string } | null>(null)
const deleteConfirm = ref<{ id: string; name: string } | null>(null)

const navigateToFolder = (folderId: string) => {
  router.push(`/folders/${folderId}`)
}

const addFolder = async () => {
  if (!newFolderName.value.trim()) return
  try {
    await store.addFolder(newFolderName.value, 'task')
    newFolderName.value = ''
  } catch (error) {
    console.error('Failed to add folder:', error)
  }
}
</script>

<template>
  <div class="folders-view">
    <header class="page-header">
      <h1>My Folders</h1>
      <div class="add-folder">
        <input
          v-model="newFolderName"
          placeholder="New folder name"
          @keyup.enter="addFolder"
        />
        <button @click="addFolder" class="btn-primary">Add Folder</button>
      </div>
    </header>

    <div class="folders-list">
      <!-- All Tasks Folder -->
      <div class="folder-card" @click="router.push('/tasks')">
        <div class="folder-info">
          <h2>All Tasks</h2>
          <p>View all your tasks</p>
        </div>
        <span class="arrow">→</span>
      </div>

      <!-- User Created Folders -->
      <div
        v-for="folder in folders"
        :key="folder.id"
        class="folder-card"
        @click="navigateToFolder(folder.id)"
      >
        <div class="folder-info">
          <h2>{{ folder.name }}</h2>
          <p>{{ folder.taskCount || 0 }} tasks</p>
        </div>
        
        <div class="folder-actions">
          <button 
            class="icon-btn"
            @click.stop="editingFolder = { id: folder.id, name: folder.name }"
          >
            ✏️
          </button>
          <button 
            class="icon-btn"
            @click.stop="deleteConfirm = { id: folder.id, name: folder.name }"
          >
            🗑️
          </button>
        </div>
        <span class="arrow">→</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.folders-view {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.add-folder {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.folders-list {
  display: grid;
  gap: 1rem;
}

.folder-card {
  background: var(--surface-color);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.folder-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.folder-info h2 {
  margin: 0;
  font-size: 1.25rem;
}

.folder-info p {
  margin: 0.25rem 0 0;
  color: var(--text-secondary);
}

.folder-actions {
  display: flex;
  gap: 0.5rem;
}

.arrow {
  font-size: 1.5rem;
  margin-left: 1rem;
  color: var(--primary-color);
}
</style>