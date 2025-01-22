<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from "vue";
import { useRoute } from "vue-router";
import { useNotesStore } from "../stores/notes";
import { Task } from "../composables/interfaces";
const ReturnButton = defineAsyncComponent(() => import("../components/ReturnButton.vue"));

const route = useRoute();
const taskStore = useNotesStore();
const folders = computed(() => taskStore.getFolders);
const tasks = computed(() => [...taskStore.getTasks]);
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
  if (!currentFolder.value) return;
  if (tasks.value.length === 0) taskStore.loadTasks();
});
</script>

<template>
  <div
    class="folder-tasks">
    <header class="page-header">
      <ReturnButton />
      <h1>{{ currentFolder?.name }}</h1>
      <div class="add-task">
        <input
          v-model="newTask"
          placeholder="New task"
          @keyup.enter="addTask"
        />
        <button @click="addTask" class="btn-primary">Add Task</button>
      </div>
    </header>

    <div class="tasks-container">
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
              <button class="icon-btn" @click="saveEdit(task)">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 448 512"
                  width="0.95rem"
                >
                  <path
                    fill="#63E6BE"
                    d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"
                  />
                </svg>
              </button>
              <button class="icon-btn" @click="cancelEdit">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 384 512"
                  width="0.95rem"
                >
                  <path
                    fill="#f66151"
                    d="M378.4 71.4c8.5-10.1 7.2-25.3-2.9-33.8s-25.3-7.2-33.8 2.9L192 218.7 42.4 40.6C33.9 30.4 18.7 29.1 8.6 37.6S-2.9 61.3 5.6 71.4L160.7 256 5.6 440.6c-8.5 10.2-7.2 25.3 2.9 33.8s25.3 7.2 33.8-2.9L192 293.3 341.6 471.4c8.5 10.2 23.7 11.5 33.8 2.9s11.5-23.7 2.9-33.8L223.3 256l155-184.6z"
                  />
                </svg>
              </button>
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
  padding: 0.5rem 1.5rem 0rem 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  min-height: 95vh;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: right;
  background-color: rgba(0, 0, 0, 0.01);
  backdrop-filter: blur(5px);
}
.page-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.page-header h1 {
  font-size: 2rem;
  margin: 3rem 0rem 0rem 0rem;
  background-color: rgb(255, 255, 255);
  padding: 0.5rem;
  border-radius: 6px;
}
.add-task {
  display: flex;
  gap: 0.75rem;
  margin: 1rem 0;
  width: 100%;
}
.icon-btn {
  background: none;
  padding: 0.25rem 0.5rem;
}
.btn-primary {
  font-weight: bold;
  color: white;
}
.tasks-list {
  margin-top: 1.5rem;
}
.task-item {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #e1e3e6;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.task-content {
  color: #1a1c1e;
  flex: 1;
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;
}
.task-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
