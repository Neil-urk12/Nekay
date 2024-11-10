<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNotesStore } from '../stores/notes'
import { storeToRefs } from 'pinia'

const store = useNotesStore()
const { tasks, folders } = storeToRefs(store)

const newTaskTitle = ref('')
const newFolderName = ref('')
const selectedFolderId = ref<string | null>(null)
const backgroundImage = ref('')
const timeOfDay = ref('')
const editingTaskId = ref<string | null>(null)
const editingFolderId = ref<string | null>(null)
const editingTaskTitle = ref('')
const editingFolderName = ref('')
const itemToDelete = ref<{ id: string; type: 'task' | 'folder'; name: string } | null>(null)
const showDeleteModal = ref(false)

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

const confirmDelete = (id: string, type: 'task' | 'folder', name: string) => {
  itemToDelete.value = { id, type, name }
  showDeleteModal.value = true
}

const addTask = () => {
  if (newTaskTitle.value.trim()) {
    store.addTask(newTaskTitle.value, selectedFolderId.value)
    newTaskTitle.value = ''
  }
}

const addFolder = () => {
  if (newFolderName.value.trim()) {
    store.addFolder(newFolderName.value, 'task')
    newFolderName.value = ''
  }
}

const editTask = (taskId: string) => {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) {
    editingTaskId.value = taskId
    editingTaskTitle.value = task.title
  }
}

const saveEditedTask = () => {
  if (editingTaskId.value && editingTaskTitle.value.trim()) {
    store.editTask(editingTaskId.value, editingTaskTitle.value)
    editingTaskId.value = null
    editingTaskTitle.value = ''
  }
}

const cancelEditTask = () => {
  editingTaskId.value = null
  editingTaskTitle.value = ''
}

const deleteTask = (taskId: string) => {
  store.deleteTask(taskId)
}

const editFolder = (folderId: string) => {
  const folder = folders.value.find(f => f.id === folderId)
  if (folder) {
    editingFolderId.value = folderId
    editingFolderName.value = folder.name
  }
}

const saveEditedFolder = () => {
  if (editingFolderId.value && editingFolderName.value.trim()) {
    store.editFolder(editingFolderId.value, editingFolderName.value)
    editingFolderId.value = null
    editingFolderName.value = ''
  }
}

const cancelEditFolder = () => {
  editingFolderId.value = null
  editingFolderName.value = ''
}

const deleteFolder = (folderId: string) => {
  store.deleteFolder(folderId)
}

const filteredTasks = computed(() => {
  if (!selectedFolderId.value) return tasks.value
  return tasks.value.filter(task => task.folderId === selectedFolderId.value)
})

onMounted(() => {
  setInterval(determineTimeOfDay, 60000)
  determineTimeOfDay()
  store.fetchTasks();
  store.fetchFolders();
})

</script>

<template>
  <div class="tasks-container" :style="{ backgroundImage: backgroundImage }">
    <div class="content-card">
      <h1 class="page-title">
        <img src="/public/assets/melody.gif" alt="My Melody" />
        My Tasks
      </h1>

      <div class="folders-section">
        <h2>Folders</h2>
        <div class="folder-list">
          <button 
            class="folder-item"
            :class="{ active: !selectedFolderId }"
            @click="selectedFolderId = null"
          >
            All Tasks
          </button>
          <button
            v-for="folder in folders.filter(f => f.type === 'task')"
            :key="folder.id"
            class="folder-item"
            :class="{ active: selectedFolderId === folder.id }"
            @click="selectedFolderId = folder.id"
          >
            {{ folder.name }}
            <button
              class="edit-button"
              @click="editFolder(folder.id)"
              v-if="!editingFolderId"
            >
              ✏️
            </button>
            <!-- Update the folder edit buttons section -->
            <div class="folder-edit-buttons" v-if="editingFolderId === folder.id">
              <input
                v-model="editingFolderName"
                @keyup.enter="saveEditedFolder"
              />
              <div class="stacked-buttons">
                <button @click="saveEditedFolder">
                  Save
                </button>
                <button @click="cancelEditFolder">
                  Cancel
                </button>
              </div>
            </div>
            <button
              class="delete-button"
              @click.stop="confirmDelete(folder.id, 'folder', folder.name)"
              v-if="!editingFolderId"
            >
              ❌
            </button>
          </button>
        </div>
        <div class="add-folder">
          <input
            v-model="newFolderName"
            placeholder="New folder name"
            @keyup.enter="addFolder"
          />
          <button @click="addFolder">Add Folder</button>
        </div>
      </div>

      <div class="tasks-section">
        <div class="add-task">
          <input
            v-model="newTaskTitle"
            placeholder="New task"
            @keyup.enter="addTask"
          />
          <button @click="addTask">Add Task</button>
        </div>

        <div class="task-list">
          <div
            v-for="task in filteredTasks"
            :key="task.id"
            class="task-item"
          >
            <label class="task-label">
              <input
                type="checkbox"
                :checked="task.completed"
                @change="store.toggleTask(task.id)"
              />
              <span :class="{ completed: task.completed }">{{ task.title }}</span>
            </label>
            <div class="icon-buttons">
              <button
                class="edit-button"
                @click="editTask(task.id)"
                v-if="!editingTaskId"
              >
                ✏️
              </button>
              <input
                v-model="editingTaskTitle"
                v-if="editingTaskId === task.id"
                @keyup.enter="saveEditedTask"
              />
              <button
                @click="saveEditedTask"
                v-if="editingTaskId === task.id"
              >
                Save
              </button>
              <button
                @click="cancelEditTask"
                v-if="editingTaskId === task.id"
              >
                Cancel
              </button>
              <button
                class="delete-button"
                @click.stop="confirmDelete(task.id, 'task', task.title)"
                v-if="!editingTaskId"
                >
                ❌
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tasks-container {
  min-height: 100vh;
  background-color: #fce7f3;
  padding: 0.5rem;
  padding-bottom: 5rem;
  background-size: cover;
}

.content-card {
  background-color: white;
  border-radius: 1.5rem;
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 100%;
  width: 100%;
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
  max-width: 100%;
}
.folder-edit-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  align-items: center;
}
.stacked-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.stacked-buttons button {
  width: 100%;
  min-width: 5rem;
}
.folder-item {
  max-width: calc(100% - 1rem);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: rgb(253, 242, 248);
  display: flex;
  align-items: center;
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

.add-folder,
.add-task {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #fbcfe8;
  border-radius: 0.5rem;
  max-width: calc(100% - 1rem);
  box-sizing: border-box;
  width: 100%;
}
button {
  background-color: #f472b6;
  color: black;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
}
.task-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: black;
}
.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background-color: #f8e7f1; 
  border-radius: 0.5rem;
  font-size: 1rem; 
  flex-wrap: wrap;
  gap: 0.5rem;
}
.task-label {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 0.5rem;
  flex: 1;
}
.task-label span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.completed {
  text-decoration: line-through;
  color: #9ca3af;
}
.delete-button {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  font-size: 1.2rem; /* Increase font size */
}
.edit-button {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  font-size: 1.2rem; /* Increase font size */
}
.task-label input {
  margin-right: 0.5rem; /* Add margin to the right of the checkbox */
}

.icon-buttons {
  display: flex;
  flex-direction: column; /* Stack buttons vertically */
  gap: 0.5rem;
}
.modal-content {
  background-color: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: calc(100% - 2rem);
  max-width: 20rem;
  margin: 0 1rem;
  text-align: center;
  box-sizing: border-box;
}

</style>
