<script setup lang="ts">
import type { Task } from '../composables/interfaces'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import ConfirmationModal from '../components/ConfirmationModal.vue'
import TaskItem from '../components/TaskItem.vue'
import { useNotesStore } from '../stores/notes'

const SlideUpSheet = defineAsyncComponent(() => import('../components/SlideUpSheet.vue'))
const FloatingActionButton = defineAsyncComponent(() => import('../components/FloatingActionButton.vue'))

const route = useRoute()
const taskStore = useNotesStore()
const folders = computed(() => taskStore.getFolders)
const tasks = computed(() => [...taskStore.getTasks])
const folderId = computed(() => route.params.id as string)
const newTask = ref('')
const showAddSheet = ref(false)

// Edit State
const showEditSheet = ref(false)
const editingTaskContent = ref('')
const editingTaskId = ref<string | null>(null)

// Delete State
const showDeleteModal = ref(false)
const deletingTaskId = ref<string | null>(null)
const isDeleting = ref(false)

const currentFolder = computed(() =>
  folders.value.find(f => f.id === folderId.value),
)

const folderTasks = computed(() =>
  tasks.value.filter(task => task.folderId === folderId.value),
)

async function addTask() {
  try {
    if (!newTask.value.trim() || !currentFolder.value)
      return

    await taskStore.addTask(newTask.value, currentFolder.value.id)
    await taskStore.editFolder(currentFolder.value.id, {
      numOfItems: ++currentFolder.value.numOfItems,
    })
    newTask.value = ''
    showAddSheet.value = false
  }
  catch (err) {
    console.error(err)
  }
}

function editTask(task: Task) {
  editingTaskId.value = task.id
  editingTaskContent.value = task.taskContent
  showEditSheet.value = true
}

async function saveEdit() {
  try {
    if (!editingTaskId.value || !editingTaskContent.value.trim()) {
      showEditSheet.value = false
      return
    }

    await taskStore.editTask(editingTaskId.value, {
      taskContent: editingTaskContent.value.trim(),
    })

    showEditSheet.value = false
    editingTaskId.value = null
    editingTaskContent.value = ''
  }
  catch (err) {
    console.error('Error editing task: ', err)
  }
}

async function toggleTask(task: Task) {
  if (!task)
    return

  task.completed = !task.completed
}

function promptDeleteTask(taskId: string) {
  deletingTaskId.value = taskId
  showDeleteModal.value = true
}

async function confirmDeleteTask() {
  if (!deletingTaskId.value || !currentFolder.value)
    return

  isDeleting.value = true
  try {
    // Artificial delay to show loading state if desired,
    // or just let the async operation take its time.
    // await new Promise(resolve => setTimeout(resolve, 500));

    await taskStore.deleteTask(deletingTaskId.value)
    await taskStore.editFolder(currentFolder.value.id, {
      numOfItems: --currentFolder.value.numOfItems,
    })

    showDeleteModal.value = false
    deletingTaskId.value = null
  }
  catch (err) {
    console.error('Error deleting task: ', err)
  }
  finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
  await taskStore.ensureInitialized()
})
</script>

<template>
  <div
    class="folder-tasks"
  >
    <header class="page-header">
      <button class="back-arrow" aria-label="Back to folders" @click="$router.push('/folders')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="20" height="20">
          <path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
        </svg>
      </button>
      <h1>{{ currentFolder?.name }}</h1>
    </header>

    <div class="tasks-container">
      <div class="tasks-list">
        <TaskItem
          v-for="task in folderTasks"
          :key="task.id"
          :task="task"
          :is-editing="false"
          @toggle="toggleTask"
          @edit="editTask"
          @delete="promptDeleteTask"
        />
      </div>
    </div>

    <!-- FAB Button -->
    <FloatingActionButton aria-label="Add new task" @click="showAddSheet = true" />

    <!-- Slide Up Sheet for Adding Task -->
    <SlideUpSheet :show="showAddSheet" title="New Task" @close="showAddSheet = false">
      <div class="sheet-form">
        <input
          v-model="newTask"
          placeholder="Task description"
          class="sheet-input"
          autofocus
          @keyup.enter="addTask"
        >
        <button class="btn-primary sheet-btn" @click="addTask">
          Add Task
        </button>
      </div>
    </SlideUpSheet>

    <!-- Slide Up Sheet for Editing Task -->
    <SlideUpSheet :show="showEditSheet" title="Edit Task" @close="showEditSheet = false">
      <div class="sheet-form">
        <input
          v-model="editingTaskContent"
          placeholder="Edit task description"
          class="sheet-input"
          autofocus
          @keyup.enter="saveEdit"
        >
        <button class="btn-primary sheet-btn" @click="saveEdit">
          Save Changes
        </button>
      </div>
    </SlideUpSheet>

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      :show="showDeleteModal"
      title="Delete Task"
      message="Are you sure you want to delete this task? This action cannot be undone."
      confirm-text="Delete"
      variant="danger"
      :loading="isDeleting"
      @close="showDeleteModal = false"
      @confirm="confirmDeleteTask"
    />
  </div>
</template>

<style scoped>
.folder-tasks {
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #fce7f3;
}
.tasks-list{
  display: flex;
  justify-content: center;
}
.page-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid rgba(219, 39, 119, 0.1);
  box-shadow: 0 2px 8px rgba(219, 39, 119, 0.08);
}
.back-arrow {
  background: none;
  border: none;
  cursor: pointer;
  color: rgb(219, 39, 119);
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}
.back-arrow:hover {
  background: rgba(219, 39, 119, 0.1);
  transform: translateX(-2px);
}
.page-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: rgb(219, 39, 119);
}
</style>
