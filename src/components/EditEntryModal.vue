<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  entry: { id: string; title: string; content: string } | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "editEntry", entry: { id: string; title: string; content: string }): void;
}>();

const title = ref(props.entry?.title || "");
const content = ref(props.entry?.content || "");

const handleSubmit = () => {
  if (!props.entry) return;

  emit("editEntry", {
    id: props.entry.id,
    title: title.value,
    content: content.value,
  });
  emit("close");
};
</script>

<template>
  <div class="modal-overlay" @click="emit('close')">
    <div class="modal-content" @click.stop>
      <h2>Edit Entry</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="title">Title:</label>
          <input
            id="title"
            v-model="title"
            type="text"
            required
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="content">Content:</label>
          <textarea
            id="content"
            v-model="content"
            required
            class="form-input"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="emit('close')">
            Cancel
          </button>
          <button type="submit" class="btn-primary">Save</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
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
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  text-align: center;
}

h2 {
  color: rgb(219, 39, 119);
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 12px;
  font-size: 0.9rem;
}

textarea.form-input {
  min-height: 150px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background: rgb(219, 39, 119);
  color: white;
  border: none;
}

.btn-secondary {
  background: #ddd;
  color: #333;
  border: none;
}

.btn-primary:hover {
  background: white;
  color: rgb(219, 39, 119);
  border: 1px solid rgb(219, 39, 119);
}

.btn-secondary:hover {
  background: #ccc;
}
</style>
