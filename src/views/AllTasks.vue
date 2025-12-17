<script setup lang="ts">
import type { Task } from '../composables/interfaces'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import ConfirmationModal from '../components/ConfirmationModal.vue'
import EmptyState from '../components/EmptyState.vue'
import PageHeader from '../components/PageHeader.vue'
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
    await taskStore.addTask(newTask.value, undefined)
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
    <PageHeader title="All Tasks" />

    <div v-if="tasks.length === 0">
      <EmptyState
        message="No tasks yet. Add your first task!"
        icon="📝"
      />
    </div>

    <div v-else class="tasks-list">
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
.tasks-container {
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #fce7f3;
}
.tasks-list{
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
