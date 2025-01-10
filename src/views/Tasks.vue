<script setup lang="ts">
import { ref, computed } from "vue";
import { useNotesStore } from "../stores/notes";
import { Task } from "../composables/interfaces";
import { useRouter } from "vue-router";

const router = useRouter();

const taskStore = useNotesStore();
const tasks = computed(() => taskStore.getTasks);
const newTaskTitle = ref("");
const editingTask = ref<{ id: string; content: string } | null>(null);
const deleteConfirm = ref<{ id: string; content: string } | null>(null);

const addTask = async () => {
  if (!newTaskTitle.value.trim()) return;
  try {
    await taskStore.addTask(newTaskTitle.value, undefined);
    newTaskTitle.value = "";
  } catch (error) {
    console.error("Failed to add task:", error);
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
          v-model="newTaskTitle"
          placeholder="New task"
          @keyup.enter="addTask"
        />
        <button @click="addTask" class="btn-primary">Add Task</button>
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
          <input
            type="checkbox"
            :checked="task.completed"
            @change="toggleTask(task)"
          />
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
            <button class="icon-btn" @click.stop="saveEdit">✅</button>
            <button class="icon-btn" @click.stop="editingTask = null">
              ❌
            </button>
          </template>
          <template v-else>
            <button
              class="icon-btn"
              @click.stop="
                editingTask = { id: task.id, content: task.taskContent }
              "
            >
              ✏️
            </button>
            <button
              class="icon-btn"
              @click.stop="
                deleteConfirm = { id: task.id, content: task.taskContent }
              "
            >
              🗑️
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
        <h3>Delete Task</h3>
        <p>Are you sure you want to delete "{{ deleteConfirm.content }}"?</p>
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
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 2rem;
}
.add-task {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.task-item {
  background: #f2f3f7;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.task-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}
.completed {
  background: #e8e9ec;
}
.completed-text {
  text-decoration: line-through;
  color: #666;
}
.task-actions {
  display: flex;
  gap: 0.5rem;
}
.edit-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--primary-color);
  border-radius: 4px;
}
.back-btn {
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-color);
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.back-btn:hover {
  color: var(--primary-color);
}
</style>
