<script setup lang="ts">
import type { Task } from '../composables/interfaces'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import ConfirmationModal from '../components/ConfirmationModal.vue'
import TaskItem from '../components/TaskItem.vue'
import { useNotesStore } from '../stores/notes'

const SlideUpSheet = defineAsyncComponent(() => import('../components/SlideUpSheet.vue'))
const FloatingActionButton = defineAsyncComponent(() => import('../components/FloatingActionButton.vue'))

const taskStore = useNotesStore()
const tasks = computed(() => [...taskStore.getTasks])
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

async function addTask() {
  if (!newTask.value.trim())
    return
  try {
    await taskStore.addTask(newTask.value, 'alltasks')
    newTask.value = ''
    showAddSheet.value = false
  }
  catch (error) {
    console.error('Failed to add task:', error)
  }
}

async function toggleTask(task: Task) {
  try {
    await taskStore.editTask(task.id, { completed: !task.completed })
  }
  catch (error) {
    console.error('Failed to toggle task:', error)
  }
}

function editTask(task: Task) {
  editingTaskId.value = task.id
  editingTaskContent.value = task.taskContent
  showEditSheet.value = true
}

async function saveEdit() {
  if (!editingTaskId.value || !editingTaskContent.value.trim()) {
    showEditSheet.value = false
    return
  }
  try {
    await taskStore.editTask(editingTaskId.value, {
      taskContent: editingTaskContent.value.trim(),
    })
    showEditSheet.value = false
    editingTaskId.value = null
    editingTaskContent.value = ''
  }
  catch (error) {
    console.error('Failed to edit task:', error)
  }
}

function promptDeleteTask(taskId: string) {
  deletingTaskId.value = taskId
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!deletingTaskId.value)
    return
  isDeleting.value = true
  try {
    await taskStore.deleteTask(deletingTaskId.value)
    showDeleteModal.value = false
    deletingTaskId.value = null
  }
  catch (error) {
    console.error('Failed to delete task:', error)
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
  <div class="tasks-container">
    <header class="page-header">
      <button class="back-arrow" aria-label="Back to folders" @click="$router.push('/folders')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="20" height="20">
          <path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
        </svg>
      </button>
      <h1>All Tasks</h1>
    </header>

    <div class="tasks-list">
      <div v-for="task in tasks" :key="task.id" class="task-wrapper">
        <TaskItem
          :task="task"
          :is-editing="false"
          @toggle="toggleTask"
          @edit="editTask"
          @delete="promptDeleteTask"
        />
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      :show="showDeleteModal"
      title="Delete Task"
      message="Are you sure you want to delete this task? This action cannot be undone."
      confirm-text="Delete"
      variant="danger"
      :loading="isDeleting"
      @close="showDeleteModal = false"
      @confirm="confirmDelete"
    />

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
  flex-direction: column;
  gap: 0.75rem;
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
</style>
