<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useNotesStore } from "../stores/notes";
import { Task } from "../composables/interfaces";
import { useRouter } from "vue-router";

const router = useRouter();

const taskStore = useNotesStore();
const folders = computed(() => taskStore.getFolders);
const tasks = computed(() => [...taskStore.getTasks]);
const newTask = ref("");
const editingTask = ref<{ id: string; content: string } | null>(null);
const deleteConfirm = ref<{ id: string; content: string } | null>(null);
const isLoading = ref(false);

const addTask = async () => {
  if (!newTask.value.trim()) return;
  try {
    isLoading.value = true;
    await taskStore.addTask(newTask.value, "alltasks");
    newTask.value = "";
  } catch (error) {
    console.error("Failed to add task:", error);
  } finally {
    isLoading.value = false;
  }
};

const toggleTask = async (task: Task) => {
  try {
    await taskStore.editTask(task.id, { completed: !task.completed });
  } catch (error) {
    console.error("Failed to toggle task:", error);
  }
};

const saveEdit = async () => {
  if (!editingTask.value) return;
  try {
    await taskStore.editTask(editingTask.value.id, {
      taskContent: editingTask.value.content,
    });
    editingTask.value = null;
  } catch (error) {
    console.error("Failed to edit task:", error);
  }
};

const confirmDelete = async () => {
  if (!deleteConfirm.value) return;
  try {
    await taskStore.deleteTask(deleteConfirm.value.id);
    deleteConfirm.value = null;
  } catch (error) {
    console.error("Failed to delete task:", error);
  }
};

onMounted(() => {
  try {
    isLoading.value = true;
    if (folders.value.length === 0) taskStore.loadFolders();
    if (tasks.value.length === 0) taskStore.loadTasks();
  } catch (error) {
    console.error("Failed to load tasks:", error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="tasks-container">
    <header class="page-header">
      <button class="back-btn" @click="router.push('/folders')">
        ← Back to Folders
      </button>
      <h1>All Tasks</h1>
      <div class="add-task">
        <input
          v-model="newTask"
          placeholder="New task"
          @keyup.enter="addTask"
        />
        <button @click="addTask" class="btn-primary" :disabled="isLoading">Add Task</button>
      </div>
    </header>

    <div class="tasks-list">
      <div
        v-for="task in tasks"
        :key="task.id"
        class="task-item"
        :class="{ completed: task.completed }"
      >
        <div class="task-content">
          <div class="checkbox-container">
            <input
              type="checkbox"
              :checked="task.completed"
              @change="toggleTask(task)"
            />
          </div>
          <template v-if="editingTask?.id === task.id">
            <input
              v-model="editingTask.content"
              @keyup.enter="saveEdit"
              @keyup.esc="editingTask = null"
              class="edit-input"
              @click.stop
            />
          </template>
          <template v-else>
            <span :class="{ 'completed-text': task.completed }">{{
              task.taskContent
            }}</span>
          </template>
        </div>

        <div class="task-actions">
          <template v-if="editingTask?.id === task.id">
            <button class="icon-btn" @click.stop="saveEdit">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                width="1.2rem"
              >
                <path
                  fill="#63E6BE"
                  d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"
                />
              </svg>
            </button>
            <button class="icon-btn" @click.stop="editingTask = null">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 384 512"
                width="1.2rem"
              >
                <path
                  fill="#f66151"
                  d="M378.4 71.4c8.5-10.1 7.2-25.3-2.9-33.8s-25.3-7.2-33.8 2.9L192 218.7 42.4 40.6C33.9 30.4 18.7 29.1 8.6 37.6S-2.9 61.3 5.6 71.4L160.7 256 5.6 440.6c-8.5 10.2-7.2 25.3 2.9 33.8s25.3 7.2 33.8-2.9L192 293.3 341.6 471.4c8.5 10.2 23.7 11.5 33.8 2.9s11.5-23.7 2.9-33.8L223.3 256l155-184.6z"
                />
              </svg>
            </button>
          </template>
          <template v-else>
            <button
              class="icon-btn"
              @click.stop="
                editingTask = { id: task.id, content: task.taskContent }
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                width="1rem"
              >
                <path
                  fill="#B197FC"
                  d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z"
                />
              </svg>
            </button>
            <button
              class="icon-btn"
              @click.stop="
                deleteConfirm = { id: task.id, content: task.taskContent }
              "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                width="1rem"
              >
                <path
                  fill="#a51d2d"
                  d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z"
                />
              </svg>
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="deleteConfirm"
      @click="deleteConfirm = null"
      class="modal-overlay"
    >
      <div class="modal-content" @click.stop>
        <h3 class="modal-title">
          <i class="fas fa-exclamation-triangle"></i> Delete Task
        </h3>
        <p class="modal-text">
          Are you sure you want to delete "{{ deleteConfirm.content }}"?
        </p>
        <div class="modal-actions">
          <button @click="deleteConfirm = null" class="btn-secondary">
            Cancel
          </button>
          <button @click="confirmDelete" class="btn-danger">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tasks-container {
  background-color: rgba(0, 0, 0, 0.01);
  backdrop-filter: blur(5px);
  padding: 0.5rem 2rem 2rem 2rem;
  max-width: 800px;
  margin: 0 auto;
}
.page-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.page-header h1 {
  margin: 3.5rem 0rem 0.5rem 0rem;
  font-size: 2rem;
  color: black;
}
.add-task {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  width: 100%;
}
.input-field {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  flex: 1;
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
}
.input-field:focus {
  border-color: rgb(206, 0, 158);
}
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.task-item {
  background-color: #f8e7f1;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 3.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transition: background-color 0.2s ease;
}
.task-item:hover {
  background: #f9f9f9;
}
.task-content {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 1rem;
  flex: 1;
}
.task-content span {
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;
  flex: 1;
}
.completed {
  background: #f0f0f0;
}
.completed-text {
  text-decoration: line-through;
  color: #888;
}
.task-actions {
  display: flex;
}
.edit-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--primary-color);
  border-radius: 6px;
}
.back-btn {
  border: none;
  cursor: pointer;
  background: none;
  font-size: 1rem;
  position: absolute;
  transition: color 0.2s ease;
}
.back-btn:hover {
  color: var(--primary-color);
}
/* Checkbox Styles */
.checkbox-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
}

.checkbox-container input[type="checkbox"] {
  margin: 0;
  width: 30px;
  height: 30px;
  cursor: pointer;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 400px;
  text-align: center;
}

.modal-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.modal-text {
  margin-bottom: 1.5rem;
  color: #555;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

/* Button Styles */
.btn-secondary,
.btn-danger {
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary {
  background-color: #f472b6;
  color: white;
  font-weight: bold;
}

.btn-primary:hover {
  background-color: #e94a9a;
}

.btn-secondary {
  background-color: #ddd;
  color: #333;
}

.btn-secondary:hover {
  background-color: #ccc;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background-color: #c0392b;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
}
</style>
