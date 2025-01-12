<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

const props = defineProps<{
  show: boolean;
  title: string;
  id: string;
}>();

const emit = defineEmits(["close", "delete"]);

const closeModal = () => {
  emit("close");
};

const confirmDelete = () => {
  emit("delete", props.id);
};
</script>

<template>
  <div v-if="show" @click="closeModal" class="modal-overlay">
    <div class="modal-content" @click.stop>
      <h3 class="modal-title">Delete Entry</h3>
      <p class="modal-text">
        Are you sure you want to delete "{{ title }}"?
      </p>
      <div class="modal-actions">
        <button @click="closeModal" class="btn-secondary">Cancel</button>
        <button @click="confirmDelete" class="btn-danger">Delete</button>
      </div>
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
  background: rgba(0, 0, 0, 0.5);
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
  max-width: 400px;
}

.modal-title {
  color: rgb(219, 39, 119);
  margin: 0 0 1rem 0;
}

.modal-actions {
  display: felx;
  justify-content: flex-end;
  gap: 1rem;
  margin: 1.5rem 0 0 0;
}

.btn-secondary {
  background: #ddd;
  color: #333;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}

.btn-danger {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}
</style>
