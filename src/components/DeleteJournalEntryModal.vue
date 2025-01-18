<script setup lang="ts">
const emit = defineEmits(["close", "confirm"]);
defineProps({
  entryTitle: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <button class="close-button" @click="$emit('close')">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 384 512"
          width="1rem"
        >
          <path
            fill="#000000"
            d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
          />
        </svg>
      </button>
      <h2>Delete Entry</h2>
      <p>Are you sure you want to delete "{{ entryTitle }}"?</p>
      <div class="button-group">
        <button class="cancel-button" @click="$emit('close')">Cancel</button>
        <button class="confirm-button" @click="$emit('confirm')">
          Delete
        </button>
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
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
}

h2 {
  margin-bottom: 1rem;
  color: rgb(219, 39, 119);
}

p {
  margin-bottom: 1.5rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.cancel-button,
.confirm-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-button {
  background: white;
  border: 1px solid rgb(219, 39, 119);
  color: rgb(219, 39, 119);
}

.confirm-button {
  background: #dc3545;
  color: white;
  border: 1px solid #dc3545;
}
.confirm-button:hover {
  background: white;
  color: #dc3545;
}
</style>
