<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useNotesStore } from '../stores/notes'
import { storeToRefs } from 'pinia'
import type { Task, Folder } from '../stores/notes'

const store = useNotesStore()
const { tasks, folders, loading, error } = storeToRefs(store)

const newTaskTitle = ref('')
const newFolderName = ref('')
const selectedFolderId = ref<string | null>(null)
const backgroundImage = ref('')
const timeOfDay = ref('')
const editingTaskId = ref<string | null>(null)
const editingTaskTitle = ref('')
const editingFolderId = ref<string | null>(null)
const editingFolderName = ref('')
const itemToDelete = ref<{ id: string; type: 'task' | 'folder'; name: string } | null>(null)
const showDeleteModal = ref(false)
const localError = ref<string | null>(null)

const determineTimeOfDay = () => {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) {
    timeOfDay.value = 'morning'
    backgroundImage.value = 'url(/public/assets/bgsky.jpg)'
  } else if (hour >= 12 && hour < 13) {
    timeOfDay.value = 'noon'
    backgroundImage.value = 'url(/public/assets/sunsetbg.jpg)'
  } else if (hour >= 13 && hour < 17) {
    timeOfDay.value = 'afternoon'
    backgroundImage.value = 'url(/public/assets/bgsky.jpg)'
  } else if (hour >= 17 && hour < 21) {
    timeOfDay.value = 'evening'
    backgroundImage.value = 'url(/public/assets/sunsetbg.jpg)'
  } else {
    timeOfDay.value = 'night'
    backgroundImage.value = 'url(/public/assets/moonbg.gif)'
  }
}

watch(() => error.value, (newError) => {
  if (newError) {
    localError.value = newError
    setTimeout(() => {
      localError.value = null
      store.$patch({ error: null })
    }, 5000)
  }
})

const confirmDelete = (id: string, type: 'task' | 'folder', name: string) => {
  itemToDelete.value = { id, type, name }
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  
  try {
    const { id, type } = itemToDelete.value
    if (type === 'task') {
      await store.deleteTask(id)
    } else {
      await store.deleteFolder(id)
    }
    showDeleteModal.value = false
    itemToDelete.value = null
  } catch (error) {
    localError.value = error instanceof Error ? error.message : 'An error occurred'
  }
}

const addTask = async () => {
  if (!newTaskTitle.value.trim()) return
  
  try {
    await store.addTask(newTaskTitle.value, selectedFolderId.value)
    newTaskTitle.value = ''
  } catch (error) {
    localError.value = error instanceof Error ? error.message : 'Failed to add task'
  }
}

const addFolder = async () => {
  if (!newFolderName.value.trim()) return
  
  try {
    await store.addFolder(newFolderName.value, 'task')
    newFolderName.value = ''
  } catch (error) {
    localError.value = error instanceof Error ? error.message : 'Failed to add folder'
  }
}

const editTask = (taskId: string) => {
  const task = tasks.value.find((t): t is Task => t.id === taskId)
  if (task) {
    editingTaskId.value = taskId
    editingTaskTitle.value = task.title
  }
}

const saveEditedTask = async () => {
  if (!editingTaskId.value || !editingTaskTitle.value.trim()) return
  
  try {
    await store.editTask(editingTaskId.value, { title: editingTaskTitle.value })
    editingTaskId.value = null
    editingTaskTitle.value = ''
  } catch (error) {
    localError.value = error instanceof Error ? error.message : 'Failed to edit task'
  }
}

const cancelEditTask = () => {
  editingTaskId.value = null
  editingTaskTitle.value = ''
}

const editFolder = (folderId: string) => {
  const folder = folders.value.find((f): f is Folder => f.id === folderId)
  if (folder) {
    editingFolderId.value = folderId
    editingFolderName.value = folder.name
  }
}

