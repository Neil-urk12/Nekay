<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from "vue";
import { useRoute } from "vue-router";
import { useNotesStore } from "../stores/notes";
import { Task } from "../composables/interfaces";
import { Pencil, Trash2 } from "lucide-vue-next";
const SlideUpSheet = defineAsyncComponent(() => import("../components/SlideUpSheet.vue"));
const FloatingActionButton = defineAsyncComponent(() => import("../components/FloatingActionButton.vue"));


const route = useRoute();
const taskStore = useNotesStore();
const folders = computed(() => taskStore.getFolders);
const tasks = computed(() => [...taskStore.getTasks]);
const folderId = computed(() => route.params.id as string);
const newTask = ref("");
const showAddSheet = ref(false);
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
    showAddSheet.value = false;
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
      <button class="back-arrow" @click="$router.push('/folders')" aria-label="Back to folders">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="20" height="20">
          <path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/>
        </svg>
      </button>
      <h1>{{ currentFolder?.name }}</h1>
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
              <button class="icon-btn" @click="editTask(task)"><Pencil :size="18" /></button>
              <button class="icon-btn" @click="deleteTask(task.id)"><Trash2 :size="18" /></button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- FAB Button -->
    <FloatingActionButton @click="showAddSheet = true" aria-label="Add new task" />

    <!-- Slide Up Sheet for Adding Task -->
    <SlideUpSheet :show="showAddSheet" title="New Task" @close="showAddSheet = false">
      <div class="sheet-form">
        <input
          v-model="newTask"
          placeholder="Task description"
          @keyup.enter="addTask"
          class="sheet-input"
          autofocus
        />
        <button @click="addTask" class="btn-primary sheet-btn">Add Task</button>
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
