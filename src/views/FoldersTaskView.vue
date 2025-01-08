<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotesStore } from '../stores/notes'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const store = useNotesStore()
const { tasks, folders } = storeToRefs(store)

const folderId = computed(() => route.params.id as string)
const newTaskTitle = ref('')

const currentFolder = computed(() => 
  folders.value.find(f => f.id === folderId.value)
)

const folderTasks = computed(() => 
  tasks.value.filter(task => task.folderId === folderId.value && !task.deleted)
)

onMounted(async () => {
  if (!currentFolder.value) {
    router.push('/folders')
  }
})
</script>

<template>
  <div class="folder-tasks">
    <header class="page-header">
      <button class="back-btn" @click="router.push('/folders')">
        ← Back to Folders
      </button>
      <h1>{{ currentFolder?.name }}</h1>
    </header>

    <div class="add-task">
      <input
        v-model="newTaskTitle"
        placeholder="New task"
        @keyup.enter="addTask"
      />
      <button @click="addTask" class="btn-primary">Add Task</button>
    </div>

    <div class="tasks-list">
      <div
        v-for="task in folderTasks"
        :key="task.id"
        class="task-item"
        :class="{ completed: task.completed }"
      >
        <input
          type="checkbox"
          :checked="task.completed"
          @change="toggleTask(task)"
        />
        <span class="task-title">{{ task.title }}</span>
        <div class="task-actions">
          <button class="icon-btn" @click="editTask(task)">✏️</button>
          <button class="icon-btn" @click="deleteTask(task)">🗑️</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.folder-tasks {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.back-btn {
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--primary-color);
}

.tasks-list {
  margin-top: 1.5rem;
}

.task-item {
  background: var(--surface-color);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.task-title {
  flex: 1;
}

.task-actions {
  display: flex;
  gap: 0.5rem;
}
</style>