const saveEditedFolder = async () => {
  if (!editingFolderId.value || !editingFolderName.value.trim()) return
  try {
    await store.editFolder(editingFolderId.value, { 
      name: editingFolderName.value.trim(),
      type: 'task' // Preserve the folder type
    })
    editingFolderId.value = null
    editingFolderName.value = ''
  } catch (error) {
    localError.value = error instanceof Error ? error.message : 'Failed to edit folder'
  }
}

const cancelEditFolder = () => {
  editingFolderId.value = null
  editingFolderName.value = ''
}

const filteredTasks = computed(() => {
  const nonDeletedTasks = tasks.value.filter(task => !task.deleted);
  if (!selectedFolderId.value) return nonDeletedTasks;
  return nonDeletedTasks.filter((task): task is Task => task.folderId === selectedFolderId.value);
})

onMounted(async () => {
  setInterval(determineTimeOfDay, 60000)
  determineTimeOfDay()
  try {
    await Promise.all([
      store.fetchTasks(),
      store.fetchFolders()
    ])
  } catch (error) {
    localError.value = error instanceof Error ? error.message : 'Failed to fetch data'
  }
})
</script>

<template>
  <div class="tasks-container" :style="{ backgroundImage }">
    <div v-if="localError" class="error-toast">
      {{ localError }}
    </div>

    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      Loading...
    </div>

    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete "{{ itemToDelete?.name }}"?</p>
        <div class="modal-actions">
          <button class="primary-button" @click="handleDelete">Yes, Delete</button>
          <button class="secondary-button" @click="showDeleteModal = false">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="editingTaskId" class="modal-overlay">
      <div class="modal-content edit-modal">
        <h3>Edit Task</h3>
        <input
          v-model="editingTaskTitle"
          @keyup.enter="saveEditedTask"
          @keyup.esc="cancelEditTask"
          class="edit-input"
          placeholder="Task title"
          ref="editTaskInput"
          autofocus
        />
        <div class="modal-actions">
          <button class="primary-button" @click="saveEditedTask">Save</button>
          <button class="secondary-button" @click="cancelEditTask">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="editingFolderId" class="modal-overlay">
      <div class="modal-content edit-modal">
        <h3>Edit Folder</h3>
        <input
          v-model="editingFolderName"
          @keyup.enter="saveEditedFolder"
          @keyup.esc="cancelEditFolder"
          class="edit-input"
          placeholder="Folder name"
          ref="editFolderInput"
          autofocus
        />
        <div class="modal-actions">
          <button class="primary-button" @click="saveEditedFolder">Save</button>
          <button class="secondary-button" @click="cancelEditFolder">Cancel</button>
        </div>
      </div>
    </div>

    <div class="content">
      <div class="folders-section">
        <h2>Folders</h2>
        <div class="folder-list">
          <button 
            class="folder-item"
            :class="{ active: !selectedFolderId }"
            @click="selectedFolderId = null"
          >
            <p>All Tasks</p>
          </button>
          <button
            v-for="folder in folders.filter((f): f is Folder => f.type === 'task')"
            :key="folder.id ?? ''"
            class="folder-item"
            :class="{ active: selectedFolderId === folder.id }"
            @click="selectedFolderId = folder.id ?? null"
          >
            <p>{{ folder.name }}</p>
            <div class="folder-actions">
              <button 
                class="icon-button edit-button"
                @click.stop="editFolder(folder.id ?? '')"
                v-if="folder.id"
              >
                ✏️
              </button>
              <button 
                class="icon-button delete-button"
                @click.stop="folder.id && confirmDelete(folder.id, 'folder', folder.name)"
                v-if="folder.id"
              >
                🗑️
              </button>
            </div>
          </button>
        </div>

        <div class="add-folder">
          <input
            v-model="newFolderName"
            placeholder="New folder name"
            @keyup.enter="addFolder"
          />
          <button class="primary-button" @click="addFolder">Add Folder</button>
        </div>
      </div>

      <div class="tasks-section">
        <div class="add-task">
          <input
            v-model="newTaskTitle"
            placeholder="New task"
            @keyup.enter="addTask"
          />
          <button class="primary-button" @click="addTask">Add Task</button>
        </div>

        <div class="tasks-list">
          <div
            v-for="task in filteredTasks"
            :key="task.id ?? ''"
            class="task-item"
            :class="{ completed: task.completed }"
          >
            <div class="task-content">
              <input
                type="checkbox"
                :checked="task.completed"
                @change="task.id && store.editTask(task.id, { completed: !task.completed })"
              />
              <span class="task-title">{{ task.title }}</span>
              <div class="task-actions">
                <button
                  class="icon-button edit-button"
                  @click="task.id && editTask(task.id)"
                >
                  ✏️
                </button>
                <button
                  class="icon-button delete-button"
                  @click="task.id && confirmDelete(task.id, 'task', task.title)"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scope>
