<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useNotesStore } from "../stores/notes";
import { Task } from "../composables/interfaces";

const route = useRoute();
const router = useRouter();
const taskStore = useNotesStore();
const folders = computed(() => taskStore.getFolders);
const tasks = computed(() => taskStore.getTasks);
const folderId = computed(() => route.params.id as string);
const newTask = ref("");
const editingTask = ref<string | null>(null);
const editedContent = ref("");

const currentFolder = computed(() =>
  folders.value.find((f) => f.id === folderId.value)
);

const folderTasks = computed(() =>
  tasks.value.filter((task) => task.folderId === folderId.value)
);

const addTask = async () => {
  try {
    if (!newTask.value.trim() || !currentFolder.value) return;

    await taskStore.addTask(newTask.value, currentFolder.value.id);
    await taskStore.editFolder(currentFolder.value.id, {
      numOfItems: ++currentFolder.value.numOfItems,
    });
    newTask.value = "";
  } catch (err) {
    console.error(err);
  }
};

const editTask = async (task: Task) => {
  editingTask.value = task.id;
  editedContent.value = task.taskContent;
};

const saveEdit = async (task: Task) => {
  try {
    if (
      !editedContent.value.trim() ||
      editedContent.value === task.taskContent
    ) {
      editingTask.value = null;
      return;
    }

    await taskStore.editTask(task.id, {
      taskContent: editedContent.value.trim(),
    });

    editingTask.value = null;
  } catch (err) {
    console.error("Error editing task: ", err);
  }
};

const cancelEdit = () => {
  editingTask.value = null;
  editedContent.value = "";
};

const toggleTask = async (task: Task) => {
  if (!task) return;

  task.completed = !task.completed;
};

const deleteTask = async (taskId: string) => {
  try {
    if (!taskId || !currentFolder.value) return;
    await taskStore.deleteTask(taskId);
    await taskStore.editFolder(currentFolder.value?.id, {
      numOfItems: --currentFolder.value.numOfItems,
    });
  } catch (err) {
    console.error(err);
  }
};

onMounted(async () => {
  if (!currentFolder.value) router.push("/folders");
  if (tasks.value.length === 0) taskStore.loadTasks();
});
</script>

<template>
  <div class="folder-tasks">
    <div class="tasks-container">
      <header class="page-header">
        <button class="back-btn" @click="router.push('/folders')">
          ← Back to Folders
        </button>
        <h1>{{ currentFolder?.name }}</h1>
      </header>

      <div class="add-task">
        <input
          v-model="newTask"
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
          @change="toggleTask(task)"
        >
          <template v-if="editingTask === task.id">
            <input
              v-model="editedContent"
              @keyup.enter="saveEdit(task)"
              @keyup.esc="cancelEdit"
              class="edit-input"
              ref="editInput"
              v-focus
            />
            <div class="task-actions">
              <button class="icon-btn" @click="saveEdit(task)">✓</button>
              <button class="icon-btn" @click="cancelEdit">✕</button>
            </div>
          </template>
          <template v-else>
            <input
              type="checkbox"
              :checked="task.completed"
              @change="toggleTask(task)"
            />
            <span class="task-content">{{ task.taskContent }}</span>
            <div class="task-actions">
              <button class="icon-btn" @click="editTask(task)">✏️</button>
              <button class="icon-btn" @click="deleteTask(task.id)">🗑️</button>
            </div>
          </template>
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
.tasks-container {
  background: rgba(255, 255, 255, 0.2);
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
  color: white;
}
.back-btn:hover {
  color: peachpuff;
}
.tasks-list {
  margin-top: 1.5rem;
}
.task-item {
  background: #ffffff;
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e1e3e6;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.task-content {
  color: #1a1c1e;
  flex: 1;
}
.task-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
