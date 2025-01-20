<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  showModal: {
    type: Boolean,
    required: true,
  },
  submitButtonText: {
    type: String,
    default: "Add",
  },
});

const emit = defineEmits(["close", "submit"]);

const handleSubmit = (event: Event) => {
  event.preventDefault();
  emit("submit");
};
</script>

<template>
  <div v-if="showModal" class="modal-overlay">
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

      <h2>{{ props.title }}</h2>

      <form @submit="handleSubmit">
        <slot></slot>

        <div class="button-group">
          <button type="button" class="cancel-button" @click="$emit('close')">
            Cancel
          </button>
          <button type="submit" class="add-button">
            {{ props.submitButtonText }}
          </button>
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
  margin-bottom: 1.5rem;
  color: rgb(219, 39, 119);
}

input {
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin: 1rem auto;
}

.cancel-button,
.add-button {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-button {
  background: white;
  border: 1px solid rgb(219, 39, 119);
  color: rgb(219, 39, 119);
}

.add-button {
  background: rgb(219, 39, 119);
  border: 1px solid rgb(219, 39, 119);
  color: white;
}

.add-button:hover {
  background: white;
  color: rgb(219, 39, 119);
}
</style>