*{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.tasks-container {
  padding: clamp(0.5rem, 3vw, 2rem);
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  color: var(--text-color);
  width: 100%;
  box-sizing: border-box;
}
.folders-section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-color);
  text-align: center
}
.folder-item{padding: 0.5rem 1rem;}
.folder-actions{
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}
.content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(200px, 1fr) minmax(200px, 3fr);
  gap: clamp(0.5rem, 3vw, 2rem);
  position: relative;
}
.tasks-section {
  background: var(--bg-color);
  padding: clamp(0.75rem, 2vw, 1.5rem);
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.39);
  backdrop-filter: blur(20px);
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.add-task {
  display: flex;
  gap: 8px;
  margin-bottom: 1rem;
  width: 100%;
}
.add-task input {
  flex: 1;
  min-width: 0; 
  padding: 0.75rem;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  font-size: 0.95rem;
}
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 0.5rem;
  width: 100%;
  box-sizing: border-box;
  min-height: 0;
  height: calc(100vh - 10rem);
}
.task-item {
  background: var(--item-bg);
  border-radius: 8px;
  padding: 0.75rem;
  width: 100%;
  box-sizing: border-box;
}
.task-content {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  flex-wrap: wrap;
}
.task-title {
  flex: 1;
  min-width: 0;
  word-break: break-word;
  font-size: 0.95rem;
  line-height: 1.4;
}
.task-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

/* Responsive Design */
@media (max-width: 768px) {
  .content {
    grid-template-columns: 1fr;
    padding: 0.5rem;
  }

  .add-task {
    flex-direction: column;
    gap: 0.5rem;
  }

  .add-task input,
  .add-task button {
    width: 100%;
  }

  .task-content {
    gap: 8px;
  }

  .task-actions {
    flex-wrap: nowrap;
    gap: 4px;
  }

  .icon-button {
    padding: 8px;
    min-width: 36px; /* Better touch target */
    min-height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .tasks-container {
    padding: 0.5rem;
  }
  .tasks-section {
    padding: 0.75rem;
  }
  .task-item {
    padding: 0.625rem;
  }
  .task-content {
    flex-direction: row;
    flex-wrap: nowrap;
  }
  .task-title {
    font-size: 0.9rem;
  }
  input[type="checkbox"] {
    min-width: 20px;
    min-height: 20px;
  }
}
.primary-button,
.secondary-button {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  white-space: nowrap;
  width: auto;
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  width: min(90vw, 400px);
  margin: 1rem;
  box-sizing: border-box;
}
.modal-actions{
  display: flex;
  gap: 1rem;
}
.edit-modal {
  width: min(90vw, 300px);
}
.edit-modal input {
  width: 100%;
  box-sizing: border-box;
}
.tasks-list::-webkit-scrollbar {
  width: 6px;
}
.tasks-list::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 3px;
}
.error-toast {
  max-width: 90vw;
  box-sizing: border-box;
  word-break: break-word;
  right: 50%;
  transform: translateX(50%);
}
</style>
