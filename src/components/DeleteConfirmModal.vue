<script setup lang="ts">
const props = defineProps({
  folderName: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["close", "confirm"]);
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h2>Delete Folder</h2>
      <p>Are you sure you want to delete "{{ props.folderName }}"?</p>
      <div class="button-group">
        <button class="cancel-button" @click="$emit('close')">Cancel</button>
        <button class="delete-button" @click="$emit('confirm')">Delete</button>
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
  border-radius: 8px;
  position: relative;
  width: 90%;
  max-width: 400px;
  text-align: center;
}

h2 {
  margin-bottom: 1rem;
  color: #a51d2d;
}

p {
  margin-bottom: 1.5rem;
  color: #4a5568;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.cancel-button,
.delete-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-button {
  background: white;
  border: 1px solid #a51d2d;
  color: #a51d2d;
}

.delete-button {
  background: #a51d2d;
  border: 1px solid #a51d2d;
  color: white;
}

.delete-button:hover {
  background: white;
  color: #a51d2d;
}
</style>
